// 1. Obtener perfil completo (Datos de 'users' + 'profile')
app.get("/user/profile", isLoged, async (req, res) => {
    const userId = req.cookies.user_session; // Sacamos el ID de la cookie segura

    try {
        const query = `
            SELECT u.full_name, u.email, p.description, p.language, p.photo
            FROM users u
            LEFT JOIN profile p ON u.id = p.user_id 
            WHERE u.id = $1
        `;
        const result = await db.pool.query(query, [userId]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener perfil" });
    }
});

// 2. Guardar o Actualizar perfil
app.put("/api/user/update-profile", isLoged, async (req, res) => {
    const userId = req.cookies.user_session;
    const { full_name, email, description, language, phone, country } = req.body;

    try {
        // Actualizamos tabla users
        await db.pool.query("UPDATE users SET full_name = $1, email = $2 WHERE id = $3", [full_name, email, userId]);

        // Actualizamos o insertamos en tabla profile
        const queryProfile = `
            INSERT INTO profile (user_id, description, language, photo, phone, country) 
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id) 
            DO UPDATE SET description = EXCLUDED.description, language = EXCLUDED.language, photo = EXCLUDED.photo, phone = EXCLUDED.phone, country = EXCLUDED.country
        `;
        await db.pool.query(queryProfile, [userId, description, language, photo, phone, country]);

        res.json({ message: "Perfil actualizado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});