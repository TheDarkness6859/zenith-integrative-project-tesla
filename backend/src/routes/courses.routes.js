import express from "express";
import { coursesControllers } from "../controllers/courses.controllers.js";
import { isLoged } from "../middleware.js";

const courseRoutes = express.Router();

courseRoutes.get("/categories", isLoged, coursesControllers.getCategories);

courseRoutes.get("/games", isLoged, coursesControllers.getGames);


courseRoutes.get("/", isLoged, coursesControllers.getCourses);

courseRoutes.post("/", isLoged, coursesControllers.postCourse);

courseRoutes.put("/:id", isLoged, coursesControllers.putCourse);

courseRoutes.delete("/:id", isLoged, coursesControllers.deleteCourse);

export default courseRoutes;