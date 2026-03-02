import mongoose from 'mongoose';
import Session from '../models/Session.mjs';
import Recommendation from '../models/Recommendation.mjs';

// Начать новый сеанс
export const startSession = async (req, res) => {
  try {
    console.log('Start session request from user:', req.user?._id);
    console.log('Start session request body:', req.body);
    
    const { settings, deviceInfo } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не авторизован'
      });
    }
    
    // Генерируем уникальный ID сеанса
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sessionData = {
      userId: req.user._id,
      sessionId,
      startTime: new Date(),
      settings: settings || {
        confidenceThreshold: 0.5,
        deviationThreshold: 0.1,
        notificationEnabled: true,
        calibrationType: 'auto'
      },
      deviceInfo: deviceInfo || {},
      status: 'active',
      postureMetrics: {
        totalFrames: 0,
        goodPostureFrames: 0,
        warningFrames: 0,
        errorFrames: 0,
        errorsByZone: {
          shoulders: { count: 0, duration: 0 },
          head: { count: 0, duration: 0 },
          hips: { count: 0, duration: 0 }
        },
        postureScore: 0,
        averageTrackingQuality: 0
      }
    };
    
    console.log('Creating session with data:', sessionData);
    
    const session = await Session.create(sessionData);
    
    console.log('Session created:', session.sessionId);
    
    res.status(201).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        message: 'Сеанс успешно начат'
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при начале сеанса: ' + error.message
    });
  }
};

// Завершить сеанс
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { finalMetrics, endSnapshots } = req.body;
    
    console.log('Ending session:', sessionId, 'by user:', req.user?._id);
    
    const session = await Session.findOne({ 
      sessionId: sessionId, 
      userId: req.user._id 
    });
    
    if (!session) {
      console.log('Session not found for ending:', sessionId);
      return res.status(404).json({
        success: false,
        error: 'Сеанс не найден'
      });
    }


    if (finalMetrics) {
  session.postureMetrics = {
    ...session.postureMetrics,
    ...finalMetrics
  };
  
  // Пересчитываем процентное соотношение
  const totalFrames = session.postureMetrics.totalFrames || 1;
  session.postureMetrics.goodPercentage = Math.round((session.postureMetrics.goodPostureFrames / totalFrames) * 100);
  session.postureMetrics.warningPercentage = Math.round((session.postureMetrics.warningFrames / totalFrames) * 100);
  session.postureMetrics.errorPercentage = Math.round((session.postureMetrics.errorFrames / totalFrames) * 100);
  
  // Также рассчитываем проценты для ошибок по зонам
  const duration = session.duration || 1;
  if (session.postureMetrics.errorsByZone) {
    Object.keys(session.postureMetrics.errorsByZone).forEach(zone => {
      if (session.postureMetrics.errorsByZone[zone]) {
        session.postureMetrics.errorsByZone[zone].percentage = 
          Math.round((session.postureMetrics.errorsByZone[zone].duration / duration) * 1000) / 10; // 1 десятичный знак
      }
    });
  }
}
    session.endTime = new Date();
    session.duration = Math.floor((session.endTime - session.startTime) / 1000);
    session.status = 'completed';
    
    if (finalMetrics) {
      session.postureMetrics = {
        ...session.postureMetrics,
        ...finalMetrics
      };
      
      // Пересчитываем процентное соотношение
      const totalFrames = session.postureMetrics.totalFrames || 1;
      session.postureMetrics.goodPercentage = Math.round((session.postureMetrics.goodPostureFrames / totalFrames) * 100);
      session.postureMetrics.warningPercentage = Math.round((session.postureMetrics.warningFrames / totalFrames) * 100);
      session.postureMetrics.errorPercentage = Math.round((session.postureMetrics.errorFrames / totalFrames) * 100);
    }
    
    if (endSnapshots) {
      session.postureSnapshots = endSnapshots;
    }
    
    await session.save();
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        message: 'Сеанс успешно завершен',
        duration: session.duration,
        postureScore: session.postureMetrics.postureScore
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при завершении сеанса'
    });
  }
};

