import React, { useEffect, useState } from 'react';
import '../../assets/styles/ui/Alert.css';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export const Alert: React.FC<AlertProps> = ({ 
  type, 
  message, 
  onClose, 
  autoClose = false,
  autoCloseDuration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoCloseDuration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, isVisible, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: '#10b981',
      border: '#059669',
      icon: '✅'
    },
    error: {
      bg: '#ef4444',
      border: '#dc2626',
      icon: '❌'
    },
    warning: {
      bg: '#f59e0b',
      border: '#d97706',
      icon: '⚠️'
    },
    info: {
      bg: '#3b82f6',
      border: '#2563eb',
      icon: 'ℹ️'
    }
  };

  const style = typeStyles[type];

  return (
    <div 
      className="alert-container"
      style={{ 
        backgroundColor: style.bg,
        borderLeft: `4px solid ${style.border}`
      }}
    >
      <div className="alert-content">
        <span className="alert-icon">{style.icon}</span>
        <span className="alert-message">{message}</span>
      </div>
      {onClose && (
        <button 
          className="alert-close"
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};