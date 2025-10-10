import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 環境変数の取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 新しいクライアントを作成（最小限の設定）
export const supabaseNew: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// デバッグ用：クライアントを直接テスト
export const testNewClient = async () => {
  console.log('=== Testing New Supabase Client ===');
  
  try {
    // 1. シンプルなAuth確認
    console.log('1. Testing auth.getSession()...');
    const sessionResult = await Promise.race([
      supabaseNew.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ]);
    console.log('Session result:', sessionResult);
  } catch (error) {
    console.error('Session error:', error);
  }
  
  try {
    // 2. シンプルなデータベースクエリ
    console.log('\n2. Testing database query...');
    const dbResult = await Promise.race([
      supabaseNew.from('users').select('id').limit(1),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ]);
    console.log('DB result:', dbResult);
  } catch (error) {
    console.error('DB error:', error);
  }
  
  console.log('=== End Test ===');
};

// 直接REST APIを使用してユーザーを作成
export const createUserDirectly = async () => {
  console.log('=== Creating User Directly ===');
  
  // LocalStorageから認証情報を取得
  const authKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
  const authData = localStorage.getItem(authKey);
  
  if (!authData) {
    console.error('No auth data in localStorage');
    return;
  }
  
  try {
    const auth = JSON.parse(authData);
    console.log('Auth data found:', {
      hasAccessToken: !!auth.access_token,
      hasUser: !!auth.user
    });
    
    if (!auth.user || !auth.access_token) {
      console.error('Invalid auth data');
      return;
    }
    
    const userData = {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.user_metadata?.name || auth.user.email.split('@')[0],
      role: 'user',
      plan: 'free',
      is_active: true,
      usage_limit: 10,
      api_access: false,
      lp_generated: 0,
      api_calls: 0
    };
    
    console.log('Creating user with data:', userData);
    
    // 直接REST APIを使用
    const response = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${auth.access_token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('✅ User created successfully');
      // ページをリロード
      setTimeout(() => {
        console.log('Reloading page...');
        window.location.reload();
      }, 1000);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('=== End ===');
};

// グローバルに公開
if (typeof window !== 'undefined') {
  (window as any).testNewClient = testNewClient;
  (window as any).createUserDirectly = createUserDirectly;
  (window as any).supabaseNew = supabaseNew;
}