// Обновить метрики сеанса
export const updateSessionMetrics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { frameData, timestamp, currentStatus, issues = [] } = req.body;
    
    console.log('Updating session metrics for:', sessionId, 'by user:', req.user?._id);
    
    const session = await Session.findOne({ 
      sessionId: sessionId, // <-- Используем sessionId напрямую
      userId: req.user._id 
    });
    
    if (!session) {
      console.log('Session not found for update:', sessionId);
      return res.status(404).json({
        success: false,
        error: 'Сеанс не найден'
      });
    }

    // Обновляем метрики
    session.postureMetrics.totalFrames = (session.postureMetrics.totalFrames || 0) + 1;
    
    if (currentStatus === 'good') {
      session.postureMetrics.goodPostureFrames = (session.postureMetrics.goodPostureFrames || 0) + 1;
    } else if (currentStatus === 'warning') {
      session.postureMetrics.warningFrames = (session.postureMetrics.warningFrames || 0) + 1;
    } else if (currentStatus === 'error') {
      session.postureMetrics.errorFrames = (session.postureMetrics.errorFrames || 0) + 1;
    }
    
    // Обновляем ошибки по зонам
    if (issues.length > 0) {
      issues.forEach(issue => {
        if (issue.includes('shoulder') && session.postureMetrics.errorsByZone.shoulders) {
          session.postureMetrics.errorsByZone.shoulders.count += 1;
          session.postureMetrics.errorsByZone.shoulders.duration += 0.1; // Пример: 0.1 секунды на кадр
        }
        if (issue.includes('head') && session.postureMetrics.errorsByZone.head) {
          session.postureMetrics.errorsByZone.head.count += 1;
          session.postureMetrics.errorsByZone.head.duration += 0.1;
        }
        if (issue.includes('hip') && session.postureMetrics.errorsByZone.hips) {
          session.postureMetrics.errorsByZone.hips.count += 1;
          session.postureMetrics.errorsByZone.hips.duration += 0.1;
        }
      });
    }
    
    // Добавляем снимок позы
    if (frameData && session.postureSnapshots.length < 100) { // Ограничиваем количество снимков
      session.postureSnapshots.push({
        timestamp: new Date(timestamp),
        normalizedPoints: frameData.normalizedPoints || [],
        status: currentStatus,
        issues: issues
      });
    }
    
    // Пересчитываем оценку осанки
    const totalFrames = session.postureMetrics.totalFrames;
    if (totalFrames > 0) {
      session.postureMetrics.postureScore = Math.round(
        (session.postureMetrics.goodPostureFrames / totalFrames) * 100
      );
    }
    
    await session.save();
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        postureScore: session.postureMetrics.postureScore,
        totalFrames: session.postureMetrics.totalFrames
      }
    });
  } catch (error) {
    console.error('Update session metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении метрик сеанса'
    });
  }
};

