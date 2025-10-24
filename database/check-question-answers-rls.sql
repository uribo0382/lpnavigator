-- question_answersテーブルのRLS状態を確認
SELECT 
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'question_answers';

-- RLSポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'question_answers';

-- question_sessionsテーブルのRLS状態も確認
SELECT 
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'question_sessions';

-- RLSポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'question_sessions';