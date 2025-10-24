-- ========================================
-- ユーザーテーブルのRLS問題を完全に修正
-- ========================================
-- このSQLをSupabase SQL Editorで実行してください

-- 1. 現在の状態を確認
SELECT 
  'Current RLS Status:' as info,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'users';

-- 2. RLSを無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. すべてのロールに適切な権限を付与
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO service_role;

-- 4. 既存のRLSポリシーをすべて削除
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
END $$;

-- 5. データ型の修正（必要に応じて）
-- is_activeがテキスト型の場合はブール型に変換
DO $$
BEGIN
    -- カラムのデータ型を確認
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_active' 
        AND data_type = 'text'
    ) THEN
        -- 一時カラムを作成
        ALTER TABLE users ADD COLUMN is_active_temp BOOLEAN;
        
        -- データを変換
        UPDATE users 
        SET is_active_temp = CASE 
            WHEN is_active IN ('true', 't', '1') THEN true
            WHEN is_active IN ('false', 'f', '0') THEN false
            ELSE true
        END;
        
        -- 古いカラムを削除し、新しいカラムをリネーム
        ALTER TABLE users DROP COLUMN is_active;
        ALTER TABLE users RENAME COLUMN is_active_temp TO is_active;
        
        -- NOT NULL制約を追加
        ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;
        ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;
    END IF;
END $$;

-- 6. 確認：すべてのユーザーを表示
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

-- 7. 統計情報
SELECT 
  'User Statistics:' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users
FROM users;

-- 8. 権限の確認
SELECT 
  'Permissions for users table:' as info,
  grantee, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;