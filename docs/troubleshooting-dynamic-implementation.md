# 動的化実装のトラブルシューティングガイド

## 修正完了した問題

### 1. 広告文フォーミュラとLP記事フォーミュラの編集・保存問題

**問題**:
- 編集時にデータが正しく保存されない
- `is_active`フィールドの値が正しく更新されない

**原因**:
- FormulaEditorコンポーネントでSupabaseのフィールド名（`is_active`）とモックデータのフィールド名（`isActive`）の不一致
- formulaServiceでのデータ変換処理の不足

**解決策**:
1. FormulaEditorで保存時に両方のフィールド名を設定
2. formulaServiceのcreateFormulaとupdateFormulaメソッドでデータ変換処理を追加
3. レスポンスデータも適切に変換して返すように修正

### 2. ユーザー管理画面でデータが表示されない問題

**問題**:
- Supabaseにユーザーデータが存在するのに「ユーザーが見つかりません」と表示される

**考えられる原因**:
1. Supabaseの環境変数が正しく設定されていない
2. Supabaseのusersテーブルにデータが存在しない
3. RLS（Row Level Security）ポリシーによるアクセス制限
4. ネットワーク接続の問題

**解決策**:
1. 環境変数の確認（`.env`ファイル）
2. Supabase接続テストの追加
3. 詳細なエラーメッセージの表示
4. デバッグログの追加

## 環境設定の確認手順

### 1. 環境変数の設定

`.env`ファイルに以下の環境変数が設定されていることを確認：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabaseデータの確認

Supabase管理画面で以下を確認：

1. **usersテーブル**にデータが存在するか
   ```sql
   SELECT * FROM users;
   ```

2. **formulasテーブル**にデータが存在するか
   ```sql
   SELECT * FROM formulas WHERE type IN ('ad_copy', 'lp_article');
   ```

### 3. RLSポリシーの確認

もしRLSが有効になっている場合は、適切なポリシーが設定されているか確認：

```sql
-- RLSが有効かどうか確認
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'formulas');
```

## 初期データのセットアップ

データベースに初期データがない場合は、以下のSQLファイルを実行：

1. **ユーザーデータ**:
   ```
   /database/setup-initial-users.sql
   ```

2. **広告文フォーミュラ**:
   ```
   /database/ad-copy-dynamic-setup-final.sql
   ```

3. **LP記事フォーミュラ**:
   ```
   /database/setup-lp-article-formulas.sql
   ```

## デバッグ方法

### ブラウザのコンソールで確認すべき項目

1. **Supabase接続状態**:
   - "Supabase Client initialized" メッセージ
   - "Supabase connection successful" または エラーメッセージ

2. **データ取得状態**:
   - "Fetching all users from Supabase..." メッセージ
   - "Users fetched: X" （取得したユーザー数）
   - "Fetched users:" （取得したユーザーデータ）

3. **エラーメッセージ**:
   - Supabaseのエラー詳細
   - ネットワークエラー

## よくある問題と対処法

### 問題: 環境変数が読み込まれない
**対処法**: 
- Viteを再起動する
- `.env`ファイルがプロジェクトルートにあることを確認
- 環境変数名が`VITE_`で始まることを確認

### 問題: CORSエラーが発生する
**対処法**:
- Supabaseプロジェクトの設定でドメインを許可
- 開発環境の場合は`localhost`を許可

### 問題: 認証エラーが発生する
**対処法**:
- Anon Keyが正しいことを確認
- Supabaseプロジェクトが有効であることを確認

## 今後の改善提案

1. **エラーハンドリングの強化**:
   - より具体的なエラーメッセージ
   - リトライ機能の実装

2. **パフォーマンス最適化**:
   - データのキャッシング
   - ページネーションの実装

3. **ユーザー体験の向上**:
   - オフライン対応
   - 楽観的更新の実装