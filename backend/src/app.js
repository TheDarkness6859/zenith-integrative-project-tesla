import express from "express"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.route.js"
import { fileURLToPath } from 'url';

const app = express();

import cors from 'cors';

app.use(cors({
    // origin: 'http://127.0.0.1:5500',
    origin: 'http://localhost:5500', // Cambia esto al origen de tu frontend
    credentials: true,               
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//Create a instance.    


//Allow that express can read json 
// app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

export default app;