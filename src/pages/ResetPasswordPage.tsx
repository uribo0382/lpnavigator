import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextFixed';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword, isLoading, currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError('メールアドレスを入力してください。');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('有効なメールアドレス形式で入力してください。');
      return;
    }

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'パスワードリセットに失敗しました。');
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

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-white p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">LPナビゲーター</h1>
          <p className="text-gray-600 mt-1">簡単にLP記事を作成</p>
        </div>

        <div className="p-6 space-y-6">
          <h2 className="text-xl font-semibold text-center text-gray-800">パスワードをリセット</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                パスワードリセットの手順をメールで送信しました。メールをご確認ください。
              </div>
              <Button
                variant="outline"
                fullWidth
                leftIcon={<ArrowLeft size={18} />}
                onClick={() => navigate('/login')}
              >
                ログイン画面に戻る
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="登録済みのメールアドレス"
                  fullWidth
                  required
                />
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                leftIcon={<KeyRound size={18} />}
              >
                リセットリンクを送信
              </Button>

              <div className="text-center text-sm mt-4">
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  ログイン画面に戻る
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 