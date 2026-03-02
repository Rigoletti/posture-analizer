import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import sharp from 'sharp';
import PostureSnapshot from '../models/PostureSnapshot.mjs';
import Session from '../models/Session.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройка GridFS
let gridFSBucket;

const getGridFSBucket = () => {
  if (!gridFSBucket) {
    const conn = mongoose.connection;
    gridFSBucket = new GridFSBucket(conn.db, {
      bucketName: 'snapshots'
    });
  }
  return gridFSBucket;
};

// Создание снимка
export const createSnapshot = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { 
        type = 'auto',
        postureStatus,
        issueDetails = {},
        poseData,
        importance = 5,
        tags = [],
        notes
      } = req.body;
  
      console.log('Creating snapshot for session:', sessionId);
  
      // Получаем issues из req.body (убрал дублирование)
      const { issues } = req.body;
  
      // Парсим issues если это строка
      let parsedIssues = issues;
      if (typeof issues === 'string') {
        try {
          parsedIssues = JSON.parse(issues);
        } catch (e) {
          parsedIssues = [issues];
        }
      }
  
      // Проверяем сеанс
      const session = await Session.findOne({ 
        sessionId: sessionId,
        userId: req.user._id 
      });
  
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Сеанс не найден'
        });
      }
  
      // Проверяем наличие изображения
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Изображение не предоставлено'
        });
      }
  
      console.log('Processing image:', req.file.originalname, req.file.size);
      console.log('Parsed issues:', parsedIssues); // Для отладки
  
      // Создаем миниатюру
      const thumbnailBuffer = await sharp(req.file.buffer)
  .resize(400, 400, { fit: 'cover' }) // Увеличил размер с 200 до 400
  .jpeg({ quality: 85 }) // Увеличил качество с 70 до 85
  .toBuffer();
  
      // Сохраняем оригинал в GridFS
      const bucket = getGridFSBucket();
      
      const originalFilename = `snapshot_${Date.now()}_${req.file.originalname}`;
      const thumbnailFilename = `thumb_${Date.now()}_${req.file.originalname}`;
  
      // Загружаем оригинал
      const originalUploadStream = bucket.openUploadStream(originalFilename, {
        contentType: req.file.mimetype || 'image/jpeg',
        metadata: {
          userId: req.user._id.toString(),
          sessionId: session._id.toString(),
          type: 'original'
        }
      });
  
      await new Promise((resolve, reject) => {
        originalUploadStream.end(req.file.buffer);
        originalUploadStream.on('finish', resolve);
        originalUploadStream.on('error', reject);
      });
  
      const originalFileId = originalUploadStream.id;
  
      // Загружаем миниатюру
      const thumbnailUploadStream = bucket.openUploadStream(thumbnailFilename, {
        contentType: 'image/jpeg',
        metadata: {
          userId: req.user._id.toString(),
          sessionId: session._id.toString(),
          type: 'thumbnail',
          originalId: originalFileId
        }
      });
  
      await new Promise((resolve, reject) => {
        thumbnailUploadStream.end(thumbnailBuffer);
        thumbnailUploadStream.on('finish', resolve);
        thumbnailUploadStream.on('error', reject);
      });
  
      const thumbnailFileId = thumbnailUploadStream.id;
  
      // Получаем размеры изображения
      const metadata = await sharp(req.file.buffer).metadata();
  
      // Рассчитываем оценку осанки на основе проблем
      let postureScore = 100;
      if (parsedIssues && parsedIssues.length > 0) {
        const baseScore = 100;
        const penaltyPerIssue = 15;
        postureScore = Math.max(0, baseScore - (parsedIssues.length * penaltyPerIssue));
      }
  
      // Создаем запись в БД
      const snapshotData = {
        sessionId: session._id,
        userId: req.user._id,
        type,
        postureStatus: postureStatus || 'warning',
        postureScore,
        issues: parsedIssues || [],
        issueDetails: issueDetails || {},
        poseData: poseData || {}, // Важно сохранять poseData
        importance,
        tags: tags || [],
        notes: notes || '',
        imageMetadata: {
          filename: originalFilename,
          contentType: req.file.mimetype || 'image/jpeg',
          size: req.file.size,
          width: metadata.width || 480,
          height: metadata.height || 480,
          thumbnailId: thumbnailFileId
        }
      };
  
      const snapshot = await PostureSnapshot.create(snapshotData);
  
      console.log('Snapshot created:', snapshot._id);
  
      // Добавляем ссылку на снимок в сеанс
      if (!session.postureSnapshots) {
        session.postureSnapshots = [];
      }
  
      session.postureSnapshots.push({
        snapshotId: snapshot._id,
        timestamp: snapshot.timestamp,
        status: postureStatus,
        issues: parsedIssues,
        thumbnailId: thumbnailFileId
      });
  
      await session.save();
  
      res.status(201).json({
        success: true,
        data: {
          _id: snapshot._id,
          timestamp: snapshot.timestamp,
          postureStatus: snapshot.postureStatus,
          postureScore: snapshot.postureScore,
          issues: snapshot.issues,
          imageUrl: snapshot.imageUrl,
          thumbnailUrl: snapshot.thumbnailUrl,
          message: 'Снимок успешно сохранен'
        }
      });
  
    } catch (error) {
      console.error('Create snapshot error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании снимка: ' + error.message
      });
    }
  };

