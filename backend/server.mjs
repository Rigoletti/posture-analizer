import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.mjs';
import authRoutes from './routes/authRoutes.mjs';
import adminRoutes from './routes/adminRoutes.mjs';
import fileRoutes from './routes/fileRoutes.mjs';
import sessionRoutes from './routes/sessionRoutes.mjs';
import snapshotRoutes from './routes/snapshotRoutes.mjs'; // Добавляем
import reviewRoutes from './routes/reviewRoutes.mjs'; 
import recommendationRoutes from './routes/recommendationRoutes.mjs';
import subscriptionRoutes from './routes/subscriptionRoutes.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cookieParser());

// Увеличьте лимиты для загрузки файлов
app.use(express.json({ limit: '250mb' }));
app.use(express.urlencoded({ extended: true, limit: '250mb' }));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Добавляем PATCH
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

connectDB();

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Posture Analyzer API',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/auth/me',
      reviews: 'GET /api/reviews',
      snapshots: 'GET /api/snapshots'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/snapshots', snapshotRoutes); // Добавляем
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/subscription', subscriptionRoutes);

const uploadsDir = path.join(__dirname, 'uploads');
console.log('Uploads directory:', uploadsDir);

app.use('/uploads', express.static(uploadsDir));

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Файл слишком большой. Максимальный размер: 5MB'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: err.message || 'Внутренняя ошибка сервера'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}`);
});