import { supabase } from './supabase';

// タイムアウト付きクエリ実行関数
export async function queryWithTimeout<T>(
  query: Promise<T>,
  timeoutMs: number = 5000,
  operationName: string = 'Query'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([query, timeoutPromise]);
    return result;
  } catch (error) {
    console.error(`${operationName} failed:`, error);
    throw error;
  }
}

// ユーザープロフィール取得（タイムアウト付き）
export async function getUserProfileWithTimeout(userId: string) {
  console.log('getUserProfileWithTimeout: Starting query with 5s timeout');
  
  try {
    const result = await queryWithTimeout(
      supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single(),
      5000,
      'getUserProfile'
    );
    
    console.log('getUserProfileWithTimeout: Query completed successfully');
    return result;
  } catch (error: any) {
    console.error('getUserProfileWithTimeout: Query failed');
    
    if (error.message.includes('timed out')) {
      console.error('Query timed out - possible causes:');
      console.error('1. Network issues');
      console.error('2. Supabase service is down');
      console.error('3. CORS issues');
      console.error('4. Invalid Supabase URL or keys');
      
      // ネットワーク状態を確認
      console.log('Navigator online:', navigator.onLine);
      
      // Supabase URLを確認
      console.log('Supabase URL:', supabase.supabaseUrl);
    }
    
    throw error;
  }
}

// テスト用：単純なクエリを実行
export async function testSimpleQuery() {
  console.log('=== Testing Simple Query ===');
  
  try {
    // 1. Auth状態を確認
    console.log('1. Checking auth status...');
    const { data: { session }, error: sessionError } = await queryWithTimeout(
      supabase.auth.getSession(),
      3000,
      'getSession'
    );
    console.log('Session:', !!session);
    console.log('Session error:', sessionError);
    
    // 2. 単純なクエリを実行（limit付き）
    console.log('\n2. Testing simple SELECT query...');
    const { data, error } = await queryWithTimeout(
      supabase.from('users').select('id').limit(1),
      3000,
      'simpleSelect'
    );
    console.log('Simple query result:', data);
    console.log('Simple query error:', error);
    
    // 3. カウントクエリを実行
    console.log('\n3. Testing count query...');
    const { count, error: countError } = await queryWithTimeout(
      supabase.from('users').select('*', { count: 'exact', head: true }),
      3000,
      'countQuery'
    );
    console.log('Count:', count);
    console.log('Count error:', countError);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  console.log('=== End Test ===');
}

// グローバルに公開
if (typeof window !== 'undefined') {
  (window as any).testSimpleQuery = testSimpleQuery;
  (window as any).getUserProfileWithTimeout = getUserProfileWithTimeout;
}