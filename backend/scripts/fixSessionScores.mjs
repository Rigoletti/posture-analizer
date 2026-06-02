import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/posture-analyzer';

const fixSessionScores = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const sessionsCollection = mongoose.connection.collection('sessions');
    
    // Находим все сеансы
    const sessions = await sessionsCollection.find({}).toArray();
    console.log(`Found ${sessions.length} sessions to fix`);
    
    let fixedCount = 0;
    
    for (const session of sessions) {
      const metrics = session.postureMetrics;
      if (metrics && metrics.totalFrames > 0) {
        // Рассчитываем правильные проценты
        const totalFrames = metrics.totalFrames;
        const goodPct = Math.round((metrics.goodPostureFrames || 0) / totalFrames * 100);
        const warningPct = Math.round((metrics.warningFrames || 0) / totalFrames * 100);
        const errorPct = Math.round((metrics.errorFrames || 0) / totalFrames * 100);
        
        // Проверяем, нужно ли обновлять
        const needsUpdate = 
          metrics.goodPercentage !== goodPct ||
          metrics.warningPercentage !== warningPct ||
          metrics.errorPercentage !== errorPct ||
          metrics.postureScore !== goodPct;
        
        if (needsUpdate) {
          await sessionsCollection.updateOne(
            { _id: session._id },
            { 
              $set: { 
                'postureMetrics.goodPercentage': goodPct,
                'postureMetrics.warningPercentage': warningPct,
                'postureMetrics.errorPercentage': errorPct,
                'postureMetrics.postureScore': goodPct
              } 
            }
          );
          fixedCount++;
          console.log(`Fixed session ${session.sessionId}: score ${metrics.postureScore}% -> ${goodPct}%`);
        }
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} sessions`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error fixing sessions:', error);
    process.exit(1);
  }
};

fixSessionScores();