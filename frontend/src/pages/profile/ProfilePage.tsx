import React from 'react';
import ProfileLayout from '../../components/profile/ProfileLayout';
import ProfileView from '../../components/profile/ProfileView';

const ProfilePage: React.FC = () => {
  return (
    <ProfileLayout 
      title="Мой профиль"
      subtitle="Просмотр и управление вашими данными"
    >
      <ProfileView />
    </ProfileLayout>
  );
};

export default ProfilePage;