// 認証状態のデバッグユーティリティ
import { supabase } from '../lib/supabase';

export const debugAuthState = async () => {
  console.group('🔍 認証状態の詳細デバッグ');
  
  try {
    // 1. セッション確認
    console.log('1. セッション確認中...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ セッションエラー:', sessionError);
    } else if (session) {
      console.log('✅ セッション取得成功');
      console.log('  - ユーザーID:', session.user.id);
      console.log('  - メール:', session.user.email);
      console.log('  - 認証済み:', session.user.email_confirmed_at ? 'Yes' : 'No');
    } else {
      console.log('❌ セッションが存在しません');
    }
    
    // 2. ユーザープロファイル確認
    if (session?.user) {
      console.log('\n2. ユーザープロファイル確認中...');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ プロファイル取得エラー:', profileError);
        console.error('  - コード:', profileError.code);
        console.error('  - メッセージ:', profileError.message);
        console.error('  - 詳細:', profileError.details);
      } else if (profile) {
        console.log('✅ プロファイル取得成功:', profile);
      } else {
        console.log('❌ プロファイルが存在しません');
      }
    }
    
    // 3. localStorage確認
    console.log('\n3. localStorage確認中...');
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-')
    );
    console.log('Supabase関連のキー:', supabaseKeys);
    supabaseKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`  - ${key}:`, value?.substring(0, 50) + '...');
    });
    
    // 4. 現在のURL
    console.log('\n4. 現在のURL情報');
    console.log('  - href:', window.location.href);
    console.log('  - hash:', window.location.hash);
    console.log('  - pathname:', window.location.pathname);
    
  } catch (error) {
    console.error('デバッグ中にエラー:', error);
  } finally {
    console.groupEnd();
  }
  
  return {
    timestamp: new Date().toISOString(),
    message: 'デバッグ完了。コンソールを確認してください。'
  };
};

// グローバルに公開
if (typeof window !== 'undefined') {
  (window as any).debugAuthState = debugAuthState;
}