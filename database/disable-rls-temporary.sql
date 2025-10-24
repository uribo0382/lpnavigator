-- 一時的にRLSを無効化（開発環境でのテストのみ）
-- 警告: 本番環境では実行しないでください！

-- RLSを無効化
ALTER TABLE saved_contents DISABLE ROW LEVEL SECURITY;

-- すべてのユーザーに権限を付与
GRANT ALL ON saved_contents TO authenticated;
GRANT ALL ON saved_contents TO anon;

-- テスト
SELECT 
    'RLS Status' as check,
    CASE 
        WHEN rowsecurity THEN 'ENABLED (問題あり)'
        ELSE 'DISABLED (テスト用)'
    END as status
FROM pg_tables 
WHERE tablename = 'saved_contents';

-- RLSを再度有効化するには：
-- ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;