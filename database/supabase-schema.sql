-- LP Navigator v1 - Supabase Database Schema
-- このSQLファイルをSupabaseのGUIで実行してデータベースを構築します

-- ===========================================
-- 1. ユーザー情報テーブル
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    plan VARCHAR(20) CHECK (plan IN ('free', 'standard', 'premium', 'enterprise')) DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- プロフィール情報
    company VARCHAR(255),
    position VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    
    -- 使用量制限
    usage_limit INTEGER DEFAULT 10, -- 月間生成回数制限（0は無制限）
    api_access BOOLEAN DEFAULT false,
    
    -- 使用量統計
    lp_generated INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0
);

-- ===========================================
-- 2. 質問データテーブル
-- ===========================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- problem, solution, features, benefits, social_proof, offer_details, cta
    order_number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    helper_text TEXT,
    sample_answer TEXT,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 3. フォーミュラ（プロンプトテンプレート）テーブル
-- ===========================================
CREATE TABLE IF NOT EXISTS formulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('basic_info', 'ad_copy', 'lp_article')) NOT NULL,
    template TEXT NOT NULL,
    variables TEXT[], -- 変数リストをJSON配列として保存
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    summary TEXT -- 概要説明
);

-- ===========================================
-- 4. 質問回答セッション
-- ===========================================
CREATE TABLE IF NOT EXISTS question_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false
);

