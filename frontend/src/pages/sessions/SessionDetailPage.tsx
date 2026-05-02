import React from 'react';
import { useParams } from 'react-router-dom';
import SessionDetail from './SessionDetail';
// УБРАЛИ импорт SnapshotGallery

const SessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  if (!sessionId) {
    return <div>Сеанс не найден</div>;
  }
  
  return <SessionDetail />;
};

export default SessionDetailPage;