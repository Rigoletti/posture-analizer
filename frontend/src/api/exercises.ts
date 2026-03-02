export const exercisesApi = {

  getExercises: async (params?: any) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/exercises${params ? '?' + new URLSearchParams(params).toString() : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching exercises:', errorData);
        throw new Error(errorData.error || 'Ошибка при загрузке упражнений');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }
  },

  // Получить упражнение по ID (публичный доступ)
  getExerciseById: async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/exercises/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching exercise:', errorData);
        throw new Error(errorData.error || 'Ошибка при загрузке упражнения');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching exercise:', error);
      throw error;
    }
  }
};