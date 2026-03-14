import { Router } from "express";
import { getStreakStatus } from "../controllers/streak.controller.js";
import { isLoged } from "../middleware.js"; 
import pool from "../configuration/posgresdb.js"; 

const router = Router();

// 1. Obtener estado actual
router.get("/status", isLoged, getStreakStatus);

// 2. Ruta corregida con isLoged
router.put("/update-manual", isLoged, async (req, res) => {
    try {
        const userId = req.userId; 
        const { nuevoValor } = req.body;

        // Cambiamos a app_zenith.user_points
        const result = await pool.query(
            `UPDATE app_zenith.user_points 
             SET current_streak = $1, 
                 best_streak = GREATEST(best_streak, $1) 
             WHERE user_id = $2 
             RETURNING current_streak`,
            [nuevoValor, userId]
        );
        
        if (result.rowCount === 0) {
            console.error(` No se encontró el usuario ${userId} en app_zenith.user_points`);
            return res.status(404).json({ message: "Usuario no encontrado en la tabla de puntos" });
        }

        console.log(`DB Actualizada: Nueva racha es ${result.rows[0].current_streak}`);
        res.json({ message: "Racha actualizada correctamente" });
    } catch (error) {
        console.error(" Error en update-manual:", error);
        res.status(500).json({ message: "Error al actualizar la racha" });
    }
});

export default router;