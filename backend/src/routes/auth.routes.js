import express from "express";
import {isGuest, isLoged} from "../middleware.js";
import * as authController from "../controllers/auth.controller.js";

const authRoutes = express.Router();

authRoutes.post("/login", authController.login);
authRoutes.post("/register", authController.register);
authRoutes.post("/logout", (req, res) => {
    res.clearCookie("user_session", { path: "/" });
    res.clearCookie("connect.sid", { path: "/" });

    if (req.session) {
        req.session.destroy(() => {
            return res.json({ message: "Logged out" });
        });
        return;
    }

    return res.json({ message: "Logged out" });
});

authRoutes.get("/confirm/:token", authController.confirmEmail);

authRoutes.get("/", isGuest, (req, res) =>{

    res.redirect("/register")

})

authRoutes.get("/dashboard", isLoged, (req, res) => {

    res.send(`Welcome to the dashboard, user: ${req.userId}`);
    
})

export default authRoutes