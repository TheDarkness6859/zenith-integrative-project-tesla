import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findOrCreateGoogleUser } from "../services/google.auth.service.js";
import pool from "../configuration/posgresdb.js";
 
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://127.0.0.1:4000/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
 
      try {
 
        const user = await findOrCreateGoogleUser(profile);
 
        return done(null, user);
 
      } catch (error) {
 
        return done(error, null);
 
      }
 
    }
  )
);
 
passport.serializeUser((user, done) => {
  done(null, user.id);
});
 
passport.deserializeUser(async (id, done) => {
  try {
 
    const user = await pool.query(
      "SELECT * FROM users WHERE id=$1",
      [id]
    );
 
    done(null, user.rows[0]);
 
  } catch (error) {
 
    done(error, null);
 
  }
});
 
export default passport;
 