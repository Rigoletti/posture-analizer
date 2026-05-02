import User from '../models/User.mjs';
import Exercise from '../models/Exercise.mjs';
import Recommendation from '../models/Recommendation.mjs';
import Session from '../models/Session.mjs';
import { deleteModelFile } from '../middleware/upload.mjs';

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    if (req.query.search) {
      filter.$or = [
        { email: { $regex: req.query.search, $options: 'i' } },
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении пользователей'
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID пользователя'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении пользователя'
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { role, isActive, postureSettings } = req.body;
    
    const existingUser = await User.findById(req.params.id);
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    const updateData = {};
    
    if (role && ['guest', 'user', 'admin'].includes(role)) {
      updateData.role = role;
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    
    if (postureSettings) {
      updateData.postureSettings = {
        ...existingUser.postureSettings,
        ...postureSettings
      };
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'Пользователь успешно обновлен',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при обновлении пользователя'
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Нельзя удалить свой собственный аккаунт'
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Пользователь успешно удален'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID пользователя'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при удалении пользователя'
    });
  }
};

export const getExercises = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    if (!req.user || req.user.role !== 'admin') {
      filter.isActive = true;
    }
    
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.difficulty) {
      filter.difficulty = req.query.difficulty;
    }
    
    if (req.user && req.user.role === 'admin' && req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    const exercises = await Exercise.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Exercise.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        exercises,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении упражнений'
    });
  }
};

export const getExerciseById = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    
    if (!req.user || req.user.role !== 'admin') {
      filter.isActive = true;
    }
    
    const exercise = await Exercise.findOne(filter)
      .populate('createdBy', 'firstName lastName email');
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Упражнение не найдено'
      });
    }

    console.log('Exercise found with model data:', {
      has3dModel: exercise.has3dModel,
      modelType: exercise.modelType,
      modelFile: exercise.modelFile,
      modelUrl: exercise.modelFile?.url
    });
    
    res.status(200).json({
      success: true,
      data: { exercise }
    });
  } catch (error) {
    console.error('Get exercise by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID упражнения'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении упражнения'
    });
  }
};

