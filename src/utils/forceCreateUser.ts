// Service Roleキーを使用して強制的にユーザーを作成（開発環境のみ）
export const forceCreateUserWithServiceRole = async () => {
  console.log('=== Force Create User with Service Role ===');
  console.warn('⚠️ この方法は開発環境でのみ使用してください！');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('Service role key not found');
    return;
  }
  
  // LocalStorageから認証情報を取得
  const authKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
  const authData = localStorage.getItem(authKey);
  
  if (!authData) {
    console.error('No auth data in localStorage');
    return;
  }
  
  try {
    const auth = JSON.parse(authData);
    console.log('Auth user:', auth.user?.email);
    
    if (!auth.user) {
      console.error('No user in auth data');
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
    
    console.log('Creating user with service role:', userData);
    
    // Service Roleキーを使用（RLSをバイパス）
    const response = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('✅ User created successfully with service role');
      setTimeout(() => {
        console.log('Reloading page...');
        window.location.reload();
      }, 1000);
    } else {
      console.error('Failed to create user');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('=== End ===');
};

// 別の方法：curlコマンドを生成
export const generateCurlCommand = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  // LocalStorageから認証情報を取得
  const authKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
  const authData = localStorage.getItem(authKey);
  
  if (!authData) {
    console.error('No auth data');
    return;
  }
  
  const auth = JSON.parse(authData);
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
  
  const curlCommand = `curl -X POST '${supabaseUrl}/rest/v1/users' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: ${serviceRoleKey}' \\
  -H 'Authorization: Bearer ${serviceRoleKey}' \\
  -H 'Prefer: return=representation' \\
  -d '${JSON.stringify(userData)}'`;
  
  console.log('=== CURL Command (run in terminal) ===');
  console.log(curlCommand);
  console.log('=== End ===');
  
  // クリップボードにコピー
  navigator.clipboard.writeText(curlCommand).then(() => {
    console.log('✅ Command copied to clipboard');
  });
};

// グローバルに追加
if (typeof window !== 'undefined') {
  (window as any).forceCreateUser = forceCreateUserWithServiceRole;
  (window as any).generateCurl = generateCurlCommand;
}