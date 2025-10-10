import { supabase } from '../lib/supabase';

export const debugAuthState = async () => {
  console.log('=== Auth Debug Info ===');
  console.log('現在時刻:', new Date().toLocaleString());
  
  // 1. 現在のセッション状態
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Current session:', session);
  console.log('Session error:', sessionError);
  
  // 2. 現在のユーザー
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('Current user:', user);
  console.log('User error:', userError);
  
  // 3. ローカルストレージの内容
  console.log('LocalStorage keys:', Object.keys(localStorage));
  const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
  supabaseKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`${key}: ${value?.substring(0, 100)}...`); // 最初の100文字のみ表示
  });
  
  // 4. public.usersテーブルの確認
  if (user) {
    console.log('Checking public.users table for user:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      console.log('✅ User profile found:', profile);
    } else {
      console.log('❌ User profile NOT found');
    }
    
    if (profileError) {
      console.error('Profile error:', profileError);
      console.error('Error code:', profileError.code);
      console.error('Error details:', profileError.details);
      console.error('Error hint:', profileError.hint);
      
      if (profileError.code === 'PGRST116') {
        console.error('→ レコードが見つかりません。新規作成が必要です。');
      } else if (profileError.code === '42501') {
        console.error('→ RLSポリシーエラー: 権限がありません');
      }
    }
  } else {
    console.log('No authenticated user found');
  }
  
  // 5. RLSポリシーのテスト
  console.log('\n=== Testing RLS Policies ===');
  if (user) {
    // INSERT権限のテスト
    console.log('Testing INSERT permission...');
    const testProfile = {
      id: user.id,
      email: user.email,
      name: 'RLS Test User',
      role: 'user',
      plan: 'free',
      is_active: true,
      usage_limit: 10,
      api_access: false,
      lp_generated: 0,
      api_calls: 0
    };
    
    const { error: insertError } = await supabase
      .from('users')
      .insert(testProfile);
    
    if (insertError) {
      console.error('❌ INSERT test failed:', insertError.message);
      console.error('Error code:', insertError.code);
      if (insertError.code === '42501') {
        console.error('→ RLSポリシーによりINSERT権限がありません');
      } else if (insertError.code === '23505') {
        console.log('✅ INSERT権限はありますが、既にレコードが存在します');
      }
    } else {
      console.log('✅ INSERT permission OK');
    }
  }
  
  console.log('=== End Debug Info ===');
};

// セッションをクリアして再ログインを強制
export const clearAuthAndReload = async () => {
  console.log('Clearing auth and reloading...');
  
  // Supabaseのセッションをクリア
  await supabase.auth.signOut();
  
  // ローカルストレージからSupabase関連のキーを削除
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('lp_navigator')
  );
  
  keysToRemove.forEach(key => {
    console.log(`Removing ${key} from localStorage`);
    localStorage.removeItem(key);
  });
  
  // ページをリロード
  window.location.href = '/#/login';
};

// ブラウザコンソールで実行できるようにwindowに追加
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuthState;
  (window as any).clearAuth = clearAuthAndReload;
}