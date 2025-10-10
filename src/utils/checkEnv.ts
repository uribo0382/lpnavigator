// 環境変数をチェックする関数
export const checkEnvironmentVariables = () => {
  console.log('=== Environment Variables Check ===');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('VITE_SUPABASE_URL:', supabaseUrl);
  console.log('URL format check:', {
    startsWithHttps: supabaseUrl?.startsWith('https://'),
    endsWithSupabaseCo: supabaseUrl?.endsWith('.supabase.co'),
    hasProjectId: supabaseUrl?.includes('.supabase.co'),
    length: supabaseUrl?.length
  });
  
  console.log('\nVITE_SUPABASE_ANON_KEY:', {
    exists: !!supabaseAnonKey,
    length: supabaseAnonKey?.length,
    startsWithEyJ: supabaseAnonKey?.startsWith('eyJ'), // JWTは通常eyJで始まる
    firstChars: supabaseAnonKey?.substring(0, 20) + '...'
  });
  
  // URLの妥当性チェック
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      console.log('\nParsed URL:', {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 'default',
        pathname: url.pathname
      });
      
      // プロジェクトIDを抽出
      const projectId = url.hostname.split('.')[0];
      console.log('Project ID:', projectId);
      
    } catch (error) {
      console.error('Invalid URL format:', error);
    }
  }
  
  // 直接curlコマンドをテスト（ブラウザでは実行不可）
  console.log('\n=== Test Commands (run in terminal) ===');
  console.log(`curl -X GET "${supabaseUrl}/rest/v1/" -H "apikey: ${supabaseAnonKey?.substring(0, 20)}..." -H "Authorization: Bearer ${supabaseAnonKey?.substring(0, 20)}..."`);
  
  console.log('\n=== End Environment Check ===');
};

// 単純なfetchでSupabaseをテスト
export const testDirectFetch = async () => {
  console.log('=== Direct Fetch Test ===');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  try {
    console.log('Testing direct fetch to Supabase...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Response error:', text);
    } else {
      console.log('✅ Direct fetch successful');
    }
    
  } catch (error) {
    console.error('Direct fetch failed:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('This might be a CORS issue or network problem');
      console.error('Check browser Network tab for more details');
    }
  }
  
  console.log('=== End Direct Fetch Test ===');
};

// window オブジェクトに追加
if (typeof window !== 'undefined') {
  (window as any).checkEnv = checkEnvironmentVariables;
  (window as any).testDirectFetch = testDirectFetch;
}