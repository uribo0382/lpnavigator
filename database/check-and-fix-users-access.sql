-- ========================================
-- ユーザーテーブルアクセス問題の診断と修正
-- ========================================
-- このSQLファイルをSupabase GUIで実行してください

-- 1. usersテーブルのRLS状態を確認
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'users';

-- 2. usersテーブルに存在するデータを確認
SELECT 
  id, 
  email, 
  name, 
  role, 
  plan, 
  is_active,
  created_at
FROM users
ORDER BY created_at DESC;

-- 3. データ数を確認
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users
FROM users;

-- 4. RLSが有効な場合は、一時的に無効化（開発環境のみ）
-- 注意: 本番環境では適切なRLSポリシーを設定してください
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 5. RLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users';

-- 6. Anon（匿名）ユーザーに読み取り権限を付与
-- 注意: 本番環境では適切な権限設定を行ってください
GRANT SELECT ON users TO anon;

-- 7. 確認用: 権限を確認
SELECT 
  grantee, 
  table_schema, 
  table_name, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;