// Получить историю сеансов
export const getSessionsHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { userId: req.user._id };
    
    // Фильтры
    if (req.query.dateFrom) {
      filter.startTime = { $gte: new Date(req.query.dateFrom) };
    }
    
    if (req.query.dateTo) {
      filter.startTime = { 
        ...filter.startTime,
        $lte: new Date(req.query.dateTo)
      };
    }
    
    if (req.query.minScore) {
      filter['postureMetrics.postureScore'] = { $gte: parseInt(req.query.minScore) };
    }
    
    if (req.query.maxScore) {
      filter['postureMetrics.postureScore'] = { 
        ...filter['postureMetrics.postureScore'],
        $lte: parseInt(req.query.maxScore)
      };
    }
    
    // Сортировка
    let sort = { startTime: -1 };
    if (req.query.sortBy === 'postureMetrics.postureScore') {
      sort = { 'postureMetrics.postureScore': req.query.sortOrder === 'asc' ? 1 : -1 };
    } else if (req.query.sortBy === 'duration') {
      sort = { duration: req.query.sortOrder === 'asc' ? 1 : -1 };
    }
    
    const sessions = await Session.find(filter)
      .select('sessionId startTime endTime duration postureMetrics status')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Обогащаем данные для фронтенда
    const enrichedSessions = sessions.map(session => {
      const metrics = session.postureMetrics || {};
      const problems = [];
      
      // Определяем проблемы на основе ошибок
      if (metrics.errorsByZone?.shoulders?.duration > 0) {
        problems.push('shoulders');
      }
      if (metrics.errorsByZone?.head?.duration > 0) {
        problems.push('head');
      }
      if (metrics.errorsByZone?.hips?.duration > 0) {
        problems.push('hips');
      }
      if (metrics.postureScore < 70) {
        problems.push('posture');
      }
      
      return {
        _id: session._id,
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration || 0,
        postureMetrics: {
          ...metrics,
          goodPercentage: metrics.goodPercentage || 0,
          warningPercentage: metrics.warningPercentage || 0,
          errorPercentage: metrics.errorPercentage || 0
        },
        problems: [...new Set(problems)], // Убираем дубликаты
        keyMomentsCount: session.keyMoments?.length || 0,
        settings: session.settings || {},
        deviceInfo: session.deviceInfo || {},
        status: session.status || 'completed'
      };
    });
    
    const total = await Session.countDocuments(filter);
    
    // Статистика
    const statistics = {
      totalSessions: await Session.countDocuments({ userId: req.user._id }),
      totalDuration: 0,
      avgScore: 0,
      bestScore: 0,
      worstScore: 100,
      avgDuration: 0,
      totalFrames: 0,
      totalGoodFrames: 0,
      totalWarningFrames: 0,
      totalErrorFrames: 0,
      totalShoulderErrors: 0,
      totalHeadErrors: 0,
      totalHipErrors: 0
    };
    
    // Вычисляем агрегированную статистику
    const allSessions = await Session.find({ userId: req.user._id });
    
    if (allSessions.length > 0) {
      allSessions.forEach(session => {
        const metrics = session.postureMetrics || {};
        
        statistics.totalDuration += session.duration || 0;
        statistics.avgScore += metrics.postureScore || 0;
        
        if (metrics.postureScore > statistics.bestScore) {
          statistics.bestScore = metrics.postureScore;
        }
        if (metrics.postureScore < statistics.worstScore) {
          statistics.worstScore = metrics.postureScore;
        }
        
        statistics.totalFrames += metrics.totalFrames || 0;
        statistics.totalGoodFrames += metrics.goodPostureFrames || 0;
        statistics.totalWarningFrames += metrics.warningFrames || 0;
        statistics.totalErrorFrames += metrics.errorFrames || 0;
        
        if (metrics.errorsByZone) {
          statistics.totalShoulderErrors += metrics.errorsByZone.shoulders?.count || 0;
          statistics.totalHeadErrors += metrics.errorsByZone.head?.count || 0;
          statistics.totalHipErrors += metrics.errorsByZone.hips?.count || 0;
        }
      });
      
      statistics.avgScore = Math.round(statistics.avgScore / allSessions.length);
      statistics.avgDuration = Math.round(statistics.totalDuration / allSessions.length);
    }
    
    res.status(200).json({
      success: true,
      data: {
        sessions: enrichedSessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        statistics
      }
    });
  } catch (error) {
    console.error('Get sessions history error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении истории сеансов'
    });
  }
};

// Получить детали сеанса
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('GET session details called for:', sessionId);
    
    // Создаем условие поиска
    const query = {
      userId: req.user._id,
      $or: []
    };
    
    // Проверяем, является ли sessionId валидным ObjectId
    if (mongoose.Types.ObjectId.isValid(sessionId)) {
      query.$or.push({ _id: sessionId });
    }
    
    // Всегда добавляем поиск по sessionId (строковому идентификатору)
    query.$or.push({ sessionId: sessionId });
    
    console.log('Search query:', JSON.stringify(query, null, 2));
    
    const session = await Session.findOne(query);
    
    if (!session) {
      console.log('Session not found for ID:', sessionId);
      return res.status(404).json({
        success: false,
        error: 'Сеанс не найден'
      });
    }
    
    console.log('Session found:', session.sessionId);
    
    // Форматируем данные для фронтенда
    const formattedSession = {
      ...session.toObject(),
      durationMinutes: Math.round((session.duration || 0) / 60),
      timeOfDay: session.startTime ? session.startTime.getHours() < 12 ? 'morning' : 
        session.startTime.getHours() < 18 ? 'afternoon' : 'evening' : 'unknown'
    };
    
    res.status(200).json({
      success: true,
      data: {
        session: formattedSession
      }
    });
  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении деталей сеанса'
    });
  }
};

