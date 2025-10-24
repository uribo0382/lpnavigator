-- saved_contentsテーブルのRLSポリシーを修正（user_idがUUID型の場合）
-- テーブルのRLSが有効になっていることを確認
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can view their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can create their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can update their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can delete their own saved contents" ON saved_contents;

-- 新しいRLSポリシーを作成
-- user_idがUUID型でauth.uid()もUUID型を返すので、直接比較可能
CREATE POLICY "Users can view their own saved contents" ON saved_contents
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own saved contents" ON saved_contents
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own saved contents" ON saved_contents
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own saved contents" ON saved_contents
    FOR DELETE
    USING (user_id = auth.uid());

-- 確認
SELECT * FROM pg_policies WHERE tablename = 'saved_contents';

-- カラムの型を確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'saved_contents' 
AND column_name = 'user_id';

-- テスト: 現在のユーザーIDでデータを挿入できるか確認（コメントアウト）
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
--     '{}'::jsonb
-- ) RETURNING *;