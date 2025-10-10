// 認証フローのテストユーティリティ
import { supabase } from '../lib/supabase';

export const testAuthFlow = async () => {
  console.group('🔄 認証フローテスト');
  
  try {
    // 1. 現在のセッション状態
    console.log('1️⃣ セッション確認...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ セッションエラー:', sessionError);
      return { success: false, error: 'セッション取得エラー' };
    }
    
    if (!session) {
      console.log('❌ セッションが存在しません');
      return { success: false, error: 'セッションなし' };
    }
    
    console.log('✅ セッション存在:', {
      userId: session.user.id,
      email: session.user.email
    });
    
    // 2. ユーザープロファイル確認
    console.log('\n2️⃣ プロファイル確認...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ プロファイルエラー:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details
      });
      
      // プロファイルが存在しない場合の対処
      if (profileError.code === 'PGRST116') {
        console.log('⚠️ プロファイルが存在しません。作成を試みます...');
        
        const newProfile = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.email?.split('@')[0] || 'ユーザー',
          role: 'user' as const,
          plan: 'free' as const,
          is_active: true,
          usage_limit: 10,
          api_access: false,
          lp_generated: 0,
          api_calls: 0
        };
        
        const { data: created, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single();
        
        if (createError) {
          console.error('❌ プロファイル作成エラー:', createError);
          return { success: false, error: 'プロファイル作成失敗', details: createError };
        }
        
        console.log('✅ プロファイル作成成功:', created);
        return { success: true, profile: created };
      }
      
      return { success: false, error: 'プロファイル取得エラー', details: profileError };
    }
    
    console.log('✅ プロファイル存在:', profile);
    
    // 3. 現在のURL状態
    console.log('\n3️⃣ 現在のURL状態:');
    console.log('  - href:', window.location.href);
    console.log('  - hash:', window.location.hash);
    
    return { success: true, session, profile };
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
    return { success: false, error: '予期しないエラー', details: error };
  } finally {
    console.groupEnd();
  }
};

// 強制的にプロファイルを作成
export const forceCreateProfile = async () => {
  console.log('🔨 強制プロファイル作成開始...');
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('セッションがありません');
    return false;
  }
  
  // 既存のプロファイルを削除（テスト用）
  await supabase.from('users').delete().eq('id', session.user.id);
  
  // 新規作成
  const result = await testAuthFlow();
  return result.success;
};

// グローバルに公開
if (typeof window !== 'undefined') {
  (window as any).testAuthFlow = testAuthFlow;
  (window as any).forceCreateProfile = forceCreateProfile;
}