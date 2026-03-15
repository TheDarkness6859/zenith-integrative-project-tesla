import * as streakService from "../services/streak.service.js";

export const getStreakStatus = async (req, res) => {
    try {
        // the middleware isLoged save the id into req.userId
        const userId = req.userId;
        const data = await streakService.processActivityLogic(userId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Error al procesar la racha", error: error.message });
    }
};