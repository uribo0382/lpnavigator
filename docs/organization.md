# LP Navigator v1 - プロジェクト組織図

## プロジェクト概要

LP Navigator v1は、AI技術を活用したランディングページ（LP）記事生成システムです。質問形式で基本情報を収集し、複数のAIモデル（ChatGPT、Gemini、Claude）を使用して高品質なコンテンツを自動生成します。

### 技術スタック
- **フロントエンド**: React 18.3.1 + TypeScript + Vite
- **UI**: Tailwind CSS + Lucide React
- **ルーティング**: React Router DOM (HashRouter)
- **状態管理**: React Context API
- **現在のデータ**: モックデータ + LocalStorage
- **将来の本番環境**: Vercel + Supabase

## ディレクトリ構造

```
lpnavigator-v1/
├── src/
│   ├── components/           # 再利用可能なUIコンポーネント
│   │   ├── auth/            # 認証関連コンポーネント
│   │   ├── layout/          # レイアウトコンポーネント
│   │   └── ui/              # 基本UIコンポーネント
│   ├── contexts/            # React Context
│   ├── pages/               # ページコンポーネント
│   │   ├── admin/           # 管理者機能
│   │   ├── generator/       # コンテンツ生成機能
│   │   └── home/            # ホームページ
│   └── utils/               # ユーティリティ関数
├── docs/                    # ドキュメント
└── 設定ファイル群
```

## ページ構成と機能

### 1. 認証・ユーザー管理

#### 認証機能
- **LoginPage** (`/login`): ユーザーログイン
- **SignupPage** (`/signup`): ユーザー登録
- **ResetPasswordPage** (`/reset-password`): パスワードリセット
- **ProfilePage** (`/profile`): ユーザープロフィール

**現在の状態**: モック認証（LocalStorage使用）
- 管理者: `admin@example.com` / `password`
- 一般ユーザー: `user@example.com` / `password`
- デモモード自動ログイン機能あり

**将来の実装**: Supabase Auth連携

### 2. 管理者機能 (`/admin/*`)

#### 管理者ダッシュボード
- **AdminDashboard** (`/admin`): 管理画面トップ
- **QuestionsManagement** (`/admin/questions`): 質問管理
- **QuestionEditor** (`/admin/questions/new`, `/admin/questions/:id`): 質問作成・編集
- **UsersManagement** (`/admin/users`): ユーザー管理
- **UserEditor** (`/admin/users/new`, `/admin/users/:id`): ユーザー作成・編集
- **ApiSettings** (`/admin/api-settings`): API設定
- **Analytics** (`/admin/analytics`): 分析・レポート

#### フォーミュラ管理 (`/admin/formula/*`)
- **FormulaManagement**: フォーミュラ管理トップ
- **BasicInfoFormula** (`/admin/formula/basic-info`): 基本情報フォーミュラ
- **AdCopyFormula** (`/admin/formula/ad-copy`): 広告文フォーミュラ
- **LpArticleFormula** (`/admin/formula/lp-article`): LP記事フォーミュラ

**現在の状態**: 
- 質問管理: 21個のモック質問データ
- ユーザー管理: 10個のモックユーザーデータ
- フォーミュラ管理: 13個のモックフォーミュラデータ

### 3. コンテンツ生成機能 (`/generator/*`)

#### メイン生成フロー
- **ContentGenerator** (`/generator`): メイン生成画面
- **QuestionFlow**: 質問フロー（21問の質問に回答）
- **BasicInfoReview**: 入力内容確認画面
- **GeneratedContent** (`/generator/content`): 生成結果表示

#### 広告文生成
- **AdCopyGenerator** (`/generator/adcopy/create`): 広告文生成
- **AdCopyDisplay** (`/generator/adcopy`): 広告文表示・比較
- **AdCopyHistory** (`/generator/adcopy/history`): 広告文履歴

#### LP記事生成
- **LpArticleGenerator** (`/generator/lparticle/create`): LP記事生成
- **LpArticleDisplay** (`/generator/lparticle`): LP記事表示
- **LpArticleHistory** (`/generator/lparticle/history`): LP記事履歴

#### 履歴管理
- **ContentHistory** (`/generator/history`): 全コンテンツ履歴

**現在の状態**: 
- 質問フロー: 完全実装済み
- AI生成: モック実装（3秒の遅延シミュレーション）
- 履歴管理: LocalStorage使用

## データ構造

### 1. 質問データ (mockQuestions)
```typescript
interface Question {
  id: string;
  text: string;           // 質問文
  category: string;       // カテゴリ（problem, solution, features等）
  order: number;          // 表示順序
  isActive: boolean;      // 有効/無効
  helperText?: string;    // ヘルプテキスト
  sampleAnswer?: string;  // 模範回答
  isRequired: boolean;    // 必須/任意
}
```

**カテゴリ分類**:
- `problem`: 課題・問題
- `solution`: 解決策
- `features`: 特徴
- `benefits`: 利点
- `social_proof`: 社会的証明
- `offer_details`: オファー詳細
- `cta`: 行動喚起

