-- saved_contentsテーブルの外部キー制約を修正（UUID型を考慮）
-- 既存の外部キー制約を削除（存在する場合）
ALTER TABLE saved_contents DROP CONSTRAINT IF EXISTS saved_contents_user_id_fkey;

-- user_id列の型を確認して、必要に応じてUUID型に変更
-- ただし、データが既に存在する場合は注意が必要
DO $$
DECLARE
    user_id_type text;
BEGIN
    -- user_id列の現在の型を取得
    SELECT data_type INTO user_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'saved_contents'
    AND column_name = 'user_id';
    
    -- text型の場合はそのまま、UUID型でない場合は変更を検討
    RAISE NOTICE 'Current user_id type: %', user_id_type;
END $$;

-- publicスキーマのusersテーブルが存在するか確認
DO $$
DECLARE
    public_users_exists boolean;
    auth_users_exists boolean;
BEGIN
    -- publicスキーマのusersテーブルの存在確認
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) INTO public_users_exists;
    
    -- authスキーマのusersテーブルの存在確認
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) INTO auth_users_exists;
    
    IF public_users_exists THEN
        RAISE NOTICE 'Using public.users table for foreign key';
        -- public.usersを参照する外部キー制約を追加（id列の型が一致する場合）
        ALTER TABLE saved_contents
        ADD CONSTRAINT saved_contents_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
    ELSIF auth_users_exists THEN
        RAISE NOTICE 'Need to handle auth.users table reference';
        -- auth.usersを参照する場合は、型変換が必要
        -- これは直接的な外部キー制約では難しいため、トリガーで対応することを推奨
    END IF;
END $$;

-- テーブルのRLSが有効になっていることを確認
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can view their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can create their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can update their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can delete their own saved contents" ON saved_contents;

-- 新しいRLSポリシーを作成（user_idがtext型の場合）
-- auth.uid()はUUID型を返すので、text型にキャストして比較
CREATE POLICY "Users can view their own saved contents" ON saved_contents
    FOR SELECT
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own saved contents" ON saved_contents
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own saved contents" ON saved_contents
    FOR UPDATE
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own saved contents" ON saved_contents
    FOR DELETE
    USING (user_id = auth.uid()::text);

-- 確認
SELECT * FROM pg_policies WHERE tablename = 'saved_contents';