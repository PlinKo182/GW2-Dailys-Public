// Scale to fractal mapping - complete 1-100 scale mapping
const scaleToFractal = {
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
};

// Daily Fractals category ID: 88
export const fetchDailyFractals = async () => {
    try {
        // 1. Fetch the "Daily Fractals" category
        const categoryResponse = await fetch("https://api.guildwars2.com/v2/achievements/categories/88");
        const category = await categoryResponse.json();

        if (!category?.achievements?.length) {
            console.warn("No achievements found in Daily Fractals category");
            return { recommended: [], dailies: [] };
        }

        // 2. Fetch the achievement details
        const achievementsResponse = await fetch(`https://api.guildwars2.com/v2/achievements?ids=${category.achievements.join(',')}`);
        const achievements = await achievementsResponse.json();

        const recommendedFractals = new Set();
        const dailyFractals = new Set();

        // 3. Process each achievement
        achievements.forEach(ach => {
            const name = ach.name;
            
            // Process recommended fractals
            if (name.includes("Recommended")) {
                try {
                    const scale = parseInt(name.split("Scale ")[1], 10);
                    const fractalName = scaleToFractal[scale] || `Scale ${scale}`;
                    recommendedFractals.add([scale, fractalName]);
                } catch (e) {
                    console.warn("Could not parse recommended fractal scale:", name);
                }
            } 
            // Process daily tier fractals
            else if (["Tier 1", "Tier 2", "Tier 3", "Tier 4"].some(tier => name.includes(tier))) {
                // Clean up the name by removing tier prefixes
                let fractalName = name;
                ["Daily Tier 1 ", "Daily Tier 2 ", "Daily Tier 3 ", "Daily Tier 4 ", "Fractal"].forEach(prefix => {
                    fractalName = fractalName.replace(prefix, "");
                });
                dailyFractals.add(fractalName.trim());
            }
        });

        // 4. Sort and format recommended fractals
        const sortedRecommended = Array.from(recommendedFractals)
            .sort(([scaleA], [scaleB]) => scaleA - scaleB)
            .map(([scale, name]) => ({
                id: `fractal_rec_${scale}`,
                name,
                scale
            }));

        // 5. Sort and format daily fractals
        const sortedDailies = Array.from(dailyFractals)
            .sort()
            .map(name => ({
                id: `fractal_daily_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name
            }));

        return {
            recommended: sortedRecommended,
            dailies: sortedDailies
        };
    } catch (error) {
        console.error("Error fetching daily fractals:", error);
        return { recommended: [], dailies: [] };
    }
};

// Daily Strikes category ID: 250
export const fetchDailyStrikes = async () => {
    try {
        // 1. Fetch the "Daily Strike Mission" category
        const categoryResponse = await fetch("https://api.guildwars2.com/v2/achievements/categories/250");
        const category = await categoryResponse.json();

        if (!category?.achievements?.length) {
            console.warn("No achievements found in Daily Strikes category");
            return [];
        }

        // 2. Fetch the achievement details
        const achievementsResponse = await fetch(`https://api.guildwars2.com/v2/achievements?ids=${category.achievements.join(',')}`);
        const achievements = await achievementsResponse.json();

        // 3. Format the strikes data
        return achievements.map(achievement => ({
            id: `daily_strike_${achievement.id}`,
            name: achievement.name
        }));
    } catch (error) {
        console.error("Error fetching daily strikes:", error);
        return [];
    }
};