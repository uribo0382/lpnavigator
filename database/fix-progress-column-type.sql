-- progressカラムの型をintegerからnumericに変更
ALTER TABLE saved_contents 
ALTER COLUMN progress TYPE NUMERIC(5,2) USING progress::numeric;

-- 確認
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'saved_contents'
AND column_name = 'progress';

-- テスト挿入
INSERT INTO saved_contents (
    user_id,
    title,
    content_type,
    progress,
    answers,
    session_data
) VALUES (
    auth.uid(),
    'テスト保存（小数値）',
    'basic_info',
    23.809523809523807,
    '{"test": "data"}'::jsonb,
    '{"test": true}'::jsonb
) RETURNING id, progress;

-- テストデータを削除
DELETE FROM saved_contents WHERE title = 'テスト保存（小数値）';