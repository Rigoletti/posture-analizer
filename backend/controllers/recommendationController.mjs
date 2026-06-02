import mongoose from 'mongoose';
import Recommendation from '../models/Recommendation.mjs';
import Exercise from '../models/Exercise.mjs';
import Session from '../models/Session.mjs';

// Получить все рекомендации (для админки)
export const getRecommendations = async (req, res) => {
  try {
    console.log('GET recommendations called with query:', req.query);
    
    const { 
      page = 1, 
      limit = 20, 
      problemType, 
      isActive 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    if (problemType) {
      filter.problemType = problemType;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    console.log('Filter for recommendations:', filter);
    
    const recommendations = await Recommendation.find(filter)
      .populate('exerciseId', 'title type difficulty duration benefits instructions imageUrl videoUrl')
      .populate('createdBy', 'firstName lastName email')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Recommendation.countDocuments(filter);
    
    console.log(`Found ${recommendations.length} recommendations out of ${total}`);
    
    res.status(200).json({
      success: true,
      data: {
        recommendations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении рекомендаций: ' + error.message
    });
  }
};

// Создать новую рекомендацию
export const createRecommendation = async (req, res) => {
  try {
    console.log('CREATE recommendation called with body:', req.body);
    console.log('User:', req.user);
    
    const { problemType, exerciseId, priority = 1, description = '', isActive = true } = req.body;
    
    if (!problemType || !exerciseId) {
      return res.status(400).json({
        success: false,
        error: 'Тип проблемы и упражнение обязательны'
      });
    }
    
    // Проверяем существование упражнения
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Упражнение не найдено'
      });
    }
    
    // Проверяем дубликаты
    const existingRecommendation = await Recommendation.findOne({
      problemType,
      exerciseId
    });
    
    if (existingRecommendation) {
      return res.status(400).json({
        success: false,
        error: 'Рекомендация для этой проблемы и упражнения уже существует'
      });
    }
    
    const recommendationData = {
      problemType,
      exerciseId,
      priority: parseInt(priority),
      description: description.trim(),
      isActive: isActive === true || isActive === 'true',
      createdBy: req.user._id
    };
    
    console.log('Creating recommendation with data:', recommendationData);
    
    const recommendation = await Recommendation.create(recommendationData);
    
    await recommendation.populate('exerciseId');
    await recommendation.populate('createdBy', 'firstName lastName email');
    
    console.log('Recommendation created successfully:', recommendation._id);
    
    res.status(201).json({
      success: true,
      message: 'Рекомендация успешно создана',
      data: { recommendation }
    });
  } catch (error) {
    console.error('Create recommendation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании рекомендации: ' + error.message
    });
  }
};

// Обновить рекомендацию
export const updateRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('UPDATE recommendation called for ID:', id, 'with body:', req.body);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID рекомендации'
      });
    }
    
    const updateData = req.body;
    
    // Если обновляется exerciseId, проверяем существование упражнения
    if (updateData.exerciseId) {
      const exercise = await Exercise.findById(updateData.exerciseId);
      if (!exercise) {
        return res.status(404).json({
          success: false,
          error: 'Упражнение не найдено'
        });
      }
    }
    
    const recommendation = await Recommendation.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
    .populate('exerciseId')
    .populate('createdBy', 'firstName lastName email');
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Рекомендация не найдена'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Рекомендация успешно обновлена',
      data: { recommendation }
    });
  } catch (error) {
    console.error('Update recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении рекомендации: ' + error.message
    });
  }
};

// Удалить рекомендацию
export const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE recommendation called for ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID рекомендации'
      });
    }
    
    const recommendation = await Recommendation.findByIdAndDelete(id);
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Рекомендация не найдена'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Рекомендация успешно удалена'
    });
  } catch (error) {
    console.error('Delete recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении рекомендации: ' + error.message
    });
  }
};

// Получить рекомендацию по ID
export const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('GET recommendation by ID called:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID рекомендации'
      });
    }
    
    const recommendation = await Recommendation.findById(id)
      .populate('exerciseId')
      .populate('createdBy', 'firstName lastName email');
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Рекомендация не найдена'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { recommendation }
    });
  } catch (error) {
    console.error('Get recommendation by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении рекомендации: ' + error.message
    });
  }
};