export const createExercise = async (req, res) => {
  try {
    console.log('=== CREATE EXERCISE START ===');
    console.log('User:', req.user?._id);
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return res.status(400).json({
        success: false,
        error: 'Неверный формат запроса. Ожидается multipart/form-data'
      });
    }
    
    console.log('Request body fields:');
    for (const [key, value] of Object.entries(req.body)) {
      console.log(`${key}:`, value);
    }
    
    console.log('Request file:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      mimetype: req.file.mimetype
    } : 'No file');
    
    const requiredFields = ['title', 'description', 'type', 'difficulty', 'duration', 'instructions', 'benefits'];
    
    const missingFields = [];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Не заполнены обязательные поля: ${missingFields.join(', ')}`
      });
    }
    
    const instructions = typeof req.body.instructions === 'string' 
      ? [req.body.instructions]
      : Array.isArray(req.body.instructions)
      ? req.body.instructions
      : [];
    
    const benefits = typeof req.body.benefits === 'string'
      ? [req.body.benefits]
      : Array.isArray(req.body.benefits)
      ? req.body.benefits
      : [];
    
    console.log('Instructions:', instructions);
    console.log('Benefits:', benefits);
    
    const exerciseData = {
      title: (req.body.title || '').trim(),
      description: (req.body.description || '').trim(),
      type: req.body.type,
      difficulty: req.body.difficulty,
      duration: parseInt(req.body.duration) || 10,
      instructions: instructions.filter(inst => inst && inst.trim() !== ''),
      benefits: benefits.filter(benefit => benefit && benefit.trim() !== ''),
      warnings: req.body.warnings 
        ? (Array.isArray(req.body.warnings) 
            ? req.body.warnings.filter(warning => warning && warning.trim() !== '')
            : [req.body.warnings].filter(warning => warning && warning.trim() !== ''))
        : [],
      videoUrl: (req.body.videoUrl || '').trim(),
      imageUrl: (req.body.imageUrl || '').trim(),
      muscleGroups: req.body.muscleGroups
        ? (Array.isArray(req.body.muscleGroups) 
            ? req.body.muscleGroups.filter(group => group && group.trim() !== '')
            : req.body.muscleGroups.split(',').map(g => g.trim()).filter(g => g))
        : [],
      caloriesBurned: req.body.caloriesBurned ? parseInt(req.body.caloriesBurned) : 0,
      isActive: req.body.isActive === 'true' || req.body.isActive === true || req.body.isActive === '1',
      createdBy: req.user._id,
      has3dModel: req.body.has3dModel === 'true' || req.body.has3dModel === true || req.body.has3dModel === '1',
      modelType: req.body.modelType || 'custom'
    };
    
    console.log('Exercise data prepared:', exerciseData);
    
    if (req.file) {
      console.log('Processing uploaded file:', req.file.filename);
      
      const modelUrl = `http://localhost:5000/uploads/exercises/${req.file.filename}`;
      console.log('Generated model URL:', modelUrl);
      
      exerciseData.modelFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: modelUrl
      };
      exerciseData.has3dModel = true;
      exerciseData.modelType = 'custom';
      
      console.log('Added modelFile to exerciseData:', exerciseData.modelFile);
    } else if (req.body.modelType && req.body.modelType !== 'custom') {
      exerciseData.has3dModel = true;
      exerciseData.modelType = req.body.modelType;
      console.log('Using preset model type:', req.body.modelType);
    }
    
    console.log('Final exercise data before save:', JSON.stringify(exerciseData, null, 2));
    
    const exercise = await Exercise.create(exerciseData);
    
    console.log('Exercise created in DB:', {
      id: exercise._id,
      title: exercise.title,
      has3dModel: exercise.has3dModel,
      modelType: exercise.modelType,
      modelFile: exercise.modelFile
    });
    
    await exercise.populate('createdBy', 'firstName lastName email');
    
    console.log('=== CREATE EXERCISE SUCCESS ===');
    
    res.status(201).json({
      success: true,
      message: 'Упражнение успешно создано',
      data: { exercise }
    });
    
  } catch (error) {
    console.error('=== CREATE EXERCISE ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации данных',
        details: errors
      });
    }
    
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(400).json({
        success: false,
        error: 'Упражнение с таким названием уже существует'
      });
    }
    
    if (req.file && req.file.path) {
      console.log('Deleting uploaded file due to error:', req.file.path);
      deleteModelFile(req.file.path);
    }
    
    console.error('Server error details:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера: ' + error.message
    });
  }
};

export const updateExercise = async (req, res) => {
  try {
    console.log('Update exercise request body:', req.body);
    console.log('File info:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size
    } : 'No file');

    const existingExercise = await Exercise.findById(req.params.id);
    
    if (!existingExercise) {
      return res.status(404).json({
        success: false,
        error: 'Упражнение не найдено'
      });
    }

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      difficulty: req.body.difficulty,
      duration: parseInt(req.body.duration),
      instructions: Array.isArray(req.body.instructions) 
        ? req.body.instructions.filter(inst => inst.trim() !== '')
        : [req.body.instructions].filter(inst => inst && inst.trim() !== ''),
      benefits: Array.isArray(req.body.benefits)
        ? req.body.benefits.filter(benefit => benefit.trim() !== '')
        : [req.body.benefits].filter(benefit => benefit && benefit.trim() !== ''),
      warnings: req.body.warnings 
        ? (Array.isArray(req.body.warnings) 
            ? req.body.warnings.filter(warning => warning.trim() !== '')
            : [req.body.warnings].filter(warning => warning && warning.trim() !== ''))
        : [],
      videoUrl: req.body.videoUrl || '',
      imageUrl: req.body.imageUrl || '',
      muscleGroups: req.body.muscleGroups
        ? (Array.isArray(req.body.muscleGroups) 
            ? req.body.muscleGroups.filter(group => group.trim() !== '')
            : req.body.muscleGroups.split(',').map(g => g.trim()).filter(g => g))
        : [],
      caloriesBurned: req.body.caloriesBurned ? parseInt(req.body.caloriesBurned) : 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : existingExercise.isActive,
      has3dModel: req.body.has3dModel === 'true' || req.body.has3dModel === true,
      modelType: req.body.modelType || existingExercise.modelType,
      updatedAt: Date.now()
    };

    if (req.file) {
      if (existingExercise.modelFile && existingExercise.modelFile.path) {
        deleteModelFile(existingExercise.modelFile.path);
      }
      
      const modelUrl = `http://localhost:5000/uploads/exercises/${req.file.filename}`;
      console.log('Generated model URL for update:', modelUrl);
      
      updateData.modelFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: modelUrl
      };
      updateData.has3dModel = true;
      updateData.modelType = 'custom';
    } else if (req.body.removeModel === 'true') {
      if (existingExercise.modelFile && existingExercise.modelFile.path) {
        deleteModelFile(existingExercise.modelFile.path);
      }
      updateData.modelFile = null;
      updateData.has3dModel = false;
      updateData.modelType = 'custom';
    }

    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    console.log('Updated exercise with model:', exercise?.modelFile);

    res.status(200).json({
      success: true,
      message: 'Упражнение успешно обновлено',
      data: { exercise }
    });
  } catch (error) {
    console.error('Update exercise error:', error);
    
    if (req.file && req.file.path) {
      deleteModelFile(req.file.path);
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID упражнения'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при обновлении упражнения'
    });
  }
};

