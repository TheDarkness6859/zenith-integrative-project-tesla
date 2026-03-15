import express from "express";
import passport from "passport";

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


    res.redirect("http://127.0.0.1:5500/frontend/templates/dashboard/dashboard.html");
  }
);

export default router;