from fastapi import FastAPI, APIRouter, HTTPException
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import os
from starlette.middleware.cors import CORSMiddleware
import logging
import sys
from pathlib import Path
from pydantic import BaseModel
from datetime import datetime
import httpx
from dotenv import load_dotenv

# Configure root directory
ROOT_DIR = Path(__file__).parent

# Load environment variables from .env file
load_dotenv()

# ---------------- Logging Configuration ----------------
# LOG_LEVEL env var can override (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL = os.environ.get("LOG_LEVEL", "WARNING").upper()

def _configure_logging():
    root_handlers = []
    # Single stream handler to stdout (platforms treat stderr as error)
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    root_handlers.append(handler)
    logging.basicConfig(level=getattr(logging, LOG_LEVEL, logging.WARNING), handlers=root_handlers, force=True)
    # Silence overly noisy third-party loggers unless debugging
    if LOG_LEVEL != "DEBUG":
        for noisy in ["uvicorn", "uvicorn.error", "uvicorn.access", "asyncio", "pymongo"]:
            logging.getLogger(noisy).setLevel(logging.WARNING)

_configure_logging()
logger = logging.getLogger(__name__)
logger.debug(f"Logging initialized at level {LOG_LEVEL}")

# Initialize FastAPI and router
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure CORS
origins = ["*"]  # Allow all origins for development
logger.debug("CORS configured to allow all origins")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # Disable credentials to allow '*'
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# MongoDB Atlas connection
MONGODB_URI = os.environ.get("MONGODB_URI")
DB_NAME = os.environ.get("MONGODB_DB", "gw2_daily_public")

mongo_client = None
db = None
progress_collection = None
users_collection = None

if not MONGODB_URI:
    logger.error("MONGODB_URI not set. Configure the environment variable with the connection URI.")
else:
    try:
        # Try connection with short timeout for quick fail
        mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        
        # Validate connection with explicit ping
        mongo_client.admin.command('ping')
        
        logger.debug(f"MongoDB connected successfully. Using database '{DB_NAME}'")
        db = mongo_client[DB_NAME]
        progress_collection = db["daily_progress"]
        users_collection = db["users"]
        
        # Ensure unique index on userName for the users collection
        users_collection.create_index("userName", unique=True)
        logger.info("Ensured unique index on 'userName' in 'users' collection.")

        # Log available collections
        collections = db.list_collection_names() if LOG_LEVEL == "DEBUG" else []
        if LOG_LEVEL == "DEBUG":
            logger.debug(f"Available collections: {collections}")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        if "auth failed" in str(e).lower():
            logger.error("→ Authentication error. Check username/password in MONGODB_URI")
        elif "timed out" in str(e).lower():
            logger.error("→ Timeout. Check firewall or Network Access in Atlas")

@app.middleware("http")
async def catch_exceptions_middleware(request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.exception("Unhandled request error:")
        return {"success": False, "error": str(e)}

# Data model for PUT/POST requests
class ProgressRequest(BaseModel):
    date: str
    dailyTasks: dict
    completedEventTypes: dict = {}
    userName: str

class UserRequest(BaseModel):
    userName: str

class FilterRequest(BaseModel):
    userName: str
    filters: dict

class Task(BaseModel):
    id: str
    name: str
    waypoint: str | None = None
    hasTimer: bool = False
    availability: dict | None = None

class TaskCard(BaseModel):
    id: str
    title: str
    tasks: list[Task]

class CustomTasksRequest(BaseModel):
    userName: str
    customTasks: list[TaskCard]

class GW2ApiKeyRequest(BaseModel):
    userName: str
    apiKey: str

# Root endpoint
@api_router.get("/")
async def root():
    return {
        "message": "GW2 Daily API",
        "version": "1.0.0",
        "features": [
            "Daily progress tracking",
            "Event countdowns",
            "Waypoint copying",
            "Local storage persistence"
        ],
        "mongoConfigured": bool(MONGODB_URI)
    }

# API health check
@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "service": "tyria-tracker-api"
    }

