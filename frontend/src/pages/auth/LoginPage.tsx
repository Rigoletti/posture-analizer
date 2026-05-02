import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Добро пожаловать"
      subtitle="Введите ваши учетные данные для доступа к системе мониторинга осанки"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;