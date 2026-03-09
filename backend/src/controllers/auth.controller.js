import * as authService from '../services/auth.service.js';

const register = async (req, res) =>{
    console.log("Datos recibidos en register:", req.body);
    const { full_name, email, password } = req.body;
     // Validación de campos obligatorios para evitar Error 400
    if (!full_name || !email || !password) {
        return res.status(400).json({ 
            error: "Faltan datos", 
            details: "Nombre, email y contraseña son obligatorios." 
        });
    }

    try {

        await authService.registerUser(full_name,email, password)
        res.status(201).json({ message: "User register" });

    } catch (error) {

        if(error.code === "23505"){
            return res.status(400).json({ error: "The email is loged" });
        }
        res.status(500).json({ error: "Error to register the user" });

    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    try {
        const result = await authService.logedUser(email, password);

        // Caso: Usuario no existe
        if (result.error === "user_not_found") {
            return res.status(401).json({ error: "El usuario no existe" });
        }

        // Caso: Contraseña correcta
        if (result.match) {
            // Guardamos el ID en una cookie segura
            res.cookie("user_session", result.userFound.id, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
                secure: false, // Para desarrollo sin HTTPS
                sameSite: "lax",
                path: "/",
                maxAge: 2 * 60 * 60 * 1000 // 2 horas
            });

            return res.json({ 
                message: "Welcome", 
                user: { 
                    id: result.userFound.id, 
                    name: result.userFound.full_name 
                } 
            });
        } 
        
        // Caso: Contraseña incorrecta
        return res.status(401).json({ error: "Contraseña incorrecta" });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

export { register, login };