require('dotenv').config();

const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
})

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on("connect", (client) =>{
  const schema = process.env.DB_SCHEMA || "public";
  client.query(`SET search_path TO ${schema}, public`)
    .catch(error => console.error("Error config search_path", error));
})

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connection to PostgreSQL:', err.stack);
  } else {
    console.log('connected to PostgreSQL');
  }
});

module.exports = {pool};