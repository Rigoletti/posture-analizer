import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // При ошибке 401 перенаправляем на страницу логина
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;