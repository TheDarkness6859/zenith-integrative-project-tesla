import pool from "../configuration/posgresdb.js"

// 1. Get full user profile (data from 'users' + 'profile')
const profile = async (userId) => {

    const query = `
        SELECT u.full_name,u.email, profile.description, profile.language, profile.photo, profile.phone, profile.country
        FROM users u
        LEFT JOIN profile ON u.id = profile.id
        WHERE u.id = $1
    `;

    // LEFT JOIN allows returning user data even if the profile does not exist yet
    const result = await pool.query(query, [userId]);

    return result.rows[0];
};

// 2. Save or update profile
const updateProfile = async (userId, data) => { 
    const { full_name, email, description, language, phone, country, photo } = data;

    // Use a transaction to keep both tables consistent
    const client = await pool.connect();
    
    try {

        await client.query('BEGIN');

        // Update basic user information
        await client.query(
            "UPDATE users SET full_name = $1, email = $2 WHERE id = $3", 
            [full_name, email, userId]
        );

        // Insert or update profile using UPSERT
        const queryProfile = `
            INSERT INTO profile (id, description, language, phone, country, photo) 
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) 
            DO UPDATE SET 
                description = EXCLUDED.description, 
                language = EXCLUDED.language, 
                phone = EXCLUDED.phone, 
                country = EXCLUDED.country,
                photo = EXCLUDED.photo
        `;

        await client.query(queryProfile, [userId, description, language, phone, country, photo]);

        // Confirm changes
        await client.query('COMMIT');

        return { success: true };

    } catch (error) {

        // Undo changes if something fails
        await client.query('ROLLBACK');

        throw error;

    } finally {

        // Release connection back to the pool
        client.release();

    }
}

export { profile, updateProfile };