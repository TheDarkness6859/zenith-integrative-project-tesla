import express from "express";
import passport from "passport";
import { notifyRegister, notifyLogin } from "../services/n8n.service.js";
 
const router = express.Router();
 
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
 
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
 
    console.log("USER SESSION:", req.user);
 
    const { id, full_name, email, google_id } = req.user;
 
    res.cookie("user_session", id, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });
 
    // User new → welcome, user exist → notify of login
    if (!google_id) {
      notifyRegister(full_name, email);
    } else {
      notifyLogin(full_name, email);
    }
 
    res.redirect("http://127.0.0.1:5500/frontend/templates/dashboard/dashboard.html");
  }
);
 
export default router;
 