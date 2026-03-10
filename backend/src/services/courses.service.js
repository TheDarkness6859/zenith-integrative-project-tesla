import pool from "../configuration/posgresdb.js";

export const coursesServices = {

    get: async (userId) => {

        try {

            const query = "SELECT * FROM get_user_course ($1)";
            const res = await pool.query(query, [userId]);
            return res.rows;
            
        } catch (error) {
            
            console.error("Error to get the courses of the user", error);
            throw error;

        }

    },

    getC: async () => {

        try {
        
            const query = "SELECT id, name FROM course_category ORDER BY name ASC";
            const res = await pool.query(query);
            return res.rows;

        } catch (error) {
            
            console.error("Error to get the categories of course_category", error);
            throw error;

        }

    },

    getG: async () => {

        try {
        
            const query = "SELECT id, name FROM game_catalog ORDER BY name ASC";
            const res = await pool.query(query);
            return res.rows;

        } catch (error) {
            
            console.error("Error to get the categories of game_catalog", error);
            throw error;

        }

    },

    create: async (userId, { title, description, photo, isPublic, category, game, modules }) => {

        const client = await pool.connect();
        
        try {
            await client.query("BEGIN");

            const queryCourse = "SELECT create_course ($1, $2, $3, $4, $5, $6, $7 ) as id";
            const resCourse = await client.query(queryCourse, [userId, title, description, photo, isPublic,  category, game]);
            
            const newCourseId = resCourse.rows[0].id;

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
            console.error("Error in the transaction of creation");
            throw error;

        }finally{

            client.release();

        }
    },

    update: async (courseId, userId, { title, description, photo, game, category, isPublic, modules }) => {

        const client = await pool.connect();

        try {   

            await client.query("BEGIN");
            
            const queryCourse = "SELECT update_course($1, $2, $3, $4, $5, $6, $7, $8) as id";
            const resCourse = await client.query(queryCourse, [courseId, userId, title, description, photo , game, category, isPublic])

            const updateId = await resCourse.rows[0].id;

            if(!updateId){

                throw new Error("Unauthorized: You are not the owner of this course");

            }

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
            console.error("Error in the transaction of update");
            throw error

        } finally{

            client.release()

        }
    },

    delete: async (courseId, userId) => {

        try {
            
            const query = "DELETE FROM course where id = $1 AND user_id = $2 RETURNING *";
            const res = await pool.query(query, [courseId, userId]);
            
            if(res.rowCount === 0){
                return null;
            };

            return res.rows[0];

        } catch (error) {
            
            console.error("Error to delete the course");
            throw error;

        }
    }
}