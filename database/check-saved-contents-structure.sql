-- saved_contentsテーブルの列情報を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'saved_contents'
ORDER BY ordinal_position;

-- auth.usersテーブルのid列の型を確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND column_name = 'id';

-- publicスキーマのusersテーブルが存在する場合、その構造も確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name = 'id';

-- 現在の外部キー制約を確認
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
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