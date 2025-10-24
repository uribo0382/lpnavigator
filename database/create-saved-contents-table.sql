-- saved_contentsテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS saved_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'basic_info',
    progress NUMERIC DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    session_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_saved_contents_user_id ON saved_contents(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_contents_created_at ON saved_contents(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_contents_updated_at ON saved_contents(updated_at);

-- RLSの有効化
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成（既存のものがあれば削除）
DROP POLICY IF EXISTS "Users can view their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can create their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can update their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can delete their own saved contents" ON saved_contents;

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

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
DROP TRIGGER IF EXISTS update_saved_contents_updated_at ON saved_contents;
CREATE TRIGGER update_saved_contents_updated_at
    BEFORE UPDATE ON saved_contents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- テーブル構造の確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'saved_contents'
ORDER BY ordinal_position;