const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

export const yandexAuthApi = {
  // Получение URL для авторизации через Яндекс
  getYandexAuthUrl: async (): Promise<string> => {
    try {
      const response = await fetch(`${API_URL}/auth/yandex`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при получении URL авторизации');
      }
      
      return data.authUrl;
    } catch (error: any) {
      console.error('Error getting Yandex auth URL:', error);
      throw error;
    }
  },

  // Перенаправление на Яндекс для авторизации
  redirectToYandex: async (): Promise<void> => {
    try {
      const authUrl = await yandexAuthApi.getYandexAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error redirecting to Yandex:', error);
      throw error;
    }
  },

  // Проверка статуса Яндекс авторизации
  getYandexAuthStatus: async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/yandex/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Ошибка при проверке статуса Яндекса');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error checking Yandex status:', error);
      throw error;
    }
  },

  // Отключение Яндекс аккаунта
  disconnectYandex: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/auth/yandex/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отключении Яндекса');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error disconnecting Yandex:', error);
      throw error;
    }
  },

  // Обработка данных после редиректа с Яндекса
  handleYandexCallback: (): { user: any; token: string } | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const userData = urlParams.get('user');
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (error) {
      throw new Error(decodeURIComponent(error));
    }
    
    if (userData && token) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        return { user, token };
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    
    return null;
  }
};