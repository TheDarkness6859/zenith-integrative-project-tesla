import pool from "../configuration/posgresdb.js";

export const findOrCreateGoogleUser = async (profile) => {

  const email = profile.emails?.[0]?.value;
  const name = profile.displayName;
  const googleId = profile.id;

  // 1 buscar usuario por email
  const userQuery = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  let user;

  if (userQuery.rows.length === 0) {

    // 2 crear usuario
    const newUser = await pool.query(
      `INSERT INTO users(full_name,email,google_id,auth_provider)
       VALUES($1,$2,$3,'google')
       RETURNING *`,
      [name,email,googleId]
    );

    user = newUser.rows[0];

    // 3 crear profile
    await pool.query(
      `INSERT INTO profile(user_id) VALUES($1)`,
      [user.id]
    );

    // 4 crear puntos iniciales
    await pool.query(
      `INSERT INTO user_points(user_id,current_balance,current_streak,best_streak)
       VALUES($1,0,0,0)`,
      [user.id]
    );

  } else {

    user = userQuery.rows[0];

    // si existe pero no tenía google_id lo agregamos
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