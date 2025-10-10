# LP Navigator v1 - データベース設定ガイド

このディレクトリには、LP Navigator v1アプリケーションのSupabaseデータベースを設定するためのSQLファイルが含まれています。

## ファイル構成

```
database/
├── README.md              # このファイル（設定手順の説明）
├── supabase-schema.sql    # データベーススキーマ定義
├── seed-data.sql         # 初期データ投入用SQL
└── schema-test.sql       # スキーマテスト用SQL
```

## 実行手順

### 1. スキーマの作成

1. Supabaseのプロジェクトページにアクセス
2. 左サイドバーから「SQL Editor」を選択
3. `supabase-schema.sql`の内容をコピー＆ペーストして実行

このSQLファイルには以下が含まれています：
- 16個のテーブル定義
- 外部キー制約
- インデックス
- トリガー（updated_at自動更新）
- Row Level Security (RLS) ポリシー
- 基本プランデータ

### 2. 初期データの投入

1. スキーマ作成が完了後、`seed-data.sql`を実行
2. 以下の初期データが投入されます：
   - 21個の質問データ
   - 3個のフォーミュラテンプレート
   - 4個の料金プラン

### 3. スキーマの確認

1. `schema-test.sql`を実行してスキーマが正しく作成されているか確認
2. エラーが発生した場合は、該当するテーブルや制約の作成を確認

## データベース構造概要

### 主要テーブル

| テーブル名 | 説明 | 主要カラム |
|------------|------|------------|
| `users` | ユーザー情報 | email, name, role, plan, usage_limit |
| `questions` | 質問データ | text, category, order_number, is_required |
| `formulas` | フォーミュラテンプレート | name, type, template, variables |
| `question_sessions` | 質問回答セッション | user_id, session_name, is_completed |
| `question_answers` | 質問回答データ | session_id, question_id, answer |
| `basic_infos` | 基本情報 | user_id, title, content, generated_by |
| `ad_copies` | 広告文 | user_id, title, content, generated_by |
| `lp_articles` | LP記事 | user_id, title, content, meta_description |
| `content_history` | コンテンツ履歴 | user_id, content_type, title |
| `plans` | 料金プラン | name, price_monthly, generation_limit |

### データフロー

```
質問回答セッション
    ↓
質問回答データ
    ↓
基本情報生成
    ↓
広告文生成
    ↓
LP記事生成
    ↓
コンテンツ履歴
```

## 認証連携

### Supabase Auth との連携

1. Supabase Auth でユーザーが作成されると、`auth.users`テーブルにレコードが追加されます
2. アプリケーション側で`users`テーブルにプロフィール情報を追加する必要があります

### RLS（Row Level Security）

以下のポリシーが設定されています：
- ユーザーは自分のデータのみアクセス可能
- 質問とフォーミュラは全認証ユーザーが読み取り可能
- 管理者のみが質問とフォーミュラを編集可能

## 環境変数の設定

アプリケーションで以下の環境変数が設定されていることを確認してください：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 将来の拡張機能

このスキーマには将来の機能拡張に対応するテーブルも含まれています：

### 課金システム
- `subscriptions`: サブスクリプション管理
- `payments`: 決済履歴

### チーム機能
- `teams`: チーム情報
- `team_members`: チームメンバー

### ファイル管理
- `uploaded_files`: アップロードファイル

### 使用量管理
- `usage_logs`: 使用量ログ

## トラブルシューティング

### よくあるエラー

1. **テーブルが作成されない**
   - RLS が有効になっているかを確認
   - 適切な権限でSQLを実行しているかを確認

2. **データが挿入できない**
   - 外部キー制約を確認
   - 必須カラムがすべて指定されているかを確認

3. **接続エラー**
   - 環境変数が正しく設定されているかを確認
   - Supabase プロジェクトのAPIキーが有効かを確認

### デバッグ用クエリ

```sql
-- テーブル一覧確認
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- RLS状態確認
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- インデックス確認
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
```

## 注意事項

1. **本番環境への適用**
   - 本番環境では段階的にマイグレーションを実行してください
   - データのバックアップを事前に取得してください

2. **セキュリティ**
   - service_role_key は管理機能でのみ使用してください
   - 本番環境では適切なRLSポリシーを設定してください

3. **パフォーマンス**
   - 大量データを扱う場合は、追加のインデックスを検討してください
   - 定期的にVACUUMとANALYZEを実行してください

## サポート

データベース設定に関する質問や問題が発生した場合は、プロジェクトの開発チームにお問い合わせください。