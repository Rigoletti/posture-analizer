// frontend/src/utils/poseStorageSync.ts
export interface PoseSessionData {
  sessionId: string | null;
  isActive: boolean;
  startTime: number;
  calibrationNormalized: any;
  stats: {
    totalFrames: number;
    goodPostureFrames: number;
    warningFrames: number;
  };
}

export const savePoseSession = (data: Partial<PoseSessionData>) => {
  try {
    const existing = localStorage.getItem('poseSessionData');
    const current = existing ? JSON.parse(existing) : {};
    const updated = { ...current, ...data, lastUpdated: Date.now() };
    localStorage.setItem('poseSessionData', JSON.stringify(updated));
    
    // Также отправляем через BroadcastChannel для синхронизации
    const channel = new BroadcastChannel('pose-sync');
    channel.postMessage({ type: 'SESSION_UPDATE', data: updated });
    channel.close();
  } catch (err) {
    console.error('Failed to save pose session:', err);
  }
};

export const loadPoseSession = (): PoseSessionData | null => {
  try {
    const data = localStorage.getItem('poseSessionData');
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to load pose session:', err);
    return null;
  }
};

export const clearPoseSession = () => {
  try {
    localStorage.removeItem('poseSessionData');
  } catch (err) {
    console.error('Failed to clear pose session:', err);
  }
};

// Слушатель изменений в других вкладках
export const subscribeToPoseSync = (callback: (data: any) => void) => {
  const channel = new BroadcastChannel('pose-sync');
  channel.onmessage = (event) => {
    if (event.data.type === 'SESSION_UPDATE') {
      callback(event.data.data);
    }
  };
  
  return () => {
    channel.close();
  };
};