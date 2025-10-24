-- saved_contentsテーブルにRLSを有効化
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can create their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can update their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can delete their own saved contents" ON saved_contents;

-- ユーザーは自分の保存データのみ参照可能
CREATE POLICY "Users can view their own saved contents" ON saved_contents
    FOR SELECT
    USING (auth.uid() = user_id);

-- ユーザーは自分の保存データを作成可能
CREATE POLICY "Users can create their own saved contents" ON saved_contents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の保存データのみ更新可能
CREATE POLICY "Users can update their own saved contents" ON saved_contents
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の保存データのみ削除可能
CREATE POLICY "Users can delete their own saved contents" ON saved_contents
    FOR DELETE
    USING (auth.uid() = user_id);

-- 確認
SELECT * FROM pg_policies WHERE tablename = 'saved_contents';