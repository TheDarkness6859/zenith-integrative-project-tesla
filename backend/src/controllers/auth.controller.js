import * as authService from '../services/auth.service.js';

const register = async (req, res) =>{
    const { full_name, email, password } = req.body;

    try {

        await authService.registerUser(full_name,email, password)
        res.status(201).json({ message: "User register" });

    } catch (error) {

        if(error.code === "23505"){
            return res.status(400).json({ error: "The email is loged" });
        }
        res.status(500).json({ error: "Error to register the user" });

    }
};

const login = async (req, res) => {
    const {email, password} = req.body;

    try {

        const result = await authService.logedUser(email, password)

        if(result.error === "user_not_found"){
            return res.status(401).json({error: "can't found user"})
        }

        if(result.match){

            res.cookie("user_session", result.userFound.id,{
                httpOnly : true,
                maxAge: 2 * 60 * 60 * 1000
            })

            res.json({ 
                message: "Welcome", 
                user: { id: result.userFound.id, name: result.userFound.full_name } 
            });
        }else {
            res.status(401).json({ error: "Wrong password" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
}

export { register, login };