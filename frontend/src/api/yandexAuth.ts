const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

export const yandexAuthApi = {
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

  redirectToYandex: async (): Promise<void> => {
    try {
      const authUrl = await yandexAuthApi.getYandexAuthUrl();
      console.log('Redirecting to Yandex:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error redirecting to Yandex:', error);
      throw error;
    }
  },

  getYandexAuthStatus: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/yandex/status`, {
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

  handleYandexCallback: (): { user: any } | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const userData = urlParams.get('user');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('Yandex callback error:', decodeURIComponent(error));
      throw new Error(decodeURIComponent(error));
    }
    
    if (userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        console.log('Yandex callback success, user:', user.email);
        return { user };
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    
    return null;
  }
};