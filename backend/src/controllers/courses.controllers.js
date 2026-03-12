import { coursesServices } from "../services/courses.service.js";

export const coursesControllers = {

    getCourses: async (req, res) => {

        try {
        
            const userId = req.userId;
            const courses = await coursesServices.get(userId);

            res.status(200).json({

                message: "Courses retrieved successfully",
                data: courses

            });

        } catch (error) {
        
            console.error('Error in getCourses controller:', error);
            res.status(500).json({ error: "Internal Server Error" });

        }

    },

    getCategories: async (req, res) => {

        try {

            const categories = await coursesServices.getC();

            res.status(200).json({
                message: "Categories retrieved sucessfully",
                data: categories
            });
        
        } catch (error) {

            console.error('Error in getCategories controller:', error);
            res.status(500).json({ error: "Internal Server Error" });
        
        }

    },

    getGames: async (req, res) => {

        try {

            const games = await coursesServices.getG();

            res.status(200).json({
                message: "Games retrie ved sucessfully",
                data: games
            });
        
        } catch (error) {

            console.error('Error in getGames controller:', error);
            res.status(500).json({ error: "Internal Server Error" });
        
        }

    },

    deleteCourse: async (req, res) => {

        try {
            
            const {id} = req.params;
            const userId = req.userId;

            const deletedCourse = await coursesServices.delete(id, userId)

            if(!deletedCourse){
                return res.status(404).json({ error: "Course not found" });
            }

            res.status(200).json({

                message: "Course deleted correctly",
                data: deletedCourse

            })

        } catch (error) {
        
            console.error('Error in deleteCourse controller:', error);
            res.status(500).json({ error: "Internal Server Error" });

        }

    },

    postCourse: async (req, res) => {

        try {

            const userId = req.userId;
            const {title, description, photo, isPublic,  category, game, modules} = req.body;

            if(!title || !description || !category || !game ){

                return res.status(400).json({message: "Please complete all required fields"})

            }

            const createdCourse = await coursesServices.create(userId, title, description, photo, isPublic,  category, game, modules);

            res.status(201).json({
                
                message: "course created correctly",
                data: createdCourse

            })


            
        } catch (error) {

            console.error('Error in postCourse controller:', error);
            res.status(500).json({ error: "Internal Server Error" });
        
        }

    },

    putCourse: async (req, res) => {

        try {
            
            const userId = req.userId
            const {id} = req.params;
            const updatedData = req.body;

            if(!updatedData.title || !updatedData.description || !updatedData.category || !updatedData.game ){

                return res.status(400).json({message: "Please complete all required fields"})

            }
        
            const updatedCourse = await coursesServices.update(id, userId, updatedData);

            res.status(200).json({

                message: "course updated correctly",
                data: updatedCourse

            })

        } catch (error) {

            if(error.message.includes("Unauthorized")){

                return res.status(403).json({ error: error.message })

            }
        
            console.error('Error in postCourse controller:', error);
            res.status(500).json({ error: "Internal Server Error" });

        }

    }

}