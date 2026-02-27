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

export {isLoged, isGuest}