#!/usr/bin/env node
import app from "./app.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ 
    path: path.resolve(process.cwd(), "backend/.env") 
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () =>{
    console.log(`Join to the website: http://localhost:${PORT}`);
});