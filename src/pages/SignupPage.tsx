import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextFixed';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, currentUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // すでにログインしている場合はリダイレクト
  useEffect(() => {
    if (currentUser) {
      try {
        navigate('/generator', { replace: true });
      } catch (error) {
        console.error('Navigation error:', error);
        window.location.href = '/generator';
      }
    }
  }, [currentUser, navigate]);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('名前を入力してください。');
      return false;
    }
    
    if (!email.trim()) {
      setError('メールアドレスを入力してください。');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('有効なメールアドレス形式で入力してください。');
      return false;
    }
    
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await register(name, email, password);
      // 登録成功後、メール確認メッセージを表示
      setIsRegistered(true);
    } catch (err: any) {
      setError(err.message || 'ユーザー登録に失敗しました。');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 rounded-lg border border-gray-200 bg-white shadow-lg w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // メール確認画面を表示
  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">登録が完了しました</h2>
            <p className="text-gray-600 mb-6">
              確認メールを <strong>{email}</strong> に送信しました。<br />
              メール内のリンクをクリックして、アカウントを有効化してください。
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </p>
              <Link 
                to="/login" 
                className="block w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-center"
              >
                ログインページへ
              </Link>
            </div>
          </div>
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
          <h2 className="text-xl font-semibold text-center text-gray-800">アカウント登録</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="お名前"
                fullWidth
                required
              />
            </div>

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
                  placeholder="パスワード (8文字以上)"
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

            <div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワード（確認）"
                  fullWidth
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              leftIcon={<UserPlus size={18} />}
            >
              登録する
            </Button>
          </form>

          <div className="text-center text-sm mt-4">
            <p className="text-gray-600">
              すでにアカウントをお持ちの方は{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                こちらからログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 