// Получить снимки сеанса
export const getSessionSnapshots = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 20, type, status, favorite } = req.query;

    console.log('Getting snapshots for session:', sessionId);

    // Находим сеанс
    const session = await Session.findOne({ 
      sessionId: sessionId,
      userId: req.user._id 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Сеанс не найден'
      });
    }

    // Строим запрос
    const query = { sessionId: session._id };
    
    if (type) query.type = type;
    if (status) query.postureStatus = status;
    if (favorite === 'true') query.isFavorite = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const snapshots = await PostureSnapshot.find(query)
      .sort({ timestamp: -1, importance: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-poseData.keypoints -issueDetails'); // Исключаем тяжелые поля для списка

    const total = await PostureSnapshot.countDocuments(query);

    // Обогащаем данными
    const enrichedSnapshots = snapshots.map(snapshot => ({
      _id: snapshot._id,
      timestamp: snapshot.timestamp,
      type: snapshot.type,
      postureStatus: snapshot.postureStatus,
      postureScore: snapshot.postureScore,
      issues: snapshot.issues,
      isFavorite: snapshot.isFavorite,
      thumbnailUrl: snapshot.thumbnailUrl,
      imageUrl: snapshot.imageUrl,
      importance: snapshot.importance,
      views: snapshot.views
    }));

    res.status(200).json({
      success: true,
      data: {
        snapshots: enrichedSnapshots,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get session snapshots error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении снимков: ' + error.message
    });
  }
};

// Получить изображение снимка
export const getSnapshotImage = async (req, res) => {
  try {
    const { snapshotId } = req.params;

    const snapshot = await PostureSnapshot.findOne({
      _id: snapshotId,
      userId: req.user._id
    });

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        error: 'Снимок не найден'
      });
    }

    // Увеличиваем счетчик просмотров
    await snapshot.incrementViews();

    const bucket = getGridFSBucket();
    const filename = snapshot.imageMetadata.filename;

    const downloadStream = bucket.openDownloadStreamByName(filename);

    res.set('Content-Type', snapshot.imageMetadata.contentType);
    res.set('Content-Length', snapshot.imageMetadata.size.toString());
    res.set('Cache-Control', 'public, max-age=31536000'); // Кэш на год

    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      console.error('Error streaming image:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при загрузке изображения'
      });
    });

  } catch (error) {
    console.error('Get snapshot image error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении изображения: ' + error.message
    });
  }
};

