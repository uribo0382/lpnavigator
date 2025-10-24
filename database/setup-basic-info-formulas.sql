-- ============================================
-- 基本情報フォーミュラのセットアップSQL
-- ============================================

-- 1. formulasテーブルの確認と作成（存在しない場合）
CREATE TABLE IF NOT EXISTS formulas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('basic_info', 'ad_copy', 'lp_article')),
    template TEXT NOT NULL,
    variables TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLSの設定
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Formulas are viewable by everyone" ON formulas;
DROP POLICY IF EXISTS "Formulas can be modified by admins" ON formulas;
DROP POLICY IF EXISTS "Formulas can be created by admins" ON formulas;
DROP POLICY IF EXISTS "Formulas can be deleted by admins" ON formulas;

-- 新しいポリシーを作成
-- 全てのユーザーが閲覧可能
CREATE POLICY "Formulas are viewable by everyone" ON formulas
    FOR SELECT
    USING (true);

-- 管理者のみが作成・更新・削除可能
CREATE POLICY "Formulas can be modified by admins" ON formulas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Formulas can be created by admins" ON formulas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Formulas can be deleted by admins" ON formulas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 3. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_formulas_type ON formulas(type);
CREATE INDEX IF NOT EXISTS idx_formulas_is_active ON formulas(is_active);

-- 4. updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_formulas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_formulas_updated_at ON formulas;
CREATE TRIGGER update_formulas_updated_at
    BEFORE UPDATE ON formulas
    FOR EACH ROW
    EXECUTE FUNCTION update_formulas_updated_at();

-- 5. 既存の基本情報フォーミュラをクリア（開発環境のみ）
-- DELETE FROM formulas WHERE type = 'basic_info';

-- 6. モックデータの挿入
-- 基本情報テンプレート（有効）
INSERT INTO formulas (name, type, template, variables, is_active, summary) VALUES (
    '基本情報テンプレート',
    'basic_info',
    '以下は、{{会社名}}が提供する{{商品・サービス名}}に関する基本情報です。
【商品・サービスの概要】
{{商品・サービスの概要説明}}
【主な特徴】
- {{特徴1}}
- {{特徴2}}
- {{特徴3}}
【想定されるお客様】
{{ターゲット顧客の説明}}
【解決できる課題】
{{顧客の課題や問題点}}
【提供価値】
{{商品・サービスの提供価値}}
【料金体系】
{{料金体系の説明}}
【導入事例】
{{導入事例や成功事例}}
【お問い合わせ方法】
{{連絡先情報}}',
    ARRAY['会社名', '商品・サービス名', '商品・サービスの概要説明', '特徴1', '特徴2', '特徴3', 'ターゲット顧客の説明', '顧客の課題や問題点', '商品・サービスの提供価値', '料金体系の説明', '導入事例や成功事例', '連絡先情報'],
    true,
    '会社や商品・サービスの基本情報を簡潔にまとめるためのテンプレートです。概要、特徴、ターゲット顧客、解決課題、提供価値、料金体系などの重要情報を構造化して表示します。'
);

-- SEO特化型（無効）
INSERT INTO formulas (name, type, template, variables, is_active, summary) VALUES (
    'SEO特化型',
    'basic_info',
    '# {{メインキーワード}} - {{サブキーワード}}
## {{メインキーワード}}とは
{{メインキーワードの詳細な説明（300-500文字）}}
## {{メインキーワード}}の主な特徴
### 1. {{特徴1のキーワード}}
{{特徴1の詳細説明（150-200文字）}}
### 2. {{特徴2のキーワード}}
{{特徴2の詳細説明（150-200文字）}}
### 3. {{特徴3のキーワード}}
{{特徴3の詳細説明（150-200文字）}}
## {{メインキーワード}}のメリット
- {{メリット1}}
- {{メリット2}}
- {{メリット3}}
- {{メリット4}}
- {{メリット5}}
## {{メインキーワード}}の選び方
{{選び方の詳細説明（200-300文字）}}
### おすすめの{{メインキーワード}}
1. **{{おすすめ製品/サービス1}}**: {{簡単な説明}}
2. **{{おすすめ製品/サービス2}}**: {{簡単な説明}}
3. **{{おすすめ製品/サービス3}}**: {{簡単な説明}}
## {{メインキーワード}}に関するよくある質問
### Q: {{よくある質問1}}
A: {{回答1}}
### Q: {{よくある質問2}}
A: {{回答2}}
### Q: {{よくある質問3}}
A: {{回答3}}
## まとめ: {{メインキーワード}}について
{{まとめの文章（200-300文字）}}
【お問い合わせ】
{{会社名}}
{{連絡先情報}}',
    ARRAY['メインキーワード', 'サブキーワード', 'メインキーワードの詳細な説明（300-500文字）', '特徴1のキーワード', '特徴1の詳細説明（150-200文字）', '特徴2のキーワード', '特徴2の詳細説明（150-200文字）', '特徴3のキーワード', '特徴3の詳細説明（150-200文字）', 'メリット1', 'メリット2', 'メリット3', 'メリット4', 'メリット5', '選び方の詳細説明（200-300文字）', 'おすすめ製品/サービス1', '簡単な説明', 'おすすめ製品/サービス2', 'おすすめ製品/サービス3', 'よくある質問1', '回答1', 'よくある質問2', '回答2', 'よくある質問3', '回答3', 'まとめの文章（200-300文字）', '会社名', '連絡先情報'],
    false,
    'SEO効果を最大化するために設計されたテンプレートです。キーワードを効果的に配置し、検索エンジンに評価されやすい構造化されたコンテンツを生成します。'
);

-- 7. 確認クエリ
SELECT 
    id,
    name,
    type,
    is_active,
    summary,
    array_length(variables, 1) as variable_count,
    created_at
FROM formulas
WHERE type = 'basic_info'
ORDER BY is_active DESC, created_at DESC;

-- 8. 権限の確認
SELECT 
    'Authenticated can SELECT' as permission,
    has_table_privilege('authenticated', 'formulas', 'SELECT') as has_permission
UNION ALL
SELECT 
    'Authenticated can INSERT',
    has_table_privilege('authenticated', 'formulas', 'INSERT')
UNION ALL
SELECT 
    'Authenticated can UPDATE',
    has_table_privilege('authenticated', 'formulas', 'UPDATE')
UNION ALL
SELECT 
    'Authenticated can DELETE',
    has_table_privilege('authenticated', 'formulas', 'DELETE');