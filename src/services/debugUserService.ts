import { supabase } from '../lib/supabase';

export async function debugUsersData() {
  console.log('=== DEBUG: Direct Supabase Users Query ===');
  
  try {
    // 1. 生のデータを取得
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Total users found:', data?.length || 0);
    
    // 2. 各ユーザーの詳細を表示
    data?.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role, 'Type:', typeof user.role);
      console.log('is_active:', user.is_active, 'Type:', typeof user.is_active);
      console.log('plan:', user.plan);
    });
    
    // 3. roleごとの集計
    const roleCount = data?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n--- Role Summary ---');
    console.log('Role counts:', roleCount);
    
    // 4. RLSチェック
    console.log('\n--- RLS Check ---');
    const { data: rlsData, error: rlsError } = await supabase.rpc('current_setting', {
      setting: 'row_security.active'
    }).single();
    
    console.log('RLS status:', rlsData || 'Could not determine');
    
  } catch (err) {
    console.error('Debug error:', err);
  }
  
  console.log('=== END DEBUG ===');
}

// ページコンポーネントで使用: debugUsersData();