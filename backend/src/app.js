//Call express from node_modules.
const express = require("express");
const path = require("path");
const bcrypt = require('bcrypt');
const db = require('./db');
const cookieParser = require('cookie-parser');

//Create a instance.    
const app = express()

app.use(express.static(path.join(__dirname, '../../frontend/static')));

//Allow that express can read json 
app.use(express.json());
app.use(cookieParser());

const isLoged = (req, res, next) => {

    const userSession = req.cookies.user_session;

    if(userSession){
        return next();
    }else{
        return res.redirect("/");
    }
}

const isGuest = (req, res, next) => {
    const userSession = req.cookies.user_session;

    if(userSession){
        return res.redirect("/dashboard")
    }else{
        return next()
    }
}

app.get("/", isGuest, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/templates/auth/index.html")));

app.get("/register", isGuest, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/templates/auth/register.html")));

app.get("/dashboard", isLoged, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/templates/dashboard/dashboard.html")));

app.post("/api/auth/register", async (req, res) =>{
    const { full_name, email, password } = req.body;

    try {
        const saltRounds = 10;

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 1. Insertamos el usuario y pedimos que nos devuelva el ID creado
        const newUserQuery = "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING id";
        const result = await db.pool.query(newUserQuery, [full_name, email, hashedPassword]);
        
        const newUserId = result.rows[0].id; 

        // CREAMOS EL PERFIL VACÍO PARA ESE USUARIO
        await db.pool.query("INSERT INTO profile (user_id) VALUES ($1)", [newUserId]);

        // const newUser = "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING id";

        // await db.pool.query(newUser, [full_name, email, hashedPassword]);

        res.status(201).json({ message: "User register" });

    } catch (error) {
        console.log(error);

        if(error.code === "23505"){
            return res.status(400).json({ error: "The email is loged" });
        }
        res.status(500).json({ error: "Error to register the user" });
    }

})

app.post("/api/auth/login", async (req, res) =>{
    const {email, password} = req.body;

    try {
        const userSelect = "SELECT * FROM users WHERE email = $1";
        const result = await db.pool.query(userSelect, [email]);

        if(result.rows.length === 0){
            return res.status(401).json({error: "can't found the user"})
        }

        const userFound = result.rows[0];

        const match = await bcrypt.compare(password, userFound.password);

        if(match){
            res.cookie("user_session", userFound.id,{
                httpOnly : true,
                maxAge: 2 * 60 * 60 * 1000
            })

            res.json({ 
                message: "Bienvenido", 
                user: { id: userFound.id, name: userFound.full_name } 
            });

        }else{
            res.status(401).json({ error: "Wrong password"});
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
})

module.exports = app;