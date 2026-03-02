import User from '../models/User.mjs';

export const validateRegistration = async (req, res, next) => {
  const { lastName, firstName, middleName, email, password, confirmPassword } = req.body;
  const errors = [];

  // Проверка фамилии
  if (!lastName || lastName.trim() === '') {
    errors.push({ field: 'lastName', message: 'Фамилия обязательна для заполнения' });
  } else if (lastName.length > 50) {
    errors.push({ field: 'lastName', message: 'Фамилия не может превышать 50 символов' });
  }

  // Проверка имени
  if (!firstName || firstName.trim() === '') {
    errors.push({ field: 'firstName', message: 'Имя обязательно для заполнения' });
  } else if (firstName.length > 50) {
    errors.push({ field: 'firstName', message: 'Имя не может превышать 50 символов' });
  }

  // Проверка отчества (необязательно)
  if (middleName && middleName.length > 50) {
    errors.push({ field: 'middleName', message: 'Отчество не может превышать 50 символов' });
  }

  // Проверка email
  if (!email || email.trim() === '') {
    errors.push({ field: 'email', message: 'Email обязателен для заполнения' });
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push({ field: 'email', message: 'Пожалуйста, введите корректный email' });
  } else {
    // Проверяем, существует ли пользователь с таким email
    try {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        errors.push({ field: 'email', message: 'Пользователь с таким email уже существует' });
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  }

  // Проверка пароля
  if (!password || password.trim() === '') {
    errors.push({ field: 'password', message: 'Пароль обязателен для заполнения' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Пароль должен содержать минимум 6 символов' });
  }

  // Проверка подтверждения пароля
  if (!confirmPassword || confirmPassword.trim() === '') {
    errors.push({ field: 'confirmPassword', message: 'Подтверждение пароля обязательно' });
  } else if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Пароли не совпадают' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  // Нормализуем данные
  req.body.lastName = lastName.trim();
  req.body.firstName = firstName.trim();
  req.body.middleName = middleName ? middleName.trim() : '';
  req.body.email = email.toLowerCase().trim();
  
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Проверка email
  if (!email || email.trim() === '') {
    errors.push({ field: 'email', message: 'Email обязателен для заполнения' });
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push({ field: 'email', message: 'Пожалуйста, введите корректный email' });
  }

  // Проверка пароля
  if (!password || password.trim() === '') {
    errors.push({ field: 'password', message: 'Пароль обязателен для заполнения' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  // Нормализуем email
  req.body.email = email.toLowerCase().trim();
  next();
};

export const validateProfileUpdate = (req, res, next) => {
  const { lastName, firstName, middleName, postureSettings } = req.body;
  const errors = [];

  // Проверка фамилии (если передана)
  if (lastName !== undefined) {
    if (!lastName || lastName.trim() === '') {
      errors.push({ field: 'lastName', message: 'Фамилия не может быть пустой' });
    } else if (lastName.length > 50) {
      errors.push({ field: 'lastName', message: 'Фамилия не может превышать 50 символов' });
    }
  }

  // Проверка имени (если передано)
  if (firstName !== undefined) {
    if (!firstName || firstName.trim() === '') {
      errors.push({ field: 'firstName', message: 'Имя не может быть пустым' });
    } else if (firstName.length > 50) {
      errors.push({ field: 'firstName', message: 'Имя не может превышать 50 символов' });
    }
  }

  // Проверка отчества (если передано)
  if (middleName !== undefined) {
    if (middleName && middleName.length > 50) {
      errors.push({ field: 'middleName', message: 'Отчество не может превышать 50 символов' });
    }
  }

  // Проверка настроек осанки
  if (postureSettings) {
    if (typeof postureSettings.notificationsEnabled !== 'boolean' && 
        postureSettings.notificationsEnabled !== undefined) {
      errors.push({ 
        field: 'postureSettings.notificationsEnabled', 
        message: 'Уведомления должны быть булевым значением' 
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  if (lastName !== undefined) req.body.lastName = lastName.trim();
  if (firstName !== undefined) req.body.firstName = firstName.trim();
  if (middleName !== undefined) req.body.middleName = middleName ? middleName.trim() : '';
  
  next();
};


export const validateExercise = (req, res, next) => {
  const { title, description, type, difficulty, duration, instructions, benefits } = req.body;
  const errors = [];

  // Проверка названия
  if (!title || title.trim() === '') {
    errors.push({ field: 'title', message: 'Название упражнения обязательно' });
  } else if (title.length > 100) {
    errors.push({ field: 'title', message: 'Название не может превышать 100 символов' });
  }

  // Проверка описания
  if (!description || description.trim() === '') {
    errors.push({ field: 'description', message: 'Описание обязательно' });
  } else if (description.length > 500) {
    errors.push({ field: 'description', message: 'Описание не может превышать 500 символов' });
  }

  // Проверка типа
  const validTypes = ['stretching', 'cardio', 'strength', 'posture', 'flexibility', 'warmup', 'cooldown'];
  if (!type || !validTypes.includes(type)) {
    errors.push({ 
      field: 'type', 
      message: `Тип упражнения должен быть одним из: ${validTypes.join(', ')}` 
    });
  }

  // Проверка уровня сложности
  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (!difficulty || !validDifficulties.includes(difficulty)) {
    errors.push({ 
      field: 'difficulty', 
      message: `Уровень сложности должен быть одним из: ${validDifficulties.join(', ')}` 
    });
  }

  // Проверка длительности
  if (!duration || isNaN(duration) || duration < 1) {
    errors.push({ field: 'duration', message: 'Длительность должна быть числом не менее 1' });
  }

  // Проверка инструкций
  if (!instructions) {
    errors.push({ field: 'instructions', message: 'Инструкции обязательны' });
  } else {
    const instructionsArray = Array.isArray(instructions) ? instructions : [instructions];
    if (instructionsArray.length === 0) {
      errors.push({ field: 'instructions', message: 'Должна быть хотя бы одна инструкция' });
    } else {
      instructionsArray.forEach((instruction, index) => {
        if (!instruction || instruction.trim() === '') {
          errors.push({ 
            field: `instructions[${index}]`, 
            message: 'Инструкция не может быть пустой' 
          });
        }
      });
    }
  }

  // Проверка преимуществ
  if (!benefits) {
    errors.push({ field: 'benefits', message: 'Преимущества обязательны' });
  } else {
    const benefitsArray = Array.isArray(benefits) ? benefits : [benefits];
    if (benefitsArray.length === 0) {
      errors.push({ field: 'benefits', message: 'Должно быть хотя бы одно преимущество' });
    } else {
      benefitsArray.forEach((benefit, index) => {
        if (!benefit || benefit.trim() === '') {
          errors.push({ 
            field: `benefits[${index}]`, 
            message: 'Преимущество не может быть пустым' 
          });
        }
      });
    }
  }

  // Проверка предупреждений (если есть)
  if (req.body.warnings) {
    const warningsArray = Array.isArray(req.body.warnings) ? req.body.warnings : [req.body.warnings];
    warningsArray.forEach((warning, index) => {
      if (warning && warning.trim() === '') {
        errors.push({ 
          field: `warnings[${index}]`, 
          message: 'Предупреждение не может быть пустым' 
        });
      }
    });
  }

  // Проверка типа модели
  if (req.body.modelType) {
    const validModelTypes = ['arm-stretching', 'jumping-jacks', 'neck-stretch', 'bicycle-crunch', 
                            'burpee', 'capoeira', 'press', 'custom'];
    if (!validModelTypes.includes(req.body.modelType)) {
      errors.push({ 
        field: 'modelType', 
        message: `Тип модели должен быть одним из: ${validModelTypes.join(', ')}` 
      });
    }
  }

  // Проверка URL видео
  if (req.body.videoUrl && req.body.videoUrl.trim() !== '') {
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlRegex.test(req.body.videoUrl)) {
      errors.push({ field: 'videoUrl', message: 'Некорректный URL видео' });
    }
  }

  // Проверка сожженных калорий
  if (req.body.caloriesBurned !== undefined) {
    const calories = parseInt(req.body.caloriesBurned);
    if (isNaN(calories) || calories < 0) {
      errors.push({ field: 'caloriesBurned', message: 'Количество калорий должно быть положительным числом' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  // Нормализуем данные
  req.body.title = title.trim();
  req.body.description = description.trim();
  req.body.type = type.trim();
  req.body.difficulty = difficulty.trim();
  req.body.duration = parseInt(duration);
  
  if (req.body.videoUrl) {
    req.body.videoUrl = req.body.videoUrl.trim();
  }
  
  if (req.body.imageUrl) {
    req.body.imageUrl = req.body.imageUrl.trim();
  }
  
  if (req.body.muscleGroups) {
    if (Array.isArray(req.body.muscleGroups)) {
      req.body.muscleGroups = req.body.muscleGroups.map(group => group.trim());
    } else {
      req.body.muscleGroups = req.body.muscleGroups.split(',').map(g => g.trim()).filter(g => g);
    }
  }
  
  if (req.body.caloriesBurned !== undefined) {
    req.body.caloriesBurned = parseInt(req.body.caloriesBurned);
  }

  next();
};