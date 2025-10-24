-- 質問テーブルのデバッグ用SQL

-- 1. 質問テーブルの存在確認
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'questions'
) as table_exists;

-- 2. 質問データの件数確認
SELECT COUNT(*) as total_questions FROM questions;

-- 3. アクティブな質問の件数確認
SELECT COUNT(*) as active_questions FROM questions WHERE is_active = true;

-- 4. 質問データの確認（最初の5件）
SELECT id, text, category, order_number, is_active, helper_text, is_required 
FROM questions 
ORDER BY order_number 
LIMIT 5;

-- 5. RLSの状態確認
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'questions';

-- 6. RLSが有効かどうか確認
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'questions';

-- 7. 現在のユーザー権限確認
SELECT current_user, session_user;