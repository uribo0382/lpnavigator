import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthProviderFixed } from './contexts/AuthContextFixed';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import LoginPageFixed from './pages/LoginPageFixed';
import SignupPage from './pages/SignupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResetPasswordCallbackPage from './pages/ResetPasswordCallbackPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
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
import LayoutFixed from './components/layout/LayoutFixed';
import LayoutSimple from './components/layout/LayoutSimple';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProtectedRouteFixed from './components/auth/ProtectedRouteFixed';
import { SupabaseTestPage } from './pages/test/SupabaseTestPage';
import ApiTest from './pages/admin/ApiTest';
import ApiTestDebug from './pages/admin/ApiTestDebug';
import { forceLogout } from './utils/forceLogout';
import { debugAuthState } from './utils/debugAuthState';
import { testAuthFlow, forceCreateProfile } from './utils/testAuthFlow';
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
  // デバッグ用：強制ログアウト機能を有効化
  React.useEffect(() => {
    (window as any).forceLogout = forceLogout;
    (window as any).debugAuthState = debugAuthState;
    (window as any).testAuthFlow = testAuthFlow;
    (window as any).forceCreateProfile = forceCreateProfile;
  }, []);
  // 修正版のAuthContextを使用するかどうかのフラグ
  const useFixedAuth = true; // これをtrueにすると修正版を使用
  
  const AuthProviderComponent = useFixedAuth ? AuthProviderFixed : AuthProvider;
  const ProtectedRouteComponent = useFixedAuth ? ProtectedRouteFixed : ProtectedRoute;
  const LoginPageComponent = useFixedAuth ? LoginPageFixed : LoginPage;
  const LayoutComponent = useFixedAuth ? LayoutFixed : Layout; // 修正版のLayoutを使用
  
  return (
    <ErrorBoundary>
      <AuthProviderComponent>
        <ThemeProvider>
          <RouteDebugger />
          <Routes>
            <Route path="/login" element={<LoginPageComponent />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordCallbackPage />} />
            <Route element={<LayoutComponent />}>
              {/* ルートパスをジェネレーターにリダイレクト */}
              <Route path="/" element={<Navigate to="/generator" replace />} />
              
              {/* プロフィールページ */}
              <Route
                path="/profile"
                element={
                  <ProtectedRouteComponent requiredRole="user">
                    <ProfilePage />
                  </ProtectedRouteComponent>
                }
              />
              
              {/* 管理者ルート - サブパスごとに個別に定義 */}
              <Route
                path="/admin"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRouteComponent>
                }
              />
              <Route
                path="/admin/questions"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <QuestionsManagement />
                  </ProtectedRouteComponent>
                }
              />
              <Route
                path="/admin/questions/new"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <QuestionEditor />
                  </ProtectedRouteComponent>
                }
              />
              <Route
                path="/admin/questions/:id"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <QuestionEditor />
                  </ProtectedRouteComponent>
                }
              />
              {/* フォーミュラ管理ルート - 新規追加 */}
              <Route
                path="/admin/formula/*"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <FormulaManagement />
                  </ProtectedRouteComponent>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <UsersManagement />
                  </ProtectedRouteComponent>
                }
              />
              <Route
                path="/admin/users/new"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <UserEditor />
                  </ProtectedRouteComponent>
                }
              />
              <Route
                path="/admin/users/:id"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <UserEditor />
                  </ProtectedRouteComponent>
                }
              />
              <Route
                path="/admin/api-settings"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <ApiSettings />
                  </ProtectedRouteComponent>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <Analytics />
                  </ProtectedRouteComponent>
                }
              />
              <Route
                path="/admin/api-test"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <ApiTest />
                  </ProtectedRouteComponent>
                }
              />
              <Route
                path="/admin/api-debug"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <ApiTestDebug />
                  </ProtectedRouteComponent>
                }
              />
              {/* Fallback for unknown admin routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRouteComponent requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRouteComponent>
                }
              />
              
              {/* ジェネレーターメインルート */}
              <Route 
                path="/generator" 
                element={
                  <ProtectedRouteComponent requiredRole="user">
                    <ContentGenerator />
                  </ProtectedRouteComponent>
                } 
              />
              
              {/* ジェネレーター関連のサブルート */}
              <Route 
                path="/generator/content" 
                element={
                  <ProtectedRouteComponent requiredRole="user">
                    <GeneratedContent />
                  </ProtectedRouteComponent>
                } 
              />
              
              <Route 
                path="/generator/history" 
                element={
                  <ProtectedRouteComponent requiredRole="user">
                    <ContentHistory />
                  </ProtectedRouteComponent>
                } 
              />

              {/* 広告文関連のルート - 新規追加 */}
              <Route 
                path="/generator/adcopy" 
                element={
                  <ProtectedRouteComponent requiredRole="user">
                    <AdCopyDisplay />
                  </ProtectedRouteComponent>
                } 
              />

              <Route 
                path="/generator/adcopy/create" 
                element={
                  <ProtectedRouteComponent requiredRole="user">
                    <AdCopyGenerator />
                  </ProtectedRouteComponent>
                } 
              />

              <Route 
                path="/generator/adcopy/history" 
                element={
                  <ProtectedRouteComponent requiredRole="user">
                    <AdCopyHistory />
                  </ProtectedRouteComponent>
                } 
              />
              
              {/* LP記事関連のルート - 新規追加 */}
              <Route 
                path="/generator/lparticle" 
                element={
                  <ProtectedRouteComponent requiredRole="user">
                    <LpArticleDisplay />
                  </ProtectedRouteComponent>
                } 
              />

              <Route 
                path="/generator/lparticle/create" 
                element={
                  <ProtectedRouteComponent requiredRole="user">
                    <LpArticleGenerator />
                  </ProtectedRouteComponent>
                } 
              />

              <Route 
                path="/generator/lparticle/history" 
                element={
                  <ProtectedRouteComponent requiredRole="user">
                    <LpArticleHistory />
                  </ProtectedRouteComponent>
                } 
              />
            </Route>
            
            {/* Supabaseテストページ（開発環境のみ） */}
            <Route path="/test/supabase" element={<SupabaseTestPage />} />
            
            {/* 404ページ */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ThemeProvider>
      </AuthProviderComponent>
    </ErrorBoundary>
  );
}

export default App;