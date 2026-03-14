import * as authService from '../services/auth.service.js';
import { notifyRegister, notifyLogin } from '../services/n8n.service.js';
 
const register = async (req, res) => {
    console.log("Datos recibidos en register:", req.body);
    const { full_name, email, password } = req.body;
 
    if (!full_name || !email || !password) {
        return res.status(400).json({ 
            error: "Faltan datos", 
            details: "Nombre, email y contraseña son obligatorios." 
        });
    }
 
    try {
 
        await authService.registerUser(full_name, email, password);
 
        // Notificar a n8n para enviar correo de bienvenida (no bloquea la respuesta)
        notifyRegister(full_name, email);
 
        res.status(201).json({ message: "User register" });
 
    } catch (error) {
 
        if (error.code === "23505") {
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
 
        if (result.error === "user_not_found") {
            return res.status(401).json({ error: "El usuario no existe" });
        }
 
        if (result.match) {
            res.cookie("user_session", result.userFound.id, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                path: "/",
                maxAge: 24 * 60 * 60 * 1000,
            });
 
            // Notificar a n8n para enviar correo de confirmación de login
            notifyLogin(result.userFound.full_name, result.userFound.email);
 
            return res.json({ 
                message: "Welcome", 
                user: { 
                    id: result.userFound.id, 
                    name: result.userFound.full_name 
                } 
            });
        } 
        
        return res.status(401).json({ error: "Contraseña incorrecta" });
 
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
 
export { register, login };
 