// Получить миниатюру
export const getSnapshotThumbnail = async (req, res) => {
  try {
    const { snapshotId } = req.params;

    const snapshot = await PostureSnapshot.findOne({
      _id: snapshotId,
      userId: req.user._id
    });

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        error: 'Снимок не найден'
      });
    }

    if (!snapshot.imageMetadata.thumbnailId) {
      return res.status(404).json({
        success: false,
        error: 'Миниатюра не найдена'
      });
    }

    const bucket = getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(snapshot.imageMetadata.thumbnailId);

    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000');

    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      console.error('Error streaming thumbnail:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при загрузке миниатюры'
      });
    });

  } catch (error) {
    console.error('Get snapshot thumbnail error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении миниатюры: ' + error.message
    });
  }
};

// Получить детали снимка
export const getSnapshotDetails = async (req, res) => {
  try {
    const { snapshotId } = req.params;

    const snapshot = await PostureSnapshot.findOne({
      _id: snapshotId,
      userId: req.user._id
    });

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        error: 'Снимок не найден'
      });
    }

    // Увеличиваем счетчик просмотров
    await snapshot.incrementViews();

    res.status(200).json({
      success: true,
      data: {
        _id: snapshot._id,
        sessionId: snapshot.sessionId,
        timestamp: snapshot.timestamp,
        type: snapshot.type,
        postureStatus: snapshot.postureStatus,
        postureScore: snapshot.postureScore,
        issues: snapshot.issues,
        issueDetails: snapshot.issueDetails,
        poseData: snapshot.poseData,
        isFavorite: snapshot.isFavorite,
        notes: snapshot.notes,
        tags: snapshot.tags,
        importance: snapshot.importance,
        views: snapshot.views,
        imageUrl: snapshot.imageUrl,
        thumbnailUrl: snapshot.thumbnailUrl,
        imageMetadata: snapshot.imageMetadata,
        createdAt: snapshot.createdAt
      }
    });

  } catch (error) {
    console.error('Get snapshot details error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении деталей снимка: ' + error.message
    });
  }
};

// Обновить снимок
export const updateSnapshot = async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const { isFavorite, notes, tags, importance } = req.body;

    const snapshot = await PostureSnapshot.findOne({
      _id: snapshotId,
      userId: req.user._id
    });

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        error: 'Снимок не найден'
      });
    }

    if (isFavorite !== undefined) snapshot.isFavorite = isFavorite;
    if (notes !== undefined) snapshot.notes = notes;
    if (tags !== undefined) snapshot.tags = tags;
    if (importance !== undefined) snapshot.importance = importance;

    await snapshot.save();

    res.status(200).json({
      success: true,
      data: {
        _id: snapshot._id,
        isFavorite: snapshot.isFavorite,
        notes: snapshot.notes,
        tags: snapshot.tags,
        importance: snapshot.importance,
        message: 'Снимок успешно обновлен'
      }
    });

  } catch (error) {
    console.error('Update snapshot error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении снимка: ' + error.message
    });
  }
};

// Удалить снимок
export const deleteSnapshot = async (req, res) => {
  try {
    const { snapshotId } = req.params;

    const snapshot = await PostureSnapshot.findOne({
      _id: snapshotId,
      userId: req.user._id
    });

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        error: 'Снимок не найден'
      });
    }

    const bucket = getGridFSBucket();

    // Удаляем файлы из GridFS
    try {
      // Удаляем оригинал
      await bucket.delete(new mongoose.Types.ObjectId(snapshot.imageMetadata.filename.split('_')[2])); // Это упрощенно, лучше хранить ID
    } catch (err) {
      console.warn('Error deleting original file:', err);
    }

    try {
      // Удаляем миниатюру
      if (snapshot.imageMetadata.thumbnailId) {
        await bucket.delete(snapshot.imageMetadata.thumbnailId);
      }
    } catch (err) {
      console.warn('Error deleting thumbnail:', err);
    }

    // Удаляем запись из БД
    await snapshot.deleteOne();

    // Удаляем ссылку из сеанса
    await Session.updateOne(
      { _id: snapshot.sessionId },
      { $pull: { postureSnapshots: { snapshotId: snapshot._id } } }
    );

    res.status(200).json({
      success: true,
      message: 'Снимок успешно удален'
    });

  } catch (error) {
    console.error('Delete snapshot error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении снимка: ' + error.message
    });
  }
};