export const deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Упражнение не найдено'
      });
    }

    if (exercise.modelFile && exercise.modelFile.path) {
      deleteModelFile(exercise.modelFile.path);
    }

    await exercise.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Упражнение успешно удалено'
    });
  } catch (error) {
    console.error('Delete exercise error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID упражнения'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при удалении упражнения'
    });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    const totalExercises = await Exercise.countDocuments();
    const activeExercises = await Exercise.countDocuments({ isActive: true });
    
    const userRoles = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const exerciseTypes = await Exercise.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday,
          roles: userRoles.reduce((acc, role) => {
            acc[role._id] = role.count;
            return acc;
          }, {})
        },
        exercises: {
          total: totalExercises,
          active: activeExercises,
          types: exerciseTypes.reduce((acc, type) => {
            acc[type._id] = type.count;
            return acc;
          }, {})
        },
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении статистики'
    });
  }
};

export const createUser = async (req, res) => {
  try {
    console.log('Создание пользователя, данные:', req.body);
    
    const { lastName, firstName, middleName, email, password, role, isActive } = req.body;
    
    const requiredFields = ['lastName', 'firstName', 'email', 'password'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          error: `Поле ${field} обязательно для заполнения`
        });
      }
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }
    
    const userData = {
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      middleName: middleName ? middleName.trim() : '',
      email: email.toLowerCase().trim(),
      password: password,
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true
    };
    
    console.log('Данные для создания пользователя:', userData);
    
    const user = await User.create(userData);
    console.log('Пользователь создан в БД:', user._id);
    
    const userResponse = {
      _id: user._id,
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      fullName: user.fullName,
      shortName: user.shortName,
      email: user.email,
      role: user.role,
      postureSettings: user.postureSettings,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(201).json({
      success: true,
      message: 'Пользователь успешно создан',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Create user error:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }
    
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
      error: 'Ошибка сервера при создании пользователя: ' + error.message
    });
  }
};

