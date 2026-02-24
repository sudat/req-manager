-- sort_orderカラムをリスト系テーブルに追加

-- business_domains
ALTER TABLE business_domains ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- concepts
ALTER TABLE concepts ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- system_functions
ALTER TABLE system_functions ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 既存データのsort_orderをID順に初期化
UPDATE business_domains SET sort_order = row_number() OVER (ORDER BY id) WHERE sort_order = 0;
UPDATE concepts SET sort_order = row_number() OVER (ORDER BY id) WHERE sort_order = 0;
UPDATE system_functions SET sort_order = row_number() OVER (ORDER BY id) WHERE sort_order = 0;
