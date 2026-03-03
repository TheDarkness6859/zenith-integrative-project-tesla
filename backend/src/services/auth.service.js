import {pool} from "../db.js"
import bcrypt from "bcrypt";


const registerUser = async (full_name, email, password ) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Insertamos el usuario en la tabla 'users'
        const userQuery = "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING id";
        const userResult = await client.query(userQuery, [full_name, email, hashedPassword]);
        const userId = userResult.rows[0].id;

    
        const profileQuery = `
            INSERT INTO profile (id, description, lenguage, phone, country) 
            VALUES ($1, $2, $3, $4, $5)
        `;
        
        // Valores por defecto seguros
        const defaultDescription = "¡Bienvenido a mi perfil , te invito a que modifiques mi informacion con el boton que esta por aqui -->!";
        const defaultLang = "Spanish";
        const defaultPhone = "0";   // Si esto falla, prueba con null
        const defaultCountry = "0"; // Si esto falla, prueba con null

        await client.query(profileQuery, [
            userId, 
            defaultDescription, 
            defaultLang, 
            defaultPhone, 
            defaultCountry
        ]);

        await client.query('COMMIT');
        return { id: userId, full_name, email };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error; 
    } finally {
        client.release();
    }   
}

const logedUser = async (email, password) => {

    const userSelect = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(userSelect, [email]);

    if(result.rows.length === 0) return { error: "user_not_found" }

    const userFound = result.rows[0];
    const match = await bcrypt.compare(password, userFound.password);

    return { match, userFound };

}

export {logedUser, registerUser}