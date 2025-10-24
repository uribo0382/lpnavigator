-- ========================================
-- 1. question_sessionsテーブルのRLSポリシー
-- ========================================

-- RLSを有効化
ALTER TABLE question_sessions ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own question sessions" ON question_sessions;
DROP POLICY IF EXISTS "Users can create their own question sessions" ON question_sessions;
DROP POLICY IF EXISTS "Users can update their own question sessions" ON question_sessions;

-- ユーザーは自分のセッションのみ参照可能
CREATE POLICY "Users can view their own question sessions" ON question_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- ユーザーは自分のセッションを作成可能
CREATE POLICY "Users can create their own question sessions" ON question_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のセッションのみ更新可能
CREATE POLICY "Users can update their own question sessions" ON question_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 2. question_answersテーブルのRLSポリシー
-- ========================================

-- RLSを有効化
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own question answers" ON question_answers;
DROP POLICY IF EXISTS "Users can create their own question answers" ON question_answers;
DROP POLICY IF EXISTS "Users can update their own question answers" ON question_answers;

-- ユーザーは自分のセッションに紐づく回答のみ参照可能
CREATE POLICY "Users can view their own question answers" ON question_answers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM question_sessions 
            WHERE question_sessions.id = question_answers.session_id
            AND question_sessions.user_id = auth.uid()
        )
    );

-- ユーザーは自分のセッションに紐づく回答を作成可能
CREATE POLICY "Users can create their own question answers" ON question_answers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM question_sessions 
            WHERE question_sessions.id = question_answers.session_id
            AND question_sessions.user_id = auth.uid()
        )
    );

-- ユーザーは自分のセッションに紐づく回答のみ更新可能
CREATE POLICY "Users can update their own question answers" ON question_answers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM question_sessions 
            WHERE question_sessions.id = question_answers.session_id
            AND question_sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM question_sessions 
            WHERE question_sessions.id = question_answers.session_id
            AND question_sessions.user_id = auth.uid()
        )
    );

-- ========================================
-- 3. saved_contentsテーブルのRLSポリシー（再確認）
-- ========================================

-- RLSを有効化
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can create their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can update their own saved contents" ON saved_contents;
DROP POLICY IF EXISTS "Users can delete their own saved contents" ON saved_contents;

-- ユーザーは自分の保存データのみ参照可能
CREATE POLICY "Users can view their own saved contents" ON saved_contents
    FOR SELECT
    USING (auth.uid() = user_id);

-- ユーザーは自分の保存データを作成可能
CREATE POLICY "Users can create their own saved contents" ON saved_contents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の保存データのみ更新可能
CREATE POLICY "Users can update their own saved contents" ON saved_contents
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の保存データのみ削除可能
CREATE POLICY "Users can delete their own saved contents" ON saved_contents
    FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- 4. 確認クエリ
-- ========================================

-- 各テーブルのRLS状態を確認
SELECT 
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('question_sessions', 'question_answers', 'saved_contents');

-- 各テーブルのポリシーを確認
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('question_sessions', 'question_answers', 'saved_contents')
ORDER BY tablename, policyname;