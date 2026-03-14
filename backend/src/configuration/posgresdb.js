import pkg from 'pg';
import "dotenv/config"

const { Pool } = pkg;

//Server connection

/* const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on("connect", (client) => {
  client.query(`SET search_path TO app_zenith, public`)
}); */

//----------------------------------------//

//Local connection with .env

const pool = new Pool({ 
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  options: `-c search_path=${process.env.DB_SCHEMA || 'public'},public`,
  connectionTimeoutMillis: 15000
});

export const connectPg = async () => {

  let client;

  try {

    client = await pool.connect()

    await client.query("SELECT NOW()");
    console.log('connected to PostgreSQL');

  } catch (error) {
    
    console.error('Error connection to PostgreSQL:', error.stack);
    
  }finally{

    if(client){
      client.release()
    }

  }
} 

export default pool