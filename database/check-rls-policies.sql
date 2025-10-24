-- RLSの状態とポリシーを確認するSQL

-- 1. questionsテーブルのRLSが有効かどうか確認
SELECT 
    tablename,
    rowsecurity 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename = 'questions';

-- 2. questionsテーブルのRLSポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public' 
    AND tablename = 'questions';

-- 3. 現在のユーザーとロールを確認
SELECT 
    current_user,
    current_role,
    session_user;

-- 4. RLSを無効化する場合（管理者権限が必要）
-- ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- 5. または、全ユーザーに対してCRUD操作を許可するポリシーを作成
-- CREATE POLICY "Enable all operations for authenticated users" ON questions
--     FOR ALL 
--     USING (true)
--     WITH CHECK (true);