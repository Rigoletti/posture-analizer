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
  /** Текущее состояние анализа */
  state: PostureAnalysisState;
}

interface PostureControlContextValue {
  /** Запустить анализ (требуется калибровка) */
  start: () => Promise<boolean>;
  /** Остановить анализ */
  stop: () => void;
  /** Полная остановка с освобождением ресурсов */
  dispose: () => void;
  /** Выполнить калибровку */
  calibrate: () => Promise<boolean>;
  /** Сбросить калибровку */
  resetCalibration: () => void;
  /** Получить referencen на video-элемент для отображения в WebcamFeed */
  getVideoElement: () => HTMLVideoElement | null;
  /** Сбросить статистику сессии */
  resetSessionStats: () => void;
}

// ─── Создание контекстов ─────────────────────────────────────────────────────

const PostureAnalysisCtx = createContext<PostureAnalysisContextValue | null>(null);
const PostureControlCtx = createContext<PostureControlContextValue | null>(null);

// ─── Провайдер ───────────────────────────────────────────────────────────────

interface PostureAnalysisProviderProps {
  children: ReactNode;
}

export const PostureAnalysisProvider: React.FC<PostureAnalysisProviderProps> = ({ children }) => {
  const [state, setState] = useState<PostureAnalysisState>(postureAnalysisService.getState());

  // Подписка на изменения сервиса
  useEffect(() => {
    const unsubscribe = postureAnalysisService.addListener((newState) => {
      // Используем функциональное обновление, чтобы избежать лишних ререндеров
      // Сервис всегда присылает полный объект (Object.assign в emit)
      setState(newState as PostureAnalysisState);
    });

    return unsubscribe;
  }, []);

  // Методы управления (стабильные ссылки через useCallback)
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

// ─── Хуки ────────────────────────────────────────────────────────────────────

/**
 * usePostureAnalysis — доступ к состоянию анализа осанки.
 * Компонент будет перерендериваться при любом изменении состояния.
 *
 * @returns PostureAnalysisState — полное состояние анализа
 */
export function usePostureAnalysis(): PostureAnalysisState {
  const ctx = useContext(PostureAnalysisCtx);
  if (!ctx) {
    throw new Error(
      'usePostureAnalysis must be used within a <PostureAnalysisProvider>',
    );
  }
  return ctx.state;
}

/**
 * usePostureControl — доступ к методам управления анализом осанки.
 * Возвращаемые функции стабильны (не меняются между рендерами).
 *
 * @returns { start, stop, dispose, calibrate, resetCalibration, getVideoElement, resetSessionStats }
 */
export function usePostureControl(): PostureControlContextValue {
  const ctx = useContext(PostureControlCtx);
  if (!ctx) {
    throw new Error(
      'usePostureControl must be used within a <PostureAnalysisProvider>',
    );
  }
  return ctx;
}
