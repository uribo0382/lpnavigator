-- LP Navigator v1 - データベーススキーマテスト用SQL
-- スキーマが正しく作成されているかを確認するためのテストクエリ

-- ===========================================
-- 1. テーブル存在確認
-- ===========================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 'questions', 'formulas', 'question_sessions', 'question_answers',
        'basic_infos', 'ad_copies', 'lp_articles', 'content_history', 'plans',
        'subscriptions', 'payments', 'usage_logs', 'teams', 'team_members', 'uploaded_files'
    )
ORDER BY table_name;

-- ===========================================
-- 2. カラム構造確認
-- ===========================================

-- ユーザーテーブルのカラム確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 質問テーブルのカラム確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 3. 外部キー制約確認
-- ===========================================
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ===========================================
-- 4. インデックス確認
-- ===========================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'questions', 'formulas', 'question_sessions', 'question_answers',
        'basic_infos', 'ad_copies', 'lp_articles', 'content_history'
    )
ORDER BY tablename, indexname;

-- ===========================================
-- 5. トリガー確認
-- ===========================================
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- ===========================================
-- 6. RLS（Row Level Security）確認
-- ===========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'questions', 'formulas', 'question_sessions', 'question_answers',
        'basic_infos', 'ad_copies', 'lp_articles', 'content_history', 'usage_logs'
    )
ORDER BY tablename;

-- ===========================================
-- 7. ポリシー確認
-- ===========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===========================================
-- 8. プラン初期データ確認
-- ===========================================
SELECT 
    name,
    display_name,
    price_monthly,
    generation_limit,
    api_access,
    is_active
FROM plans
ORDER BY price_monthly;

-- ===========================================
-- 9. 質問初期データ確認
-- ===========================================
SELECT 
    text,
    category,
    order_number,
    is_active,
    is_required
FROM questions
ORDER BY order_number
LIMIT 5;

-- ===========================================
-- 10. フォーミュラ初期データ確認
-- ===========================================
SELECT 
    name,
    type,
    is_active,
    array_length(variables, 1) as variable_count
FROM formulas
ORDER BY type, name;

-- ===========================================
-- 11. テーブル行数確認
-- ===========================================
SELECT 
    schemaname,
    tablename,
    n_tup_ins as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'questions', 'formulas', 'plans'
    )
ORDER BY tablename;

-- ===========================================
-- 12. データ型制約確認
-- ===========================================

-- ユーザーロールの制約確認
SELECT 
    conname,
    consrc
FROM pg_constraint 
WHERE conname LIKE '%users%role%';

-- プランの制約確認
SELECT 
    conname,
    consrc
FROM pg_constraint 
WHERE conname LIKE '%users%plan%';

-- ===========================================
-- 13. 機能テスト用のサンプルクエリ
-- ===========================================

-- 1. ユーザー作成テスト（実際のauth.uid()が必要）
-- INSERT INTO users (email, name, role, plan) VALUES 
-- ('test@example.com', 'テストユーザー', 'user', 'free');

-- 2. 質問セッション作成テスト
-- INSERT INTO question_sessions (user_id, session_name) VALUES 
-- ('ユーザーID', 'テストセッション');

-- 3. 質問回答テスト
-- INSERT INTO question_answers (session_id, question_id, answer) VALUES 
-- ('セッションID', '質問ID', 'テスト回答');

-- 4. 基本情報生成テスト
-- INSERT INTO basic_infos (user_id, session_id, title, content, generated_by) VALUES 
-- ('ユーザーID', 'セッションID', 'テストタイトル', 'テストコンテンツ', 'gpt-4o');

-- ===========================================
-- 14. パフォーマンステスト用クエリ
-- ===========================================

-- インデックスが適切に使用されているかを確認
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM questions WHERE category = 'features' AND is_active = true;

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users WHERE email = 'test@example.com';

-- ===========================================
-- 完了メッセージ
-- ===========================================
-- スキーマテストが完了しました。
-- 全てのクエリが正常に実行されれば、スキーマは正しく作成されています。
-- エラーが発生した場合は、対応するテーブルまたは制約の作成を確認してください。