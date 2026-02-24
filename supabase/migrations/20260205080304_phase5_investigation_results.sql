-- Phase 5: investigation_results テーブル作成
-- 影響調査結果を保持するテーブル

CREATE TABLE IF NOT EXISTS investigation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  top_down_result JSONB,
  suspect_links_detected JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_investigation_results_change_request_id
  ON investigation_results (change_request_id);

CREATE INDEX IF NOT EXISTS idx_investigation_results_status
  ON investigation_results (status);

CREATE INDEX IF NOT EXISTS idx_investigation_results_project_id
  ON investigation_results (project_id);
