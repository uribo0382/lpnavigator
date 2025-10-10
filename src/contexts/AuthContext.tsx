import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  signUp,
  signIn,
  signOut,
  resetPassword as authResetPassword,
  getSession,
  getUserProfile,
  onAuthStateChange,
  AppUser
} from '../lib/auth';

interface AuthContextType {
  currentUser: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  autoLogin: (role?: 'admin' | 'user') => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  session: Session | null;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // セッションとユーザー情報の初期化
  useEffect(() => {
    console.log('AuthContext - 初期化開始');
    let mounted = true; // メモリリーク防止用フラグ
    
    const initializeAuth = async () => {
      // タイムアウトを設定（10秒）
      const timeoutId = setTimeout(() => {
        if (mounted && isLoading) {
          console.error('AuthContext - 初期化タイムアウト');
          setIsLoading(false);
        }
      }, 10000);

      try {
        // 既存のセッションを取得
        const { session, error } = await getSession();
        console.log('AuthContext - getSession結果:', { session: !!session, error });
        
        if (!mounted) return; // コンポーネントがアンマウントされていたら処理を中止
        
        if (error) {
          console.error('セッション取得エラー:', error);
          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          setSession(session);
          
          try {
            // ユーザープロフィールを取得
            const profile = await getUserProfile(session.user.id);
            if (!mounted) return;
            
            if (profile) {
              console.log('AuthContext - プロフィール取得成功:', profile);
              setCurrentUser(profile);
            } else {
              console.warn('AuthContext - プロフィールが見つかりませんでした');
              setAuthError('ユーザープロフィールの作成に失敗しました。管理者にお問い合わせください。');
            }
          } catch (profileError) {
            console.error('プロフィール取得エラー:', profileError);
            setAuthError('プロフィールの取得中にエラーが発生しました。');
          }
        } else {
          console.log('AuthContext - セッションが存在しません');
        }
      } catch (error) {
        console.error('AuthContext - 初期化エラー:', error);
      } finally {
        // 必ずisLoadingをfalseに設定
        clearTimeout(timeoutId);
        if (mounted) {
          console.log('AuthContext - isLoadingをfalseに設定');
          setIsLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    return () => {
      mounted = false; // クリーンアップ時にフラグを false に設定
    };
  }, []); // 依存配列を空にして一度だけ実行

  // 別のuseEffectで認証状態の変更を監視
  useEffect(() => {
    // 認証状態の変更を監視
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', !!session);
      
      // INITIAL_SESSION イベントは無視（初期化処理と重複するため）
      if (event === 'INITIAL_SESSION') {
        console.log('Ignoring INITIAL_SESSION event');
        return;
      }
      
      setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('SIGNED_IN event - プロフィール取得中...');
        const profile = await getUserProfile(session.user.id);
        if (profile) {
          setCurrentUser(profile);
        } else {
          setAuthError('ユーザープロフィールの作成に失敗しました。');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('SIGNED_OUT event');
        setCurrentUser(null);
        setAuthError(null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        console.log('USER_UPDATED event');
        const profile = await getUserProfile(session.user.id);
        if (profile) {
          setCurrentUser(profile);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ログイン関数
  const login = async (email: string, password: string): Promise<void> => {
    console.log('AuthContext - login開始');
    setIsLoading(true);
    setAuthError(null); // エラーをクリア
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error('AuthContext - ログインエラー:', error);
        throw new Error(error.message || 'ログインに失敗しました。');
      }
      
      if (data.session?.user) {
        console.log('AuthContext - ログイン成功、プロフィール取得中...');
        setSession(data.session);
        
        const profile = await getUserProfile(data.session.user.id);
        if (profile) {
          console.log('AuthContext - プロフィール設定:', profile);
          setCurrentUser(profile);
        } else {
          console.warn('AuthContext - プロフィールが取得できませんでした');
          setAuthError('ユーザープロフィールの作成に失敗しました。管理者にお問い合わせください。');
        }
      }
    } catch (error) {
      console.error('AuthContext - login関数内エラー:', error);
      throw error;
    } finally {
      console.log('AuthContext - login完了、isLoadingをfalseに設定');
      setIsLoading(false);
    }
  };

  // ユーザー登録機能（メール認証あり）
  const register = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password, name);
      
      if (error) {
        throw new Error(error.message || '登録に失敗しました。');
      }
      
      // メール認証が必要なため、ここではログイン状態にしない
      // ユーザーにメール確認を促す
    } finally {
      setIsLoading(false);
    }
  };
  
  // パスワードリセット機能
  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { error } = await authResetPassword(email);
      
      if (error) {
        throw new Error(error.message || 'パスワードリセットに失敗しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 自動ログイン機能（デモ用 - Supabase環境では使用しない）
  const autoLogin = (role: 'admin' | 'user' = 'user') => {
    console.warn('autoLogin is not supported with Supabase Auth');
  };

  const logout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('ログアウトエラー:', error);
    }
    setCurrentUser(null);
    setSession(null);
  };

  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    isAdmin,
    autoLogin,
    register,
    resetPassword,
    session,
    authError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};