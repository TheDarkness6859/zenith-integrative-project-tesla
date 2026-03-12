import * as userService from '../services/user.service.js';


const profileUser = async (req, res) => {
    try {

        const userId = req.userId;
        const userProfile = await userService.profile(userId); 

        if (!userProfile) {
            return res.status(404).json({ message: "profile data not found user" });
        }

        res.status(200).json(userProfile);
        
    } catch (error) {

        console.error("Error in profileUser:", error);
        res.status(500).json({ error: "Error to get the profile" });
        
    }
};


const updateProfileUser = async (req, res) => {
    try {

        const userId = req.userId; 

        await userService.updateProfile(userId, req.body);

        res.status(200).json({ message: "profile updated correctly" });

    } catch (error) {

        console.error("Error in updateProfileUser:", error);
        res.status(500).json({ error: "Error to update profile" });

    }
};

export { profileUser, updateProfileUser };