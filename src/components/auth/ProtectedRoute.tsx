import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { currentUser, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">読み込み中...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // For admin routes, check if user is admin
  if (requiredRole === 'admin' && !isAdmin()) {
    return <Navigate to="/generator" replace />;
  }

  // For user routes, both admin and user can access
  return <>{children}</>;
};

export default ProtectedRoute;