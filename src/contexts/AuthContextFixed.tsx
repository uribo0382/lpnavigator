import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserProfile, signIn, signUp, signOut } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { AppUser } from '../lib/auth';

// 認証コンテキストの型定義
interface AuthContextType {
  currentUser: AppUser | null;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

// コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProviderのプロパティ型
interface AuthProviderProps {
  children: ReactNode;
}

// localStorageから直接セッションを取得
function getSessionFromLocalStorage() {
  try {
    const storageKey = Object.keys(localStorage).find(key => 
      key.startsWith('sb-') && key.endsWith('-auth-token')
    );
    
    if (!storageKey) return null;
    
    const data = localStorage.getItem(storageKey);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return parsed.currentSession || null;
  } catch (error) {
    console.error('Failed to get session from localStorage:', error);
    return null;
  }
}

export const AuthProviderFixed: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 初期化
  useEffect(() => {
    let mounted = true;
    console.log('AuthContextFixed - 初期化開始');

    const initAuth = async () => {
      try {
        // localStorageから直接セッション情報を取得
        console.log('AuthContextFixed - localStorageからセッション取得を試みます');
        const localSession = getSessionFromLocalStorage();
        
        if (!localSession || !localSession.user) {
          console.log('AuthContextFixed - セッションが存在しません');
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        console.log('AuthContextFixed - セッション検出:', localSession.user.email);
        
        // ユーザープロフィールを取得
        try {
          const profile = await getUserProfile(localSession.user.id);
          if (!mounted) return;
          
          if (profile) {
            console.log('AuthContextFixed - プロフィール取得成功');
            setCurrentUser(profile);
          } else {
            console.warn('AuthContextFixed - プロフィールが見つかりませんでした');
            // プロフィールがない場合でも、セッションがあればエラーにしない
            // 次回ログイン時に作成される
          }
        } catch (profileError) {
          console.error('プロフィール取得エラー:', profileError);
          // プロフィール取得エラーでもセッションは有効とする
        }
      } catch (error) {
        console.error('AuthContextFixed - 初期化エラー:', error);
        setAuthError('認証の初期化中にエラーが発生しました');
      } finally {
        if (mounted) {
          console.log('AuthContextFixed - isLoadingをfalseに設定');
          setIsLoading(false);
        }
      }
    };

    // エラーをキャッチするためにtry-catchで囲む
    try {
      initAuth();
    } catch (err) {
      console.error('initAuth実行エラー:', err);
      if (mounted) {
        setIsLoading(false);
        setAuthError('予期しないエラーが発生しました');
      }
    }

    // クリーンアップ
    return () => {
      mounted = false;
    };
  }, []);

  // ログイン
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        throw error;
      }

      if (data.session?.user) {
        console.log('ログイン成功:', data.session.user.email);
        const profile = await getUserProfile(data.session.user.id);
        
        if (profile) {
          setCurrentUser(profile);
          navigate('/generator');
        } else {
          setAuthError('ユーザープロフィールの作成に失敗しました。');
        }
      }
    } catch (error: any) {
      console.error('ログインエラー:', error);
      setAuthError(error.message || 'ログインに失敗しました');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOut();
      setCurrentUser(null);
      setAuthError(null);
      navigate('/login');
    } catch (error: any) {
      console.error('ログアウトエラー:', error);
      setAuthError(error.message || 'ログアウトに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 管理者権限チェック
  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  const value = {
    currentUser,
    isLoading,
    authError,
    login,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuthフック
export const useAuthFixed = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};