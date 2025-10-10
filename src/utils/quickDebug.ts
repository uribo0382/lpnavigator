import { supabase } from '../lib/supabase';

// 手動でユーザープロフィールをチェック
export const checkUserProfile = async (userId: string) => {
  console.log('=== Checking User Profile ===');
  console.log('UserID:', userId);
  
  try {
    // 1. Authユーザーの確認
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Auth User:', user);
    console.log('Auth Error:', userError);
    
    // 2. usersテーブルから直接SELECT
    console.log('\n--- Checking users table ---');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);
    
    console.log('Query Result:', data);
    console.log('Query Error:', error);
    
    if (error) {
      console.error('Error Details:');
      console.error('- Code:', error.code);
      console.error('- Message:', error.message);
      console.error('- Details:', error.details);
      console.error('- Hint:', error.hint);
    }
    
    // 3. single()を使わないでテスト
    console.log('\n--- Testing without single() ---');
    const { data: data2, error: error2 } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);
    
    console.log('Result array length:', data2?.length);
    console.log('First result:', data2?.[0]);
    
    // 4. RLSをバイパスしてテスト（service_roleキーが必要）
    console.log('\n--- Testing RLS ---');
    
    // 5. INSERT権限のテスト
    console.log('\n--- Testing INSERT ---');
    const testData = {
      id: userId,
      email: user?.email || 'test@example.com',
      name: 'Test User',
      role: 'user',
      plan: 'free',
      is_active: true,
      usage_limit: 10,
      api_access: false,
      lp_generated: 0,
      api_calls: 0
    };
    
    console.log('Attempting to insert:', testData);
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testData)
      .select();
    
    console.log('Insert Result:', insertData);
    console.log('Insert Error:', insertError);
    
    if (insertError) {
      console.error('Insert Error Details:');
      console.error('- Code:', insertError.code);
      console.error('- Message:', insertError.message);
      console.error('- Details:', insertError.details);
      console.error('- Hint:', insertError.hint);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
  
  console.log('=== End Check ===');
};

// 現在のSupabaseクライアントの状態を確認
export const checkSupabaseClient = () => {
  console.log('=== Supabase Client Info ===');
  console.log('Supabase URL:', supabase.supabaseUrl);
  console.log('Has Auth:', !!supabase.auth);
  console.log('Has Storage:', !!supabase.storage);
  console.log('Has Functions:', !!supabase.functions);
  console.log('=== End Client Info ===');
};

// グローバルに公開
if (typeof window !== 'undefined') {
  (window as any).checkUserProfile = checkUserProfile;
  (window as any).checkSupabaseClient = checkSupabaseClient;
}