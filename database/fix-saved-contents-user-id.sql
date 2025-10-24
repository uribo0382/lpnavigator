-- saved_contentsテーブルの列情報を再確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'saved_contents'
ORDER BY ordinal_position;

-- user_id列の制約を確認
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'saved_contents' AND tc.constraint_type = 'FOREIGN KEY';

-- RLSポリシーの詳細を確認
SELECT 
    polname as policy_name,
    polcmd as command,
    polqual::text as using_clause,
    polwithcheck::text as with_check_clause,
    polroles::regrole[] as roles
FROM pg_policy
WHERE polrelid = 'saved_contents'::regclass;

-- 現在のセッションユーザーを確認
SELECT 
    current_user,
    session_user,
    auth.uid() as auth_uid,
    auth.email() as auth_email,
    auth.role() as auth_role;

-- saved_contentsテーブルのuser_id列がauth.usersテーブルを参照しているか確認
SELECT EXISTS(
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'saved_contents' 
        AND kcu.column_name = 'user_id'
        AND ccu.table_name = 'users'
        AND tc.constraint_type = 'FOREIGN KEY'
) as has_users_fk;

-- auth.usersテーブルが存在するか確認
SELECT EXISTS(
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'auth' 
        AND table_name = 'users'
) as auth_users_exists;