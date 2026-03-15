import pool from "../configuration/posgresdb.js";

// Processes dashboard activity data for a user
export const processActivityLogic = async (userId) => {
    try {

        // 1. Get streak and points information
        const userResult = await pool.query(
            "SELECT current_streak, best_streak, lifetime_points FROM user_points WHERE user_id = $1", 
            [userId]
        );

        // Default values in case the user has no record yet
        const user = userResult.rows[0] || { current_streak: 0, best_streak: 0, lifetime_points: 0 };

        // 2. Calculate global ranking based on lifetime points
        const rankRes = await pool.query(
            "SELECT COUNT(*) + 1 as posicion FROM app_zenith.user_points WHERE lifetime_points > $1", 
            [user.lifetime_points]
        );

        const puestoReal = parseInt(rankRes.rows[0].posicion);

        // 3. Get activity history from database function
        const historyRes = await pool.query("SELECT * FROM get_user_dashboard_history($1)", [userId]);
        const rows = historyRes.rows || [];

        // 4. Extract active days for the current month
        const currentMonth = new Date().getUTCMonth() + 1;

        const activeDays = rows
            .map(row => {
                // Handle possible column name differences (Date or date)
                const rawDate = row.Date || row.date;
                return rawDate ? new Date(rawDate) : null;
            })
            .filter(d => d && !isNaN(d) && (d.getUTCMonth() + 1) === currentMonth)
            .map(d => d.getUTCDate());

        return {
            userStats: {
                dayStreak: user.current_streak || 0,
                previousBest: user.best_streak || 0,
                globalRank: puestoReal
            },

            // Remove duplicated days
            activeDays: [...new Set(activeDays)], 

            // Last 5 activities for the dashboard
            history: rows.map(row => ({
                type: row.Name || row.name || 'Activity',
                efficiency: row.Efficiency || row.efficiency || 'N/A',
                xp: row.xp || 0,
                date: row.Date || row.date
            })).slice(0, 5)
        };

    } catch (error) {

        console.error("Error in processActivityLogic:", error);

        // Send error to the controller
        throw error;

    }
};