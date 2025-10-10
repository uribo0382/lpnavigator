import { supabase } from './supabase';
import { AuthError, User as SupabaseUser } from '@supabase/supabase-js';

// アプリケーションのユーザー型
export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  plan?: 'free' | 'standard' | 'premium' | 'enterprise';
}

// Supabase AuthのユーザーからアプリのユーザーIDへの変換
export const getAppUserId = (supabaseUser: SupabaseUser | null): string | null => {
  return supabaseUser?.id || null;
};

// サインアップ（メール認証付き）
export const signUp = async (email: string, password: string, name: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name: name,
          role: 'user',
          plan: 'free'
        }
      }
    });

    if (error) throw error;

    // メール認証が必要なため、ここではプロフィールを作成しない
    // プロフィール作成はログイン時に行う
    console.log('サインアップ成功。メール認証待ち。');

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
};

// サインイン
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // サインイン成功後、ユーザープロフィールを確認（存在しなければ作成）
    if (data.user) {
      console.log('ログイン成功。プロフィールを確認中...');
      const profile = await getUserProfile(data.user.id);
      if (!profile) {
        console.error('ユーザープロフィールの作成に失敗しました');
      } else {
        console.log('ユーザープロフィール確認完了:', profile.email);
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
};

// サインアウト
export const signOut = async () => {
  try {
    console.log('サインアウト処理開始');
    
    // Supabaseのサインアウト
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase signOut error:', error);
      throw error;
    }
    
    // ローカルストレージを完全にクリア（セッションの分離を確実にする）
    console.log('ローカルストレージをクリア');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // セッションストレージもクリア
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('サインアウト完了');
    return { error: null };
  } catch (error) {
    console.error('サインアウトエラー:', error);
    return { error: error as AuthError };
  }
};

// パスワードリセットメール送信
export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
};

// 現在のセッションを取得
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    return { session: null, error: error as AuthError };
  }
};

// 現在のユーザーを取得
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error as AuthError };
  }
};

// ユーザープロフィールを取得（存在しない場合は作成）
export const getUserProfile = async (userId: string): Promise<AppUser | null> => {
  console.log('getUserProfile called with userId:', userId);
  
  if (!userId) {
    console.error('getUserProfile: userId is required');
    return null;
  }
  
  try {
    // 現在のセッションを確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('getUserProfile: No active session', sessionError);
      return null;
    }
    
    console.log('getUserProfile: Session found, user:', session.user.id);
    
    // まずプロフィールの取得を試みる
    console.log('getUserProfile: Querying users table...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('getUserProfile: Query completed', { data: !!data, error: !!error });

    if (error && error.code === 'PGRST116') {
      // レコードが見つからない場合、Auth情報から作成
      console.log('ユーザープロフィールが見つかりません。新規作成します。');
      console.log('エラー詳細:', { code: error.code, message: error.message, details: error.details });
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth情報取得エラー:', authError);
        return null;
      }
      
      console.log('Auth user found:', { id: user.id, email: user.email });

      // デフォルトのユーザープロフィールを作成
      const newUserProfile = {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'ユーザー',
        role: (user.user_metadata?.role || 'user') as 'admin' | 'user',
        plan: (user.user_metadata?.plan || 'free') as 'free' | 'standard' | 'premium' | 'enterprise',
        is_active: true,
        usage_limit: 10,
        api_access: false,
        lp_generated: 0,
        api_calls: 0
      };

      console.log('Creating new user profile:', newUserProfile);
      
      const { data: createdProfile, error: createError } = await supabase
        .from('users')
        .insert(newUserProfile)
        .select()
        .single();

      if (createError) {
        console.error('プロフィール作成エラー:', createError);
        console.error('エラーコード:', createError.code);
        console.error('エラー詳細:', createError.details);
        console.error('エラーヒント:', createError.hint);
        
        // RLSポリシーエラーの場合
        if (createError.code === '42501') { // insufficient_privilege
          console.error('RLSポリシーエラー: ユーザープロフィールの作成権限がありません');
          console.error('Supabaseダッシュボードで以下のポリシーを追加してください:');
          console.error('CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);');
        }
        
        // 競合状態の場合、再度取得を試みる
        if (createError.code === '23505') { // unique constraint violation
          console.log('プロフィールが既に存在する可能性があります。再度取得を試みます...');
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (!retryError && retryData) {
            console.log('既存のプロフィールを取得しました');
            return {
              id: retryData.id,
              email: retryData.email,
              name: retryData.name,
              role: retryData.role,
              plan: retryData.plan
            };
          }
        }
        return null;
      }

      console.log('✅ プロフィール作成成功:', createdProfile);
      return {
        id: createdProfile.id,
        email: createdProfile.email,
        name: createdProfile.name,
        role: createdProfile.role,
        plan: createdProfile.plan
      };
    } else if (error) {
      console.error('プロフィール取得エラー:', error);
      console.error('エラーコード:', error.code);
      console.error('エラー詳細:', error.details);
      
      // RLSポリシーエラーの場合
      if (error.code === '42501') {
        console.error('RLSポリシーエラー: ユーザープロフィールの読み取り権限がありません');
      }
      
      return null;
    }

    // データが正常に取得できた場合
    if (data) {
      console.log('✅ 既存のプロフィールを取得:', data);
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        plan: data.plan
      };
    }
    
    // データがnullの場合
    console.warn('getUserProfile: データが見つかりませんでした');
    return null;
  } catch (error) {
    console.error('getUserProfile: 予期しないエラー:', error);
    return null;
  }
};

// 認証状態の変更を監視
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};