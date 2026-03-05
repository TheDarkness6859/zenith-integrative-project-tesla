import path from "path";
import pkg from 'pg';
import dotenv from "dotenv";
const { Pool } = pkg;

dotenv.config({
  path: path.resolve("backend/.env")
})

//Server connection

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on("connect", (client) => {
  client.query(`SET search_path TO app_zenith, public`)
});

//Local connection with .env

// const pool = new Pool({ 
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// pool.on("connect", (client) =>{
//   const schema = process.env.DB_SCHEMA || "public";
//   client.query(`SET search_path TO ${schema}, public`)
//     .catch(error => console.error("Error config search_path", error));
// }) 

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connection to PostgreSQL:', err.stack);
  } else {
    console.log('connected to PostgreSQL');
  }
});

export { pool }