// Получить статистику снимков
export const getSnapshotsStatistics = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await PostureSnapshot.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSnapshots: { $sum: 1 },
          favoriteSnapshots: {
            $sum: { $cond: ['$isFavorite', 1, 0] }
          },
          warningSnapshots: {
            $sum: { $cond: [{ $eq: ['$postureStatus', 'warning'] }, 1, 0] }
          },
          errorSnapshots: {
            $sum: { $cond: [{ $eq: ['$postureStatus', 'error'] }, 1, 0] }
          },
          goodSnapshots: {
            $sum: { $cond: [{ $eq: ['$postureStatus', 'good'] }, 1, 0] }
          },
          avgImportance: { $avg: '$importance' },
          totalViews: { $sum: '$views' }
        }
      }
    ]);

    // Статистика по проблемам
    const issuesStats = await PostureSnapshot.aggregate([
      { $match: { userId: userId } },
      { $unwind: '$issues' },
      {
        $group: {
          _id: '$issues',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Последние снимки по дням
    const dailyStats = await PostureSnapshot.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$postureScore' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalSnapshots: 0,
          favoriteSnapshots: 0,
          warningSnapshots: 0,
          errorSnapshots: 0,
          goodSnapshots: 0,
          avgImportance: 0,
          totalViews: 0
        },
        issuesStats,
        dailyStats
      }
    });

  } catch (error) {
    console.error('Get snapshots statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики снимков: ' + error.message
    });
  }
};

// Массовое удаление снимков
export const bulkDeleteSnapshots = async (req, res) => {
  try {
    const { snapshotIds } = req.body;

    if (!snapshotIds || !Array.isArray(snapshotIds) || snapshotIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Не указаны ID снимков для удаления'
      });
    }

    const snapshots = await PostureSnapshot.find({
      _id: { $in: snapshotIds },
      userId: req.user._id
    });

    const bucket = getGridFSBucket();

    // Удаляем файлы и записи
    for (const snapshot of snapshots) {
      try {
        // Удаляем оригинал
        const fileId = snapshot.imageMetadata.filename.split('_')[2];
        if (fileId) {
          await bucket.delete(new mongoose.Types.ObjectId(fileId));
        }
      } catch (err) {
        console.warn('Error deleting file:', err);
      }

      try {
        // Удаляем миниатюру
        if (snapshot.imageMetadata.thumbnailId) {
          await bucket.delete(snapshot.imageMetadata.thumbnailId);
        }
      } catch (err) {
        console.warn('Error deleting thumbnail:', err);
      }
    }

    // Удаляем записи
    await PostureSnapshot.deleteMany({
      _id: { $in: snapshotIds },
      userId: req.user._id
    });

    // Удаляем ссылки из сеансов
    await Session.updateMany(
      { userId: req.user._id },
      { $pull: { postureSnapshots: { snapshotId: { $in: snapshotIds } } } }
    );

    res.status(200).json({
      success: true,
      message: `Удалено ${snapshots.length} снимков`
    });

  } catch (error) {
    console.error('Bulk delete snapshots error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при массовом удалении снимков: ' + error.message
    });
  }
};

export default {
  createSnapshot,
  getSessionSnapshots,
  getSnapshotImage,
  getSnapshotThumbnail,
  getSnapshotDetails,
  updateSnapshot,
  deleteSnapshot,
  getSnapshotsStatistics,
  bulkDeleteSnapshots
};