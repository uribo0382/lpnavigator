import { createClient } from '@supabase/supabase-js';

// 環境変数の取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 環境変数のバリデーション
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// 修正版Supabaseクライアント（セッション永続化を無効化）
export const supabaseFixed = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,  // セッション永続化を無効化
    detectSessionInUrl: false,  // URL検出を無効化
    storage: undefined,  // カスタムストレージを無効化
  },
  global: {
    headers: {
      'X-Client-Info': 'lpnavigator-fixed@1.0.0',
    },
  },
  db: {
    schema: 'public',
  },
});

// セッション取得のヘルパー関数（タイムアウト付き）
export async function getSessionWithTimeout(timeoutMs: number = 3000) {
  return new Promise<{ session: any; error: any }>((resolve) => {
    const timeoutId = setTimeout(() => {
      console.log('getSession timeout, using localStorage fallback');
      const session = getSessionFromLocalStorage();
      resolve({ session, error: null });
    }, timeoutMs);

    supabaseFixed.auth.getSession()
      .then(({ data, error }) => {
        clearTimeout(timeoutId);
        resolve({ session: data.session, error });
      })
      .catch(error => {
        clearTimeout(timeoutId);
        resolve({ session: null, error });
      });
  });
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

// 既存のセッションを手動で設定
export async function manuallySetSession() {
  const session = getSessionFromLocalStorage();
  if (session) {
    await supabaseFixed.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });
    console.log('✅ セッションを手動で設定しました');
    return true;
  }
  return false;
}