-- ===========================================
-- 5. 質問回答データ
-- ===========================================
CREATE TABLE IF NOT EXISTS question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES question_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 6. 基本情報テーブル
-- ===========================================
CREATE TABLE IF NOT EXISTS basic_infos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES question_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    generated_by VARCHAR(50), -- どのAIモデルで生成されたか
    formula_id UUID REFERENCES formulas(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 7. 広告文テーブル
-- ===========================================
CREATE TABLE IF NOT EXISTS ad_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    basic_info_id UUID REFERENCES basic_infos(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    generated_by VARCHAR(50), -- どのAIモデルで生成されたか
    formula_id UUID REFERENCES formulas(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 8. LP記事テーブル
-- ===========================================
CREATE TABLE IF NOT EXISTS lp_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    basic_info_id UUID REFERENCES basic_infos(id) ON DELETE CASCADE,
    ad_copy_id UUID REFERENCES ad_copies(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    permalink VARCHAR(255),
    word_count INTEGER,
    generated_by VARCHAR(50), -- どのAIモデルで生成されたか
    formula_id UUID REFERENCES formulas(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 9. コンテンツ履歴テーブル（統合履歴管理）
-- ===========================================
CREATE TABLE IF NOT EXISTS content_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) CHECK (content_type IN ('basic_info', 'ad_copy', 'lp_article')) NOT NULL,
    content_id UUID NOT NULL, -- basic_infos.id, ad_copies.id, lp_articles.idのいずれか
    title VARCHAR(255) NOT NULL,
    meta_description TEXT,
    permalink VARCHAR(255),
    generated_by VARCHAR(50),
    word_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 10. プラン情報テーブル（将来の課金システム用）
-- ===========================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly INTEGER, -- 月額料金（セント単位）
    price_yearly INTEGER, -- 年額料金（セント単位）
    generation_limit INTEGER, -- 月間生成回数制限（0は無制限）
    api_access BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    features TEXT[], -- 機能リスト
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 11. サブスクリプション情報テーブル（将来の課金システム用）
-- ===========================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')) DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 12. 決済履歴テーブル（将来の課金システム用）
-- ===========================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount INTEGER NOT NULL, -- セント単位
    currency VARCHAR(3) DEFAULT 'JPY',
    status VARCHAR(50) CHECK (status IN ('succeeded', 'pending', 'failed', 'canceled')) DEFAULT 'pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 13. 使用量ログテーブル
-- ===========================================
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'basic_info_generation', 'ad_copy_generation', 'lp_article_generation', 'api_call'
    content_id UUID, -- 生成されたコンテンツのID
    generated_by VARCHAR(50), -- 使用したAIモデル
    tokens_used INTEGER, -- 使用トークン数
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 14. チーム情報テーブル（将来の機能用）
-- ===========================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 15. チームメンバー情報テーブル（将来の機能用）
-- ===========================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 複合ユニーク制約
    UNIQUE(team_id, user_id)
);

-- ===========================================
-- 16. ファイルアップロードテーブル（将来の機能用）
-- ===========================================
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    purpose VARCHAR(50), -- 'profile_image', 'content_image', 'document'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- インデックスの作成
-- ===========================================

-- ユーザーテーブル
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 質問テーブル
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(order_number);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active);

-- フォーミュラテーブル
CREATE INDEX IF NOT EXISTS idx_formulas_type ON formulas(type);
CREATE INDEX IF NOT EXISTS idx_formulas_is_active ON formulas(is_active);

-- 質問回答セッション
CREATE INDEX IF NOT EXISTS idx_question_sessions_user_id ON question_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_question_sessions_created_at ON question_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_question_sessions_is_completed ON question_sessions(is_completed);

-- 質問回答データ
CREATE INDEX IF NOT EXISTS idx_question_answers_session_id ON question_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_question_id ON question_answers(question_id);

-- 基本情報
CREATE INDEX IF NOT EXISTS idx_basic_infos_user_id ON basic_infos(user_id);
CREATE INDEX IF NOT EXISTS idx_basic_infos_session_id ON basic_infos(session_id);
CREATE INDEX IF NOT EXISTS idx_basic_infos_created_at ON basic_infos(created_at);

-- 広告文
CREATE INDEX IF NOT EXISTS idx_ad_copies_user_id ON ad_copies(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_copies_basic_info_id ON ad_copies(basic_info_id);
CREATE INDEX IF NOT EXISTS idx_ad_copies_created_at ON ad_copies(created_at);

-- LP記事
CREATE INDEX IF NOT EXISTS idx_lp_articles_user_id ON lp_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_articles_basic_info_id ON lp_articles(basic_info_id);
CREATE INDEX IF NOT EXISTS idx_lp_articles_permalink ON lp_articles(permalink);
CREATE INDEX IF NOT EXISTS idx_lp_articles_created_at ON lp_articles(created_at);

-- コンテンツ履歴
CREATE INDEX IF NOT EXISTS idx_content_history_user_id ON content_history(user_id);
CREATE INDEX IF NOT EXISTS idx_content_history_content_type ON content_history(content_type);
CREATE INDEX IF NOT EXISTS idx_content_history_created_at ON content_history(created_at);

-- サブスクリプション
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- 決済履歴
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 使用量ログ
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

-- チーム関連
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- ファイルアップロード
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_team_id ON uploaded_files(team_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_purpose ON uploaded_files(purpose);

-- ===========================================
-- トリガー関数の作成（updated_atの自動更新用）
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===========================================
-- updated_atトリガーの設定
-- ===========================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formulas_updated_at BEFORE UPDATE ON formulas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_sessions_updated_at BEFORE UPDATE ON question_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_answers_updated_at BEFORE UPDATE ON question_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_basic_infos_updated_at BEFORE UPDATE ON basic_infos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_copies_updated_at BEFORE UPDATE ON ad_copies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lp_articles_updated_at BEFORE UPDATE ON lp_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Row Level Security (RLS) の設定
-- ===========================================

-- ユーザーは自分のデータのみアクセス可能
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 質問は全ユーザーが読み取り可能、管理者のみ編集可能
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are viewable by all authenticated users" ON questions
    FOR SELECT USING (auth.role() = 'authenticated');

-- フォーミュラは全ユーザーが読み取り可能、管理者のみ編集可能
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Formulas are viewable by all authenticated users" ON formulas
    FOR SELECT USING (auth.role() = 'authenticated');

-- その他のテーブルは所有者のみアクセス可能
ALTER TABLE question_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions are viewable by owner" ON question_sessions
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers are viewable by session owner" ON question_answers
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM question_sessions WHERE id = session_id
    ));

ALTER TABLE basic_infos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Basic infos are viewable by owner" ON basic_infos
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE ad_copies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ad copies are viewable by owner" ON ad_copies
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE lp_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LP articles are viewable by owner" ON lp_articles
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Content history is viewable by owner" ON content_history
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usage logs are viewable by owner" ON usage_logs
    FOR ALL USING (auth.uid() = user_id);

-- ===========================================
-- 基本プランデータの挿入
-- ===========================================
INSERT INTO plans (name, display_name, description, price_monthly, price_yearly, generation_limit, api_access, priority_support, features) VALUES
('free', 'フリープラン', '無料で基本機能をお試しいただけます', 0, 0, 10, false, false, ARRAY['月10回までのコンテンツ生成', '基本テンプレート利用', 'コミュニティサポート']),
('standard', 'スタンダードプラン', '個人利用に最適なプランです', 980, 9800, 50, false, false, ARRAY['月50回までのコンテンツ生成', '全テンプレート利用', 'メールサポート', 'PDF出力機能']),
('premium', 'プレミアムプラン', 'プロフェッショナル向けの高機能プランです', 2980, 29800, 200, true, true, ARRAY['月200回までのコンテンツ生成', 'API アクセス', '優先サポート', 'チーム機能', '高度な分析機能']),
('enterprise', 'エンタープライズプラン', '大規模利用向けの無制限プランです', 9800, 98000, 0, true, true, ARRAY['無制限のコンテンツ生成', 'API アクセス', '専用サポート', 'チーム機能', 'カスタムテンプレート', 'SSO連携']);

-- ===========================================
-- 完了メッセージ
-- ===========================================
-- スキーマの作成が完了しました。
-- 次のステップ:
-- 1. Supabase GUIでこのSQLを実行
-- 2. auth.users テーブルとの連携設定
-- 3. ストレージバケットの設定（ファイルアップロード用）
-- 4. 環境変数の設定確認