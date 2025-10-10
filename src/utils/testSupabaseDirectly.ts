import { supabase } from '../lib/supabase';

// 直接REST APIを使用してusersテーブルをクエリ
export const testDirectRestApi = async (userId: string) => {
  console.log('=== Testing Direct REST API ===');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  try {
    // 1. 全ユーザーを取得（制限付き）
    console.log('1. Fetching all users (limit 5)...');
    const allUsersResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=*&limit=5`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('All users response:', {
      status: allUsersResponse.status,
      statusText: allUsersResponse.statusText
    });
    
    if (allUsersResponse.ok) {
      const users = await allUsersResponse.json();
      console.log('Users found:', users.length);
      console.log('Users:', users);
    }
    
    // 2. 特定のユーザーを取得
    console.log(`\n2. Fetching specific user: ${userId}...`);
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log('Specific user response:', {
      status: userResponse.status,
      statusText: userResponse.statusText
    });
    
    const responseText = await userResponse.text();
    console.log('Response text:', responseText);
    
    if (userResponse.ok && responseText) {
      try {
        const user = JSON.parse(responseText);
        console.log('✅ User found:', user);
      } catch (e) {
        console.log('Response is not JSON:', responseText);
      }
    }
    
    // 3. INSERTテスト（新しいユーザーを作成）
    console.log('\n3. Testing INSERT...');
    const newUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      plan: 'free',
      is_active: true,
      usage_limit: 10,
      api_access: false,
      lp_generated: 0,
      api_calls: 0
    };
    
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(newUser)
    });
    
    console.log('Insert response:', {
      status: insertResponse.status,
      statusText: insertResponse.statusText
    });
    
    const insertResult = await insertResponse.text();
    console.log('Insert result:', insertResult);
    
  } catch (error) {
    console.error('Direct REST API test failed:', error);
  }
  
  console.log('=== End Direct REST API Test ===');
};

// RealtimeとPostgRESTの接続をテスト
export const testSupabaseConnections = async () => {
  console.log('=== Testing Supabase Connections ===');
  
  // 1. Auth接続テスト
  console.log('\n1. Testing Auth...');
  try {
    // getSession with timeout
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 3000)
    );
    
    const result = await Promise.race([sessionPromise, timeoutPromise]);
    console.log('✅ Auth is working:', result);
  } catch (error) {
    console.error('❌ Auth failed:', error);
  }
  
  // 2. Realtime接続テスト
  console.log('\n2. Testing Realtime...');
  const channel = supabase.channel('test-channel');
  
  // チャンネルの状態を監視
  channel.on('system', {}, (payload) => {
    console.log('Realtime system event:', payload);
  });
  
  const subscription = channel.subscribe((status) => {
    console.log('Realtime subscription status:', status);
    
    // 購読後にクリーンアップ
    if (status === 'SUBSCRIBED') {
      setTimeout(() => {
        console.log('Cleaning up realtime subscription...');
        supabase.removeChannel(channel);
      }, 1000);
    }
  });
  
  // 3. Storage接続テスト
  console.log('\n3. Testing Storage...');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Storage error:', error);
    } else {
      console.log('✅ Storage is working. Buckets:', data);
    }
  } catch (error) {
    console.error('❌ Storage failed:', error);
  }
  
  console.log('=== End Connection Tests ===');
};

// クライアントの内部状態を確認
export const inspectSupabaseClient = () => {
  console.log('=== Inspecting Supabase Client ===');
  
  // クライアントのプロパティを確認
  console.log('Supabase client properties:', {
    url: supabase.supabaseUrl,
    // @ts-ignore - 内部プロパティにアクセス
    headers: supabase._headers,
    // @ts-ignore
    schema: supabase._schema,
    // @ts-ignore
    fetch: supabase._fetch?.name,
    auth: {
      // @ts-ignore
      url: supabase.auth.url,
      // @ts-ignore
      headers: supabase.auth.headers,
    }
  });
  
  // PostgrestClientを直接確認
  // @ts-ignore
  const postgrestClient = supabase.rest;
  console.log('PostgrestClient:', {
    // @ts-ignore
    url: postgrestClient?.url,
    // @ts-ignore
    headers: postgrestClient?.headers,
    // @ts-ignore
    schema: postgrestClient?.schema,
  });
  
  console.log('=== End Client Inspection ===');
};

// グローバルに追加
if (typeof window !== 'undefined') {
  (window as any).testDirectRestApi = testDirectRestApi;
  (window as any).testSupabaseConnections = testSupabaseConnections;
  (window as any).inspectSupabaseClient = inspectSupabaseClient;
}