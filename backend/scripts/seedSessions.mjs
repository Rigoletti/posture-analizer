import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/posture-analizer';

// Ваш ID пользователя
const USER_ID = new ObjectId('69986d80058a1f19717c82cf');

// Генерация случайной даты в пределах последних 30 дней
const getRandomDate = (daysBack = 30) => {
  const date = new Date();
  const daysAgo = Math.floor(Math.random() * daysBack);
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Генерация случайной длительности сеанса (от 30 до 600 секунд)
const getRandomDuration = () => {
  return Math.floor(Math.random() * 570) + 30;
};

// Генерация количества кадров на основе длительности
const getRandomFrames = (duration) => {
  const fps = 5;
  return Math.floor(duration * fps * (0.8 + Math.random() * 0.4));
};

// Генерация метрик
const generateMetrics = (quality = 'good') => {
  let goodPostureFrames, warningFrames, errorFrames;
  let totalFrames = 0;
  let duration = getRandomDuration();
  
  switch (quality) {
    case 'excellent':
      totalFrames = getRandomFrames(duration);
      goodPostureFrames = Math.floor(totalFrames * (0.90 + Math.random() * 0.1));
      warningFrames = Math.floor(totalFrames * (0.0 + Math.random() * 0.08));
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
      break;
    case 'good':
      totalFrames = getRandomFrames(duration);
      goodPostureFrames = Math.floor(totalFrames * (0.75 + Math.random() * 0.14));
      warningFrames = Math.floor(totalFrames * (0.1 + Math.random() * 0.1));
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
      break;
    case 'average':
      totalFrames = getRandomFrames(duration);
      goodPostureFrames = Math.floor(totalFrames * (0.60 + Math.random() * 0.14));
      warningFrames = Math.floor(totalFrames * (0.2 + Math.random() * 0.15));
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
      break;
    case 'poor':
      totalFrames = getRandomFrames(duration);
      goodPostureFrames = Math.floor(totalFrames * (0.40 + Math.random() * 0.19));
      warningFrames = Math.floor(totalFrames * (0.3 + Math.random() * 0.2));
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
      break;
    case 'veryPoor':
      totalFrames = getRandomFrames(duration);
      goodPostureFrames = Math.floor(totalFrames * (0 + Math.random() * 0.39));
      warningFrames = Math.floor(totalFrames * (0.4 + Math.random() * 0.3));
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
      break;
    default:
      totalFrames = getRandomFrames(duration);
      goodPostureFrames = Math.floor(totalFrames * 0.7);
      warningFrames = Math.floor(totalFrames * 0.2);
      errorFrames = totalFrames - goodPostureFrames - warningFrames;
  }
  
  if (goodPostureFrames + warningFrames + errorFrames !== totalFrames) {
    errorFrames = totalFrames - goodPostureFrames - warningFrames;
  }
  
  const goodPct = Math.round((goodPostureFrames / totalFrames) * 100);
  const warningPct = Math.round((warningFrames / totalFrames) * 100);
  const errorPct = Math.round((errorFrames / totalFrames) * 100);
  
  // Генерация ошибок по зонам
  const shoulders = { count: 0, duration: 0, percentage: 0 };
  const head = { count: 0, duration: 0, percentage: 0 };
  const hips = { count: 0, duration: 0, percentage: 0 };
  
  if (quality === 'poor' || quality === 'veryPoor' || (quality === 'average' && Math.random() > 0.5)) {
    if (Math.random() > 0.3) {
      const shoulderDuration = duration * (0.2 + Math.random() * 0.5);
      shoulders.count = Math.floor(shoulderDuration / 0.2);
      shoulders.duration = shoulderDuration;
      shoulders.percentage = Math.round((shoulderDuration / duration) * 100);
    }
    
    if (Math.random() > 0.4) {
      const headDuration = duration * (0.1 + Math.random() * 0.4);
      head.count = Math.floor(headDuration / 0.2);
      head.duration = headDuration;
      head.percentage = Math.round((headDuration / duration) * 100);
    }
    
    if (Math.random() > 0.7) {
      const hipsDuration = duration * (0.1 + Math.random() * 0.3);
      hips.count = Math.floor(hipsDuration / 0.2);
      hips.duration = hipsDuration;
      hips.percentage = Math.round((hipsDuration / duration) * 100);
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
    averageTrackingQuality: Math.floor(70 + Math.random() * 30)
  };
};

// Создание одного сеанса
const createSession = (index) => {
  let quality;
  
  // Создаем прогрессию: первые сеансы хуже, последние лучше
  if (index < 5) quality = 'veryPoor';
  else if (index < 12) quality = 'poor';
  else if (index < 22) quality = 'average';
  else if (index < 35) quality = 'good';
  else quality = 'excellent';
  
  const startTime = getRandomDate(30);
  const duration = getRandomDuration();
  const metrics = generateMetrics(quality);
  
  // Корректируем количество кадров
  const expectedFrames = Math.floor(duration * 5);
  if (Math.abs(metrics.totalFrames - expectedFrames) > expectedFrames * 0.3) {
    metrics.totalFrames = expectedFrames;
    metrics.goodPostureFrames = Math.floor(metrics.goodPercentage / 100 * expectedFrames);
    metrics.warningFrames = Math.floor(metrics.warningPercentage / 100 * expectedFrames);
    metrics.errorFrames = expectedFrames - metrics.goodPostureFrames - metrics.warningFrames;
  }
  
  const sessionId = `session_${startTime.getTime()}_${Math.random().toString(36).substr(2, 8)}`;
  
  // Ключевые моменты
  const keyMoments = [
    {
      timestamp: startTime,
      type: 'start',
      message: 'Сеанс начат',
      data: {}
    }
  ];
  
  if (quality !== 'excellent' && quality !== 'good') {
    const notificationCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < notificationCount; i++) {
      const offset = Math.random() * duration;
      const notificationTime = new Date(startTime.getTime() + offset * 1000);
      keyMoments.push({
        timestamp: notificationTime,
        type: 'notification',
        message: 'Обнаружено нарушение осанки',
        data: { type: Math.random() > 0.5 ? 'shoulders' : 'head' }
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
      confidenceThreshold: 0.3 + Math.random() * 0.4,
      deviationThreshold: 0.1 + Math.random() * 0.1,
      notificationEnabled: Math.random() > 0.2,
      calibrationType: Math.random() > 0.7 ? 'manual' : 'auto'
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
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');
    
    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('sessions');
    
    // Проверяем существующие сеансы
    const existingCount = await sessionsCollection.countDocuments({ userId: USER_ID });
    console.log(`\n📊 Существующих сеансов для пользователя: ${existingCount}`);
    
    // Спрашиваем, нужно ли очистить
    console.log('\nЧто делать?');
    console.log('1. Добавить 50 новых сеансов (сохранить существующие)');
    console.log('2. Очистить и добавить 50 новых сеансов');
    console.log('3. Добавить 50 новых сеансов с другого аккаунта (указать другой ID)');
    console.log('4. Выйти');
    
    // Для автоматического выполнения выберем вариант 1
    console.log('\n🔄 Автоматически выбираем вариант 1: Добавление 50 новых сеансов...');
    
    console.log('\n📊 Генерация 50 новых сеансов...');
    const sessions = [];
    const totalSessions = 50;
    
    for (let i = 0; i < totalSessions; i++) {
      const session = createSession(i);
      sessions.push(session);
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Сгенерировано ${i + 1}/${totalSessions} сеансов...`);
      }
    }
    
    // Сортируем по дате
    sessions.sort((a, b) => a.startTime - b.startTime);
    
    console.log('\n💾 Сохранение сеансов в базу данных...');
    const result = await sessionsCollection.insertMany(sessions);
    console.log(`✅ Добавлено ${result.insertedCount} новых сеансов`);
    
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
    
    const totalNow = existingCount + result.insertedCount;
    console.log(`\n📊 Теперь у вас ${totalNow} сеансов!`);
    
    // Показываем пример
    console.log('\n📋 Пример добавленного сеанса:');
    const example = sessions[Math.floor(sessions.length / 2)];
    console.log(`   Дата: ${example.startTime.toLocaleString('ru-RU')}`);
    console.log(`   Оценка: ${example.postureMetrics.postureScore}%`);
    console.log(`   Длительность: ${Math.floor(example.duration / 60)} мин ${example.duration % 60} сек`);
    console.log(`   Хорошая осанка: ${example.postureMetrics.goodPercentage}%`);
    
    await mongoose.disconnect();
    console.log('\n✨ Готово! Обновите страницу /sessions чтобы увидеть новые данные');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
  process.exit(0);
};

seedDatabase();