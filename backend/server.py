from fastapi import FastAPI, APIRouter
from pymongo import MongoClient
import os
from starlette.middleware.cors import CORSMiddleware
import logging
import sys
from pathlib import Path
from pydantic import BaseModel
from datetime import datetime

# Configure root directory
ROOT_DIR = Path(__file__).parent

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
DB_NAME = os.environ.get("MONGODB_DB", "gw2_daily")

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
    if progress_collection is None:
        logger.error("Attempted MongoDB access but client is None")
        logger.error(f"MONGODB_URI defined: {bool(MONGODB_URI)}")
        logger.error(f"DB_NAME: {DB_NAME}")
        return {"success": False, "error": "MongoDB not configured"}
    try:
        # Log connection state
        try:
            mongo_client.admin.command('ping')
            logger.debug("MongoDB connection OK at request time")
        except Exception as ping_err:
            logger.error(f"MongoDB ping failed: {ping_err}")
            raise Exception(f"MongoDB unavailable: {ping_err}")

        # Try to fetch document
        doc = progress_collection.find_one({"userName": userName}, {"_id": 0})
        logger.debug(f"Search for userName={userName}: found={bool(doc)}")
        if doc:
            return {"success": True, "data": doc.get("progressByDate", {})}
        return {"success": False, "error": "User not found"}
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
        # Check if user already exists
        if users_collection.find_one({"userName": req.userName}):
            return {"success": False, "error": "User already exists"}

        # Create new user
        users_collection.insert_one({"userName": req.userName, "createdAt": datetime.utcnow()})

        # Also create a default progress document for the user
        progress_collection.insert_one({"userName": req.userName, "progressByDate": {}})

        return {"success": True, "userName": req.userName}
    except Exception as e:
        logging.error(f"Error creating user: {e}")
        return {"success": False, "error": str(e)}

# Include router in the application
app.include_router(api_router)

# Vercel serverless handler
app = app