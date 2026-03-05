import {profileUser,updateProfileUser} from "../controllers/user.controller.js";
import express from "express";
const router = express.Router();

router.get("/profile", profileUser);
router.put("/profileput", updateProfileUser);

export default router;
