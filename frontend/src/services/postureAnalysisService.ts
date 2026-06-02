import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

// ─── Константы 

const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 320;
const KEYPOINT_INDICES = {
  NOSE: 0, LEFT_EYE: 1, RIGHT_EYE: 2, LEFT_EAR: 3, RIGHT_EAR: 4,
  LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6, LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
  LEFT_WRIST: 9, RIGHT_WRIST: 10, LEFT_HIP: 11, RIGHT_HIP: 12,
} as const;

const POSTURE_THRESHOLDS = {
  CONFIDENCE_THRESHOLD: 0.3,
  DEVIATION_THRESHOLD: 0.1,
};

const UPPER_BODY_INDICES: number[] = [
  KEYPOINT_INDICES.NOSE, KEYPOINT_INDICES.LEFT_EYE, KEYPOINT_INDICES.RIGHT_EYE,
  KEYPOINT_INDICES.LEFT_EAR, KEYPOINT_INDICES.RIGHT_EAR,
  KEYPOINT_INDICES.LEFT_SHOULDER, KEYPOINT_INDICES.RIGHT_SHOULDER,
  KEYPOINT_INDICES.LEFT_ELBOW, KEYPOINT_INDICES.RIGHT_ELBOW,
  KEYPOINT_INDICES.LEFT_WRIST, KEYPOINT_INDICES.RIGHT_WRIST,
];

const POSTURE_ANALYSIS_INDICES = [
  KEYPOINT_INDICES.LEFT_SHOULDER, KEYPOINT_INDICES.RIGHT_SHOULDER,
  KEYPOINT_INDICES.NOSE, KEYPOINT_INDICES.LEFT_EAR, KEYPOINT_INDICES.RIGHT_EAR,
];

const DETECTION_INTERVAL_ACTIVE = 1000;      // 1 сек — активная вкладка
const DETECTION_INTERVAL_BACKGROUND = 2000;   // 2 сек — фоновая вкладка
const NOTIFICATION_COOLDOWN = 5000;
const HISTORY_SIZE = 5;
const NOTIFICATION_TAG = 'posture-analyzer-alert';

export type PostureIssueType = 'shoulders' | 'head' | 'hips';

export interface PostureIssue {
  type: PostureIssueType;
  message: string;
}

export interface PostureAnalysisState {
  isRunning: boolean;
  isModelLoading: boolean;
  isModelReady: boolean;
  isCalibrated: boolean;
  isCalibrating: boolean;
  isSessionActive: boolean;
  currentStatus: string;
  issues: PostureIssue[];
  trackingQuality: number;
  postureScore: number;
  totalFrames: number;
  goodPostureFrames: number;
  warningFrames: number;
  error: string | null;
  postureHistory: string[];
  sessionDuration: number;
  normalizedKeypoints?: Array<{ x: number; y: number; score?: number }>;
}

export type PostureAnalysisListener = (state: PostureAnalysisState) => void;


const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

const mirrorKeypoints = (kps: poseDetection.Keypoint[], w: number): poseDetection.Keypoint[] =>
  kps.map(kp => ({ ...kp, x: w - kp.x }));

const normalizePoints = (kps: poseDetection.Keypoint[]) => {
  const ls = kps[KEYPOINT_INDICES.LEFT_SHOULDER];
  const rs = kps[KEYPOINT_INDICES.RIGHT_SHOULDER];
  if (!ls || !rs || (ls.score ?? 0) < POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD ||
      (rs.score ?? 0) < POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD) return null;
  const sw = calculateDistance(ls.x, ls.y, rs.x, rs.y);
  if (sw < 10) return null;
  return kps.map(kp => ({ ...kp, x: kp.x / sw, y: kp.y / sw }));
};

// ─── Встроенный Web Worker для таймера 

