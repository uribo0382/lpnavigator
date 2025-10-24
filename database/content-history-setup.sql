-- LP Navigator v1 - コンテンツ履歴機能のセットアップSQL
-- このSQLファイルをSupabaseのGUIで実行して、コンテンツ履歴機能を動的化します

-- ===========================================
-- 1. 基本情報テーブルの拡充（不足しているカラムの追加）
-- ===========================================

-- basic_infosテーブルに不足しているカラムを追加
ALTER TABLE basic_infos 
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS permalink VARCHAR(255),
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('draft', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 100 CHECK (progress >= 0 AND progress <= 100);

-- ===========================================
-- 2. 保存データ（作成途中）管理テーブル
-- ===========================================

-- 作成途中の保存データを管理するテーブル
CREATE TABLE IF NOT EXISTS saved_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) DEFAULT 'basic_info' CHECK (content_type IN ('basic_info', 'ad_copy', 'lp_article')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    answers JSONB NOT NULL DEFAULT '{}',
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- saved_contentsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_saved_contents_user_id ON saved_contents(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_contents_created_at ON saved_contents(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_contents_content_type ON saved_contents(content_type);

-- ===========================================
-- 3. モックデータの投入
-- ===========================================

-- 3.1 生成済み基本情報のサンプルデータ
INSERT INTO basic_infos (
    user_id, 
    title, 
    content, 
    meta_description,
    permalink,
    generated_by,
    word_count,
    status
) VALUES 
(
    (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1),
    'クラウド会計ソフトウェア基本情報',
    '株式会社FinTechソリューションズが提供するクラウド会計ソフトウェア「SmartAccounts」に関する基本情報です。

【商品・サービスの概要】
SmartAccountsは、中小企業向けのクラウド型会計ソフトウェアで、請求書発行から経費管理、決算書作成まで一気通貫で対応します。インターネット環境があればいつでもどこでも利用可能で、モバイルアプリにも対応しています。

【主な特徴】
- AI搭載のレシート読取機能で経費精算の手間を90%削減
- 銀行口座やクレジットカードと自動連携し、取引データを自動取得
- 税務申告に必要な書類を自動生成し、電子申告にも対応

【想定されるお客様】
従業員50名以下の中小企業、個人事業主、フリーランス。特に、経理担当者が少ない、または経理業務の効率化を図りたい企業に最適です。

【解決できる課題】
経理業務の属人化、手作業による記帳ミス、確定申告時の書類作成負担、リモートワーク時の経理業務遅延などの課題を解決します。

【提供価値】
経理業務の時間を最大70%削減し、本業に集中できる環境を提供します。また、リアルタイムの経営状況の可視化により、的確な経営判断をサポートします。

【料金体系】
スタータープラン：月額5,000円（年間契約で20%オフ）
ビジネスプラン：月額10,000円（年間契約で20%オフ）
エンタープライズプラン：月額20,000円（年間契約で20%オフ）
すべてのプランで14日間の無料トライアル可能。

【導入事例】
株式会社山田製作所（製造業、従業員30名）：経理業務時間が週15時間から5時間に削減
cafe Bloom（飲食業、従業員8名）：売上・経費の可視化により、利益率が15%向上
佐藤デザイン事務所（個人事業主）：確定申告準備時間が3日から半日に短縮

【お問い合わせ方法】
電話：03-1234-5678（平日9:00-18:00）
メール：info@smartaccounts.jp
公式サイト：https://www.smartaccounts.jp/contact',
    '中小企業向けクラウド会計ソフトウェアの特徴と導入メリットについての基本情報です。',
    'cloud-accounting-software-info',
    'gpt-4o',
    850,
    'completed'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1),
    'オーガニック食品宅配サービス基本情報',
    '株式会社グリーンテーブルが提供する「オーガニックライフ」に関する基本情報です。

【商品・サービスの概要】
オーガニックライフは、全国の厳選された有機栽培農家から直接仕入れた新鮮な野菜や果物、加工食品を定期的にご自宅にお届けする宅配サービスです。すべての食材は有機JAS認証を取得しており、安心・安全な食生活をサポートします。

【主な特徴】
- 契約農家から直送される完全無農薬・有機栽培の新鮮野菜
- 旬の食材を活かしたレシピ提案とミールキット同梱オプション
- 食材の生産者情報と栽培方法の完全開示による透明性

【想定されるお客様】
健康や食の安全性に関心の高い30〜50代の家族世帯、特に小さなお子様がいるご家庭や、食材の品質にこだわる方々。また、忙しくてスーパーに買い物に行く時間がない共働き世帯にも最適です。

【解決できる課題】
市販の食品に含まれる農薬や添加物への不安、忙しい日常での食材調達の時間的負担、食材の産地や栽培方法の不透明さなどの課題を解決します。

【提供価値】
安心・安全な食材を通じた家族の健康維持、食材調達にかかる時間の削減、環境に配慮した持続可能な消費活動への参加、地域農業の活性化への貢献などの価値を提供します。

【料金体系】
ベーシックセット（2〜3人家族向け）：週1回 3,980円
ファミリーセット（4〜5人家族向け）：週1回 5,980円
カスタムセット（好きな食材を選択）：週1回 基本料2,000円+選択食材料金
すべてのプランで初回お試し50%オフキャンペーン実施中。

【導入事例】
佐藤家（4人家族）：子どもの食物アレルギーに対する不安が解消され、家族全員の食事の質が向上
田中家（共働き夫婦）：食材買い出しの時間が週3時間削減され、週末の余暇時間が増加
山本さん（一人暮らし）：栄養バランスの良い食事で健康診断の数値が改善

【お問い合わせ方法】
電話：0120-123-456（毎日9:00-20:00）
メール：support@organiclife.jp
公式サイト：https://www.organiclife.jp/contact',
    '無農薬・有機栽培の新鮮食材を定期宅配するサービスについての基本情報です。',
    'organic-food-delivery-info',
    'claude-3-opus',
    920,
    'completed'
),
(
    (SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1),
    'オンラインヨガスタジオ基本情報',
    'YogaLifeStudioが提供する「どこでもヨガ」に関する基本情報です。

【商品・サービスの概要】
どこでもヨガは、自宅や外出先から参加できるオンラインヨガスタジオです。ライブクラスとオンデマンドレッスンを組み合わせたハイブリッド型で、場所や時間を選ばずに本格的なヨガレッスンを受講できます。初心者から上級者まで、様々なレベルやスタイルのクラスを提供しています。

【主な特徴】
- 一流インストラクターによるライブクラスを毎日20本以上配信
- 500本以上のレッスン動画がいつでも視聴可能なオンデマンドライブラリ
- インストラクターからリアルタイムでポーズの修正やアドバイスが受けられる双方向コミュニケーション

【想定されるお客様】
忙しい仕事や育児でスタジオに通う時間がない方、自宅で気軽にヨガを始めたい初心者、対面レッスンに抵抗がある方、地方在住でヨガスタジオへのアクセスが限られている方など。年齢層は20代から60代まで幅広く対応。

【解決できる課題】
スタジオまでの移動時間や固定スケジュールの制約、初心者の対面レッスンへの心理的ハードル、地方在住者のヨガ教室へのアクセス制限、コロナ禍における運動不足などの課題を解決します。

【提供価値】
時間や場所を選ばない柔軟なレッスン参加による健康維持・ストレス軽減、自分のペースでの継続的な練習環境の提供、オンラインでありながらパーソナルな指導を受けられるコミュニティ体験を提供します。

【料金体系】
ベーシックプラン：月額4,980円（オンデマンド動画見放題）
プレミアムプラン：月額7,980円（オンデマンド見放題＋週3回ライブクラス参加可能）
アンリミテッドプラン：月額12,980円（オンデマンド見放題＋ライブクラス無制限参加）
すべてのプランで7日間の無料トライアル可能。年間契約で20%オフ。

【導入事例】
鈴木さん（32歳、会社員）：通勤時間削減により週3回の継続的な参加が可能になり、慢性的な肩こりが改善
高橋さん（45歳、主婦）：子どもの送迎の合間にレッスン参加が可能になり、ストレス軽減と睡眠の質向上を実感
佐々木さん（58歳、自営業）：対面レッスンへの抵抗感がなくなり、半年間で体重5kg減、体力向上を達成

【お問い合わせ方法】
メール：info@dokodemo-yoga.jp
LINE公式アカウント：@dokodemo-yoga
公式サイト：https://www.dokodemo-yoga.jp/contact
電話サポート：平日10:00-18:00（0120-567-890）',
    '自宅で気軽に参加できるライブ配信・オンデマンドのヨガレッスンサービスについての基本情報です。',
    'online-yoga-studio-info',
    'gpt-4o',
    780,
    'completed'
);

-- 3.2 保存データ（作成途中）のサンプルデータ
INSERT INTO saved_contents (
    user_id,
    title,
    content_type,
    progress,
    answers,
    session_data
) VALUES
(
    (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1),
    'オンライン学習サービス提案書',
    'basic_info',
    75,
    '{
        "1": "プログラミング学習プラットフォーム「CodeMaster」",
        "2": "未経験からエンジニア転職を目指す25〜40代の社会人",
        "3": "現役エンジニアによるマンツーマン指導と実践的なプロジェクト課題",
        "4": "転職成功率98％、初心者でも6ヶ月で即戦力に",
        "5": "受講料全額返金保証制度あり"
    }'::jsonb,
    '{"currentQuestionIndex": 5, "totalQuestions": 21}'::jsonb
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1),
    '健康食品新商品企画書',
    'basic_info',
    45,
    '{
        "1": "発酵大豆パワーサプリメント「ソイヴィタル」",
        "2": "健康意識が高い40〜60代の男女",
        "3": "国産大豆100%使用、無添加製法による高品質サプリメント",
        "4": "継続的な摂取による免疫力向上と疲労回復効果"
    }'::jsonb,
    '{"currentQuestionIndex": 4, "totalQuestions": 21}'::jsonb
),
(
    (SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1),
    'コンサルティングサービス提案',
    'basic_info',
    30,
    '{
        "1": "中小企業向けDX推進コンサルティング「デジタルシフトパートナー」",
        "2": "従業員50名以下の製造業・小売業の経営者",
        "3": "低コストで導入可能なDXソリューションの提案と実装支援"
    }'::jsonb,
    '{"currentQuestionIndex": 3, "totalQuestions": 21}'::jsonb
);

