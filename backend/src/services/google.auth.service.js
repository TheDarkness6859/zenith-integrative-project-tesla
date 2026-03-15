// PostgreSQL connection pool
import pool from "../configuration/posgresdb.js";

// Finds an existing user by email or creates a new one using Google profile data
export const findOrCreateGoogleUser = async (profile) => {

  // Extract basic information from the Google profile
  const email = profile.emails?.[0]?.value;
  const name = profile.displayName;
  const googleId = profile.id;

  // 1. Search user by email
  const userQuery = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  let user;

  // If the user does not exist, create it
  if (userQuery.rows.length === 0) {

    // 2. Create user
    const newUser = await pool.query(
      `INSERT INTO users(full_name,email,google_id,auth_provider)
       VALUES($1,$2,$3,'google')
       RETURNING *`,
      [name,email,googleId]
    );

    user = newUser.rows[0];

    // 3. Create profile linked to the user
    await pool.query(
      `INSERT INTO profile(id) VALUES($1)`,
      [user.id]
    );

    // 4. Initialize user points and streak values
    await pool.query(
      `INSERT INTO user_points(user_id,current_balance,current_streak,best_streak)
       VALUES($1,0,0,0)`,
      [user.id]
    );

  } else {

    user = userQuery.rows[0];

    // If the user exists but doesn't have a google_id yet, update it
    if (!user.google_id) {

      await pool.query(
        `UPDATE users
         SET google_id=$1
         WHERE id=$2`,
        [googleId,user.id]
      );

    }

  }

  return user;

};