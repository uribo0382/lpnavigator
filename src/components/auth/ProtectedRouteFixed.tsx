import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthFixed } from '../../contexts/AuthContextFixed';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'user';
}

const ProtectedRouteFixed: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { currentUser, isLoading, isAdmin, authError } = useAuthFixed();

  console.log('ProtectedRouteFixed - Render:', {
    isLoading,
    currentUser: currentUser ? { id: currentUser.id, email: currentUser.email, role: currentUser.role } : null,
    requiredRole,
    authError,
    pathname: window.location.pathname,
    hash: window.location.hash
  });

  if (isLoading) {
    console.log('ProtectedRouteFixed - Loading state detected');
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="mb-4">読み込み中...</div>
          <div className="text-sm text-gray-500">
            認証状態を確認しています
          </div>
          {authError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{authError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('ProtectedRouteFixed - No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // For admin routes, check if user is admin
  if (requiredRole === 'admin' && !isAdmin()) {
    console.log('ProtectedRouteFixed - Non-admin user trying to access admin route');
    return <Navigate to="/generator" replace />;
  }

  console.log('ProtectedRouteFixed - Access granted');
  // For user routes, both admin and user can access
  return <>{children}</>;
};

export default ProtectedRouteFixed;