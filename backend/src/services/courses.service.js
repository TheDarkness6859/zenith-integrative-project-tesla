// PostgreSQL connection pool
import pool from "../configuration/posgresdb.js";

// Service layer that handles course-related database operations
export const coursesServices = {

    // Get courses created by the user and courses the user joined
    get: async (userId) => {

        try {

            // Run both queries at the same time for better performance
            const [created, enrolled] = await Promise.all([
                pool.query("SELECT * FROM get_my_course($1)", [userId]),
                pool.query("SELECT * FROM get_user_course($1)", [userId])
            ]);

            return {
                created: created.rows,
                enrolled: enrolled.rows
        };
            
        } catch (error) {
            
            console.error("Error getting the user's courses", error);
            throw error;

        }

    },

    // Get all course categories
    getC: async () => {

        try {
        
            const query = "SELECT id, name FROM course_category ORDER BY name ASC";
            const res = await pool.query(query);

            return res.rows;

        } catch (error) {
            
            console.error("Error getting course categories", error);
            throw error;

        }

    },

    // Get all games available in the catalog
    getG: async () => {

        try {
        
            const query = "SELECT id, name FROM game_catalog ORDER BY name ASC";
            const res = await pool.query(query);

            return res.rows;

        } catch (error) {
            
            console.error("Error getting game categories", error);
            throw error;

        }

    },

    // Get all public courses from the community
    getP: async () => {

        try {
        
            const query = "SELECT * FROM get_public_courses()";
            const res = await pool.query(query);

            return res.rows;

        } catch (error) {
            
            console.error("Error getting community courses", error);
            throw error;

        }

    },

    // Save the first session of a user in a course game
    saveSession: async (userId, {score, gameId, courseId}) => {

        const client = await pool.connect();

        try {

            // Start transaction
            await client.query("BEGIN");

            const query = "SELECT FROM save_first_session($1::uuid, $2::uuid, $3::uuid, $4) as id"
            const resSession = await client.query(query, [userId, gameId, courseId, score]);

            // Confirm changes
            await client.query("COMMIT");

            return resSession.rows[0].id

        } catch (error) {

            // Undo changes if something fails
            await client.query("ROLLBACK")

            console.error("Error saving score transaction");
            throw error;

        } finally{

            // Release connection back to the pool
            client.release();

        }

    },

    // Enroll a user into a course
    joinCourse: async (userId, courseId) => {

        const client = await pool.connect();

        try {

            await client.query("BEGIN");

            const query = "SELECT join_course($1, $2) as progress";
            const resJoin = await client.query(query, [userId, courseId]);

            await client.query("COMMIT");

            return resJoin.rows[0].progress;
            
        } catch (error) {

            await client.query("ROLLBACK")

            console.error("Error joining course transaction");
            throw error;

        } finally{

            client.release();
        
        }

    },

    // Create a new course with its modules
    create: async (userId, {title, description, photo, isPublic, category, game, modules}) => {

        const client = await pool.connect();
        
        try {

            await client.query("BEGIN");

            const queryCourse = "SELECT create_course ($1, $2, $3, $4, $5::uuid, $6::uuid, $7 ) as id";
            const resCourse = await client.query(queryCourse, [userId, title, description, photo, game, category, isPublic]);
            
            const newCourseId = resCourse.rows[0].id;

            // Insert modules if they exist
            if(modules && modules.length > 0){

                const queryModule = "INSERT INTO course_module (course_id, title, content, order_index) VALUES ($1, $2, $3, $4)";

                for (let i  = 0 ; i < modules.length; i ++ ){

                    const mod = modules[i];

                    await client.query(queryModule, [newCourseId, mod.title, mod.content, i + 1])

                };
            }

            await client.query("COMMIT");

            return {id: newCourseId};


        } catch (error) {

            await client.query("ROLLBACK");

            console.error("Error creating course transaction");
            throw error;

        }finally{

            client.release();

        }
    },

    // Update a course and its modules
    update: async (courseId, userId, { title, description, photo, game, category, isPublic, modules }) => {

        console.log("UPDATE PARAMS →", { courseId, userId, title, description, photo, game, category, isPublic })

        const client = await pool.connect();

        try {   

            await client.query("BEGIN");
            
            const queryCourse = "SELECT update_course($1, $2, $3, $4, $5, $6::uuid, $7::uuid, $8) as id";
            const resCourse = await client.query(queryCourse, [courseId, userId, title, description, photo , game, category, isPublic])

            const updateId = await resCourse.rows[0].id;

            // Check if the user is the owner of the course
            if(!updateId){

                throw new Error("Unauthorized: You are not the owner of this course");

            }

            // Remove old modules before inserting updated ones
            await client.query("DELETE FROM course_module WHERE course_id = $1", [courseId]);

            if(modules && modules.length > 0){

                const queryModule = "INSERT INTO course_module (course_id, title, content, order_index) VALUES ($1, $2, $3, $4)";

                for (let i  = 0 ; i < modules.length; i ++ ){

                    const mod = modules[i];

                    await client.query(queryModule, [courseId, mod.title, mod.content, i + 1])

                };
            }

            await client.query("COMMIT")

            return {id: updateId }


        } catch (error) {
            
            await client.query("ROLLBACK")

            console.error("Error updating course transaction");
            throw error

        } finally{

            client.release()

        }
    },

    // Delete a course only if it belongs to the user
    delete: async (courseId, userId) => {

        try {
            
            const query = "DELETE FROM course where id = $1 AND user_id = $2 RETURNING *";
            const res = await pool.query(query, [courseId, userId]);
            
            // If no rows were deleted, the course does not exist or is not owned by the user
            if(res.rowCount === 0){
                return null;
            };

            return res.rows[0];

        } catch (error) {
            
            console.error("Error deleting the course");
            throw error;

        }
    }
}