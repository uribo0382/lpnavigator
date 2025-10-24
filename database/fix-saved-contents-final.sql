-- 既存のRLSポリシーをすべて削除
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

-- RLSを一旦無効化
ALTER TABLE saved_contents DISABLE ROW LEVEL SECURITY;

-- テーブルに必要な権限を付与
GRANT ALL ON saved_contents TO authenticated;
GRANT ALL ON saved_contents TO anon;

-- RLSを再度有効化
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

-- シンプルで包括的なRLSポリシーを作成
CREATE POLICY "Enable access for authenticated users" ON saved_contents
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 確認
SELECT 
    'Table exists' as check_item,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_contents') as status
UNION ALL
SELECT 
    'RLS enabled',
    rowsecurity::boolean
FROM pg_tables WHERE tablename = 'saved_contents'
UNION ALL
SELECT 
    'Policy exists',
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'saved_contents') as status
UNION ALL
SELECT 
    'Authenticated can INSERT',
    has_table_privilege('authenticated', 'saved_contents', 'INSERT') as status;

-- ポリシーの詳細を表示
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'saved_contents';