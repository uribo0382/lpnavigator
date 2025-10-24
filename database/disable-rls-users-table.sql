-- ========================================
-- usersテーブルのRLSを一時的に無効化
-- ========================================
-- 注意: 本番環境では適切なRLSポリシーを設定してください

-- 1. 現在のRLS状態を確認
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'users';

-- 2. RLSを無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. 無効化後の確認
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'users';

-- 4. ユーザーデータの確認
SELECT 
  id,
  email,
  name,
  role,
  is_active
FROM users
ORDER BY created_at DESC;