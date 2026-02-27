import {pool} from "../db.js"
import bcrypt from "bcrypt";


const registerUser = async (full_name, email, password ) => {

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING id";

    return await pool.query(newUser, [full_name, email, hashedPassword]);

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