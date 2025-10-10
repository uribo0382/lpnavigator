// Supabase設定の型定義と設定情報
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  dbPassword?: string;
}

// 環境変数から設定を取得
export const supabaseConfig: SupabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  dbPassword: import.meta.env.VITE_SUPABASE_DB_PASSWORD,
};

// 設定のバリデーション
export function validateSupabaseConfig(config: SupabaseConfig): boolean {
  if (!config.url || !config.anonKey) {
    console.error('Supabase configuration is missing required fields');
    return false;
  }

  try {
    new URL(config.url);
  } catch {
    console.error('Invalid Supabase URL');
    return false;
  }

  return true;
}

// APIエンドポイント
export const supabaseEndpoints = {
  auth: {
    signIn: '/auth/v1/token',
    signUp: '/auth/v1/signup',
    signOut: '/auth/v1/logout',
    resetPassword: '/auth/v1/recover',
  },
  storage: {
    upload: '/storage/v1/object',
    download: '/storage/v1/object',
  },
};

// エラーメッセージ
export const supabaseErrorMessages = {
  CONNECTION_ERROR: 'Supabaseへの接続に失敗しました',
  AUTH_ERROR: '認証エラーが発生しました',
  PERMISSION_ERROR: 'アクセス権限がありません',
  NOT_FOUND: 'データが見つかりません',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
};