# MongoDB health check with detailed diagnostics
@api_router.get("/mongo_health")
async def mongo_health():
    status = {
        "mongo_status": "checking",
        "has_uri": bool(MONGODB_URI),
        "uri_starts_with": MONGODB_URI[:25] + "..." if MONGODB_URI else None,
        "db_name": DB_NAME,
        "client_initialized": mongo_client is not None,
        "db_initialized": db is not None,
        "collection_initialized": progress_collection is not None
    }
    
    if db is None:
        status["mongo_status"] = "not_configured"
        return status
        
    try:
        # Try ping
        mongo_client.admin.command('ping')
        status["ping"] = "success"
        
        # List collections if ping OK
        collections = db.list_collection_names()
        status["mongo_status"] = "connected"
        status["collections"] = collections
        
        # Try a simple query
        sample = progress_collection.find_one({}, {"_id": 1})
        status["sample_query"] = "success"
        status["has_documents"] = bool(sample)
        
        return status
    except Exception as e:
        logging.exception("Detailed MongoDB connection error:")
        status["mongo_status"] = "error"
        status["error"] = str(e)
        status["error_type"] = e.__class__.__name__
        return status

# Endpoint to save daily progress (supports both PUT and POST)
@api_router.put("/progress")
@api_router.post("/progress")
async def save_progress(req: ProgressRequest):
    if progress_collection is None or users_collection is None:
        return {"success": False, "error": "MongoDB not configured"}
    try:
        # First, verify the user exists in the users collection
        if not users_collection.find_one({"userName": req.userName}):
            return {"success": False, "error": "User not found, cannot save progress."}

        # If user exists, upsert their progress
        result = progress_collection.update_one(
            {"userName": req.userName},
            {
                "$set": {
                    f"progressByDate.{req.date}": {
                        "dailyTasks": req.dailyTasks,
                        "completedEventTypes": req.completedEventTypes
                    }
                }
            },
            upsert=True
        )
        return {
            "success": True,
            "matched_count": result.matched_count,
            "modified_count": result.modified_count
        }
    except Exception as e:
        logging.error(f"Error saving progress: {e}")
        return {"success": False, "error": str(e)}

# Endpoint to query user progress history
@api_router.get("/progress/{userName}")
async def get_user_progress(userName: str):
    if users_collection is None or progress_collection is None:
        logger.error("Attempted MongoDB access but a collection is None")
        return {"success": False, "error": "MongoDB not configured"}
    try:
        # First, validate that the user exists in the main users collection.
        user_doc = users_collection.find_one({"userName": userName})
        if not user_doc:
            logger.warning(f"Attempted to get progress for non-existent user: {userName}")
            return {"success": False, "error": "User not found"}

        # If the user is valid, fetch their progress document.
        progress_doc = progress_collection.find_one({"userName": userName}, {"_id": 0})

        # Extract progress data, event filters, custom tasks, and GW2 API key info
        progress_data = progress_doc.get("progressByDate", {}) if progress_doc else {}
        event_filters = user_doc.get("eventFilters", None)
        custom_tasks = user_doc.get("customTasks", None)
        gw2_account_name = user_doc.get("gw2AccountName", None)
        gw2_api_key_permissions = user_doc.get("gw2ApiKeyPermissions", None)

        # Combine all into a single data object
        response_data = {
            "progress": progress_data,
            "filters": event_filters,
            "customTasks": custom_tasks,
            "gw2AccountName": gw2_account_name,
            "gw2ApiKeyPermissions": gw2_api_key_permissions
        }

        return {"success": True, "data": response_data}

    except Exception as e:
        logger.exception(f"Error getting progress for '{userName}':")
        return {
            "success": False, 
            "error": "Failed to query progress", 
            "details": str(e),
            "type": e.__class__.__name__
        }

@api_router.post("/user")
async def create_user(req: UserRequest):
    if users_collection is None:
        return {"success": False, "error": "MongoDB not configured"}
    try:
        # Create new user. The unique index on `userName` will prevent duplicates.
        users_collection.insert_one({"userName": req.userName, "createdAt": datetime.utcnow()})
        return {"success": True, "userName": req.userName}
    except DuplicateKeyError:
        logging.warning(f"Attempted to create duplicate user: {req.userName}")
        return {"success": False, "error": "User already exists"}
    except Exception as e:
        logging.error(f"Error creating user: {e}")
        return {"success": False, "error": "An unexpected error occurred during user creation."}

