-- saved_contentsテーブルの存在確認
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'saved_contents'
) as table_exists;

-- カラム情報の詳細
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'saved_contents'
ORDER BY ordinal_position;

-- 制約の確認
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'saved_contents'
ORDER BY tc.constraint_type;

-- RLSの状態確認
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'saved_contents';

-- RLSポリシーの確認
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'saved_contents';

-- 現在のユーザー情報
SELECT 
    current_user,
    session_user,
    auth.uid() as auth_uid,
    auth.role() as auth_role;

-- テスト挿入（DRY RUN - コメントアウト）
-- BEGIN;
-- INSERT INTO saved_contents (
--     user_id,
--     title,
--     content_type,
--     progress,
--     answers,
--     session_data
-- ) VALUES (
--     auth.uid(),
--     'テスト保存',
--     'basic_info',
--     50,
--     '{"q1": "回答1"}'::jsonb,
--     '{"test": true}'::jsonb
-- ) RETURNING *;
-- ROLLBACK;