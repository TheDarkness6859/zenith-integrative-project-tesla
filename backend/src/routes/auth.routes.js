import express from "express";
import {isGuest, isLoged} from "../middleware.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);

router.get("/", isGuest, (req, res) =>{
    res.redirect("/register")
})

router.get("/dashboard", isLoged, (req, res) => {
    res.send("Bienvenido al dashboard")
})

export default router