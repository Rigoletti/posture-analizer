import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import RegisterForm from '../../components/auth/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Создать аккаунт"
      subtitle="Заполните форму для регистрации в системе мониторинга осанки"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;