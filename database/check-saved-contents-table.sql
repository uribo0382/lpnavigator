-- saved_contentsテーブルの存在確認
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'saved_contents'
) as table_exists;

-- テーブルが存在する場合、カラム情報を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'saved_contents'
ORDER BY ordinal_position;

-- テーブルのデータ件数を確認
SELECT COUNT(*) as record_count FROM saved_contents;

-- RLSポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'saved_contents';