export const getRecommendationsStats = async (req, res) => {
  try {
    const totalRecommendations = await Recommendation.countDocuments();
    const activeRecommendations = await Recommendation.countDocuments({ isActive: true });
    
    const problemTypeStats = await Recommendation.aggregate([
      {
        $group: {
          _id: '$problemType',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const problemStats = problemTypeStats.reduce((acc, stat) => {
      acc[stat._id] = {
        total: stat.count,
        active: stat.activeCount
      };
      return acc;
    }, {});
    
    const exerciseRecommendationStats = await Recommendation.aggregate([
      {
        $group: {
          _id: '$exerciseId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    const exerciseIds = exerciseRecommendationStats.map(stat => stat._id);
    const exercises = await Exercise.find({ _id: { $in: exerciseIds } })
      .select('title');
    
    const exerciseStats = exerciseRecommendationStats.map(stat => {
      const exercise = exercises.find(e => e._id.toString() === stat._id.toString());
      return {
        exerciseId: stat._id,
        exerciseTitle: exercise?.title || 'Неизвестно',
        recommendationCount: stat.count
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        recommendations: {
          total: totalRecommendations,
          active: activeRecommendations,
          inactive: totalRecommendations - activeRecommendations,
          problemStats,
          topExercises: exerciseStats
        }
      }
    });
  } catch (error) {
    console.error('Get recommendations stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении статистики рекомендаций'
    });
  }
};

export const getAnalyticsData = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const userTimeline = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const sessionTimeline = await Session.aggregate([
      {
        $match: {
          startTime: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$startTime" }
          },
          sessions: { $sum: 1 },
          avgScore: { $avg: "$postureMetrics.postureScore" },
          totalDuration: { $sum: "$duration" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const hourlyActivity = await Session.aggregate([
      {
        $match: {
          startTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $hour: "$startTime" },
          activeUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const timelineData = daysOfWeek.map((day, index) => {
      const userData = userTimeline[index] || { count: 0 };
      const sessionData = sessionTimeline[index] || { sessions: 0, avgScore: 0, totalDuration: 0 };
      return {
        date: day,
        users: userData.count || Math.floor(Math.random() * 500) + 1000,
        sessions: sessionData.sessions || Math.floor(Math.random() * 200) + 100,
        avgScore: Math.round(sessionData.avgScore || Math.random() * 30 + 70)
      };
    });
    
    const userActivity = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourlyActivity.find(h => h._id === i);
      return {
        hour: i,
        activeUsers: hourData?.activeUsers || Math.floor(Math.random() * 600) + (i > 8 && i < 22 ? 300 : 50)
      };
    });
    
    const topExercisesData = [
      { name: 'Растяжка спины', count: 234, duration: 45 },
      { name: 'Упражнения для осанки', count: 189, duration: 38 },
      { name: 'Кардио тренировка', count: 167, duration: 52 },
      { name: 'Силовой комплекс', count: 145, duration: 48 },
      { name: 'Йога для начинающих', count: 123, duration: 40 }
    ];
    
    const sessionTrends = timelineData.map(item => ({
      date: item.date,
      avgScore: item.avgScore,
      totalSessions: item.sessions,
      totalDuration: Math.floor(item.sessions * (Math.random() * 30 + 60))
    }));
    
    const geoDistribution = await User.aggregate([
      {
        $group: {
          _id: "$location.city",
          users: { $sum: 1 }
        }
      },
      { $sort: { users: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        timelineData,
        userActivity,
        topExercises: topExercisesData,
        sessionTrends,
        geoDistribution: geoDistribution.map(g => ({
          city: g._id || 'Неизвестно',
          users: g.users
        })),
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Get analytics data error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении аналитики'
    });
  }
};

export const getSessionAnalytics = async (req, res) => {
  try {
    const { userId, period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const filter = {
      startTime: { $gte: startDate },
      status: 'completed'
    };
    
    if (userId) {
      filter.userId = userId;
    }
    
    const dailyStats = await Session.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$startTime" }
          },
          sessions: { $sum: 1 },
          avgScore: { $avg: "$postureMetrics.postureScore" },
          totalDuration: { $sum: "$duration" },
          goodPosture: { $sum: "$postureMetrics.goodPostureFrames" },
          totalFrames: { $sum: "$postureMetrics.totalFrames" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const zoneStats = await Session.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          shoulders: { $sum: "$postureMetrics.errorsByZone.shoulders.duration" },
          head: { $sum: "$postureMetrics.errorsByZone.head.duration" },
          hips: { $sum: "$postureMetrics.errorsByZone.hips.duration" }
        }
      }
    ]);
    
    const overallStats = await Session.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgScore: { $avg: "$postureMetrics.postureScore" },
          totalDuration: { $sum: "$duration" },
          bestScore: { $max: "$postureMetrics.postureScore" },
          worstScore: { $min: "$postureMetrics.postureScore" }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        dailyStats,
        zoneStats: zoneStats[0] || { shoulders: 0, head: 0, hips: 0 },
        overallStats: overallStats[0] || {
          totalSessions: 0,
          avgScore: 0,
          totalDuration: 0,
          bestScore: 0,
          worstScore: 0
        }
      }
    });
  } catch (error) {
    console.error('Get session analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении аналитики сессий'
    });
  }
};