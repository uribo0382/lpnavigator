-- ========================================
-- 初期ユーザーデータのセットアップ
-- ========================================
-- このSQLファイルをSupabase GUIで実行してください
-- 本番環境では適切なパスワードを設定してください

-- 管理者ユーザーの作成
INSERT INTO users (
  email, 
  name, 
  role, 
  plan, 
  is_active, 
  company, 
  position, 
  phone,
  notes,
  usage_limit,
  api_access,
  lp_generated,
  api_calls
) VALUES 
-- 管理者
('admin@example.com', 'システム管理者', 'admin', 'enterprise', true, 
 'LP Navigator運営', 'システム管理者', '03-1234-5678', 
 '全権限を持つ管理者アカウント', 0, true, 0, 0),

-- 一般ユーザー（デモ用）
('user@example.com', '山田太郎', 'user', 'free', true,
 '株式会社デモ', 'マーケティング部', '090-1234-5678',
 'デモ用の一般ユーザーアカウント', 10, false, 3, 0),

('tanaka@company.co.jp', '田中花子', 'user', 'standard', true,
 '田中商事株式会社', '広報部長', '080-2345-6789',
 'スタンダードプラン利用中', 50, false, 15, 0),

('suzuki@startup.io', '鈴木一郎', 'user', 'premium', true,
 'スタートアップXYZ', 'CEO', '090-3456-7890',
 'プレミアムプラン、APIアクセス有り', 200, true, 45, 120),

('sato@enterprise.com', '佐藤美咲', 'user', 'enterprise', true,
 '大手企業ABC', 'マーケティング本部長', '03-9876-5432',
 'エンタープライズプラン', 0, true, 234, 567),

-- 無効なユーザー（テスト用）
('inactive@test.com', '無効太郎', 'user', 'free', false,
 'テスト会社', 'テスト部', null,
 '無効化されたアカウント', 10, false, 0, 0)

ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  plan = EXCLUDED.plan,
  is_active = EXCLUDED.is_active,
  company = EXCLUDED.company,
  position = EXCLUDED.position,
  phone = EXCLUDED.phone,
  notes = EXCLUDED.notes,
  usage_limit = EXCLUDED.usage_limit,
  api_access = EXCLUDED.api_access,
  updated_at = CURRENT_TIMESTAMP;

-- 確認用クエリ
SELECT id, email, name, role, plan, is_active FROM users ORDER BY created_at DESC;