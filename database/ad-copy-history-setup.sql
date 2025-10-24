-- ========================================
-- 広告文履歴機能の動的化 - SQL設定
-- ========================================
-- このSQLファイルをSupabase GUIで実行してください
-- 実行前に既存データのバックアップを取ることを推奨します

-- ========================================
-- 1. 広告文履歴表示用ビューの作成
-- ========================================

-- 既存のビューがある場合は削除
DROP VIEW IF EXISTS ad_copy_history_view;

-- 広告文履歴ビューを作成（基本情報とフォーミュラ情報を結合）
CREATE VIEW ad_copy_history_view AS
SELECT 
    ac.id,
    ac.user_id,
    ac.title,
    ac.content,
    ac.generated_by,
    ac.created_at,
    ac.updated_at,
    ac.basic_info_id,
    ac.formula_id,
    bi.title as basic_info_title,
    bi.content as basic_info_content,
    f.name as formula_name,
    f.type as formula_type
FROM ad_copies ac
LEFT JOIN basic_infos bi ON ac.basic_info_id = bi.id
LEFT JOIN formulas f ON ac.formula_id = f.id
ORDER BY ac.created_at DESC;

-- ========================================
-- 2. サンプル広告文データの挿入
-- ========================================

-- ユーザーが存在しない場合の処理
DO $$
DECLARE
    target_user_id UUID;
    basic_info_id_1 UUID;
    basic_info_id_2 UUID;
    basic_info_id_3 UUID;
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
        -- 基本情報のサンプルデータを作成（存在しない場合）
        INSERT INTO basic_infos (user_id, title, content, summary, generated_by, created_at)
        VALUES (
            target_user_id,
            'AIを活用したコンテンツ作成ツール',
            'AIを活用したコンテンツ作成ツールに関する基本情報です。最新のAI技術を使用して、高品質なコンテンツを効率的に生成します。',
            'AI技術を活用したコンテンツ作成ツールの基本情報',
            'ChatGPT',
            NOW() - INTERVAL '15 days'
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO basic_info_id_1;
        
        -- 既存の基本情報がある場合はそれを使用
        IF basic_info_id_1 IS NULL THEN
            SELECT id INTO basic_info_id_1
            FROM basic_infos
            WHERE user_id = target_user_id
            AND title LIKE '%AIを活用したコンテンツ作成ツール%'
            LIMIT 1;
        END IF;
        
        INSERT INTO basic_infos (user_id, title, content, summary, generated_by, created_at)
        VALUES (
            target_user_id,
            'デジタルマーケティング支援サービス',
            'デジタルマーケティング支援サービスに関する基本情報です。マーケティングの効率化と効果測定を実現します。',
            'デジタルマーケティング支援サービスの基本情報',
            'Gemini',
            NOW() - INTERVAL '10 days'
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO basic_info_id_2;
        
        IF basic_info_id_2 IS NULL THEN
            SELECT id INTO basic_info_id_2
            FROM basic_infos
            WHERE user_id = target_user_id
            AND title LIKE '%デジタルマーケティング支援サービス%'
            LIMIT 1;
        END IF;
        
        INSERT INTO basic_infos (user_id, title, content, summary, generated_by, created_at)
        VALUES (
            target_user_id,
            'クラウドストレージソリューション',
            'クラウドストレージソリューションに関する基本情報です。安全で効率的なデータ管理を提供します。',
            'クラウドストレージソリューションの基本情報',
            'Claude',
            NOW() - INTERVAL '5 days'
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO basic_info_id_3;
        
        IF basic_info_id_3 IS NULL THEN
            SELECT id INTO basic_info_id_3
            FROM basic_infos
            WHERE user_id = target_user_id
            AND title LIKE '%クラウドストレージソリューション%'
            LIMIT 1;
        END IF;
        
        -- フォーミュラIDを取得
        SELECT id INTO formula_id_1
        FROM formulas
        WHERE type = 'ad_copy'
        AND is_active = true
        LIMIT 1;
        
        SELECT id INTO formula_id_2
        FROM formulas
        WHERE type = 'ad_copy'
        AND is_active = true
        AND id != formula_id_1
        LIMIT 1;
        
        -- サンプル広告文データを挿入
        IF basic_info_id_1 IS NOT NULL AND formula_id_1 IS NOT NULL THEN
            INSERT INTO ad_copies (
                user_id,
                basic_info_id,
                title,
                content,
                generated_by,
                formula_id,
                created_at
            ) VALUES (
                target_user_id,
                basic_info_id_1,
                'AIを活用したコンテンツ作成ツール - 広告文 (ChatGPT)',
                '【AIを活用したコンテンツ作成ツール】

業界最先端のAI技術を駆使して、あなたのコンテンツ作成を革新します。時間の節約と品質の向上を同時に実現。今すぐ無料トライアルを始めて、効率的なコンテンツ戦略を構築しましょう。',
                'ChatGPT',
                formula_id_1,
                NOW() - INTERVAL '15 days'
            )
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF basic_info_id_2 IS NOT NULL AND formula_id_2 IS NOT NULL THEN
            INSERT INTO ad_copies (
                user_id,
                basic_info_id,
                title,
                content,
                generated_by,
                formula_id,
                created_at
            ) VALUES (
                target_user_id,
                basic_info_id_2,
                'デジタルマーケティング支援サービス - 広告文 (Gemini)',
                '✨ デジタルマーケティング支援サービス ✨

マーケティングの常識を覆す、次世代AIツール。あなたのアイデアを瞬時に魅力的な広告に変換します。創造性を解き放ち、ブランドの声を届けましょう。期間限定30%オフキャンペーン実施中！',
                'Gemini',
                formula_id_2,
                NOW() - INTERVAL '10 days'
            )
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF basic_info_id_3 IS NOT NULL AND formula_id_1 IS NOT NULL THEN
            INSERT INTO ad_copies (
                user_id,
                basic_info_id,
                title,
                content,
                generated_by,
                formula_id,
                created_at
            ) VALUES (
                target_user_id,
                basic_info_id_3,
                'クラウドストレージソリューション - 広告文 (Claude)',
                'クラウドストレージソリューション

「もっと安全にデータを保存できたら...」
そんな願いを叶えるサービスが誕生しました。高セキュリティと使いやすさを兼ね備えた、次世代のクラウドストレージ。

今なら30日間無料でお試しいただけます。',
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

-- 広告文テーブルのインデックス（存在しない場合のみ作成）
CREATE INDEX IF NOT EXISTS idx_ad_copies_user_id_created ON ad_copies(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_copies_basic_info_id ON ad_copies(basic_info_id);
CREATE INDEX IF NOT EXISTS idx_ad_copies_formula_id ON ad_copies(formula_id);

-- ========================================
-- 4. 確認用クエリ
-- ========================================

-- 挿入されたデータの確認
SELECT 
    'Total ad copies:' as info, 
    COUNT(*) as count 
FROM ad_copies
UNION ALL
SELECT 
    'Ad copies with ChatGPT:' as info, 
    COUNT(*) as count 
FROM ad_copies 
WHERE generated_by = 'ChatGPT'
UNION ALL
SELECT 
    'Ad copies with Gemini:' as info, 
    COUNT(*) as count 
FROM ad_copies 
WHERE generated_by = 'Gemini'
UNION ALL
SELECT 
    'Ad copies with Claude:' as info, 
    COUNT(*) as count 
FROM ad_copies 
WHERE generated_by = 'Claude';

-- 広告文履歴ビューの確認（最新5件）
SELECT * FROM ad_copy_history_view LIMIT 5;

-- ========================================
-- 実行完了
-- ========================================
-- このSQLの実行により、以下が設定されます：
-- 1. 広告文履歴表示用のビュー（ad_copy_history_view）
-- 2. サンプル広告文データ3件
-- 3. パフォーマンス向上のためのインデックス
-- 
-- 広告文履歴機能が正常に動作するようになります。