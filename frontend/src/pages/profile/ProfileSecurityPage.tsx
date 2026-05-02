 import React from 'react';
import ProfileLayout from '../../components/profile/ProfileLayout';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';

const ProfileSecurityPage: React.FC = () => {
  return (
    <ProfileLayout 
      title="Безопасность"
      subtitle="Управление паролем и настройками безопасности"
    >
      <ChangePasswordForm />
    </ProfileLayout>
  );
};

export default ProfileSecurityPage;