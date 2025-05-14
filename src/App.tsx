import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import QuestionsManagement from './pages/admin/QuestionsManagement';
import QuestionEditor from './pages/admin/QuestionEditor';
import UsersManagement from './pages/admin/UsersManagement';
import UserEditor from './pages/admin/UserEditor';
import ApiSettings from './pages/admin/ApiSettings';
import Analytics from './pages/admin/Analytics';
import FormulaManagement from './pages/admin/formula/FormulaManagement';
import ContentGenerator from './pages/ContentGenerator';
import GeneratedContent from './pages/generator/GeneratedContent';
import ContentHistory from './pages/generator/ContentHistory';
import AdCopyGenerator from './pages/generator/AdCopyGenerator';
import AdCopyDisplay from './pages/generator/AdCopyDisplay';
import AdCopyHistory from './pages/generator/AdCopyHistory';
import LpArticleGenerator from './pages/generator/LpArticleGenerator';
import LpArticleDisplay from './pages/generator/LpArticleDisplay';
import LpArticleHistory from './pages/generator/LpArticleHistory';
import NotFound from './pages/NotFound';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

// グローバルエラーハンドラー
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="bg-error-50 border border-error-200 text-error-700 p-6 rounded-md max-w-md">
            <h2 className="text-lg font-medium mb-2">エラーが発生しました</h2>
            <p className="mb-4">アプリケーションでエラーが発生しました。</p>
            <button 
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ルートパスの情報を表示するデバッグコンポーネント
const RouteDebugger: React.FC = () => {
  const location = useLocation();
  return (
    <div className="fixed bottom-0 right-0 bg-black bg-opacity-80 text-white p-2 text-xs z-50">
      Path: {location.pathname} (Hash: {window.location.hash})
    </div>
  );
};

// メインのアプリケーション
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <RouteDebugger />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<Layout />}>
              {/* ルートパスをジェネレーターにリダイレクト */}
              <Route path="/" element={<Navigate to="/generator" replace />} />
              
              {/* プロフィールページ */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requiredRole="user">
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              
              {/* 管理者ルート - サブパスごとに個別に定義 */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/questions"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <QuestionsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/questions/new"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <QuestionEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/questions/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <QuestionEditor />
                  </ProtectedRoute>
                }
              />
              {/* フォーミュラ管理ルート - 新規追加 */}
              <Route
                path="/admin/formula/*"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <FormulaManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UsersManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users/new"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UserEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UserEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/api-settings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ApiSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              {/* Fallback for unknown admin routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* ジェネレーターメインルート */}
              <Route 
                path="/generator" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <ContentGenerator />
                  </ProtectedRoute>
                } 
              />
              
              {/* ジェネレーター関連のサブルート */}
              <Route 
                path="/generator/content" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <GeneratedContent />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/generator/history" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <ContentHistory />
                  </ProtectedRoute>
                } 
              />

              {/* 広告文関連のルート - 新規追加 */}
              <Route 
                path="/generator/adcopy" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <AdCopyDisplay />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/generator/adcopy/create" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <AdCopyGenerator />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/generator/adcopy/history" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <AdCopyHistory />
                  </ProtectedRoute>
                } 
              />
              
              {/* LP記事関連のルート - 新規追加 */}
              <Route 
                path="/generator/lparticle" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <LpArticleDisplay />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/generator/lparticle/create" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <LpArticleGenerator />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/generator/lparticle/history" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <LpArticleHistory />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* 404ページ */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;