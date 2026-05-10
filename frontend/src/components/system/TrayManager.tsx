import React, { useEffect, useState } from 'react';
import { usePostureAnalysis, usePostureControl } from '../../contexts/PostureAnalysisContext';
import '../../assets/styles/system/TrayManager.css';

interface TrayManagerProps {
  children: React.ReactNode;
}

export const TrayManager: React.FC<TrayManagerProps> = ({ children }) => {
  const state = usePostureAnalysis();
  const control = usePostureControl();

  const [showAlert, setShowAlert] = useState(false);
  const [lastAlert, setLastAlert] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(
    localStorage.getItem('posture_analyzer_sound_enabled') !== 'false',
  );

  // Запрос разрешения на уведомления при монтировании
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Отслеживание нарушений для показа alert'ов
  useEffect(() => {
    if (!state.isRunning || state.issues.length === 0) return;

    const messages = state.issues.map(i => i.message).join('; ');
    setLastAlert(messages);
    setShowAlert(true);
  }, [state.issues, state.isRunning]);

  const handleStopMonitoring = () => {
    control.stop();
    setShowAlert(false);
  };

  const handleStartMonitoring = async () => {
    if (!state.isCalibrated) {
      const ok = await control.calibrate();
      if (!ok) return;
    }
    await control.start();
  };

  const closeAlert = () => {
    setShowAlert(false);
    setTimeout(() => setLastAlert(null), 300);
  };

  const toggleSound = () => {
    const newVal = !isSoundEnabled;
    setIsSoundEnabled(newVal);
    localStorage.setItem('posture_analyzer_sound_enabled', String(newVal));
  };

  return (
    <div className="tray-manager">
      {/* Баннер статуса мониторинга */}
      <div className={`monitoring-banner ${state.isRunning ? 'active' : 'inactive'}`}>
        <div className="banner-content">
          <div className="status-indicator">
            <div className={`status-dot ${state.isRunning ? 'monitoring' : 'idle'}`}></div>
            <span>
              {state.isRunning
                ? '🔴 Мониторинг осанки активен'
                : '⚪ Мониторинг осанки остановлен'}
            </span>
          </div>
          <div className="banner-actions">
            {state.issues.length > 0 && (
              <span className="issue-badge" title="Текущие нарушения">
                ⚠️ {state.issues.length}
              </span>
            )}
            {state.isRunning ? (
              <button onClick={handleStopMonitoring} className="stop-btn">
                ⏹️ Остановить
              </button>
            ) : (
              <button
                onClick={handleStartMonitoring}
                disabled={state.isModelLoading}
                className="start-btn"
              >
                ▶️ {state.isCalibrated ? 'Запустить' : 'Калибровать'}
              </button>
            )}
          </div>
        </div>

        {/* Дополнительная строка с параметрами */}
        {state.isRunning && (
          <div className="banner-details">
            <span>Качество: {state.trackingQuality}%</span>
            <span>Оценка: {state.postureScore}%</span>
            <span>Кадров: {state.totalFrames}</span>
            <button
              onClick={toggleSound}
              className="sound-toggle-btn"
              title={isSoundEnabled ? 'Отключить звук' : 'Включить звук'}
            >
              {isSoundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        )}
      </div>

      {/* Всплывающее уведомление о нарушении */}
      {showAlert && lastAlert && (
        <div className="alert-notification show">
          <div className="alert-content">
            <div className="alert-icon">⚠️</div>
            <div className="alert-text">
              <div className="alert-title">Нарушение осанки обнаружено!</div>
              <div className="alert-message">{lastAlert}</div>
            </div>
            <button onClick={closeAlert} className="alert-close">
              ×
            </button>
          </div>
        </div>
      )}

      {children}

      {/* Панель информации о фоновом режиме */}
      <div className="background-controls">
        <div className="control-card">
          <h3>🏃 Фоновый режим активен</h3>
          <p>
            Анализ осанки продолжается даже когда вы переключаете вкладки или
            сворачиваете браузер. При нарушениях вы получите системные уведомления.
          </p>
          <div className="control-tips">
            <div className="tip">
              • <strong>На другой вкладке</strong> — приходят системные уведомления
            </div>
            <div className="tip">
              • <strong>В свернутом браузере</strong> — приходят системные уведомления + звуковой сигнал
            </div>
            <div className="tip">
              • <strong>Веб-камера</strong> — остаётся активной всё время анализа
            </div>
          </div>
          {state.isRunning && (
            <div className="tray-status">
              <div className="status-item">
                <span className="status-label">Статус:</span>
                <span className={`status-value ${state.isRunning ? 'active' : 'inactive'}`}>
                  {state.isRunning ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Вкладка:</span>
                <span className={`status-value ${document.hidden ? 'hidden' : 'visible'}`}>
                  {document.hidden ? 'Скрыта' : 'Видна'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Осанка:</span>
                <span className={`status-value ${state.issues.length === 0 ? 'active' : 'inactive'}`}>
                  {state.issues.length === 0 ? 'Норма' : 'Нарушение'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrayManager;
