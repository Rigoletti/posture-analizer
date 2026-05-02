export const authApi = {
  register: async (data: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Ошибка при регистрации');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error registering:', error);
      throw error;
    }
  },

  verifyEmailCode: async (data: { email: string, code: string }) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const error = new Error(responseData.error || 'Ошибка при подтверждении email');
        if (responseData.attemptsLeft !== undefined) {
          (error as any).attemptsLeft = responseData.attemptsLeft;
        }
        throw error;
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error verifying email code:', error);
      throw error;
    }
  },

  resendVerificationCode: async (email: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Ошибка при отправке кода');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error resending verification code:', error);
      throw error;
    }
  },

  login: async (data: any) => {
    try {
      console.log('Attempting login with:', { email: data.email });
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      console.log('Login response status:', response.status);
      console.log('Login response headers:', [...response.headers.entries()]);
      
      const responseData = await response.json();
      console.log('Login response data:', responseData);
      
      if (!response.ok) {
        if (responseData.requiresVerification) {
          const error = new Error(responseData.error);
          (error as any).requiresVerification = true;
          (error as any).email = responseData.email;
          throw error;
        }
        throw new Error(responseData.error || 'Ошибка при авторизации');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.status === 401) {
        console.log('User not authenticated (expected for non-logged users)');
        return { success: false, user: null };
      }
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Ошибка при загрузке профиля');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  updateProfile: async (data: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется авторизация');
        }
        throw new Error(responseData.error || 'Ошибка при обновлении профиля');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  updatePassword: async (data: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется авторизация');
        }
        throw new Error(responseData.error || 'Ошибка при обновлении пароля');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error updating password:', error);
      throw error;
    }
  },

  // Загрузка аватара
  uploadAvatar: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('http://localhost:5000/api/auth/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Ошибка при загрузке аватара');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  // Удаление аватара
  deleteAvatar: async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/avatar', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Ошибка при удалении аватара');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Logout warning:', errorData);
      }
      
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }
};