-- ========================================
-- LP記事履歴機能の動的化 - SQL設定
-- ========================================
-- このSQLファイルをSupabase GUIで実行してください
-- 実行前に既存データのバックアップを取ることを推奨します

-- ========================================
-- 1. LP記事履歴表示用ビューの作成
-- ========================================

-- 既存のビューがある場合は削除
DROP VIEW IF EXISTS lp_article_history_view;

-- LP記事履歴ビューを作成（基本情報、広告文、フォーミュラ情報を結合）
CREATE VIEW lp_article_history_view AS
SELECT 
    lp.id,
    lp.user_id,
    lp.title,
    lp.content,
    lp.meta_description,
    lp.permalink,
    lp.word_count,
    lp.generated_by,
    lp.created_at,
    lp.updated_at,
    lp.basic_info_id,
    lp.ad_copy_id,
    lp.formula_id,
    bi.title as basic_info_title,
    bi.content as basic_info_content,
    ac.title as ad_copy_title,
    ac.content as ad_copy_content,
    f.name as formula_name,
    f.type as formula_type
FROM lp_articles lp
LEFT JOIN basic_infos bi ON lp.basic_info_id = bi.id
LEFT JOIN ad_copies ac ON lp.ad_copy_id = ac.id
LEFT JOIN formulas f ON lp.formula_id = f.id
ORDER BY lp.created_at DESC;

-- ========================================
-- 2. サンプルLP記事データの挿入
-- ========================================

-- ユーザーが存在しない場合の処理
DO $$
DECLARE
    target_user_id UUID;
    basic_info_id_1 UUID;
    basic_info_id_2 UUID;
    basic_info_id_3 UUID;
    ad_copy_id_1 UUID;
    ad_copy_id_2 UUID;
    ad_copy_id_3 UUID;
    formula_id_1 UUID;
    formula_id_2 UUID;