// Получить доступные упражнения для рекомендаций
export const getAvailableExercises = async (req, res) => {
  try {
    const { problemType } = req.query;
    console.log('GET available exercises called for problemType:', problemType);
    
    if (!problemType) {
      return res.status(400).json({
        success: false,
        error: 'Тип проблемы обязателен'
      });
    }
    
    // Получаем все активные упражнения
    const exercises = await Exercise.find({ isActive: true })
      .select('_id title description type difficulty duration benefits instructions imageUrl videoUrl')
      .sort({ title: 1 });
    
    console.log(`Found ${exercises.length} total active exercises`);
    
    // Форматируем упражнения для ответа
    const formattedExercises = exercises.map(exercise => ({
      _id: exercise._id,
      title: exercise.title,
      description: exercise.description,
      type: exercise.type,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      benefits: exercise.benefits || [],
      instructions: exercise.instructions || [],
      imageUrl: exercise.imageUrl || '',
      videoUrl: exercise.videoUrl || ''
    }));
    
    res.status(200).json({
      success: true,
      data: {
        exercises: formattedExercises,
        totalExercises: formattedExercises.length
      }
    });
  } catch (error) {
    console.error('Get available exercises error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении доступных упражнений: ' + error.message
    });
  }
};

// Получить рекомендации для конкретной сессии
export const getSessionRecommendations = async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('GET session recommendations called for session:', sessionId);
    
    // Создаем условие поиска
    const query = {
      $or: []
    };
    
    // Проверяем, является ли sessionId валидным ObjectId
    if (mongoose.Types.ObjectId.isValid(sessionId)) {
      query.$or.push({ _id: sessionId });
    }
    
    // Всегда добавляем поиск по sessionId (строковому идентификатору)
    query.$or.push({ sessionId: sessionId });
    
    console.log('Search query for session:', JSON.stringify(query, null, 2));
    
    // Находим сеанс
    const session = await Session.findOne(query);
    
    if (!session) {
      console.log('Session not found for recommendations:', sessionId);
      return res.status(404).json({
        success: false,
        error: 'Сеанс не найден'
      });
    }
    
    console.log('Session found:', {
      sessionId: session.sessionId,
      duration: session.duration,
      postureScore: session.postureMetrics?.postureScore,
      errorsByZone: session.postureMetrics?.errorsByZone
    });
    
    // Анализируем проблемы из метрик сеанса
    const problems = [];
    const errorsByZone = session.postureMetrics?.errorsByZone || {};
    const duration = session.duration || 1;
    
    console.log('Raw errorsByZone:', JSON.stringify(errorsByZone, null, 2));
    
    // Проверяем проблемы с плечами
    if (errorsByZone.shoulders && errorsByZone.shoulders.duration > 0) {
      const percentage = (errorsByZone.shoulders.duration / duration) * 100;
      console.log(`Shoulders problem detected: ${percentage}% of ${duration}s`);
      problems.push({
        type: 'shoulders',
        severity: percentage > 30 ? 'high' : percentage > 15 ? 'medium' : 'low',
        percentage: Math.round(percentage * 10) / 10
      });
    } else {
      console.log('No shoulders data or duration is 0');
    }
    
    // Проверяем проблемы с головой
    if (errorsByZone.head && errorsByZone.head.duration > 0) {
      const percentage = (errorsByZone.head.duration / duration) * 100;
      console.log(`Head problem detected: ${percentage}%`);
      problems.push({
        type: 'head',
        severity: percentage > 30 ? 'high' : percentage > 15 ? 'medium' : 'low',
        percentage: Math.round(percentage * 10) / 10
      });
    } else {
      console.log('No head data or duration is 0');
    }
    
    // Проверяем проблемы с тазом
    if (errorsByZone.hips && errorsByZone.hips.duration > 0) {
      const percentage = (errorsByZone.hips.duration / duration) * 100;
      console.log(`Hips problem detected: ${percentage}%`);
      problems.push({
        type: 'hips',
        severity: percentage > 30 ? 'high' : percentage > 15 ? 'medium' : 'low',
        percentage: Math.round(percentage * 10) / 10
      });
    } else {
      console.log('No hips data or duration is 0');
    }
    
    // Проверяем общие проблемы с осанкой
    const postureScore = session.postureMetrics?.postureScore || 0;
    console.log(`Posture score: ${postureScore}%`);
    
    if (postureScore < 80 && postureScore > 0) {
      problems.push({
        type: 'general_posture',
        severity: postureScore < 60 ? 'high' : postureScore < 70 ? 'medium' : 'low',
        percentage: Math.round((100 - postureScore) * 10) / 10
      });
    }
    
    // Если нет проблем на основе метрик, добавляем тестовые проблемы для отладки
    if (problems.length === 0) {
      console.log('No problems detected from metrics, adding test problems');
      
      // Временно добавляем тестовые проблемы для проверки отображения
      problems.push({
        type: 'shoulders',
        severity: 'medium',
        percentage: 25.5
      });
      
      problems.push({
        type: 'head',
        severity: 'low',
        percentage: 12.3
      });
    }
    
    console.log('Detected problems:', JSON.stringify(problems, null, 2));
    
    // Получаем рекомендации для каждой проблемы
    const recommendations = [];
    
    for (const problem of problems) {
      console.log(`Searching recommendations for problemType: ${problem.type}`);
      
      // Ищем активные рекомендации для данного типа проблемы
      const recs = await Recommendation.find({
        problemType: problem.type,
        isActive: true
      })
      .populate('exerciseId')
      .sort({ priority: -1 });
      
      console.log(`Found ${recs.length} recommendations for problem type: ${problem.type}`);
      
      if (recs.length > 0) {
        console.log(`Recommendations for ${problem.type}:`, recs.map(r => ({
          id: r._id,
          exerciseTitle: r.exerciseId?.title,
          priority: r.priority
        })));
      }
      
      // Ограничиваем количество рекомендаций в зависимости от серьезности
      const limit = problem.severity === 'high' ? 3 : problem.severity === 'medium' ? 2 : 1;
      const limitedRecs = recs.slice(0, limit);
      
      limitedRecs.forEach(rec => {
        if (rec.exerciseId) {
          recommendations.push({
            _id: rec._id,
            problemType: problem.type,
            problemSeverity: problem.severity,
            problemPercentage: problem.percentage,
            exercise: {
              _id: rec.exerciseId._id,
              title: rec.exerciseId.title,
              description: rec.exerciseId.description || 'Описание упражнения',
              type: rec.exerciseId.type || 'posture',
              difficulty: rec.exerciseId.difficulty || 'beginner',
              duration: rec.exerciseId.duration || 10,
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
        } else {
          console.warn(`Recommendation ${rec._id} has no exerciseId populated`);
        }
      });
    }
    
    // Сортируем по приоритету
    recommendations.sort((a, b) => b.priority - a.priority);
    
    console.log(`Final: ${problems.length} problems, ${recommendations.length} recommendations`);
    console.log('Returning recommendations:', recommendations.map(r => ({
      problemType: r.problemType,
      exerciseTitle: r.exercise.title,
      priority: r.priority
    })));
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        postureScore: postureScore,
        problems: problems,
        recommendations: recommendations,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Get session recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении рекомендаций для сеанса: ' + error.message
    });
  }
};

