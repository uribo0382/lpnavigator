-- 警告: これは開発環境でのデバッグ専用です。本番環境では使用しないでください！

-- すべてのRLSポリシーを削除
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'saved_contents'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON saved_contents', policy_rec.policyname);
    END LOOP;
END $$;

-- RLSを無効化
ALTER TABLE saved_contents DISABLE ROW LEVEL SECURITY;

-- 確認
SELECT 
    'RLS Status' as info,
    CASE 
        WHEN rowsecurity THEN 'ENABLED - 問題の可能性あり'
        ELSE 'DISABLED - デバッグモード'
    END as status,
    'RLSが無効化されました。テストしてみてください。' as message
FROM pg_tables 
WHERE tablename = 'saved_contents';

-- RLSを再度有効化する場合は以下を実行：
-- ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable access for authenticated users" ON saved_contents
--     FOR ALL
--     TO authenticated
--     USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id);