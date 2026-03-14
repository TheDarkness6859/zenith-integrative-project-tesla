export const googleAuthSuccess = (req, res) => {

  res.json({
    message: "Google login successful",
    user: req.user
  });
  
};

export const googleAuthFailure = (req, res) => {

  res.status(401).json({
    message: "Google login failed"
  });

};
