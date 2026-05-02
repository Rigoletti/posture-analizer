import React from 'react';
import '../../assets/styles/ui/LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = '#3b82f6',
  fullScreen = false 
}) => {
  const sizeMap = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  const spinner = (
    <div className="loading-spinner-container">
      <div 
        className={`loading-spinner ${sizeMap[size]}`}
        style={{ borderTopColor: color }}
      ></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        {spinner}
      </div>
    );
  }

  return spinner;
};