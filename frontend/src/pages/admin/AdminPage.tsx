import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminDashboard from '../../components/admin/AdminDashboard';
import { ProtectedRoute } from '../../components/ui/ProtectedRoute';
import RecommendationsManager from '../../components/admin/RecommendationsManager';
import UserList from '../../components/admin/UserList';
import UserForm from '../../components/admin/UserForm';
import ExerciseList from '../../components/admin/ExerciseList';
import ExerciseForm from '../../components/admin/ExerciseForm';

const AdminPage: React.FC = () => {
  return (
    <ProtectedRoute requireAuth requireAdmin>
      <Routes>
        <Route 
          path="/" 
          element={
            <AdminLayout title="Дашборд">
              <AdminDashboard />
            </AdminLayout>
          } 
        />
        
        <Route 
          path="/users" 
          element={
            <AdminLayout title="Управление пользователями">
              <UserList />
            </AdminLayout>
          } 
        />
        
        <Route 
          path="/users/create" 
          element={
            <AdminLayout title="Создание пользователя">
              <UserForm />
            </AdminLayout>
          } 
        />
        
        <Route 
          path="/users/edit/:id" 
          element={
            <AdminLayout title="Редактирование пользователя">
              <UserForm />
            </AdminLayout>
          } 
        />
        
        <Route 
          path="/exercises" 
          element={
            <AdminLayout title="Управление упражнениями">
              <ExerciseList />
            </AdminLayout>
          } 
        />
        
        <Route 
          path="/exercises/create" 
          element={
            <AdminLayout title="Создание упражнения">
              <ExerciseForm />
            </AdminLayout>
          } 
        />
        
        <Route 
          path="/exercises/edit/:id" 
          element={
            <AdminLayout title="Редактирование упражнения">
              <ExerciseForm />
            </AdminLayout>
          } 
        />
        
        <Route 
          path="/recommendations" 
          element={
            <AdminLayout title="Управление рекомендациями">
              <RecommendationsManager />
            </AdminLayout>
          } 
        />
      </Routes>
    </ProtectedRoute>
  );
};

export default AdminPage;