// Получить детали сеанса с рекомендациями
export const getSessionDetailsWithRecommendations = async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('GET session details with recommendations called for:', sessionId);
    
    // Создаем условие поиска
    const query = {
      userId: req.user._id,
      $or: []
    };
    
    // Проверяем, является ли sessionId валидным ObjectId
    if (mongoose.Types.ObjectId.isValid(sessionId)) {
      query.$or.push({ _id: sessionId });
    }
    
    // Всегда добавляем поиск по sessionId (строковому идентификатору)
    query.$or.push({ sessionId: sessionId });
    
    console.log('Search query:', JSON.stringify(query, null, 2));
    
    // Находим сеанс
    const session = await Session.findOne(query);
    
    if (!session) {
      console.log('Session not found for ID:', sessionId);
      return res.status(404).json({
        success: false,
        error: 'Сеанс не найден'
      });
    }
    
    console.log('Session found:', session.sessionId);
    
   const formattedSession = {
      ...session.toObject(),
      durationMinutes: Math.round((session.duration || 0) / 60),
      timeOfDay: session.startTime ? session.startTime.getHours() < 12 ? 'morning' : 
        session.startTime.getHours() < 18 ? 'afternoon' : 'evening' : 'unknown'
    };
    
    // Анализируем проблемы для получения рекомендаций
    const problems = [];
    const errorsByZone = session.postureMetrics.errorsByZone || {};
    const duration = session.duration || 1;
    
    if (errorsByZone.shoulders && errorsByZone.shoulders.duration > 0) {
      const percentage = (errorsByZone.shoulders.duration / duration) * 100;
      if (percentage > 5) {
        problems.push({
          type: 'shoulders',
          severity: percentage > 30 ? 'high' : percentage > 15 ? 'medium' : 'low',
          percentage: Math.round(percentage * 10) / 10
        });
      }
    }
    
    if (errorsByZone.head && errorsByZone.head.duration > 0) {
      const percentage = (errorsByZone.head.duration / duration) * 100;
      if (percentage > 5) {
        problems.push({
          type: 'head',
          severity: percentage > 30 ? 'high' : percentage > 15 ? 'medium' : 'low',
          percentage: Math.round(percentage * 10) / 10
        });
      }
    }
    
    if (errorsByZone.hips && errorsByZone.hips.duration > 0) {
      const percentage = (errorsByZone.hips.duration / duration) * 100;
      if (percentage > 5) {
        problems.push({
          type: 'hips',
          severity: percentage > 30 ? 'high' : percentage > 15 ? 'medium' : 'low',
          percentage: Math.round(percentage * 10) / 10
        });
      }
    }
    
    const postureScore = session.postureMetrics.postureScore || 0;
    if (postureScore < 80) {
      problems.push({
        type: 'general_posture',
        severity: postureScore < 60 ? 'high' : postureScore < 70 ? 'medium' : 'low',
        percentage: Math.round((100 - postureScore) * 10) / 10
      });
    }
    
    console.log('Detected problems:', problems);
    
    // Получаем рекомендации
    const recommendations = [];
    
    for (const problem of problems) {
      const recs = await Recommendation.find({
        problemType: problem.type,
        isActive: true
      })
      .populate('exerciseId')
      .sort({ priority: -1 })
      .limit(problem.severity === 'high' ? 3 : 2);
      
      recs.forEach(rec => {
        if (rec.exerciseId) {
          recommendations.push({
            _id: rec._id,
            problemType: problem.type,
            problemSeverity: problem.severity,
            problemPercentage: problem.percentage,
            exercise: {
              _id: rec.exerciseId._id,
              title: rec.exerciseId.title,
              description: rec.exerciseId.description,
              type: rec.exerciseId.type,
              difficulty: rec.exerciseId.difficulty,
              duration: rec.exerciseId.duration,
              instructions: rec.exerciseId.instructions || [],
              benefits: rec.exerciseId.benefits || [],
              has3dModel: rec.exerciseId.has3dModel || false,
              modelType: rec.exerciseId.modelType || 'custom',
              videoUrl: rec.exerciseId.videoUrl || '',
              imageUrl: rec.exerciseId.imageUrl || ''
            },
            recommendation: rec.description || `Упражнение для коррекции ${problem.type === 'shoulders' ? 'плеч' : problem.type === 'head' ? 'головы' : problem.type === 'hips' ? 'таза' : 'осанки'}`,
            priority: rec.priority
          });
        }
      });
    }
    
    // Сортируем по приоритету
    recommendations.sort((a, b) => b.priority - a.priority);
    
    console.log('Returning session details with recommendations');
    
    res.status(200).json({
      success: true,
      data: {
        session: formattedSession,
        recommendations: {
          sessionId: session.sessionId,
          postureScore: postureScore,
          problems,
          recommendations,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Get session details with recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении деталей сеанса с рекомендациями: ' + error.message
    });
  }
};

