import pool from "../configuration/posgresdb.js"
import bcrypt from "bcrypt";


const registerUser = async (full_name, email, password ) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userQuery = "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING id";
        const userResult = await client.query(userQuery, [full_name, email, hashedPassword]);
        const userId = userResult.rows[0].id;

    
        const profileQuery = `
            INSERT INTO profile (id, description, language, phone, country, photo) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        //Values per defect sures
        const defaultDescription = "¡Bienvenido a mi perfil , te invito a que modifiques mi informacion con el boton que esta por aqui -->!";
        const defaultLang = "Spanish";
        const defaultPhone = "0";   
        const defaultCountry = "0"; 
        const defaultPhoto = "";   

        await client.query(profileQuery, [
            userId, 
            defaultDescription, 
            defaultLang, 
            defaultPhone, 
            defaultCountry,
            defaultPhoto
        ]);

        await client.query('COMMIT');
        return { id: userId, full_name, email };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error.message)
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