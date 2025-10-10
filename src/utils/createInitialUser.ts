import { supabase } from '../lib/supabase';

// 手動で最初のユーザープロフィールを作成
export const createInitialUserProfile = async () => {
  console.log('=== Creating Initial User Profile ===');
  
  try {
    // 1. 現在のセッションを確認
    console.log('1. Getting current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return;
    }
    
    if (!session) {
      console.error('No active session. Please login first.');
      return;
    }
    
    console.log('Session found:', {
      userId: session.user.id,
      email: session.user.email,
      metadata: session.user.user_metadata
    });
    
    // 2. 既存のプロフィールを確認
    console.log('\n2. Checking existing profile...');
    const { data: existingProfile, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id);
    
    console.log('Existing profile check:', { 
      found: existingProfile?.length > 0, 
      error: checkError 
    });
    
    if (existingProfile && existingProfile.length > 0) {
      console.log('Profile already exists:', existingProfile[0]);
      return existingProfile[0];
    }
    
    // 3. 新しいプロフィールを作成
    console.log('\n3. Creating new profile...');
    const newProfile = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'ユーザー',
      role: 'user' as const,
      plan: 'free' as const,
      is_active: true,
      usage_limit: 10,
      api_access: false,
      lp_generated: 0,
      api_calls: 0
    };
    
    console.log('New profile data:', newProfile);
    
    const { data: createdProfile, error: createError } = await supabase
      .from('users')
      .insert(newProfile)
      .select()
      .single();
    
    if (createError) {
      console.error('Create error:', createError);
      console.error('Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      });
      return null;
    }
    
    console.log('✅ Profile created successfully:', createdProfile);
    return createdProfile;
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('=== End Create Profile ===');
};

// セッション情報を詳細に確認
export const debugSession = async () => {
  console.log('=== Debug Session ===');
  
  try {
    // getSessionを使用
    console.log('1. Using getSession()...');
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Session:', session);
    console.log('Error:', error);
    
    // getUserを使用
    console.log('\n2. Using getUser()...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', user);
    console.log('Error:', userError);
    
    // ローカルストレージを確認
    console.log('\n3. Checking localStorage...');
    const authToken = localStorage.getItem('sb-pvsornxlgfxowbqcsqjt-auth-token');
    if (authToken) {
      try {
        const parsed = JSON.parse(authToken);
        console.log('Auth token found:', {
          hasAccessToken: !!parsed.access_token,
          hasRefreshToken: !!parsed.refresh_token,
          expiresAt: parsed.expires_at ? new Date(parsed.expires_at * 1000).toLocaleString() : 'N/A'
        });
      } catch (e) {
        console.log('Auth token parsing failed:', e);
      }
    } else {
      console.log('No auth token found in localStorage');
    }
    
  } catch (error) {
    console.error('Debug session error:', error);
  }
  
  console.log('=== End Debug ===');
};

// グローバルに追加
if (typeof window !== 'undefined') {
  (window as any).createInitialUserProfile = createInitialUserProfile;
  (window as any).debugSession = debugSession;
}