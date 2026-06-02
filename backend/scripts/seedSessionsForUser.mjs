import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// ПРАВИЛЬНЫЙ URL для подключения - используем базу данных с подчеркиванием
const MONGODB_URI = 'mongodb://localhost:27017/posture_analyzer';

// ВАШ ID пользователя
const USER_ID_STRING = '69986d80058a1f19717c82cf';
const USER_ID = new ObjectId(USER_ID_STRING);

// Генерация случайной даты в пределах последних 60 дней
const getRandomDate = (daysBack = 60) => {
  const date = new Date();
  const daysAgo = Math.floor(Math.random() * daysBack);
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Генерация случайной длительности сеанса
const getRandomDuration = () => {
  return Math.floor(Math.random() * 600) + 60;
};

// Генерация количества кадров
const getRandomFrames = (duration) => {
  const fps = 5;
  return Math.floor(duration * fps * (0.8 + Math.random() * 0.4));
};

// Генерация метрик
const generateMetrics = (quality, index) => {
  let goodPostureFrames, warningFrames, errorFrames;
  let duration = getRandomDuration();
  let totalFrames = getRandomFrames(duration);
  
  let actualQuality = quality;
  if (quality === 'progressive') {
    if (index < 8) actualQuality = 'veryPoor';
    else if (index < 18) actualQuality = 'poor';
    else if (index < 30) actualQuality = 'average';
    else if (index < 42) actualQuality = 'good';
    else actualQuality = 'excellent';
  }
  
  switch (actualQuality) {
    case 'excellent':
      goodPostureFrames = Math.floor(totalFrames * (0.92 + Math.random() * 0.08));
      warningFrames = Math.floor(totalFrames * (0.0 + Math.random() * 0.05));
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
      break;
    case 'good':
      goodPostureFrames = Math.floor(totalFrames * (0.78 + Math.random() * 0.12));
      warningFrames = Math.floor(totalFrames * (0.08 + Math.random() * 0.1));
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
      break;
    case 'average':
      goodPostureFrames = Math.floor(totalFrames * (0.62 + Math.random() * 0.13));
      warningFrames = Math.floor(totalFrames * (0.15 + Math.random() * 0.15));
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
      break;
    case 'poor':
      goodPostureFrames = Math.floor(totalFrames * (0.45 + Math.random() * 0.14));
      warningFrames = Math.floor(totalFrames * (0.25 + Math.random() * 0.2));
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
      break;
    case 'veryPoor':
      goodPostureFrames = Math.floor(totalFrames * (0.15 + Math.random() * 0.3));
      warningFrames = Math.floor(totalFrames * (0.35 + Math.random() * 0.25));
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
      break;
    default:
      goodPostureFrames = Math.floor(totalFrames * 0.7);
      warningFrames = Math.floor(totalFrames * 0.2);
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
  }
  
  if (goodPostureFrames + warningFrames + errorFrames !== totalFrames) {
    errorFrames = totalFrames - goodPostureFrames - warningFrames;
  }
  if (errorFrames < 0) errorFrames = 0;
  
  const goodPct = Math.round((goodPostureFrames / totalFrames) * 100);
  const warningPct = Math.round((warningFrames / totalFrames) * 100);
  const errorPct = Math.round((errorFrames / totalFrames) * 100);
  
  const shoulders = { count: 0, duration: 0, percentage: 0 };
  const head = { count: 0, duration: 0, percentage: 0 };
  const hips = { count: 0, duration: 0, percentage: 0 };
  
  if (actualQuality === 'poor' || actualQuality === 'veryPoor' || 
      (actualQuality === 'average' && Math.random() > 0.6)) {
    
    if (Math.random() > 0.3) {
      const shoulderPct = 15 + Math.random() * 40;
      const shoulderDuration = duration * (shoulderPct / 100);
      shoulders.count = Math.floor(shoulderDuration / 0.2);
      shoulders.duration = shoulderDuration;
      shoulders.percentage = Math.round(shoulderPct);
    }
    
    if (Math.random() > 0.4) {
      const headPct = 10 + Math.random() * 30;
      const headDuration = duration * (headPct / 100);
      head.count = Math.floor(headDuration / 0.2);
      head.duration = headDuration;
      head.percentage = Math.round(headPct);
    }
    
    if (Math.random() > 0.75) {
      const hipsPct = 5 + Math.random() * 20;
      const hipsDuration = duration * (hipsPct / 100);
      hips.count = Math.floor(hipsDuration / 0.2);
      hips.duration = hipsDuration;
      hips.percentage = Math.round(hipsPct);
    }
  }
  
  return {
    totalFrames,
    goodPostureFrames,
    warningFrames,
    errorFrames,
    errorsByZone: { shoulders, head, hips },
    postureScore: goodPct,
    goodPercentage: goodPct,
    warningPercentage: warningPct,
    errorPercentage: errorPct,
    averageTrackingQuality: Math.floor(65 + Math.random() * 35)
  };
};

// Создание сеанса
const createSession = (index) => {
  const startTime = getRandomDate(60);
  const duration = getRandomDuration();
  const metrics = generateMetrics('progressive', index);
  
  const sessionId = `session_${startTime.getTime()}_${Math.random().toString(36).substr(2, 8)}`;
  
  const keyMoments = [
    {
      timestamp: startTime,
      type: 'start',
      message: 'Сеанс начат',
      data: {}
    }
  ];
  
  if (metrics.postureScore < 85) {
    const notificationCount = Math.floor(Math.random() * 6) + 1;
    for (let i = 0; i < notificationCount; i++) {
      const offset = Math.random() * duration;
      const notificationTime = new Date(startTime.getTime() + offset * 1000);
      let message = 'Обнаружено нарушение осанки';
      let problemType = 'general';
      
      if (metrics.errorsByZone.shoulders.percentage > 0 && Math.random() > 0.5) {
        message = 'Плечи опущены! Выпрямитесь!';
        problemType = 'shoulders';
      } else if (metrics.errorsByZone.head.percentage > 0 && Math.random() > 0.5) {
        message = 'Голова наклонена! Поднимите голову!';
        problemType = 'head';
      }
      
      keyMoments.push({
        timestamp: notificationTime,
        type: 'notification',
        message,
        data: { type: problemType }
      });
    }
  }
  
  keyMoments.push({
    timestamp: new Date(startTime.getTime() + duration * 1000),
    type: 'end',
    message: 'Сеанс завершен',
    data: {}
  });
  
  return {
    userId: USER_ID,
    sessionId,
    startTime,
    endTime: new Date(startTime.getTime() + duration * 1000),
    duration,
    postureMetrics: metrics,
    keyMoments,
    settings: {
      confidenceThreshold: 0.3,
      deviationThreshold: 0.1,
      notificationEnabled: true,
      calibrationType: 'auto'
    },
    deviceInfo: {
      userAgent: 'Chrome/120.0.0.0',
      screenResolution: '1920x1080',
      webcamResolution: '1280x720'
    },
    status: 'completed',
    createdAt: startTime,
    updatedAt: new Date(startTime.getTime() + duration * 1000)
  };
};

// Главная функция
const seedDatabase = async () => {
  try {
    console.log('🔄 Подключение к MongoDB...');
    console.log(`   URL: ${MONGODB_URI}`);
    
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');
    
    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('sessions');
    const usersCollection = db.collection('users');
    
    // Показываем все коллекции в базе
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Коллекции в базе данных:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Ищем пользователя
    console.log(`\n🔍 Поиск пользователя с ID: ${USER_ID_STRING}`);
    let user = await usersCollection.findOne({ _id: USER_ID });
    
    if (!user) {
      console.log('\n❌ Пользователь не найден!');
      console.log('\n📋 Все пользователи в базе:');
      const allUsers = await usersCollection.find({}).toArray();
      
      if (allUsers.length === 0) {
        console.log('   Нет пользователей в базе данных');
        console.log('\n💡 Возможно, пользователи хранятся в другой коллекции или базе данных');
        console.log('   Проверьте название базы данных в вашем .env файле');
      } else {
        allUsers.forEach(u => {
          console.log(`   ID: ${u._id}`);
          console.log(`   Email: ${u.email}`);
          console.log(`   Имя: ${u.firstName} ${u.lastName || ''}`);
          console.log('   ---');
        });
        
        // Если есть пользователь, предлагаем использовать его ID
        if (allUsers.length > 0) {
          console.log('\n💡 Используйте один из ID выше в скрипте');
        }
      }
      process.exit(1);
    }
    
    console.log(`\n👤 Найден пользователь:`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Имя: ${user.firstName} ${user.lastName || ''}`);
    
    // Проверяем существующие сеансы
    const existingSessions = await sessionsCollection.find({ userId: user._id }).toArray();
    console.log(`\n📊 Существующих сеансов: ${existingSessions.length}`);
    
    // Удаляем старые сеансы (по желанию)
    const deleteExisting = process.argv.includes('--clear');
    if (deleteExisting) {
      console.log('🗑️ Удаление существующих сеансов...');
      await sessionsCollection.deleteMany({ userId: user._id });
      console.log('✅ Существующие сеансы удалены');
    }
    
    // Генерируем 50 сеансов
    console.log('\n📊 Генерация 50 сеансов с прогрессией...');
    const sessions = [];
    const totalSessions = 50;
    
    for (let i = 0; i < totalSessions; i++) {
      const session = createSession(i);
      session.userId = user._id;
      sessions.push(session);
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Сгенерировано ${i + 1}/${totalSessions}...`);
      }
    }
    
    sessions.sort((a, b) => a.startTime - b.startTime);
    
    console.log('\n💾 Сохранение в базу данных...');
    const result = await sessionsCollection.insertMany(sessions);
    console.log(`✅ Добавлено ${result.insertedCount} сеансов`);
    
    // Статистика
    console.log('\n📈 Статистика добавленных сеансов:');
    const stats = { excellent: 0, good: 0, average: 0, poor: 0, veryPoor: 0 };
    
    sessions.forEach(session => {
      const score = session.postureMetrics.postureScore;
      if (score >= 90) stats.excellent++;
      else if (score >= 75) stats.good++;
      else if (score >= 60) stats.average++;
      else if (score >= 40) stats.poor++;
      else stats.veryPoor++;
    });
    
    console.log(`   🟢 Отличная (90-100%): ${stats.excellent}`);
    console.log(`   ✅ Хорошая (75-89%): ${stats.good}`);
    console.log(`   🟡 Средняя (60-74%): ${stats.average}`);
    console.log(`   🟠 Плохая (40-59%): ${stats.poor}`);
    console.log(`   🔴 Очень плохая (0-39%): ${stats.veryPoor}`);
    
    const totalNow = deleteExisting ? result.insertedCount : existingSessions.length + result.insertedCount;
    console.log(`\n📊 Теперь у вас ${totalNow} сеансов!`);
    
    // Примеры
    console.log('\n📋 Примеры добавленных сеансов:');
    const examples = [sessions[0], sessions[25], sessions[49]];
    examples.forEach((session, idx) => {
      const dateStr = session.startTime.toLocaleString('ru-RU');
      console.log(`\n   ${idx === 0 ? 'Ранний' : idx === 1 ? 'Средний' : 'Последний'} сеанс:`);
      console.log(`   📅 ${dateStr}`);
      console.log(`   ⭐ Оценка: ${session.postureMetrics.postureScore}%`);
      console.log(`   ⏱️ Длительность: ${Math.floor(session.duration / 60)} мин ${session.duration % 60} сек`);
      console.log(`   📊 Кадров: ${session.postureMetrics.totalFrames}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✨ Готово!');
    console.log('🔗 Обновите страницу: http://localhost:5173/sessions');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
  process.exit(0);
};

seedDatabase();