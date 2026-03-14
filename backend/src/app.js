import express from "express";
import cookieParser from "cookie-parser"
import cors from 'cors';
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import courseRoutes from "./routes/courses.routes.js";
import streakRoutes from "./routes/streak.routes.js";

const app = express();

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true,               
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

//Allow that express can read json.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

//Route url.
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/courses', courseRoutes)
app.use('/api/streak', streakRoutes);

export default app;