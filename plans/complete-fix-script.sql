-- ============================================
-- 双方向参照不整合完全修正SQL
-- ============================================
-- 実行目的:
--   1. 削除されたシステム要件を復元
--   2. 業務要件の related_system_requirement_ids を更新
-- 作成日時: 2026-01-21
-- 実行順序: 必ず上から順番に実行してください
-- ============================================

-- ============================================
-- Step 1: システム要件の復元
-- ============================================
-- SRF-001（請求書発行）のシステム要件を復元
-- task_id は TASK-003 を使用（外部キー制約対応）

INSERT INTO public.system_requirements (
  id,
  task_id,
  srf_id,
  title,
  summary,
  concept_ids,
  impacts,
  category,
  business_requirement_ids,
  acceptance_criteria_json,
  acceptance_criteria,
  system_domain_ids,
  sort_order,
  created_at,
  updated_at
) VALUES
(
  'SR-TASK-003-001',
  'TASK-003',
  'SRF-001',
  '請求書PDF生成',
  'インボイス要件に対応したフォーマットで適格請求書をPDFとして生成できること。具体的には、①自社の登録番号を請求書に印字できること、②税率別の対価および税率別税額を集計し印字できること、③適用税率ごとに摘要を区分して表示できること、④生成した請求書PDFをダウンロードできること。',
  ARRAY['C001', 'C002'],
  ARRAY[]::text[],
  'function',
  ARRAY['BR-TASK-003-001', 'BR-TASK-003-002'],
  '[]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  0,
  NOW(),
  NOW()
),
(
  'SR-TASK-003-002',
  'TASK-003',
  'SRF-001',
  '電子請求書送信',
  '生成した請求書を顧客へ電子メールで送信できること。具体的には、①送信先の顧客メールアドレスを指定できること、②メール本文に請求内容の要約を含められること、③送信履歴を記録し後照会できること、④送信失敗時にはエラーログを記録できること。',
  ARRAY['C005'],
  ARRAY[]::text[],
  'function',
  ARRAY['BR-TASK-003-001', 'BR-TASK-003-002'],
  '[]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  1,
  NOW(),
  NOW()
),
(
  'SR-TASK-003-006',
  'TASK-003',
  'SRF-001',
  '請求書発行完了通知',
  '請求書発行完了時に関係者へ通知を送信でき、処理完了を知らせることができること。通知履歴を記録し、後照会できること。',
  ARRAY[]::text[],
  ARRAY[]::text[],
  'function',
  ARRAY['BR-TASK-003-001', 'BR-TASK-003-002'],
  '[]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  2,
  NOW(),
  NOW()
),
(
  'SR-TASK-003-009',
  'TASK-003',
  'SRF-001',
  '請求書発行スケジュール管理',
  '請求書発行のスケジュールを登録・管理でき、定期実行設定を行えること。スケジュールの実行履歴を記録し、実行結果を確認できること。',
  ARRAY[]::text[],
  ARRAY[]::text[],
  'function',
  ARRAY['BR-TASK-003-001', 'BR-TASK-003-002'],
  '[]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  3,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  task_id = EXCLUDED.task_id,
  srf_id = EXCLUDED.srf_id,
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  concept_ids = EXCLUDED.concept_ids,
  category = EXCLUDED.category,
  business_requirement_ids = EXCLUDED.business_requirement_ids,
  updated_at = NOW();

-- ============================================
-- Step 2: 業務要件の related_system_requirement_ids を更新
-- ============================================

-- BR-TASK-003-001 に4つのシステム要件を紐付け
UPDATE business_requirements
SET related_system_requirement_ids = ARRAY[
  'SR-TASK-003-001',
  'SR-TASK-003-002',
  'SR-TASK-003-006',
  'SR-TASK-003-009'
],
updated_at = NOW()
WHERE id = 'BR-TASK-003-001';

-- BR-TASK-003-002 に4つのシステム要件を紐付け
UPDATE business_requirements
SET related_system_requirement_ids = ARRAY[
  'SR-TASK-003-001',
  'SR-TASK-003-002',
  'SR-TASK-003-006',
  'SR-TASK-003-009'
],
updated_at = NOW()
WHERE id = 'BR-TASK-003-002';

-- ============================================
-- Step 3: 結果確認
-- ============================================

-- システム要件の確認
SELECT
  id,
  task_id,
  srf_id,
  title,
  business_requirement_ids,
  array_length(business_requirement_ids, 1) as br_count
FROM system_requirements
WHERE srf_id = 'SRF-001'
ORDER BY sort_order;

-- 業務要件の確認
SELECT
  id,
  title,
  related_system_requirement_ids,
  array_length(related_system_requirement_ids, 1) as sr_count
FROM business_requirements
WHERE id IN ('BR-TASK-003-001', 'BR-TASK-003-002')
ORDER BY id;

-- ============================================
-- 期待される結果
-- ============================================
-- [system_requirements]
-- SR-TASK-003-001 | TASK-003 | SRF-001 | 請求書PDF生成        | {BR-TASK-003-001,BR-TASK-003-002} | 2
-- SR-TASK-003-002 | TASK-003 | SRF-001 | 電子請求書送信      | {BR-TASK-003-001,BR-TASK-003-002} | 2
-- SR-TASK-003-006 | TASK-003 | SRF-001 | 請求書発行完了通知  | {BR-TASK-003-001,BR-TASK-003-002} | 2
-- SR-TASK-003-009 | TASK-003 | SRF-001 | 請求書発行スケジュール管理 | {BR-TASK-003-001,BR-TASK-003-002} | 2
--
-- [business_requirements]
-- BR-TASK-003-001 | 請求対象データの正確な抽出        | {SR-TASK-003-001,SR-TASK-003-002,SR-TASK-003-006,SR-TASK-003-009} | 4
-- BR-TASK-003-002 | 請求書の適切な生成と発行          | {SR-TASK-003-001,SR-TASK-003-002,SR-TASK-003-006,SR-TASK-003-009} | 4
-- ============================================
