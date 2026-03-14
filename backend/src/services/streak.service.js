import pool from "../configuration/posgresdb.js";

export const processActivityLogic = async (userId) => {
    try {
        // 1. Datos de racha
        const userResult = await pool.query(
            "SELECT current_streak, best_streak, lifetime_points FROM user_points WHERE user_id = $1", 
            [userId]
        );
        const user = userResult.rows[0] || { current_streak: 0, best_streak: 0, lifetime_points: 0 };

        // 2. Ranking
        const rankRes = await pool.query(
            "SELECT COUNT(*) + 1 as posicion FROM app_zenith.user_points WHERE lifetime_points > $1", 
            [user.lifetime_points]
        );
        const puestoReal = parseInt(rankRes.rows[0].posicion);

        // 3. Llamada a la función con validación
        const historyRes = await pool.query("SELECT * FROM get_user_dashboard_history($1)", [userId]);
        const rows = historyRes.rows || [];

        // 4. Procesar días de forma segura
        const currentMonth = new Date().getUTCMonth() + 1;
        const activeDays = rows
            .map(row => {
                // Intentamos leer 'Date' o 'date'
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
            activeDays: [...new Set(activeDays)], 
            history: rows.map(row => ({
                type: row.Name || row.name || 'Actividad',
                efficiency: row.Efficiency || row.efficiency || 'N/A',
                xp: row.xp || 0,
                date: row.Date || row.date
            })).slice(0, 5)
        };
    } catch (error) {
        console.error("❌ Error en processActivityLogic:", error);
        throw error; // Esto enviará el error al controlador para que no se quede colgado
    }
};