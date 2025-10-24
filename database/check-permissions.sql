-- 現在のユーザーとロールを確認
SELECT 
    current_user,
    auth.uid() as auth_user_id,
    auth.role() as auth_role,
    auth.email() as auth_email;

-- saved_contentsテーブルの権限を確認
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'saved_contents'
ORDER BY grantee, privilege_type;

-- RLSポリシーの詳細確認
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
WHERE tablename = 'saved_contents';

-- authenticatedロールの権限確認
SELECT 
    has_table_privilege('authenticated', 'saved_contents', 'INSERT') as can_insert,
    has_table_privilege('authenticated', 'saved_contents', 'SELECT') as can_select,
    has_table_privilege('authenticated', 'saved_contents', 'UPDATE') as can_update,
    has_table_privilege('authenticated', 'saved_contents', 'DELETE') as can_delete;

-- anonロールの権限確認  
SELECT 
    has_table_privilege('anon', 'saved_contents', 'INSERT') as anon_can_insert,
    has_table_privilege('anon', 'saved_contents', 'SELECT') as anon_can_select,
    has_table_privilege('anon', 'saved_contents', 'UPDATE') as anon_can_update,
    has_table_privilege('anon', 'saved_contents', 'DELETE') as anon_can_delete;