// Получить статистику сеансов
export const getSessionStatistics = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id });
    
    // Статистика по дням недели
    const dayOfWeekStats = Array(7).fill(0).map((_, index) => ({
      _id: index,
      count: 0,
      avgScore: 0
    }));
    
    // Статистика по часам
    const hourStats = Array(24).fill(0).map((_, index) => ({
      _id: index,
      count: 0,
      avgScore: 0
    }));
    
    // Общая статистика ошибок
    const errorStats = {
      totalShoulderErrors: 0,
      totalHeadErrors: 0,
      totalHipErrors: 0
    };
    
    // Прогресс по дням
    const progressStats = [];
    const last30Days = {};
    
    sessions.forEach(session => {
      const dayOfWeek = session.startTime.getDay();
      const hour = session.startTime.getHours();
      const date = session.startTime.toISOString().split('T')[0];
      
      // Обновляем статистику по дням недели
      dayOfWeekStats[dayOfWeek].count += 1;
      dayOfWeekStats[dayOfWeek].avgScore += session.postureMetrics.postureScore || 0;
      
      // Обновляем статистику по часам
      hourStats[hour].count += 1;
      hourStats[hour].avgScore += session.postureMetrics.postureScore || 0;
      
      // Обновляем статистику ошибок
      if (session.postureMetrics.errorsByZone) {
        errorStats.totalShoulderErrors += session.postureMetrics.errorsByZone.shoulders?.count || 0;
        errorStats.totalHeadErrors += session.postureMetrics.errorsByZone.head?.count || 0;
        errorStats.totalHipErrors += session.postureMetrics.errorsByZone.hips?.count || 0;
      }
      
      // Собираем данные для прогресса (последние 30 дней)
      if (!last30Days[date]) {
        last30Days[date] = {
          score: 0,
          count: 0,
          duration: 0
        };
      }
      last30Days[date].score += session.postureMetrics.postureScore || 0;
      last30Days[date].count += 1;
      last30Days[date].duration += session.duration || 0;
    });
    
    // Рассчитываем средние значения
    dayOfWeekStats.forEach(stat => {
      if (stat.count > 0) {
        stat.avgScore = Math.round(stat.avgScore / stat.count);
      }
    });
    
    hourStats.forEach(stat => {
      if (stat.count > 0) {
        stat.avgScore = Math.round(stat.avgScore / stat.count);
      }
    });
    
    // Формируем прогресс по дням
    Object.keys(last30Days).forEach(date => {
      const dayData = last30Days[date];
      progressStats.push({
        date,
        score: Math.round(dayData.score / dayData.count),
        duration: Math.round(dayData.duration / 60) // в минутах
      });
    });
    
    // Сортируем по дате
    progressStats.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.status(200).json({
      success: true,
      data: {
        dayOfWeekStats,
        hourStats,
        errorStats,
        progressStats: progressStats.slice(-30) // Последние 30 дней
      }
    });
  } catch (error) {
    console.error('Get session statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики сеансов'
    });
  }
};

// Удалить сеанс
export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('DELETE session called for:', sessionId);
    
    // Создаем условие поиска
    const query = {
      userId: req.user._id,
      $or: []
    };
    
    // Проверяем, является ли sessionId валидным ObjectId
    if (mongoose.Types.ObjectId.isValid(sessionId)) {
      query.$or.push({ _id: sessionId });
    }
    
    // Всегда добавляем поиск по sessionId (строковому идентификатору)
    query.$or.push({ sessionId: sessionId });
    
    console.log('Search query:', JSON.stringify(query, null, 2));
    
    // Находим сеанс
    const session = await Session.findOne(query);
    
    if (!session) {
      console.log('Session not found for deletion:', sessionId);
      return res.status(404).json({
        success: false,
        error: 'Сеанс не найден'
      });
    }
    
    console.log('Session found for deletion:', session.sessionId);
    
    // Удаляем сеанс по его _id (ObjectId)
    await Session.deleteOne({ _id: session._id });
    
    console.log('Session deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Сеанс успешно удален'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении сеанса: ' + error.message
    });
  }
};

// Добавить ключевой момент
export const addKeyMoment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type, message, data } = req.body;
    
    console.log('Adding key moment to session:', sessionId);
    
    const session = await Session.findOne({
      sessionId: sessionId, 
      userId: req.user._id
    });
    
    if (!session) {
      console.log('Session not found for key moment:', sessionId);
      return res.status(404).json({
        success: false,
        error: 'Сеанс не найден'
      });
    }
    
    if (!session.keyMoments) {
      session.keyMoments = [];
    }
    
    session.keyMoments.push({
      timestamp: new Date(),
      type: type || 'notification',
      message: message || '',
      data: data || {}
    });
    
    await session.save();
    
    res.status(200).json({
      success: true,
      message: 'Ключевой момент добавлен'
    });
  } catch (error) {
    console.error('Add key moment error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при добавлении ключевого момента'
    });
  }
};

export default {
  startSession,
  endSession,
  updateSessionMetrics,
  getSessionsHistory,
  getSessionDetails,
  getSessionDetailsWithRecommendations,
  getSessionStatistics,
  deleteSession,
  addKeyMoment
};