BEGIN
    -- admin@example.comのユーザーIDを取得
    SELECT id INTO target_user_id 
    FROM users 
    WHERE email = 'admin@example.com' 
    LIMIT 1;
    
    -- ユーザーが存在しない場合は、最初のユーザーを使用
    IF target_user_id IS NULL THEN
        SELECT id INTO target_user_id 
        FROM users 
        LIMIT 1;
    END IF;
    
    -- それでもユーザーが存在しない場合はスキップ
    IF target_user_id IS NOT NULL THEN
        -- 基本情報のサンプルデータを確認（既存データを使用）
        SELECT id INTO basic_info_id_1
        FROM basic_infos
        WHERE user_id = target_user_id
        AND title LIKE '%AIを活用したコンテンツ作成ツール%'
        LIMIT 1;
        
        SELECT id INTO basic_info_id_2
        FROM basic_infos
        WHERE user_id = target_user_id
        AND title LIKE '%デジタルマーケティング支援サービス%'
        LIMIT 1;
        
        SELECT id INTO basic_info_id_3
        FROM basic_infos
        WHERE user_id = target_user_id
        AND title LIKE '%クラウドストレージソリューション%'
        LIMIT 1;
        
        -- 広告文のサンプルデータを確認（既存データを使用）
        SELECT id INTO ad_copy_id_1
        FROM ad_copies
        WHERE user_id = target_user_id
        AND title LIKE '%AIを活用したコンテンツ作成ツール%'
        AND generated_by = 'ChatGPT'
        LIMIT 1;
        
        SELECT id INTO ad_copy_id_2
        FROM ad_copies
        WHERE user_id = target_user_id
        AND title LIKE '%デジタルマーケティング支援サービス%'
        AND generated_by = 'Gemini'
        LIMIT 1;
        
        SELECT id INTO ad_copy_id_3
        FROM ad_copies
        WHERE user_id = target_user_id
        AND title LIKE '%クラウドストレージソリューション%'
        AND generated_by = 'Claude'
        LIMIT 1;
        
        -- LP記事用フォーミュラIDを取得
        SELECT id INTO formula_id_1
        FROM formulas
        WHERE type = 'lp_article'
        AND is_active = true
        LIMIT 1;
        
        SELECT id INTO formula_id_2
        FROM formulas
        WHERE type = 'lp_article'
        AND is_active = true
        AND id != formula_id_1
        LIMIT 1;
        
        -- サンプルLP記事データを挿入
        IF basic_info_id_1 IS NOT NULL AND formula_id_1 IS NOT NULL THEN
            INSERT INTO lp_articles (
                user_id,
                basic_info_id,
                ad_copy_id,
                title,
                content,
                meta_description,
                permalink,
                word_count,
                generated_by,
                formula_id,
                created_at
            ) VALUES (
                target_user_id,
                basic_info_id_1,
                ad_copy_id_1,
                'AIを活用したコンテンツ作成ツール - LP記事 (ChatGPT)',
                '<h1>AIを活用したコンテンツ作成ツール</h1>
<p>革新的なAI技術を駆使して、コンテンツ作成の効率を飛躍的に向上させるツールをご紹介します。</p>

<h2>特徴</h2>
<ul>
  <li>高品質な文章を自動生成</li>
  <li>SEO対策済みのコンテンツ作成</li>
  <li>多言語対応で海外展開も簡単</li>
  <li>直感的な操作性でだれでも簡単に使える</li>
</ul>',
                'AIを活用したコンテンツ作成ツールで、効率的に高品質なコンテンツを生成。SEO対策済みで多言語対応も可能。',
                'ai-content-creation-tool',
                250,
                'ChatGPT',
                formula_id_1,
                NOW() - INTERVAL '15 days'
            )
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF basic_info_id_2 IS NOT NULL AND formula_id_2 IS NOT NULL THEN
            INSERT INTO lp_articles (
                user_id,
                basic_info_id,
                ad_copy_id,
                title,
                content,
                meta_description,
                permalink,
                word_count,
                generated_by,
                formula_id,
                created_at
            ) VALUES (
                target_user_id,
                basic_info_id_2,
                ad_copy_id_2,
                'デジタルマーケティング支援サービス - LP記事 (Gemini)',
                '<h1>デジタルマーケティング支援サービス - コンテンツ制作の未来</h1>
<p>次世代のAI技術で、あなたのコンテンツ戦略を一新しませんか？時間と労力を大幅に節約しながら、クオリティの高いコンテンツを生成できます。</p>

<h2>✨ 主な機能 ✨</h2>
<ul>
  <li>自然な日本語でのコンテンツ生成</li>
  <li>ブランドの声に合わせたトーン調整</li>
  <li>キーワード最適化によるSEO強化</li>
  <li>複数フォーマットでのエクスポート</li>
</ul>',
                'AI技術を活用したデジタルマーケティング支援サービス。自然な日本語生成とSEO最適化で、効果的なコンテンツ戦略を実現。',
                'digital-marketing-support-service',
                300,
                'Gemini',
                COALESCE(formula_id_2, formula_id_1),
                NOW() - INTERVAL '10 days'
            )
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF basic_info_id_3 IS NOT NULL AND formula_id_1 IS NOT NULL THEN
            INSERT INTO lp_articles (
                user_id,
                basic_info_id,
                ad_copy_id,
                title,
                content,
                meta_description,
                permalink,
                word_count,
                generated_by,
                formula_id,
                created_at
            ) VALUES (
                target_user_id,
                basic_info_id_3,
                ad_copy_id_3,
                'クラウドストレージソリューション - LP記事 (Claude)',
                '<h1>クラウドストレージソリューション</h1>
<section class="intro">
  <p>AIの力でコンテンツ作成の常識を覆す、革新的なツールが誕生しました。時間と創造性のバランスを大切にする現代のクリエイターやマーケターのために設計された、次世代のコンテンツ制作システムです。</p>
</section>

<section class="benefits">
  <h2>こんな悩みを解決します</h2>
  <div class="benefit-grid">
    <div class="benefit-item">
      <h3>時間不足</h3>
      <p>高品質なコンテンツ作成にかかる時間を最大75%削減し、本来のクリエイティブ業務に集中できます。</p>
    </div>',
                'AIによるコンテンツ作成ツール。時間を75%削減しながら高品質なコンテンツを生成。クリエイターとマーケターのための革新的ソリューション。',
                'cloud-storage-solution',
                350,
                'Claude',
                formula_id_1,
                NOW() - INTERVAL '5 days'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

-- ========================================
-- 3. インデックスの作成（パフォーマンス向上）
-- ========================================

-- LP記事テーブルのインデックス（存在しない場合のみ作成）
CREATE INDEX IF NOT EXISTS idx_lp_articles_user_id_created ON lp_articles(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lp_articles_basic_info_id ON lp_articles(basic_info_id);
CREATE INDEX IF NOT EXISTS idx_lp_articles_ad_copy_id ON lp_articles(ad_copy_id);
CREATE INDEX IF NOT EXISTS idx_lp_articles_formula_id ON lp_articles(formula_id);
CREATE INDEX IF NOT EXISTS idx_lp_articles_generated_by ON lp_articles(generated_by);

-- ========================================
-- 4. 確認用クエリ
-- ========================================

-- 挿入されたデータの確認
SELECT 
    'Total LP articles:' as info, 
    COUNT(*) as count 
FROM lp_articles
UNION ALL
SELECT 
    'LP articles with ChatGPT:' as info, 
    COUNT(*) as count 
FROM lp_articles 
WHERE generated_by = 'ChatGPT'
UNION ALL
SELECT 
    'LP articles with Gemini:' as info, 
    COUNT(*) as count 
FROM lp_articles 
WHERE generated_by = 'Gemini'
UNION ALL
SELECT 
    'LP articles with Claude:' as info, 
    COUNT(*) as count 
FROM lp_articles 
WHERE generated_by = 'Claude';

-- LP記事履歴ビューの確認（最新5件）
SELECT 
    id,
    title,
    generated_by,
    basic_info_title,
    ad_copy_title,
    formula_name,
    created_at
FROM lp_article_history_view 
LIMIT 5;

-- ========================================
-- 実行完了
-- ========================================
-- このSQLの実行により、以下が設定されます：
-- 1. LP記事履歴表示用のビュー（lp_article_history_view）
-- 2. サンプルLP記事データ3件
-- 3. パフォーマンス向上のためのインデックス
-- 
-- LP記事履歴機能が正常に動作するようになります。