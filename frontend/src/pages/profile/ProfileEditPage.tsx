import React from 'react';
import ProfileLayout from '../../components/profile/ProfileLayout';
import ProfileEditForm from '../../components/profile/ProfileEditForm';

const ProfileEditPage: React.FC = () => {
  return (
    <ProfileLayout 
      title="Редактирование профиля"
      subtitle="Измените ваши личные данные и настройки"
    >
      <ProfileEditForm />
    </ProfileLayout>
  );
};

export default ProfileEditPage;