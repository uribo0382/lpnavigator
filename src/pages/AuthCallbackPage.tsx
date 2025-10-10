import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../lib/auth';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallbackPage: 処理開始');
        console.log('URL:', window.location.href);
        
        // URLパラメータを確認（メール認証のコールバックかどうか）
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasAccessToken = hashParams.has('access_token');
        const hasError = hashParams.has('error');
        
        if (hasError) {
          const errorDescription = hashParams.get('error_description');
          console.error('認証エラー:', errorDescription);
          setError(errorDescription || '認証エラーが発生しました。');
          return;
        }
        
        if (hasAccessToken) {
          console.log('メール認証トークンを検出しました');
          // メール認証の場合、Supabaseに処理を任せる（少し待つ）
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // 処理後のセッションを取得
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth callback error:', error);
            setError('認証エラーが発生しました。');
            return;
          }
          
          if (session?.user) {
            console.log('メール認証完了:', session.user.email);
            // メール認証完了後はログインページへ（自動ログインを防ぐ）
            navigate('/login', { 
              replace: true,
              state: { 
                message: 'メール認証が完了しました。ログインしてください。',
                email: session.user.email
              }
            });
            return;
          }
        } else {
          // 通常のセッションチェック（メール認証以外）
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth callback error:', error);
            setError('認証エラーが発生しました。');
            return;
          }
          
          if (session?.user) {
            console.log('既存セッション検出、ダッシュボードへ');
            navigate('/generator', { replace: true });
            return;
          }
        }
        
        // セッションがない場合はログインページへ
        console.log('セッションなし、ログインページへ');
        navigate('/login', { replace: true });
      } catch (err) {
        console.error('予期しないエラー:', err);
        setError('予期しないエラーが発生しました。');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">エラーが発生しました</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <a 
              href="/login" 
              className="block w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-center"
            >
              ログインページへ戻る
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 rounded-lg border border-gray-200 bg-white shadow-lg w-full max-w-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">認証中...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;