// Получить статистику рекомендаций
export const getRecommendationsStats = async (req, res) => {
  try {
    const stats = await Recommendation.aggregate([
      {
        $group: {
          _id: null,
          totalRecommendations: { $sum: 1 },
          activeRecommendations: { 
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } 
          },
          avgPriority: { $avg: '$priority' }
        }
      }
    ]);
    
    // Статистика по типам проблем
    const problemStats = await Recommendation.aggregate([
      {
        $group: {
          _id: '$problemType',
          count: { $sum: 1 },
          avgPriority: { $avg: '$priority' },
          activeCount: { 
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } 
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Получаем все типы проблем для полноты
    const allProblemTypes = ['shoulders', 'head', 'hips', 'general_posture', 'balance', 'flexibility'];
    const completeProblemStats = allProblemTypes.map(type => {
      const foundStat = problemStats.find(stat => stat._id === type);
      return {
        _id: type,
        count: foundStat?.count || 0,
        activeCount: foundStat?.activeCount || 0,
        avgPriority: foundStat?.avgPriority || 0
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalRecommendations: 0,
          activeRecommendations: 0,
          avgPriority: 0
        },
        problemStats: completeProblemStats,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Get recommendations stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики рекомендаций'
    });
  }
};

// Получить рекомендации по типу проблемы
export const getRecommendationsByProblemType = async (req, res) => {
  try {
    const { problemType } = req.params;
    
    if (!problemType) {
      return res.status(400).json({
        success: false,
        error: 'Тип проблемы обязателен'
      });
    }
    
    const recommendations = await Recommendation.find({
      problemType,
      isActive: true
    })
    .populate('exerciseId')
    .populate('createdBy', 'firstName lastName email')
    .sort({ priority: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        problemType,
        recommendations,
        count: recommendations.length
      }
    });
  } catch (error) {
    console.error('Get recommendations by problem type error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении рекомендаций по типу проблемы'
    });
  }
};

export default {
  getRecommendations,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  getAvailableExercises,
  getRecommendationById,
  getSessionRecommendations,
  getRecommendationsStats,
  getRecommendationsByProblemType
};