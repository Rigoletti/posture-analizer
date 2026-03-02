import React, { useEffect, useState } from 'react';
import '../../assets/styles/system/TrayManager.css';

interface TrayManagerProps {
  children: React.ReactNode;
}

export const TrayManager: React.FC<TrayManagerProps> = ({ children }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastAlert, setLastAlert] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const demoInterval = setInterval(() => {
      if (isMonitoring) {
        const alertTypes = ["плечами", "головой", "спиной", "шеей"];
        const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        
        const alertMessage = `Обнаружена проблема с ${randomType}. Качество осанки: ${(70 + Math.random() * 20).toFixed(0)}%`;
        
        setLastAlert(alertMessage);
        setShowAlert(true);
        
        // Показываем браузерное уведомление
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Posture Analyzer - Нарушение осанки', {
            body: alertMessage,
            icon: '/favicon.ico'
          });
        }
      }
    }, 30000);

    return () => {
      clearInterval(demoInterval);
    };
  }, [isMonitoring]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    console.log('Monitoring started');
    
    // Демо-уведомление через 5 секунд
    setTimeout(() => {
      const alertMessage = "Обнаружена проблема с плечами. Качество осанки: 65%";
      setLastAlert(alertMessage);
      setShowAlert(true);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Posture Analyzer - Нарушение осанки', {
          body: alertMessage,
          icon: '/favicon.ico'
        });
      }
    }, 5000);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    console.log('Monitoring stopped');
  };

  const closeAlert = () => {
    setShowAlert(false);
    setTimeout(() => setLastAlert(null), 300);
  };

  return (
    <div className="tray-manager">
      {/* Баннер статуса мониторинга */}
      <div className={`monitoring-banner ${isMonitoring ? 'active' : 'inactive'}`}>
        <div className="banner-content">
          <div className="status-indicator">
            <div className={`status-dot ${isMonitoring ? 'monitoring' : 'idle'}`}></div>
            <span>
              {isMonitoring ? '🔴 Мониторинг осанки активен' : '⚪ Мониторинг осанки остановлен'}
            </span>
          </div>
          <div className="banner-actions">
            {isMonitoring ? (
              <button onClick={stopMonitoring} className="stop-btn">
                ⏹️ Остановить мониторинг
              </button>
            ) : (
              <button onClick={startMonitoring} className="start-btn">
                ▶️ Запустить мониторинг
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Всплывающее уведомление */}
      {showAlert && lastAlert && (
        <div className="alert-notification show">
          <div className="alert-content">
            <div className="alert-icon">⚠️</div>
            <div className="alert-text">
              <div className="alert-title">Нарушение осанки обнаружено!</div>
              <div className="alert-message">{lastAlert}</div>
            </div>
            <button 
              onClick={closeAlert}
              className="alert-close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {children}

      {/* Простая панель информации */}
      <div className="background-controls">
        <div className="control-card">
          <h3>🏃 Фоновый режим активен</h3>
          <p>Приложение работает в системном трее. Закройте окно - приложение продолжит работать в фоне.</p>
          <div className="control-tips">
            <div className="tip">• <strong>ЛКМ по иконке в трее</strong> - показать/скрыть окно</div>
            <div className="tip">• <strong>ПКМ по иконке в трее</strong> - открыть меню управления</div>
            <div className="tip">• <strong>Для выхода</strong> - используйте "Выход" в меню трея</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrayManager;