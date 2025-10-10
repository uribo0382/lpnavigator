// 強制ログアウトユーティリティ
// Supabaseクライアントが正常に動作しない場合の緊急措置

export const forceLogout = () => {
  console.log('強制ログアウトを実行します...');
  
  // 1. localStorageから認証情報を削除
  const keysToRemove = [
    'sb-localhost-auth-token',
    'supabase.auth.token',
  ];
  
  // Supabase関連のすべてのキーを削除
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
      console.log(`Removing key: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // 2. sessionStorageもクリア
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
  
  // 3. Cookieもクリア（念のため）
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name.includes('supabase') || name.includes('sb-')) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
  
  console.log('✅ 強制ログアウト完了');
  console.log('ログインページにリダイレクトします...');
  
  // 4. ログインページにリダイレクト
  window.location.href = '/#/login';
  
  // 5. ページをリロード（完全にクリーンな状態にする）
  setTimeout(() => {
    window.location.reload();
  }, 100);
};

// グローバルに公開（デバッグ用）
if (typeof window !== 'undefined') {
  (window as any).forceLogout = forceLogout;
}