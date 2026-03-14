import {profileUser,updateProfileUser} from "../controllers/user.controller.js";
import { isLoged } from "../middleware.js";

import express from "express";

const userRoutes = express.Router();

userRoutes.get("/profile", isLoged, profileUser);
userRoutes.put("/profileput", isLoged, updateProfileUser);

export default userRoutes;
