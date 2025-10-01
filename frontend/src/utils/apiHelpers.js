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