@api_router.post("/user/filters")
async def save_user_filters(req: FilterRequest):
    if users_collection is None:
        return {"success": False, "error": "MongoDB not configured"}
    try:
        result = users_collection.update_one(
            {"userName": req.userName},
            {"$set": {"eventFilters": req.filters}}
        )

        if result.matched_count == 0:
            return {"success": False, "error": "User not found"}

        return {"success": True, "modified_count": result.modified_count}
    except Exception as e:
        logging.error(f"Error saving user filters: {e}")
        return {"success": False, "error": "An unexpected error occurred while saving filters."}

@api_router.post("/user/tasks")
async def save_custom_tasks(req: CustomTasksRequest):
    if users_collection is None:
        return {"success": False, "error": "MongoDB not configured"}
    try:
        # Pydantic models need to be converted to dicts for MongoDB
        tasks_to_save = [card.model_dump() for card in req.customTasks]
        result = users_collection.update_one(
            {"userName": req.userName},
            {"$set": {"customTasks": tasks_to_save}}
        )

        if result.matched_count == 0:
            return {"success": False, "error": "User not found"}

        return {"success": True, "modified_count": result.modified_count}
    except Exception as e:
        logging.error(f"Error saving custom tasks: {e}")
        return {"success": False, "error": "An unexpected error occurred while saving tasks."}

@api_router.post("/user/gw2-api-key")
async def save_gw2_api_key(req: GW2ApiKeyRequest):
    """Save or update user's GW2 API key after validating it."""
    if users_collection is None:
        return {"success": False, "error": "MongoDB not configured"}

    try:
        # Validate API key format (GW2 keys are typically 72 characters, format: XXXX-XXXX-...)
        api_key = req.apiKey.strip()
        if len(api_key) < 60 or "-" not in api_key:
            return {"success": False, "error": "Invalid API key format"}

        # Verify API key with GW2 API by testing /v2/account endpoint
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    "https://api.guildwars2.com/v2/account",
                    headers={"Authorization": f"Bearer {api_key}"}
                )

                if response.status_code == 403:
                    return {"success": False, "error": "Invalid API key or insufficient permissions"}
                elif response.status_code != 200:
                    return {"success": False, "error": f"Failed to validate API key: {response.status_code}"}

                account_data = response.json()

                # Get token info to check permissions
                token_response = await client.get(
                    "https://api.guildwars2.com/v2/tokeninfo",
                    headers={"Authorization": f"Bearer {api_key}"}
                )

                if token_response.status_code == 200:
                    token_info = token_response.json()
                    permissions = token_info.get("permissions", [])

                    # Check if 'account' permission is present
                    if "account" not in permissions:
                        return {"success": False, "error": "API key must have 'account' permission"}
                else:
                    # If we can't get token info but account worked, proceed
                    permissions = ["account"]

            except httpx.TimeoutException:
                return {"success": False, "error": "Timeout validating API key with GW2 API"}
            except Exception as e:
                logging.error(f"Error validating GW2 API key: {e}")
                return {"success": False, "error": "Failed to validate API key"}

        # Save API key to database
        result = users_collection.update_one(
            {"userName": req.userName},
            {
                "$set": {
                    "gw2ApiKey": api_key,
                    "gw2ApiKeyPermissions": permissions,
                    "gw2AccountName": account_data.get("name", ""),
                    "gw2ApiKeyUpdatedAt": datetime.utcnow()
                }
            }
        )

        if result.matched_count == 0:
            return {"success": False, "error": "User not found"}

        return {
            "success": True,
            "accountName": account_data.get("name", ""),
            "permissions": permissions
        }

    except Exception as e:
        logging.error(f"Error saving GW2 API key: {e}")
        return {"success": False, "error": "An unexpected error occurred while saving API key."}

@api_router.delete("/user/gw2-api-key/{userName}")
async def delete_gw2_api_key(userName: str):
    """Remove user's GW2 API key from the database."""
    if users_collection is None:
        return {"success": False, "error": "MongoDB not configured"}

    try:
        result = users_collection.update_one(
            {"userName": userName},
            {
                "$unset": {
                    "gw2ApiKey": "",
                    "gw2ApiKeyPermissions": "",
                    "gw2AccountName": "",
                    "gw2ApiKeyUpdatedAt": ""
                }
            }
        )

        if result.matched_count == 0:
            return {"success": False, "error": "User not found"}

        return {"success": True, "modified_count": result.modified_count}

    except Exception as e:
        logging.error(f"Error deleting GW2 API key: {e}")
        return {"success": False, "error": "An unexpected error occurred while deleting API key."}

