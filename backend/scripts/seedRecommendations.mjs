import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем env переменные
dotenv.config({ path: path.join(__dirname, '../.env') });

// Импортируем модели
import User from '../models/User.mjs';
import Exercise from '../models/Exercise.mjs';
import Recommendation from '../models/Recommendation.mjs';

const seedRecommendations = async () => {
  console.log('🌱 Начинаем заполнение базы рекомендаций...');
  
  try {
    // Подключаемся к базе данных
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/posture-analyzer';
    console.log('Подключаемся к MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Успешно подключились к MongoDB');
    
    // Находим админа (первого пользователя с ролью admin)
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('⚠️  Администратор не найден. Ищем любого пользователя...');
      const anyUser = await User.findOne();
      if (!anyUser) {
        console.error('❌ Нет пользователей в базе. Сначала создайте пользователя.');
        process.exit(1);
      }
      console.log(`✅ Используем пользователя: ${anyUser.email}`);
    }
    
    // Находим упражнения
    const exercises = await Exercise.find({ isActive: true });
    console.log(`✅ Найдено упражнений: ${exercises.length}`);
    
    if (exercises.length === 0) {
      console.error('❌ Нет активных упражнений в базе. Сначала создайте упражнения.');
      process.exit(1);
    }
    
    // Логируем найденные упражнения
    console.log('\n📋 Найденные упражнения:');
    exercises.forEach(ex => {
      console.log(`  - ${ex.title} (${ex.type}, ${ex.difficulty})`);
    });
    
    // Базовые рекомендации с поиском подходящих упражнений
    const initialRecommendations = [];
    
    // Функция для поиска упражнения по ключевым словам
    const findExercise = (keywords, type = null, difficulty = null) => {
      let filtered = exercises;
      
      if (type) {
        filtered = filtered.filter(e => e.type === type);
      }
      
      if (difficulty) {
        filtered = filtered.filter(e => e.difficulty === difficulty);
      }
      
      for (const exercise of filtered) {
        for (const keyword of keywords) {
          if (exercise.title.toLowerCase().includes(keyword.toLowerCase()) || 
              exercise.description.toLowerCase().includes(keyword.toLowerCase())) {
            return exercise;
          }
        }
      }
      
      // Если не нашли по ключевым словам, возвращаем первое подходящее
      return filtered.length > 0 ? filtered[0] : exercises[0];
    };
    
    // Для проблем с плечами
    const shoulderExercise = findExercise(['плеч', 'спин', 'рука'], 'stretching');
    if (shoulderExercise) {
      initialRecommendations.push({
        problemType: 'shoulders',
        exerciseId: shoulderExercise._id,
        priority: 10,
        description: 'Упражнение помогает снять напряжение в плечах, улучшить осанку и раскрыть грудную клетку',
        isActive: true,
        createdBy: admin ? admin._id : null
      });
    }
    
    // Для проблем с головой
    const headExercise = findExercise(['ше', 'голов', 'шейн'], 'stretching');
    if (headExercise) {
      initialRecommendations.push({
        problemType: 'head',
        exerciseId: headExercise._id,
        priority: 9,
        description: 'Растяжка шейного отдела для снятия напряжения, улучшения кровообращения и профилактики головных болей',
        isActive: true,
        createdBy: admin ? admin._id : null
      });
    }
    
    // Для проблем с тазом
    const hipsExercise = findExercise(['таз', 'бедр', 'поясниц'], 'stretching');
    if (hipsExercise) {
      initialRecommendations.push({
        problemType: 'hips',
        exerciseId: hipsExercise._id,
        priority: 8,
        description: 'Улучшение гибкости тазобедренных суставов, снятие напряжения в пояснице',
        isActive: true,
        createdBy: admin ? admin._id : null
      });
    }
    
    // Общие рекомендации для осанки
    const generalExercise1 = findExercise(['осанк', 'спин', 'позвон'], 'stretching', 'beginner');
    if (generalExercise1) {
      initialRecommendations.push({
        problemType: 'general_posture',
        exerciseId: generalExercise1._id,
        priority: 7,
        description: 'Базовые упражнения для поддержания хорошей осанки и профилактики искривлений позвоночника',
        isActive: true,
        createdBy: admin ? admin._id : null
      });
    }
    
    const generalExercise2 = findExercise(['кор', 'пресс', 'живот'], 'strength', 'beginner');
    if (generalExercise2) {
      initialRecommendations.push({
        problemType: 'general_posture',
        exerciseId: generalExercise2._id,
        priority: 6,
        description: 'Укрепление мышц кора для поддержки позвоночника и улучшения стабильности',
        isActive: true,
        createdBy: admin ? admin._id : null
      });
    }
    
    // Для гибкости
    const flexibilityExercise = findExercise(['гибк', 'растяж', 'расслабл'], 'stretching');
    if (flexibilityExercise) {
      initialRecommendations.push({
        problemType: 'flexibility',
        exerciseId: flexibilityExercise._id,
        priority: 5,
        description: 'Улучшение общей гибкости тела, увеличение диапазона движений',
        isActive: true,
        createdBy: admin ? admin._id : null
      });
    }
    
    // Для баланса
    const balanceExercise = findExercise(['баланс', 'равновес', 'стабильн'], 'strength');
    if (balanceExercise) {
      initialRecommendations.push({
        problemType: 'balance',
        exerciseId: balanceExercise._id,
        priority: 5,
        description: 'Улучшение баланса и координации движений, укрепление стабилизирующих мышц',
        isActive: true,
        createdBy: admin ? admin._id : null
      });
    }
    
    console.log('\n🎯 Создаваемые рекомендации:');
    initialRecommendations.forEach(rec => {
      console.log(`  - ${rec.problemType} → Приоритет: ${rec.priority}`);
    });
    
    // Очищаем старые рекомендации
    console.log('\n🧹 Очищаем старые рекомендации...');
    const deleteResult = await Recommendation.deleteMany({});
    console.log(`✅ Удалено рекомендаций: ${deleteResult.deletedCount}`);
    
    // Создаем новые рекомендации
    console.log('\n📝 Создаем новые рекомендации...');
    const createdRecommendations = [];
    
    for (const rec of initialRecommendations) {
      try {
        const recommendation = await Recommendation.create(rec);
        createdRecommendations.push(recommendation);
        console.log(`  ✅ Создана: ${rec.problemType} (Приоритет: ${rec.priority})`);
      } catch (error) {
        console.error(`  ❌ Ошибка при создании ${rec.problemType}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Успешно создано рекомендаций: ${createdRecommendations.length}`);
    
    // Показываем итоговую статистику
    const problemStats = await Recommendation.aggregate([
      { $group: {
        _id: '$problemType',
        count: { $sum: 1 },
        avgPriority: { $avg: '$priority' }
      }}
    ]);
    
    console.log('\n📊 Статистика по типам проблем:');
    problemStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} рекомендаций, средний приоритет: ${stat.avgPriority.toFixed(1)}`);
    });
    
    const activeCount = await Recommendation.countDocuments({ isActive: true });
    console.log(`\n📈 Активных рекомендаций: ${activeCount}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Ошибка при заполнении базы:', error);
    process.exit(1);
  }
};

// Запускаем скрипт
seedRecommendations();