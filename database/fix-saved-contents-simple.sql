-- saved_contentsテーブルのRLSポリシーのみを修正（外部キー制約なし）
-- テーブルのRLSが有効になっていることを確認
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can view their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can create their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can update their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can delete their own saved contents" ON saved_contents;

-- 新しいRLSポリシーを作成
-- user_idがtext型でauth.uid()がUUID型の場合を考慮
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

-- テスト: 現在のユーザーIDでデータを挿入できるか確認
-- INSERT INTO saved_contents (
--     user_id,
--     title,
--     content_type,
--     progress,
--     answers,
--     session_data
-- ) VALUES (
--     auth.uid()::text,
--     'テスト保存',
--     'basic_info',
--     50,
--     '{"q1": "回答1"}'::jsonb,
--     '{}'::jsonb
-- ) RETURNING *;