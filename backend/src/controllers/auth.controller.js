import * as authService from '../services/auth.service.js';
import { notifyRegister, notifyLogin, notifyEmailConfirmation } from '../services/n8n.service.js';
const port = "http://127.0.0.1:5500"

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

        const newUser = await authService.registerUser(full_name, email, password);

        notifyEmailConfirmation(newUser.full_name, newUser.email, newUser.verificationToken);

        res.status(201).json({ message: "User register. check your email to verify your account." });

    } catch (error) {

        if (error.code === "23505") {
            return res.status(400).json({ error: "The email is loged" });
        }
        res.status(500).json({ error: "Error to register the user", error });

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

        if (result.error === "email_not_verified") {
            return res.status(403).json({ error: "Por favor verifica tu correo electrónico antes de iniciar sesión" });
        }

        if (result.match) {
            res.cookie("user_session", result.userFound.id, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                path: "/",
                maxAge: 24 * 60 * 60 * 1000,
            });

            // Notify to n8n for send a confirmation email of login
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
        res.status(500).json({ error: "Internal server error" });
    }
};

const confirmEmail = async (req, res) => {
    try {
        const { token } = req.params;
        
        // Call the services for validate in the DB
        const isVerified = await authService.verifyUserToken(token);
        
        if (isVerified) {
            // if all it's okey redirect to login
            return res.redirect(`${port}/frontend/templates/auth/index.html`);
        }
        
        // If the token don't exists or was used
        return res.status(400).send("Link invalid or expired.");
    } catch (error) {
        console.error("[Auth Controller] Error confirm email:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export { register, login, confirmEmail };