function createTimerWorker(): Worker | null {
  try {
    const blob = new Blob([`
      var interval = 3000;
      self.onmessage = function(e) {
        if (e.data.type === 'start') {
          interval = e.data.interval || 3000;
          setInterval(function() { self.postMessage('tick'); }, interval);
        } else if (e.data.type === 'stop') {
          self.close();
        }
      };
    `], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const w = new Worker(url);
    URL.revokeObjectURL(url);
    return w;
  } catch { return null; }
}

class PostureAnalysisService {
  private static instance: PostureAnalysisService | null = null;

  // Камера
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private hiddenContainer: HTMLDivElement | null = null;

  // TensorFlow
  private detector: poseDetection.PoseDetector | null = null;
  private modelBusy = false;

  // Таймеры
  private activeTimerId: ReturnType<typeof setInterval> | null = null;
  private workerTimer: Worker | null = null;

  // Canvas для fallback
  private captureCanvas: HTMLCanvasElement | null = null;
  private captureCtx: CanvasRenderingContext2D | null = null;

  // Калибровка
  private referenceNormalized: poseDetection.Keypoint[] | null = null;

  // Уведомления
  private lastNotifyTime = 0;
  private lastAlertKey = '';

  // Состояние
  private state: PostureAnalysisState = {
    isRunning: false, isModelLoading: false, isModelReady: false,
    isCalibrated: false, isCalibrating: false, isSessionActive: false,
    currentStatus: 'Ожидание анализа...', issues: [],
    trackingQuality: 0, postureScore: 0, totalFrames: 0,
    goodPostureFrames: 0, warningFrames: 0, error: null,
    postureHistory: [], sessionDuration: 0,
    normalizedKeypoints: undefined,
  };

  private listeners: Set<PostureAnalysisListener> = new Set();
  private cameraInitPromise: Promise<boolean> | null = null;

  private constructor() {}

  static getInstance(): PostureAnalysisService {
    if (!PostureAnalysisService.instance)
      PostureAnalysisService.instance = new PostureAnalysisService();
    return PostureAnalysisService.instance;
  }

  static destroyInstance(): void {
    if (PostureAnalysisService.instance) {
      PostureAnalysisService.instance.dispose();
      PostureAnalysisService.instance = null;
    }
  }

  // ─── Публичные методы ──────────────────────────────────────────────────

  getState(): Readonly<PostureAnalysisState> { return { ...this.state }; }
  getVideoElement(): HTMLVideoElement | null { return this.videoElement; }

  addListener(fn: PostureAnalysisListener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => { this.listeners.delete(fn); };
  }

  private emit(p: Partial<PostureAnalysisState>): void {
    Object.assign(this.state, p);
    const snap = { ...this.state };
    this.listeners.forEach(fn => fn(snap));
  }

  // ─── Загрузка модели ────────────────────────────────────────────────────

  /**
   * Загрузка модели TensorFlow.js с поддержкой:
   * - Множественных бэкендов (webgl → cpu → wasm)
   * - Retry при сетевых ошибках
   * - Альтернативных зеркал для загрузки модели
   */
  async loadModel(): Promise<boolean> {
    if (this.detector && this.state.isModelReady) return true;
    if (this.modelBusy) return false;
    this.modelBusy = true;
    this.emit({ isModelLoading: true, error: null });

    // Проверка сети: tfhub.dev должен резолвиться
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch('https://tfhub.dev', { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      console.log('[PAS] tfhub.dev reachable');
    } catch (e) {
      console.warn('[PAS] tfhub.dev check failed:', e);
      // В Electron продолжаем — модель может загрузиться через настроенную сессию
    }

    // Пытаемся инициализировать TF.js с разными бэкендами
    const backends = [
      { name: 'webgl', priority: 0 },
      { name: 'cpu', priority: 1 },
    ];

    let activeBackend: string | null = null;

    for (const { name } of backends) {
      try {
        await tf.setBackend(name);
        await tf.ready();
        if (tf.getBackend() === name) {
          activeBackend = name;
          console.log(`[PAS] TF backend: ${name}`);
          break;
        }
      } catch (err) {
        console.warn(`[PAS] Backend ${name} not available:`, err);
      }
    }

    if (!activeBackend) {
      console.error('[PAS] No TF backend available');
      this.emit({ isModelLoading: false, error: 'Ошибка инициализации TensorFlow.js' });
      this.modelBusy = false;
      return false;
    }

    // Загрузка модели с retry
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[PAS] Loading MoveNet model (attempt ${attempt}/${MAX_RETRIES})...`);
        this.emit({ isModelLoading: true, error: null });

        this.detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: true,
            minPoseScore: 0.3,
          }
        );

        this.emit({ isModelReady: true, isModelLoading: false });
        console.log('[PAS] Model loaded successfully');
        return true;
      } catch (err) {
        console.error(`[PAS] Model error (attempt ${attempt}):`, err);

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt));
        }
      }
    }

    // Если всё провалилось — финальная ошибка
    console.error('[PAS] All model loading attempts failed');
    this.emit({ isModelLoading: false, error: 'Ошибка загрузки модели AI. Проверьте подключение к интернету.' });

    // Делаем последнюю попытку — очищаем прошлые ошибки в кэше TF
    try {
      tf.disposeVariables();
    } catch {}

    this.modelBusy = false;
    return false;
  }

  // ─── Камера ──────────────────────────────────────────────────────────────

  private ensureContainer(): HTMLDivElement {
    if (!this.hiddenContainer) {
      const d = document.createElement('div');
      d.id = 'pas-hidden-video';
      d.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(d);
      this.hiddenContainer = d;
    }
    return this.hiddenContainer;
  }

  private ensureCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (!this.captureCanvas) {
      const c = document.createElement('canvas');
      c.width = VIDEO_WIDTH;
      c.height = VIDEO_HEIGHT;
      this.captureCanvas = c;
      this.captureCtx = c.getContext('2d');
    }
    return { canvas: this.captureCanvas, ctx: this.captureCtx! };
  }

  async initCamera(): Promise<boolean> {
    if (this.mediaStream && this.videoElement) return true;
    if (this.cameraInitPromise) return this.cameraInitPromise;

    this.cameraInitPromise = (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT, facingMode: 'user' },
          audio: false,
        });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.width = VIDEO_WIDTH;
        video.height = VIDEO_HEIGHT;
        video.playsInline = true;
        video.muted = true;
        video.setAttribute('playsinline', '');
        this.ensureContainer().appendChild(video);
        await video.play();
        this.mediaStream = stream;
        this.videoElement = video;
        stream.getVideoTracks()[0]?.addEventListener('ended', () => this.handleCameraLost());
        return true;
      } catch (err) {
        console.error('[PAS] Camera error:', err);
        this.emit({ error: 'Не удалось получить доступ к веб-камере' });
        return false;
      }
    })();
    const r = await this.cameraInitPromise;
    this.cameraInitPromise = null;
    return r;
  }

  private handleCameraLost(): void {
    this.cleanupCamera();
    this.emit({ isRunning: false, error: 'Веб-камера отключена' });
  }

  private cleanupCamera(): void {
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.mediaStream = null;
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement.parentNode?.removeChild(this.videoElement);
      this.videoElement = null;
    }
    this.hiddenContainer?.parentNode?.removeChild(this.hiddenContainer);
    this.hiddenContainer = null;
    this.captureCanvas = null;
    this.captureCtx = null;
    this.cameraInitPromise = null;
  }

  // ─── Захват кадра (ключевой метод для фоновой работы) 

  private async grabFrame(): Promise<HTMLVideoElement | HTMLCanvasElement | ImageBitmap | null> {
    // Приоритет 1: ImageCapture (работает в фоне!)
    if (this.mediaStream && typeof ImageCapture !== 'undefined') {
      try {
        const track = this.mediaStream.getVideoTracks()[0];
        if (track && track.readyState === 'live') {
          const capt = new ImageCapture(track);
          const bitmap = await capt.grabFrame();
          if (bitmap) return bitmap;
        }
      } catch (e) {
        // ImageCapture может быть недоступен в некоторых режимах
        console.warn('[PAS] ImageCapture fail, fallback to video:', e);
      }
    }

    // Приоритет 2: <video> (быстро, но не работает в фоне)
    if (this.videoElement && this.videoElement.readyState >= 2) {
      return this.videoElement;
    }

    // Приоритет 3: Canvas fallback (если видео есть, но не готово)
    if (this.videoElement && this.mediaStream) {
      try {
        const { canvas, ctx } = this.ensureCanvas();
        ctx.drawImage(this.videoElement, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        return canvas;
      } catch {}
    }

    return null;
  }

  // ─── Калибровка 

  async calibrate(): Promise<boolean> {
    if (!this.detector || !this.state.isModelReady) {
      const ok = await this.loadModel();
      if (!ok) { this.emit({ error: 'Модель не загружена' }); return false; }
    }
    if (!this.mediaStream) {
      const ok = await this.initCamera();
      if (!ok) return false;
    }
    this.emit({ isCalibrating: true, error: null });
    try {
      await new Promise(r => setTimeout(r, 300));
      const frame = await this.grabFrame();
      if (!frame) { this.emit({ isCalibrating: false, error: 'Нет кадра с камеры' }); return false; }

      const poses = await this.detector!.estimatePoses(frame, { maxPoses: 1, flipHorizontal: false });
      if (!poses.length) { this.emit({ isCalibrating: false, error: 'Поза не обнаружена' }); return false; }

      const kp = poses[0].keypoints;
      const hasRequired = (kp[KEYPOINT_INDICES.LEFT_SHOULDER]?.score ?? 0) > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD &&
        (kp[KEYPOINT_INDICES.RIGHT_SHOULDER]?.score ?? 0) > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD &&
        (kp[KEYPOINT_INDICES.NOSE]?.score ?? 0) > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD;
      if (!hasRequired) { this.emit({ isCalibrating: false, error: 'Не распознаны плечи и голова' }); return false; }

      const mirrored = mirrorKeypoints(kp, VIDEO_WIDTH);
      const normalized = normalizePoints(mirrored);
      if (!normalized) { this.emit({ isCalibrating: false, error: 'Не удалось нормализовать позу' }); return false; }

      this.referenceNormalized = normalized;
      this.lastAlertKey = '';
      this.lastNotifyTime = 0;
      this.emit({ isCalibrated: true, isCalibrating: false, currentStatus: 'Калибровано', postureHistory: [], error: null });
      return true;
    } catch (err) {
      console.error('[PAS] Calibration error:', err);
      this.emit({ isCalibrating: false, error: 'Ошибка калибровки' });
      return false;
    }
  }

  resetCalibration(): void {
    this.referenceNormalized = null;
    this.lastAlertKey = '';
    this.lastNotifyTime = 0;
    this.emit({ isCalibrated: false, currentStatus: 'Ожидание анализа...', postureHistory: [], issues: [] });
  }

  // ─── Запуск / Остановка 

  async start(forceRestart?: boolean): Promise<boolean> {
    if (this.state.isRunning) {
      if (forceRestart) {
        this.stop();
      } else {
        return true;
      }
    }
    const modelOk = await this.loadModel();
    if (!modelOk) return false;
    const camOk = await this.initCamera();
    if (!camOk) return false;
    if (!this.referenceNormalized) { this.emit({ error: 'Сначала выполните калибровку' }); return false; }

    this.lastAlertKey = '';
    this.lastNotifyTime = 0;
    this.emit({
      isRunning: true, isSessionActive: true,
      totalFrames: 0, goodPostureFrames: 0, warningFrames: 0,
      postureScore: 0, currentStatus: 'Анализ начат', sessionDuration: 0, error: null,
    });

    this.startActiveTimer();
    this.startWorkerTimer();
    this.startDurationTimer();
    this.requestNotifyPermission();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    return true;
  }

  stop(): void {
    this.stopAllTimers();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.emit({ isRunning: false, isSessionActive: false, currentStatus: 'Анализ остановлен' });
  }

  dispose(): void {
    this.stop();
    this.cleanupCamera();
    if (this.detector) { try { this.detector.dispose(); } catch {} this.detector = null; }
    this.referenceNormalized = null;
    this.listeners.clear();
    this.emit({ isModelReady: false, isCalibrated: false, isRunning: false, isSessionActive: false });
  }

  resetSessionStats(): void {
    this.emit({ totalFrames: 0, goodPostureFrames: 0, warningFrames: 0, postureScore: 0, sessionDuration: 0, postureHistory: [] });
  }

  // ─── Таймеры 

  /** Активный таймер (setInterval, для видимой вкладки) */
  private startActiveTimer(): void {
    this.stopActiveTimer();
    this.activeTimerId = setInterval(() => this.runDetection(), DETECTION_INTERVAL_ACTIVE);
  }
  private stopActiveTimer(): void {
    if (this.activeTimerId !== null) { clearInterval(this.activeTimerId); this.activeTimerId = null; }
  }

  /** Web Worker таймер (работает в фоновых вкладках без throttle) */
  private startWorkerTimer(): void {
    this.stopWorkerTimer();
    const worker = createTimerWorker();
    if (!worker) return;
    this.workerTimer = worker;
    worker.onmessage = () => {
      // worker тикает всегда, но мы используем его только в фоновом режиме
      // В активном режиме приоритет у setInterval
      if (this.isBackgroundMode()) this.runDetection();
    };
    worker.postMessage({ type: 'start', interval: DETECTION_INTERVAL_BACKGROUND });
  }
  private stopWorkerTimer(): void {
    if (this.workerTimer) { try { this.workerTimer.postMessage({ type: 'stop' }); } catch {} this.workerTimer = null; }
  }

  private stopAllTimers(): void {
    this.stopActiveTimer();
    this.stopWorkerTimer();
    if (this.durationTimerId !== null) { clearInterval(this.durationTimerId); this.durationTimerId = null; }
  }

  private isBackgroundMode(): boolean {
    return document.hidden || document.visibilityState === 'hidden';
  }


  private onVisibilityChange = (): void => {
    if (!this.state.isRunning) return;
    if (!this.isBackgroundMode()) {
      // Стали видимы — переключаемся на активный таймер + catch-up
      this.startActiveTimer();
      this.runDetection(); // catch-up
    }
    // Worker timer работает всегда, ничего менять не нужно
  };


  private durationTimerId: ReturnType<typeof setInterval> | null = null;
  private startDurationTimer(): void {
    this.stopDurationTimer();
    this.durationTimerId = setInterval(() => {
      if (this.state.isRunning) this.emit({ sessionDuration: this.state.sessionDuration + 1 });
    }, 1000);
  }
  private stopDurationTimer(): void {
    if (this.durationTimerId !== null) { clearInterval(this.durationTimerId); this.durationTimerId = null; }
  }

  // ─── Детекция 

  private async runDetection(): Promise<void> {
    if (!this.detector || !this.referenceNormalized) return;

    const frame = await this.grabFrame();
    if (!frame) return;

    try {
      const poses = await this.detector.estimatePoses(frame, { maxPoses: 1, flipHorizontal: false });
      if (!poses.length) return;

      const kp = poses[0].keypoints;

      // Проверяем плечи (минимальное требование)
      const hasShoulders =
        (kp[KEYPOINT_INDICES.LEFT_SHOULDER]?.score ?? 0) > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD &&
        (kp[KEYPOINT_INDICES.RIGHT_SHOULDER]?.score ?? 0) > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD;
      if (!hasShoulders) return;

      // Качество отслеживания
      const validCount = kp.filter((p, i) => UPPER_BODY_INDICES.includes(i) && (p.score ?? 0) > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD).length;
      const quality = Math.round((validCount / UPPER_BODY_INDICES.length) * 100);
      this.emit({ trackingQuality: quality });

      const mirrored = mirrorKeypoints(kp, VIDEO_WIDTH);
      const normalized = normalizePoints(mirrored);
      if (!normalized) return;

      this.analyzePosture(normalized);
    } catch (err) {
      console.warn('[PAS] Detection error:', err);
    }
  }

  private analyzePosture(current: poseDetection.Keypoint[]): void {
    if (!this.referenceNormalized) return;

    const issues: PostureIssue[] = [];
    const types = new Set<string>();

    for (const idx of POSTURE_ANALYSIS_INDICES) {
      const cp = current[idx];
      const rp = this.referenceNormalized[idx];
      if ((cp?.score ?? 0) > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD &&
          (rp?.score ?? 0) > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD) {
        const dev = calculateDistance(cp.x, cp.y, rp.x, rp.y);
        if (dev > POSTURE_THRESHOLDS.DEVIATION_THRESHOLD) {
          if ((idx === KEYPOINT_INDICES.LEFT_SHOULDER || idx === KEYPOINT_INDICES.RIGHT_SHOULDER) && !types.has('shoulders')) {
            types.add('shoulders'); issues.push({ type: 'shoulders', message: 'Плечи опущены! Выпрямитесь!' });
          } else if ((idx === KEYPOINT_INDICES.NOSE || idx === KEYPOINT_INDICES.LEFT_EAR || idx === KEYPOINT_INDICES.RIGHT_EAR) && !types.has('head')) {
            types.add('head'); issues.push({ type: 'head', message: 'Голова наклонена! Поднимите голову!' });
          }
        }
      }
    }

    const status = issues.length > 0
      ? `Нарушена: ${issues.map(i => i.type === 'shoulders' ? 'Плечи' : 'Голова').join(', ')}`
      : 'Хорошая осанка';

    const history = [...this.state.postureHistory];
    if (history[history.length - 1] !== status) { history.push(status); if (history.length > HISTORY_SIZE) history.shift(); }

    const total = this.state.totalFrames + 1;
    const good = this.state.goodPostureFrames + (issues.length === 0 ? 1 : 0);
    const warn = this.state.warningFrames + (issues.length > 0 ? 1 : 0);
    const score = Math.round((good / total) * 100);

    this.emit({
      currentStatus: status, issues,
      totalFrames: total, goodPostureFrames: good,
      warningFrames: warn, postureScore: score,
      postureHistory: history,
      normalizedKeypoints: current.map(kp => ({ x: kp.x, y: kp.y, score: kp.score })),
    });

    // Уведомления
    if (issues.length > 0 && this.state.isSessionActive) {
      const key = issues.map(i => i.type).join(',');
      if (key !== this.lastAlertKey) { this.lastAlertKey = key; this.sendNotification(issues); }
    } else { this.lastAlertKey = ''; }
  }

  // ─── Уведомления 

  private requestNotifyPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }

  private sendNotification(issues: PostureIssue[]): void {
    const now = Date.now();
    if (now - this.lastNotifyTime < NOTIFICATION_COOLDOWN) return;
    this.lastNotifyTime = now;

    const title = 'Posture Analyzer — Нарушение осанки';
    const body = issues[0].message;

    // В Electron — используем IPC для нативного уведомления (работает всегда)
    if (window.electronAPI) {
      try {
        window.electronAPI.showNotification(title, body);
        return;
      } catch {}
    }

    // В браузере — используем Notification API (работает только когда вкладка видна)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(title, {
          body,
          tag: NOTIFICATION_TAG,
          icon: '/vite.svg',
          requireInteraction: true,
        });
        n.onclick = () => { window.focus(); n.close(); };
      } catch {}
    }
  }

  // ─── Метрики сессии ────────────────────────────────────────────────────

  getSessionMetrics() {
    const s = this.state;
    return {
      totalFrames: s.totalFrames, goodPostureFrames: s.goodPostureFrames,
      warningFrames: s.warningFrames, errorFrames: 0,
      errorsByZone: {
        shoulders: { count: s.issues.filter(i => i.type === 'shoulders').length },
        head: { count: s.issues.filter(i => i.type === 'head').length },
        hips: { count: 0 },
      },
      postureScore: s.postureScore,
    };
  }
}

export const postureAnalysisService = PostureAnalysisService.getInstance();
export default postureAnalysisService;
