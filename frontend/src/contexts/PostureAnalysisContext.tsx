import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { postureAnalysisService, type PostureAnalysisState } from '../services/postureAnalysisService';

interface PostureAnalysisContextValue {
  state: PostureAnalysisState;
}

interface PostureControlContextValue {
  start: () => Promise<boolean>;
  stop: () => void;
  dispose: () => void;
  calibrate: () => Promise<boolean>;
  resetCalibration: () => void;
  getVideoElement: () => HTMLVideoElement | null;
  resetSessionStats: () => void;
}

// Создание контекстов 

const PostureAnalysisCtx = createContext<PostureAnalysisContextValue | null>(null);
const PostureControlCtx = createContext<PostureControlContextValue | null>(null);

// Провайдер 

interface PostureAnalysisProviderProps {
  children: ReactNode;
}

export const PostureAnalysisProvider: React.FC<PostureAnalysisProviderProps> = ({ children }) => {
  const [state, setState] = useState<PostureAnalysisState>(postureAnalysisService.getState());

  // Подписка на изменения сервиса
  useEffect(() => {
    const unsubscribe = postureAnalysisService.addListener((newState) => {
      // Используем функциональное обновление, чтобы избежать лишних ререндеров
      setState(newState as PostureAnalysisState);
    });

    return unsubscribe;
  }, []);

  // Методы управления 
  const start = useCallback(async (): Promise<boolean> => {
    return postureAnalysisService.start(true);
  }, []);

  const stop = useCallback((): void => {
    postureAnalysisService.stop();
  }, []);

  const dispose = useCallback((): void => {
    postureAnalysisService.dispose();
  }, []);

  const calibrate = useCallback(async (): Promise<boolean> => {
    return postureAnalysisService.calibrate();
  }, []);

  const resetCalibration = useCallback((): void => {
    postureAnalysisService.resetCalibration();
  }, []);

  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    return postureAnalysisService.getVideoElement();
  }, []);

  const resetSessionStats = useCallback((): void => {
    postureAnalysisService.resetSessionStats();
  }, []);

  // Контекстные значения
  const analysisValue: PostureAnalysisContextValue = { state };
  const controlValue: PostureControlContextValue = {
    start,
    stop,
    dispose,
    calibrate,
    resetCalibration,
    getVideoElement,
    resetSessionStats,
  };

  return (
    <PostureAnalysisCtx.Provider value={analysisValue}>
      <PostureControlCtx.Provider value={controlValue}>
        {children}
      </PostureControlCtx.Provider>
    </PostureAnalysisCtx.Provider>
  );
};

//  Хуки 


export function usePostureAnalysis(): PostureAnalysisState {
  const ctx = useContext(PostureAnalysisCtx);
  if (!ctx) {
    throw new Error(
      'usePostureAnalysis must be used within a <PostureAnalysisProvider>',
    );
  }
  return ctx.state;
}

export function usePostureControl(): PostureControlContextValue {
  const ctx = useContext(PostureControlCtx);
  if (!ctx) {
    throw new Error(
      'usePostureControl must be used within a <PostureAnalysisProvider>',
    );
  }
  return ctx;
}