### 2. ユーザーデータ (mockUsers)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  plan: 'free' | 'standard' | 'premium' | 'enterprise';
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  company?: string;
  position?: string;
  phone?: string;
  notes?: string;
  usageLimit?: number;
  apiAccess?: boolean;
  usage?: {
    lpGenerated: number;
    apiCalls: number;
  };
}
```

### 3. フォーミュラデータ (mockFormulas)
```typescript
interface Formula {
  id: string;
  name: string;
  type: 'basic_info' | 'ad_copy' | 'lp_article';
  template: string;       // テンプレート文
  variables: string[];    // 変数リスト
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  summary?: string;       // 概要説明
}
```

**フォーミュラタイプ**:
- `basic_info`: 基本情報テンプレート（2個）
- `ad_copy`: 広告文フォーミュラ（11個）
- `lp_article`: LP記事フォーミュラ（2個）

## 実装済み機能

### ✅ 完全実装済み
1. **認証システム**: ログイン・ログアウト・自動ログイン
2. **質問フロー**: 21問の質問に順不同で回答可能
3. **進捗管理**: 回答進捗の可視化
4. **途中保存**: 入力内容の保存・復元
5. **模範回答**: 各質問のサンプル回答表示
6. **AI添削**: 回答内容のAIによる改善提案
7. **管理者機能**: 質問・ユーザー・フォーミュラ管理
8. **履歴管理**: 生成コンテンツの履歴表示
9. **レスポンシブデザイン**: モバイル対応

### 🔄 モック実装済み（本番化が必要）
1. **AI生成**: 3秒遅延のシミュレーション
2. **データ永続化**: LocalStorage使用
3. **ユーザー管理**: モックデータベース
4. **分析機能**: ダッシュボード表示のみ

## 未実装・部分実装機能

### ❌ 未実装
1. **実際のAI API連携**: OpenAI、Anthropic、Google API
2. **データベース連携**: Supabase PostgreSQL
3. **ファイルアップロード**: 画像・ドキュメント
4. **メール通知**: パスワードリセット等
5. **支払い機能**: サブスクリプション管理
6. **API制限管理**: 使用量制限・課金
7. **エクスポート機能**: PDF、Word、HTML
8. **コラボレーション**: チーム機能
9. **バージョン管理**: コンテンツの履歴・差分
10. **SEO機能**: メタタグ生成・最適化

### 🔧 部分実装
1. **検索機能**: 基本的な検索のみ
2. **フィルタリング**: 基本的なフィルタのみ
3. **ソート機能**: 基本的なソートのみ
4. **エラーハンドリング**: 基本的なエラー表示のみ

## データフロー

### 1. コンテンツ生成フロー
```
質問回答 → 基本情報生成 → 広告文生成 → LP記事生成
    ↓           ↓            ↓           ↓
LocalStorage → LocalStorage → LocalStorage → LocalStorage
```

### 2. 管理者機能フロー
```
管理者ログイン → ダッシュボード → 各管理画面
     ↓              ↓              ↓
AuthContext → AdminDashboard → 各管理コンポーネント
```

## 技術的特徴

### 1. 状態管理
- **AuthContext**: 認証状態の管理
- **ThemeContext**: テーマ設定の管理
- **LocalStorage**: データの永続化

### 2. ルーティング
- **HashRouter**: シングルページアプリケーション
- **ProtectedRoute**: 認証が必要なページの保護
- **動的ルーティング**: パラメータ付きルート

### 3. UI/UX
- **Tailwind CSS**: ユーティリティファーストCSS
- **Lucide React**: アイコンライブラリ
- **レスポンシブデザイン**: モバイルファースト
- **アニメーション**: 生成プロセスの可視化

### 4. エラーハンドリング
- **ErrorBoundary**: React エラーバウンダリ
- **グローバルエラーハンドラー**: 未処理のPromise拒否
- **確認ダイアログ**: 重要な操作の確認

## 本番環境移行時の課題

### 1. データベース設計
現在のLocalStorageデータをSupabase PostgreSQLに移行する必要があります。

**必要なテーブル**:
- `users`: ユーザー情報
- `questions`: 質問データ
- `formulas`: フォーミュラデータ
- `basic_infos`: 基本情報
- `ad_copies`: 広告文
- `lp_articles`: LP記事
- `content_history`: コンテンツ履歴

### 2. API連携
- OpenAI API (GPT-4, GPT-3.5)
- Anthropic API (Claude)
- Google AI API (Gemini)
- API キー管理
- レート制限
- エラーハンドリング

### 3. 認証・セキュリティ
- Supabase Auth連携
- JWT トークン管理
- ロールベースアクセス制御
- API セキュリティ

### 4. パフォーマンス
- 画像最適化
- コード分割
- キャッシュ戦略
- CDN 設定

## 今後の開発計画

### Phase 1: 基盤整備
1. Supabase プロジェクト設定
2. データベーススキーマ設計
3. 認証システム移行
4. 基本的なCRUD操作実装

### Phase 2: AI連携
1. OpenAI API 連携
2. Anthropic API 連携
3. Google AI API 連携
4. エラーハンドリング強化

### Phase 3: 機能拡張
1. ファイルアップロード機能
2. エクスポート機能
3. チーム機能
4. 分析・レポート機能

### Phase 4: 最適化
1. パフォーマンス最適化
2. SEO 対策
3. アクセシビリティ対応
4. 国際化対応

## まとめ

LP Navigator v1は、フロントエンドの基盤がしっかりと構築されており、ユーザーインターフェースと基本的な機能は完成しています。現在はモックデータを使用していますが、本番環境への移行準備が整っています。

**強み**:
- 直感的なユーザーインターフェース
- 完全な質問フローシステム
- レスポンシブデザイン
- 管理者機能の充実

**課題**:
- 実際のAI API連携
- データベース移行
- 本番環境でのパフォーマンス最適化

本番環境移行時は、段階的に機能を移行し、各段階でテストを行うことを推奨します。
