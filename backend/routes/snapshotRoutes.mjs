import express from 'express';
import multer from 'multer';
import snapshotController from '../controllers/snapshotController.mjs';
import { protect } from '../middleware/auth.mjs';

const router = express.Router();

// Настройка multer для загрузки изображений
const storage = multer.memoryStorage(); // Храним в памяти для последующей обработки

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый формат изображения. Разрешены: JPEG, PNG, WEBP'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Все маршруты требуют авторизации
router.use(protect);

// Создать снимок для сеанса
router.post(
  '/session/:sessionId',
  upload.single('image'),
  snapshotController.createSnapshot
);

// Получить снимки сеанса
router.get('/session/:sessionId', snapshotController.getSessionSnapshots);

// Получить статистику снимков
router.get('/statistics', snapshotController.getSnapshotsStatistics);

// Получить изображение снимка
router.get('/:snapshotId/image', snapshotController.getSnapshotImage);

// Получить миниатюру снимка
router.get('/:snapshotId/thumbnail', snapshotController.getSnapshotThumbnail);

// Получить детали снимка
router.get('/:snapshotId', snapshotController.getSnapshotDetails);

// Обновить снимок
router.patch('/:snapshotId', snapshotController.updateSnapshot);

// Удалить снимок
router.delete('/:snapshotId', snapshotController.deleteSnapshot);

// Массовое удаление снимков
router.post('/bulk-delete', snapshotController.bulkDeleteSnapshots);

export default router;