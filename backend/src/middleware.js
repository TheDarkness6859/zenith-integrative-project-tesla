const isLoged = (req, res, next) => {

    const userId = req.cookies.user_session;

    if(userId){

        req.userId = userId;
        return next();

    }else{

        return res.status(401).json({ message: "No session found" });
    
    }
}

    const isGuest = (req, res, next) => {

        const userSession = req.cookies.user_session;

        if(userSession){

            if(req.headers.accept && req.headers.accept.includes('application/json')){

                return res.status(403).json({message: "acces denied: You are logged in"})

            }

        }else{

            return next()

        }
    }

export {isLoged, isGuest}