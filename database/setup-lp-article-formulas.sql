-- LP記事フォーミュラのセットアップ
-- このファイルはSupabaseのGUIから実行してください

-- 既存のLP記事フォーミュラを削除（必要に応じてコメントアウト）
-- DELETE FROM formulas WHERE type = 'lp_article';

-- LP記事フォーミュラを追加
INSERT INTO formulas (name, type, template, variables, is_active, summary) VALUES
-- 1. 問題解決型LP記事
('問題解決型LP記事', 'lp_article', 
'<h1>{{キャッチコピー}}</h1>

<div class="lead-section">
<p><strong>{{問題提起}}</strong></p>
<p>{{共感メッセージ}}</p>
</div>

<h2>こんなお悩みありませんか？</h2>
<ul>
{{悩みリスト}}
</ul>

<h2>その原因は{{原因}}にあります</h2>
{{原因の詳細説明}}

<h2>{{商品名}}が解決します</h2>
{{解決策の説明}}

<h3>3つの特徴</h3>
<ol>
{{特徴リスト}}
</ol>

<h2>お客様の声</h2>
{{お客様の声}}

<h2>今なら{{特典}}！</h2>
{{特典の詳細}}

<div class="cta-box">
<h3>{{CTAタイトル}}</h3>
<p>{{CTA説明}}</p>
<button class="cta-button">{{CTAボタンテキスト}}</button>
</div>

<h2>よくある質問</h2>
{{FAQ}}

<div class="guarantee">
<h3>{{保証内容}}</h3>
<p>{{保証説明}}</p>
</div>', 
ARRAY['キャッチコピー', '問題提起', '共感メッセージ', '悩みリスト', '原因', '原因の詳細説明', '商品名', '解決策の説明', '特徴リスト', 'お客様の声', '特典', '特典の詳細', 'CTAタイトル', 'CTA説明', 'CTAボタンテキスト', 'FAQ', '保証内容', '保証説明'],
true,
'読者の問題に共感し、解決策を提示する王道のLP記事構成'),

-- 2. ストーリー型LP記事
('ストーリー型LP記事', 'lp_article',
'<h1>{{メインタイトル}}</h1>

<div class="story-intro">
<p>{{導入ストーリー}}</p>
</div>

<h2>転機となった出会い</h2>
{{転機の詳細}}

<h2>試してみた結果...</h2>
{{結果の詳細}}

<h2>なぜ{{商品名}}は効果があるのか</h2>
{{理論的説明}}

<h3>科学的根拠</h3>
{{科学的データ}}

<h2>私と同じように変われた人たち</h2>
{{成功事例}}

<h2>あなたも始めてみませんか？</h2>
{{行動喚起}}

<div class="cta-box">
<h3>{{CTAヘッドライン}}</h3>
<p>{{CTA詳細}}</p>
<button class="cta-button">{{CTAボタン}}</button>
</div>

<h2>追伸</h2>
{{追伸メッセージ}}',
ARRAY['メインタイトル', '導入ストーリー', '転機の詳細', '商品名', '結果の詳細', '理論的説明', '科学的データ', '成功事例', '行動喚起', 'CTAヘッドライン', 'CTA詳細', 'CTAボタン', '追伸メッセージ'],
true,
'体験談やストーリーを軸に共感を生み出すLP記事構成'),

-- 3. 比較型LP記事
('比較型LP記事', 'lp_article',
'<h1>{{比較タイトル}}</h1>

<div class="comparison-intro">
<p>{{導入文}}</p>
</div>

<h2>従来の方法の問題点</h2>
{{従来方法の問題}}

<h2>各解決方法の比較</h2>
<table class="comparison-table">
{{比較表}}
</table>

<h2>なぜ{{商品名}}が最適なのか</h2>
{{優位性の説明}}

<h3>独自の強み</h3>
{{強みの詳細}}

<h2>実際の効果を検証</h2>
{{効果検証データ}}

<h2>利用者の評価</h2>
{{利用者レビュー}}

<div class="cta-box">
<h3>{{CTA見出し}}</h3>
<p>{{CTA本文}}</p>
<button class="cta-button">{{CTAボタンテキスト}}</button>
</div>

<h2>比較まとめ</h2>
{{まとめ}}',
ARRAY['比較タイトル', '導入文', '従来方法の問題', '比較表', '商品名', '優位性の説明', '強みの詳細', '効果検証データ', '利用者レビュー', 'CTA見出し', 'CTA本文', 'CTAボタンテキスト', 'まとめ'],
true,
'他社商品や従来の方法と比較して優位性を示すLP記事構成'),

-- 4. 権威型LP記事
('権威型LP記事', 'lp_article',
'<h1>{{権威的タイトル}}</h1>

<div class="authority-intro">
<p>{{専門家の肩書き}}</p>
<p>{{導入メッセージ}}</p>
</div>

<h2>専門家が警鐘を鳴らす{{問題}}</h2>
{{問題の専門的解説}}

<h2>最新の研究でわかったこと</h2>
{{研究結果}}

<h2>{{商品名}}の開発背景</h2>
{{開発ストーリー}}

<h3>特許技術</h3>
{{特許情報}}

<h2>医師・専門家からの推薦</h2>
{{推薦文}}

<h2>臨床データ</h2>
{{臨床結果}}

<div class="cta-box">
<h3>{{専門家CTA}}</h3>
<p>{{CTA説明文}}</p>
<button class="cta-button">{{CTAボタン}}</button>
</div>

<h2>安全性について</h2>
{{安全性情報}}',
ARRAY['権威的タイトル', '専門家の肩書き', '導入メッセージ', '問題', '問題の専門的解説', '研究結果', '商品名', '開発ストーリー', '特許情報', '推薦文', '臨床結果', '専門家CTA', 'CTA説明文', 'CTAボタン', '安全性情報'],
true,
'専門家や研究データを活用して信頼性を高めるLP記事構成'),

-- 5. 限定型LP記事
('限定型LP記事', 'lp_article',
'<h1>{{緊急性タイトル}}</h1>

<div class="urgency-box">
<p><strong>{{期限情報}}</strong></p>
<p>{{限定理由}}</p>
</div>

<h2>なぜ今なのか</h2>
{{タイミングの重要性}}

<h2>{{商品名}}の特別オファー</h2>
{{オファー詳細}}

<h3>通常価格との比較</h3>
{{価格比較}}

<h2>この機会を逃すと...</h2>
{{機会損失}}

<h2>すでに{{人数}}名が申し込み</h2>
{{申込状況}}

<h2>特典内容</h2>
{{特典一覧}}

<div class="cta-box urgent">
<h3>{{緊急CTA}}</h3>
<p>残り{{残数}}</p>
<button class="cta-button">{{CTAボタン}}</button>
</div>

<h2>キャンセル待ちについて</h2>
{{キャンセル待ち情報}}',
ARRAY['緊急性タイトル', '期限情報', '限定理由', 'タイミングの重要性', '商品名', 'オファー詳細', '価格比較', '機会損失', '人数', '申込状況', '特典一覧', '緊急CTA', '残数', 'CTAボタン', 'キャンセル待ち情報'],
true,
'期間限定や数量限定を強調して行動を促すLP記事構成')

ON CONFLICT (name, type) DO UPDATE SET
  template = EXCLUDED.template,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  summary = EXCLUDED.summary,
  updated_at = CURRENT_TIMESTAMP;

-- 確認用クエリ
SELECT id, name, type, summary, is_active FROM formulas WHERE type = 'lp_article' ORDER BY created_at DESC;