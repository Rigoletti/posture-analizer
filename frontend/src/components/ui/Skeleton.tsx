import React from 'react';
import '../../assets/styles/ui/Skeleton.css';

interface SkeletonProps {
  type?: 'card' | 'text' | 'circle' | 'image' | 'button';
  width?: string;
  height?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  type = 'text',
  width,
  height,
  className = ''
}) => {
  const style: React.CSSProperties = {
    width,
    height,
  };

  return (
    <div 
      className={`skeleton ${type} ${className}`}
      style={style}
    >
      <div className="skeleton-shimmer"></div>
    </div>
  );
};

export const ExerciseCardSkeleton: React.FC = () => {
  return (
    <div className="exercise-card-skeleton">
      <div className="card-skeleton-glow"></div>
      
      <div className="card-header-skeleton">
        <Skeleton type="circle" width="40px" height="40px" />
        <div className="skeleton-meta">
          <Skeleton type="text" width="60px" height="20px" />
          <Skeleton type="text" width="40px" height="20px" />
        </div>
      </div>
      
      <div className="skeleton-number">
        <Skeleton type="circle" width="50px" height="50px" />
      </div>
      
      <Skeleton type="text" width="80%" height="28px" className="skeleton-title" />
      <Skeleton type="text" width="100%" height="60px" className="skeleton-description" />
      
      <div className="skeleton-duration">
        <Skeleton type="text" width="100px" height="20px" />
      </div>
      
      <div className="skeleton-benefits">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} type="text" width="100%" height="20px" />
        ))}
      </div>
      
      <Skeleton type="button" width="100%" height="45px" />
    </div>
  );
};

export const ExerciseDetailSkeleton: React.FC = () => {
  return (
    <div className="exercise-detail-skeleton">
      <div className="detail-header-skeleton">
        <Skeleton type="text" width="200px" height="40px" />
        <Skeleton type="text" width="100%" height="60px" className="skeleton-title" />
        
        <div className="skeleton-meta-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-meta-item">
              <Skeleton type="circle" width="40px" height="40px" />
              <div>
                <Skeleton type="text" width="80px" height="20px" />
                <Skeleton type="text" width="60px" height="16px" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-content-skeleton">
        <div className="skeleton-visualization">
          <Skeleton type="image" width="100%" height="400px" />
        </div>

        <div className="skeleton-controls">
          <Skeleton type="text" width="100%" height="40px" />
          <div className="skeleton-buttons">
            <Skeleton type="button" width="120px" height="45px" />
            <Skeleton type="button" width="120px" height="45px" />
          </div>
        </div>

        <div className="skeleton-instructions">
          <Skeleton type="text" width="100%" height="200px" />
        </div>
      </div>
    </div>
  );
};