@api_router.get("/user/mapchests/{userName}")
async def get_user_mapchests(userName: str):
    """Fetch map chests for user from GW2 API using their stored API key."""
    if users_collection is None:
        return {"success": False, "error": "MongoDB not configured"}

    try:
        # Get user's API key from database
        user_doc = users_collection.find_one({"userName": userName})
        if not user_doc:
            return {"success": False, "error": "User not found"}

        api_key = user_doc.get("gw2ApiKey")
        if not api_key:
            return {"success": False, "error": "No API key configured", "needsApiKey": True}

        # Fetch map chests from GW2 API
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    "https://api.guildwars2.com/v2/account/mapchests",
                    headers={"Authorization": f"Bearer {api_key}"}
                )

                if response.status_code == 403:
                    return {"success": False, "error": "API key is invalid or expired", "needsApiKey": True}
                elif response.status_code != 200:
                    return {"success": False, "error": f"GW2 API error: {response.status_code}"}

                mapchests_data = response.json()

                return {
                    "success": True,
                    "data": mapchests_data,
                    "accountName": user_doc.get("gw2AccountName", "")
                }

            except httpx.TimeoutException:
                return {"success": False, "error": "Timeout fetching data from GW2 API"}
            except Exception as e:
                logging.error(f"Error fetching map chests from GW2 API: {e}")
                return {"success": False, "error": "Failed to fetch map chests"}

    except Exception as e:
        logging.error(f"Error getting map chests for '{userName}': {e}")
        return {"success": False, "error": "An unexpected error occurred."}

@api_router.get("/user/dailycrafting/{userName}")
async def get_user_dailycrafting(userName: str):
    """Fetch daily crafting completion for user from GW2 API using their stored API key."""
    if users_collection is None:
        return {"success": False, "error": "MongoDB not configured"}

    try:
        # Get user's API key from database
        user_doc = users_collection.find_one({"userName": userName})
        if not user_doc:
            return {"success": False, "error": "User not found"}

        api_key = user_doc.get("gw2ApiKey")
        if not api_key:
            return {"success": False, "error": "No API key configured", "needsApiKey": True}

        # Fetch daily crafting from GW2 API
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    "https://api.guildwars2.com/v2/account/dailycrafting",
                    headers={"Authorization": f"Bearer {api_key}"}
                )

                if response.status_code == 403:
                    return {"success": False, "error": "API key is invalid or expired", "needsApiKey": True}
                elif response.status_code != 200:
                    return {"success": False, "error": f"GW2 API error: {response.status_code}"}

                crafting_data = response.json()

                return {
                    "success": True,
                    "data": crafting_data,
                    "accountName": user_doc.get("gw2AccountName", "")
                }

            except httpx.TimeoutException:
                return {"success": False, "error": "Timeout fetching data from GW2 API"}
            except Exception as e:
                logging.error(f"Error fetching daily crafting from GW2 API: {e}")
                return {"success": False, "error": "Failed to fetch daily crafting"}

    except Exception as e:
        logging.error(f"Error getting daily crafting for '{userName}': {e}")
        return {"success": False, "error": "An unexpected error occurred."}

@api_router.get("/user/worldbosses/{userName}")
async def get_user_worldbosses(userName: str):
    """Fetch world bosses defeated for user from GW2 API using their stored API key."""
    if users_collection is None:
        return {"success": False, "error": "MongoDB not configured"}

    try:
        # Get user's API key from database
        user_doc = users_collection.find_one({"userName": userName})
        if not user_doc:
            return {"success": False, "error": "User not found"}

        api_key = user_doc.get("gw2ApiKey")
        if not api_key:
            return {"success": False, "error": "No API key configured", "needsApiKey": True}

        # Fetch world bosses from GW2 API
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    "https://api.guildwars2.com/v2/account/worldbosses",
                    headers={"Authorization": f"Bearer {api_key}"}
                )

                if response.status_code == 403:
                    return {"success": False, "error": "API key is invalid or expired", "needsApiKey": True}
                elif response.status_code != 200:
                    return {"success": False, "error": f"GW2 API error: {response.status_code}"}

                worldbosses_data = response.json()

                return {
                    "success": True,
                    "data": worldbosses_data,
                    "accountName": user_doc.get("gw2AccountName", "")
                }

            except httpx.TimeoutException:
                return {"success": False, "error": "Timeout fetching data from GW2 API"}
            except Exception as e:
                logging.error(f"Error fetching world bosses from GW2 API: {e}")
                return {"success": False, "error": "Failed to fetch world bosses"}

    except Exception as e:
        logging.error(f"Error getting world bosses for '{userName}': {e}")
        return {"success": False, "error": "An unexpected error occurred."}

