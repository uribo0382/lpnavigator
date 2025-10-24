-- 質問テーブルのRLS設定を修正
-- questionsテーブルは認証されていないユーザーでも読み取り可能にする

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Questions are viewable by all authenticated users" ON questions;

-- 新しいポリシー：すべてのユーザー（認証不要）が質問を読み取り可能
CREATE POLICY "Questions are viewable by all users" 
ON questions 
FOR SELECT 
USING (true);

-- 管理者のみが質問を作成・更新・削除可能
CREATE POLICY "Only admins can insert questions"
ON questions
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update questions" 
ON questions
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete questions"
ON questions
FOR DELETE
USING (auth.jwt() ->> 'role' = 'admin');