-- 3.3 content_historyテーブルに履歴データを同期
INSERT INTO content_history (
    user_id,
    content_type,
    content_id,
    title,
    meta_description,
    permalink,
    generated_by,
    word_count,
    created_at
)
SELECT 
    user_id,
    'basic_info' as content_type,
    id as content_id,
    title,
    meta_description,
    permalink,
    generated_by,
    word_count,
    created_at
FROM basic_infos
WHERE status = 'completed'
ON CONFLICT DO NOTHING;

-- ===========================================
-- 4. トリガー関数の追加（saved_contents用）
-- ===========================================
CREATE TRIGGER update_saved_contents_updated_at BEFORE UPDATE ON saved_contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 5. Row Level Security (RLS) の設定（saved_contents用）
-- ===========================================
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Saved contents are viewable by owner" ON saved_contents
    FOR ALL USING (auth.uid() = user_id);

-- ===========================================
-- 6. ビューの作成（任意：複雑なクエリを簡単にするため）
-- ===========================================

-- 基本情報一覧ビュー（生成済み）
CREATE OR REPLACE VIEW v_basic_infos_completed AS
SELECT 
    bi.id,
    bi.user_id,
    bi.title,
    bi.meta_description,
    bi.permalink,
    bi.generated_by,
    bi.word_count,
    bi.status,
    bi.created_at,
    bi.updated_at,
    u.name as user_name,
    u.email as user_email