@api_router.get("/user/fractals/{userName}")
async def get_user_fractals(userName: str):
    """
    Get user's daily fractal completion status
    Returns the daily fractals with names, scales, and completion status
    """
    # Scale to fractal name mapping
    scale_to_fractal = {
        1: "Molten Furnace", 2: "Uncategorized", 3: "Snowblind", 4: "Urban Battleground", 5: "Swampland",
        6: "Cliffside", 7: "Aquatic Ruins", 8: "Underground Facility", 9: "Molten Boss", 10: "Molten Furnace",
        11: "Uncategorized", 12: "Snowblind", 13: "Urban Battleground", 14: "Swampland", 15: "Cliffside",
        16: "Aquatic Ruins", 17: "Underground Facility", 18: "Molten Boss", 19: "Thaumanova Reactor", 20: "Solid Ocean",
        21: "Uncategorized", 22: "Snowblind", 23: "Urban Battleground", 24: "Swampland", 25: "Cliffside",
        26: "Aquatic Ruins", 27: "Underground Facility", 28: "Molten Boss", 29: "Thaumanova Reactor", 30: "Solid Ocean",
        31: "Aetherblade", 32: "Swampland", 33: "Uncategorized", 34: "Snowblind", 35: "Urban Battleground",
        36: "Cliffside", 37: "Aquatic Ruins", 38: "Underground Facility", 39: "Molten Boss", 40: "Thaumanova Reactor",
        41: "Solid Ocean", 42: "Aetherblade", 43: "Captain Mai Trin Boss", 44: "Chaos", 45: "Nightmare",
        46: "Shattered Observatory", 47: "Twilight Oasis", 48: "Sunqua Peak", 49: "Silent Surf", 50: "Siren's Reef",
        51: "Deepstone", 52: "Malicious Forgeman", 53: "Molten Furnace", 54: "Uncategorized", 55: "Snowblind",
        56: "Urban Battleground", 57: "Swampland", 58: "Cliffside", 59: "Aquatic Ruins", 60: "Underground Facility",
        61: "Molten Boss", 62: "Thaumanova Reactor", 63: "Solid Ocean", 64: "Aetherblade", 65: "Underground Facility",
        66: "Captain Mai Trin Boss", 67: "Chaos", 68: "Nightmare", 69: "Shattered Observatory", 70: "Twilight Oasis",
        71: "Sunqua Peak", 72: "Silent Surf", 73: "Siren's Reef", 74: "Deepstone", 75: "Malicious Forgeman",
        76: "Molten Furnace", 77: "Uncategorized", 78: "Snowblind", 79: "Urban Battleground", 80: "Swampland",
        81: "Cliffside", 82: "Aquatic Ruins", 83: "Underground Facility", 84: "Molten Boss", 85: "Thaumanova Reactor",
        86: "Solid Ocean", 87: "Aetherblade", 88: "Captain Mai Trin Boss", 89: "Chaos", 90: "Nightmare",
        91: "Shattered Observatory", 92: "Twilight Oasis", 93: "Sunqua Peak", 94: "Silent Surf", 95: "Siren's Reef",
        96: "Deepstone", 97: "Malicious Forgeman", 98: "Uncategorized", 99: "Snowblind", 100: "Urban Battleground"
    }

    try:
        user_doc = users_collection.find_one({"userName": userName})
        if not user_doc:
            return {"success": False, "error": "User not found."}

        api_key = user_doc.get("gw2ApiKey")
        if not api_key:
            return {"success": False, "needsApiKey": True}

        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get daily fractals category (category 88) which contains all daily fractal achievement IDs
            category_response = await client.get(
                "https://api.guildwars2.com/v2/achievements/categories/88"
            )
            if category_response.status_code != 200:
                return {"success": False, "error": "Failed to fetch daily fractal achievements."}

            category_data = category_response.json()
            fractal_achievement_ids = category_data.get("achievements", [])

            if not fractal_achievement_ids:
                return {"success": True, "data": []}

            # Get achievement details for all fractal IDs
            fractal_ids_str = ','.join(str(id) for id in fractal_achievement_ids)
            achievement_details_response = await client.get(
                f"https://api.guildwars2.com/v2/achievements?ids={fractal_ids_str}"
            )
            if achievement_details_response.status_code != 200:
                return {"success": False, "error": "Failed to fetch achievement details."}

            achievement_details = achievement_details_response.json()

            # Get user's completed achievements
            achievements_response = await client.get(
                "https://api.guildwars2.com/v2/account/achievements",
                headers={"Authorization": f"Bearer {api_key}"}
            )
            if achievements_response.status_code != 200:
                return {"success": False, "error": "Failed to fetch account achievements."}

            user_achievements = achievements_response.json()

            # Create a map of achievement progress
            user_achievement_map = {a["id"]: a for a in user_achievements}

            # Build detailed fractal list
            fractal_list = []
            for details in achievement_details:
                fractal_id = details.get("id")
                name = details.get("name", "Unknown Fractal")
                requirement = details.get("requirement", "")
                description = details.get("description", "")
                icon = details.get("icon", "")

                # Check if user has completed this achievement
                user_progress = user_achievement_map.get(fractal_id, {})
                is_completed = user_progress.get("done", False)

                # Extract scale information from the name if available
                # Format: "Daily Recommended Fractal—Scale X" or "Daily Tier X [Fractal Name]"
                import re
                scale = None
                scale_range = None
                fractal_name = name
                tier = None
                improved_requirement = requirement  # Default to original requirement

                # Check for "Daily Recommended Fractal—Scale X" format
                scale_match = re.search(r'Scale\s*(\d+)', name)
                if scale_match:
                    scale_num = int(scale_match.group(1))
                    scale = scale_num

                    # Get fractal name from mapping
                    fractal_name = scale_to_fractal.get(scale_num, f"Scale {scale_num}")

                    # Build improved requirement text
                    improved_requirement = f"Complete {fractal_name} at fractal scale {scale_num}."

                    # Determine scale range
                    if scale_num <= 25:
                        scale_range = "1-25"
                    elif scale_num <= 50:
                        scale_range = "26-50"
                    elif scale_num <= 75:
                        scale_range = "51-75"
                    else:
                        scale_range = "76-100"

                # Check for "Daily Tier X [Fractal Name]" format
                elif "Tier 1" in name:
                    tier = "Tier 1"
                    scale_range = "1-25"
                    fractal_name = re.sub(r'^Daily Tier 1\s+', '', name)
                    scale = tier
                    improved_requirement = requirement  # Keep original for Tier fractals
                elif "Tier 2" in name:
                    tier = "Tier 2"
                    scale_range = "26-50"
                    fractal_name = re.sub(r'^Daily Tier 2\s+', '', name)
                    scale = tier
                    improved_requirement = requirement
                elif "Tier 3" in name:
                    tier = "Tier 3"
                    scale_range = "51-75"
                    fractal_name = re.sub(r'^Daily Tier 3\s+', '', name)
                    scale = tier
                    improved_requirement = requirement
                elif "Tier 4" in name:
                    tier = "Tier 4"
                    scale_range = "76-100"
                    fractal_name = re.sub(r'^Daily Tier 4\s+', '', name)
                    scale = tier
                    improved_requirement = requirement

                if scale is not None:  # Only include if we found scale info
                    fractal_list.append({
                        "id": fractal_id,
                        "name": fractal_name,
                        "full_name": name,
                        "requirement": improved_requirement,
                        "description": description,
                        "icon": icon,
                        "scale": scale,
                        "scale_range": scale_range,
                        "tier": tier,
                        "completed": is_completed
                    })

            return {
                "success": True,
                "data": fractal_list
            }

    except httpx.TimeoutException:
        return {"success": False, "error": "GW2 API request timed out."}
    except httpx.HTTPStatusError as e:
        return {"success": False, "error": f"GW2 API returned an error: {e.response.status_code}"}
    except Exception as e:
        logger.error(f"Error in get_user_fractals: {str(e)}")
        return {"success": False, "error": "An unexpected error occurred."}

# Include router in the application
app.include_router(api_router)

# Vercel serverless handler
app = app