import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.get('/health', (_req, res) => {
  res.json({ success: true, databaseConnected: mongoose.connection.readyState === 1 });
});
app.use('/api/v1/auth', (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ success: false, message: 'Chưa kết nối được MongoDB. Vui lòng kiểm tra cấu hình database.' });
    return;
  }
  next();
}, authRoutes);
app.use((_req, res) => { res.status(404).json({ success: false, message: 'Không tìm thấy API.' }); });
app.use(errorHandler);
export default app;
