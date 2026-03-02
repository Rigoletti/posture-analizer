export const adminApi = {
  getExercises: async (params?: any) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/exercises${params ? '?' + new URLSearchParams(params).toString() : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Куки отправляются автоматически
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching exercises:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        
        throw new Error(errorData.error || 'Ошибка при загрузке упражнений');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }
  },

  getExerciseById: async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/exercises/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching exercise:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        
        throw new Error(errorData.error || 'Ошибка при загрузке упражнения');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching exercise:', error);
      throw error;
    }
  },

  createExercise: async (data: any) => {
    try {
      console.log('Creating exercise with data:', data);
      
      const response = await fetch('http://localhost:5000/api/admin/exercises', {
        method: 'POST',
        credentials: 'include',
        body: data
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        let errorMessage = 'Ошибка при создании упражнения';
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ': ' + errorData.details.join(', ');
          }
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating exercise:', error);
      throw error;
    }
  },

  updateExercise: async (id: string, data: any) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/exercises/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: data
      });
      
      if (!response.ok) {
        let errorMessage = 'Ошибка при обновлении упражнения';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ': ' + errorData.details.join(', ');
          }
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  },

  deleteExercise: async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/exercises/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error('Ошибка при удалении упражнения');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  },

// Методы для рекомендаций
getRecommendations: async (params?: any) => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
    }
    
    const url = `http://localhost:5000/api/admin/recommendations${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Fetching recommendations from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching recommendations:', errorData);
      
      if (response.status === 401) {
        window.location.href = '/login';
      }
      
      throw new Error(errorData.error || `Ошибка ${response.status} при загрузке рекомендаций`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
},


  createRecommendation: async (data: any) => {
    try {
      console.log('Creating recommendation with data:', data);
      
      const response = await fetch('http://localhost:5000/api/admin/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Create recommendation error response:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorData.error || 'Ошибка при создании рекомендации');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating recommendation:', error);
      throw error;
    }
  },

  updateRecommendation: async (id: string, data: any) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/recommendations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update recommendation error response:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorData.error || 'Ошибка при обновлении рекомендации');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      throw error;
    }
  },

  deleteRecommendation: async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/recommendations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete recommendation error response:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorData.error || 'Ошибка при удалении рекомендации');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      throw error;
    }
  },

 getAvailableExercises: async (problemType: string) => {
  try {

    const url = `http://localhost:5000/api/recommendations/available-exercises?problemType=${encodeURIComponent(problemType)}`;
    console.log('Fetching available exercises from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Get available exercises error response:', errorData);
      
      if (response.status === 401) {
        window.location.href = '/login';
      }
      throw new Error(errorData.error || 'Ошибка при загрузке доступных упражнений');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching available exercises:', error);
    throw error;
  }
},
  getRecommendationsStats: async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/recommendations/stats/overview', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Get recommendations stats error response:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorData.error || 'Ошибка при загрузке статистики рекомендаций');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recommendations stats:', error);
      throw error;
    }
  },

  getRecommendationById: async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/recommendations/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Get recommendation by ID error response:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorData.error || 'Ошибка при загрузке рекомендации');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recommendation by ID:', error);
      throw error;
    }
  },

  getAdminStats: async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error('Ошибка при загрузке статистики');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  getUsers: async (params?: any) => {
    try {
      const url = `http://localhost:5000/api/admin/users${params ? '?' + new URLSearchParams(params).toString() : ''}`;
      console.log('Fetching users from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorData.error || `Ошибка ${response.status} при загрузке пользователей`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  createUser: async (data: any) => {
    try {
      console.log('Creating user with data:', data);
      
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Create user error response:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorData.error || 'Ошибка при создании пользователя');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },


  updateUser: async (id: string, data: any) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update user error response:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorData.error || 'Ошибка при обновлении пользователя');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete user error response:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorData.error || 'Ошибка при удалении пользователя');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  getUserById: async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Get user by ID error response:', errorData);
        
        if (response.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(errorData.error || 'Ошибка при загрузке пользователя');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }
};