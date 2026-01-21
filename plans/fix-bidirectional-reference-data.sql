-- ============================================
-- 双方向参照不整合修正SQL
-- ============================================
-- 実行目的: business_requirements.related_system_requirement_ids を更新
-- 作成日時: 2026-01-21
-- ============================================

-- 現在の状態確認（実行前に確認）
SELECT
  id,
  title,
  related_system_requirement_ids
FROM business_requirements
WHERE id IN ('BR-TASK-003-001', 'BR-TASK-003-002')
ORDER BY id;

-- BR-TASK-003-001 に4つのシステム要件を紐付け
UPDATE business_requirements
SET related_system_requirement_ids = ARRAY[
  'SR-TASK-003-001',
  'SR-TASK-003-002',
  'SR-TASK-003-006',
  'SR-TASK-003-009'
]
WHERE id = 'BR-TASK-003-001';

-- BR-TASK-003-002 に4つのシステム要件を紐付け
UPDATE business_requirements
SET related_system_requirement_ids = ARRAY[
  'SR-TASK-003-001',
  'SR-TASK-003-002',
  'SR-TASK-003-006',
  'SR-TASK-003-009'
]
WHERE id = 'BR-TASK-003-002';

-- 結果確認（実行後に確認）
SELECT
  id,
  title,
  related_system_requirement_ids,
  array_length(related_system_requirement_ids, 1) as count
FROM business_requirements
WHERE id IN ('BR-TASK-003-001', 'BR-TASK-003-002')
ORDER BY id;
