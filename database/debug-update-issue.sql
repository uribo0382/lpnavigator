-- 質問更新エラーのデバッグSQL

-- 1. 全質問のIDとorder_numberを確認
SELECT id, order_number, text 
FROM questions 
ORDER BY order_number;

-- 2. 特定のorder_numberの質問を確認（例：order_number = 1）
SELECT * FROM questions WHERE order_number = 1;

-- 3. 特定のIDの質問を確認（例：id = 'xxxx-xxxx-xxxx'）
-- SELECT * FROM questions WHERE id = 'YOUR_ID_HERE';

-- 4. 更新テスト（order_numberで取得したレコードのIDを使って更新）
-- UPDATE questions 
-- SET text = 'テスト更新' 
-- WHERE id = (SELECT id FROM questions WHERE order_number = 1);

-- 5. RLSの状態を確認
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'questions';

-- 6. 現在のセッション情報を確認
SELECT 
    current_user,
    session_user,
    current_database(),
    current_schema();