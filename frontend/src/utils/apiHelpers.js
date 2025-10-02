// Scale to fractal mapping - complete 1-100 scale mapping
const scaleToFractal = {
    1: "Volcanic", 2: "Uncategorized", 3: "Snowblind", 4: "Urban Battleground",
    5: "Swampland", 6: "Cliffside", 7: "Aquatic Ruins", 8: "Underground Facility",
    9: "Molten Furnace", 10: "Molten Boss", 11: "Deepstone", 12: "Siren's Reef",
    13: "Chaos", 14: "Aetherblade", 15: "Thaumanova Reactor", 16: "Twilight Oasis",
    17: "Kinfall", 18: "Captain Mai Trin Boss", 19: "Volcanic", 20: "Solid Ocean",
    21: "Silent Surf", 22: "Nightmare", 23: "Shattered Observatory", 24: "Sunqua Peak",
    25: "Lonely Tower", 26: "Aquatic Ruins", 27: "Snowblind", 28: "Volcanic",
    29: "Underground Facility", 30: "Chaos", 31: "Urban Battleground", 32: "Swampland",
    33: "Deepstone", 34: "Thaumanova Reactor", 35: "Solid Ocean", 36: "Uncategorized",
    37: "Siren's Reef", 38: "Kinfall", 39: "Molten Furnace", 40: "Molten Boss",
    41: "Twilight Oasis", 42: "Captain Mai Trin Boss", 43: "Silent Surf", 44: "Solid Ocean",
    45: "Aetherblade", 46: "Cliffside", 47: "Nightmare", 48: "Shattered Observatory",
    49: "Sunqua Peak", 50: "Lonely Tower", 51: "Snowblind", 52: "Volcanic",
    53: "Underground Facility", 54: "Siren's Reef", 55: "Thaumanova Reactor",
    56: "Swampland", 57: "Urban Battleground", 58: "Molten Furnace", 59: "Twilight Oasis",
    60: "Solid Ocean", 61: "Aquatic Ruins", 62: "Uncategorized", 63: "Chaos",
    64: "Thaumanova Reactor", 65: "Aetherblade", 66: "Silent Surf", 67: "Deepstone",
    68: "Cliffside", 69: "Molten Boss", 70: "Kinfall", 71: "Captain Mai Trin Boss",
    72: "Nightmare", 73: "Shattered Observatory", 74: "Sunqua Peak", 75: "Lonely Tower",
    76: "Aquatic Ruins", 77: "Swampland", 78: "Siren's Reef", 79: "Uncategorized",
    80: "Solid Ocean", 81: "Underground Facility", 82: "Thaumanova Reactor",
    83: "Molten Furnace", 84: "Deepstone", 85: "Urban Battleground", 86: "Snowblind",
    87: "Twilight Oasis", 88: "Chaos", 89: "Swampland", 90: "Molten Boss",
    91: "Captain Mai Trin Boss", 92: "Volcanic", 93: "Aetherblade", 94: "Cliffside",
    95: "Kinfall", 96: "Nightmare", 97: "Shattered Observatory", 98: "Sunqua Peak",
    99: "Silent Surf", 100: "Lonely Tower"
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
        const dailyFractalsMap = new Map();

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
                // Extract scale from tier fractal names
                try {
                    let fractalName = name;
                    ["Daily Tier 1 ", "Daily Tier 2 ", "Daily Tier 3 ", "Daily Tier 4 ", "Fractal"].forEach(prefix => {
                        fractalName = fractalName.replace(prefix, "");
                    });
                    fractalName = fractalName.trim();
                    
                    // Find all scales for this fractal name
                    const scales = [];
                    for (let scale = 1; scale <= 100; scale++) {
                        if (scaleToFractal[scale] === fractalName) {
                            scales.push(scale);
                        }
                    }
                    
                    if (scales.length > 0) {
                        if (!dailyFractalsMap.has(fractalName)) {
                            dailyFractalsMap.set(fractalName, new Set());
                        }
                        scales.forEach(scale => dailyFractalsMap.get(fractalName).add(scale));
                    }
                } catch (e) {
                    console.warn("Could not process daily tier fractal:", name);
                }
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

        // 5. Sort and format daily fractals with scales
        const sortedDailies = Array.from(dailyFractalsMap.entries())
            .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
            .map(([fractalName, scalesSet]) => {
                const scales = Array.from(scalesSet).sort((a, b) => a - b);
                const scalesText = scales.join(' | ');
                return {
                    id: `fractal_daily_${fractalName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                    name: `${scalesText} - ${fractalName}`,
                    fractalName,
                    scales
                };
            });

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
