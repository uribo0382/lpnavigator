-- questionsテーブルのRLSを修正するSQL

-- 1. RLSを無効化（開発環境用）
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- または、本番環境用に適切なポリシーを設定する場合：

-- 2. 既存のポリシーを削除（存在する場合）
-- DROP POLICY IF EXISTS "Enable read access for all users" ON questions;
-- DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON questions;
-- DROP POLICY IF EXISTS "Enable update for authenticated users only" ON questions;
-- DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON questions;

-- 3. RLSを有効化して適切なポリシーを設定
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 4. 読み取りは全ユーザーに許可
-- CREATE POLICY "Enable read access for all users" ON questions
--     FOR SELECT
--     USING (true);

-- 5. 挿入、更新、削除は認証されたユーザーのみ許可
-- CREATE POLICY "Enable insert for authenticated users only" ON questions
--     FOR INSERT
--     WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Enable update for authenticated users only" ON questions
--     FOR UPDATE
--     USING (auth.role() = 'authenticated')
--     WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Enable delete for authenticated users only" ON questions
--     FOR DELETE
--     USING (auth.role() = 'authenticated');