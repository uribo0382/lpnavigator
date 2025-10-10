import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuthFixed } from '../contexts/AuthContextFixed';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const LoginPageFixed: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, currentUser } = useAuthFixed();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // locationからのメッセージとメールアドレスを処理
  useEffect(() => {
    const state = location.state as { message?: string; email?: string } | null;
    if (state?.message) {
      setSuccessMessage(state.message);
      if (state.email) {
        setEmail(state.email);
      }
      // stateをクリア
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // すでにログインしている場合はリダイレクト
  useEffect(() => {
    if (currentUser) {
      try {
        navigate('/generator', { replace: true });
      } catch (error) {
        console.error('Navigation error:', error);
        // フォールバックとしてwindow.locationを使用
        window.location.href = '/#/generator';
      }
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      console.log('LoginPage - ログイン処理開始');
      await login(email, password);
      console.log('LoginPage - ログイン成功、リダイレクトしません（currentUserの更新を待つ）');
      // ナビゲーションはcurrentUserの更新を検知するuseEffectで行う
    } catch (err) {
      console.error('LoginPage - ログインエラー:', err);
      setError('メールアドレスまたはパスワードが正しくありません。');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 rounded-lg border border-gray-200 bg-white shadow-lg w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-white p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">LPナビゲーター</h1>
          <p className="text-gray-600 mt-1">簡単にLP記事を作成</p>
        </div>

        <div className="p-6 space-y-6">
          <h2 className="text-xl font-semibold text-center text-gray-800">ログイン</h2>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                fullWidth
                required
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード"
                  fullWidth
                  required
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/reset-password" className="text-sm text-primary-600 hover:text-primary-700">
                パスワードをお忘れですか？
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              leftIcon={<LogIn size={18} />}
            >
              ログイン
            </Button>
          </form>
          
          <div className="text-center py-2">
            <Link to="/signup" className="inline-flex items-center text-primary-600 hover:text-primary-700">
              <UserPlus size={18} className="mr-2" />
              <span>新規アカウント登録</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageFixed;