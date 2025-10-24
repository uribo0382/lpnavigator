-- ========================================
-- users テーブルの is_active フィールドの型を修正
-- ========================================
-- このSQLファイルをSupabase GUIで実行してください

-- 1. 現在の is_active の値を確認
SELECT id, email, name, role, is_active, typeof(is_active) as type
FROM users
ORDER BY created_at;

-- 2. is_active が文字列型の場合、BOOLEAN型に変換
-- まず、一時的なカラムを作成
ALTER TABLE users ADD COLUMN is_active_temp BOOLEAN;

-- 3. 文字列値をBOOLEAN値に変換してコピー
UPDATE users
SET is_active_temp = 
  CASE 
    WHEN is_active = 'true' OR is_active = '1' OR is_active = 't' THEN true
    WHEN is_active = 'false' OR is_active = '0' OR is_active = 'f' THEN false
    ELSE true -- デフォルトはtrueに設定
  END;

-- 4. 古いカラムを削除
ALTER TABLE users DROP COLUMN is_active;

-- 5. 新しいカラムをリネーム
ALTER TABLE users RENAME COLUMN is_active_temp TO is_active;

-- 6. NOT NULL制約とデフォルト値を追加
ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;

-- 7. 変換後の確認
SELECT id, email, name, role, is_active
FROM users
ORDER BY created_at;

-- 注意: もし上記のALTER TABLEコマンドがエラーになる場合は、
-- 以下の単純なUPDATE文を実行してください：
-- UPDATE users SET is_active = true WHERE is_active = 'true';
-- UPDATE users SET is_active = false WHERE is_active = 'false';