-- 現在のユーザーIDを確認
SELECT auth.uid() as current_user_id;

-- saved_contentsテーブルの存在とRLS状態を確認
SELECT 
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'saved_contents';

-- RLSポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'saved_contents';

-- 手動でデータ挿入をテスト（管理者権限で）
-- 注意: YOUR_USER_IDを実際のユーザーIDに置き換えてください
INSERT INTO saved_contents (
    user_id,
    title,
    content_type,
    progress,
    answers,
    session_data
) VALUES (
    'YOUR_USER_ID',  -- ここに実際のユーザーIDを入れてください
    'テストデータ',
    'basic_info',
    50,
    '{"q1": "テスト回答1", "q2": "テスト回答2"}'::jsonb,
    '{"sessionId": "test-session-id"}'::jsonb
) RETURNING *;

-- エラーが出る場合、RLSを一時的に無効化してテスト
-- ALTER TABLE saved_contents DISABLE ROW LEVEL SECURITY;
-- 上記のINSERTを再実行
-- ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;