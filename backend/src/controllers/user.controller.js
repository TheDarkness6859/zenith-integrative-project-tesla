import * as userService from '../services/user.service.js';

/**
 * Obtiene el perfil del usuario actual
 */
const profileUser = async (req, res) => {
    try {
        // Asumiendo que tu middleware de auth pone el ID en req.userId o req.user.id
        const userId = req.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "No autorizado. Falta el ID de usuario." });
        }

        const userProfile = await userService.profile(userId);

        if (!userProfile) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.status(200).json(userProfile);
    } catch (error) {
        console.error("Error en profileUser:", error);
        res.status(500).json({ error: "Error al obtener el perfil" });
    }
};

/**
 * Actualiza el perfil del usuario actual
 */
const updateProfileUser = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "No autorizado" });
        }

        // El servicio espera (userId, dataObject). 
        // req.body contiene: full_name, email, description, language, phone, country, photo
        await userService.updateProfile(userId, req.body);

        res.status(200).json({ message: "Perfil actualizado con éxito" });
    } catch (error) {
        console.error("Error en updateProfileUser:", error);
        res.status(500).json({ error: "Error al actualizar el perfil" });
    }
};

export { profileUser, updateProfileUser };