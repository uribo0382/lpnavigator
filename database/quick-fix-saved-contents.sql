-- 既存のテーブルが存在する場合は削除して再作成（開発環境のみ）
-- 本番環境では使用しないでください！
DROP TABLE IF EXISTS saved_contents CASCADE;

-- saved_contentsテーブルを作成
CREATE TABLE saved_contents (
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
CREATE INDEX idx_saved_contents_user_id ON saved_contents(user_id);
CREATE INDEX idx_saved_contents_created_at ON saved_contents(created_at);
CREATE INDEX idx_saved_contents_updated_at ON saved_contents(updated_at);

-- RLSの有効化
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
CREATE POLICY "Enable all operations for users on their own data" ON saved_contents
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
CREATE TRIGGER update_saved_contents_updated_at
    BEFORE UPDATE ON saved_contents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- テーブルの権限を確認
GRANT ALL ON saved_contents TO authenticated;
GRANT USAGE ON SEQUENCE saved_contents_id_seq TO authenticated;

-- テスト挿入
DO $$
BEGIN
    -- 現在の認証ユーザーで挿入テスト
    INSERT INTO saved_contents (
        user_id,
        title,
        content_type,
        progress,
        answers,
        session_data
    ) VALUES (
        auth.uid(),
        'システムテスト',
        'basic_info',
        0,
        '{}'::jsonb,
        '{}'::jsonb
    );
    
    -- 成功した場合は削除
    DELETE FROM saved_contents WHERE title = 'システムテスト' AND user_id = auth.uid();
    
    RAISE NOTICE 'テーブルの作成とテストが成功しました';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'エラーが発生しました: %', SQLERRM;
END $$;

-- 最終確認
SELECT 
    'Table exists' as check_type,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_contents') as result
UNION ALL
SELECT 
    'Has RLS enabled',
    rowsecurity::boolean
FROM pg_tables 
WHERE tablename = 'saved_contents'
UNION ALL
SELECT 
    'Policy count',
    COUNT(*)::boolean
FROM pg_policies 
WHERE tablename = 'saved_contents';