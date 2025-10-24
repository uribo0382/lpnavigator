-- saved_contentsテーブルの外部キー制約を修正
-- 既存の外部キー制約を削除（存在する場合）
ALTER TABLE saved_contents DROP CONSTRAINT IF EXISTS saved_contents_user_id_fkey;

-- auth.usersテーブルを参照する外部キー制約を追加
ALTER TABLE saved_contents
ADD CONSTRAINT saved_contents_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- テーブルのRLSが有効になっていることを確認
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can view their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can create their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can update their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can delete their own saved contents" ON saved_contents;

-- 新しいRLSポリシーを作成（auth.uid()を使用）
CREATE POLICY "Users can view their own saved contents" ON saved_contents
    FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own saved contents" ON saved_contents
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own saved contents" ON saved_contents
    FOR UPDATE
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own saved contents" ON saved_contents
    FOR DELETE
    USING (auth.uid()::text = user_id);

-- 確認
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

-- RLSポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'saved_contents';