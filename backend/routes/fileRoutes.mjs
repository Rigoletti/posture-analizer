import express from 'express';
import fs from 'fs';
import path from 'path';
import { protect, authorize } from '../middleware/auth.mjs';

const router = express.Router();

// Маршрут для получения 3D модели
router.get('/exercise-model/:filename', protect, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads/exercises', filename);
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Файл не найден'
      });
    }
    
    // Отправляем файл
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error serving model file:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении файла'
    });
  }
});

// Маршрут для удаления файла (только для админов)
router.delete('/exercise-model/:filename', protect, authorize('admin'), (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads/exercises', filename);
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Файл не найден'
      });
    }
    
    // Удаляем файл
    fs.unlinkSync(filePath);
    
    res.status(200).json({
      success: true,
      message: 'Файл успешно удален'
    });
  } catch (error) {
    console.error('Error deleting model file:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении файла'
    });
  }
});

export default router;