FROM basic_infos bi
LEFT JOIN users u ON bi.user_id = u.id
WHERE bi.status = 'completed';

-- 保存データ一覧ビュー
CREATE OR REPLACE VIEW v_saved_contents AS
SELECT 
    sc.id,
    sc.user_id,
    sc.title,
    sc.content_type,
    sc.progress,
    sc.answers,
    sc.session_data,
    sc.created_at,
    sc.updated_at,
    u.name as user_name,
    u.email as user_email
FROM saved_contents sc
LEFT JOIN users u ON sc.user_id = u.id;

-- ===========================================
-- 完了メッセージ
-- ===========================================
-- コンテンツ履歴機能のセットアップが完了しました。
-- 
-- 実装内容:
-- 1. basic_infosテーブルに必要なカラムを追加（meta_description, permalink, word_count, status, progress）
-- 2. saved_contentsテーブルを作成（作成途中のデータ管理用）
-- 3. モックデータを投入（生成済み基本情報3件、保存データ3件）
-- 4. content_historyテーブルにデータを同期
-- 5. saved_contents用のトリガーとRLSポリシーを設定
-- 6. データ取得を簡単にするためのビューを作成
--
-- 次のステップ:
-- 1. Supabase GUIでこのSQLを実行
-- 2. フロントエンドのContentHistory.tsxを動的化対応に修正
-- 3. Supabase接続とクエリを実装