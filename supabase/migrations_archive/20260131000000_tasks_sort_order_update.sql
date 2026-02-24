-- 業務タスクの並び順を一括更新するRPC関数
CREATE OR REPLACE FUNCTION update_tasks_sort_order(
  p_updates JSONB,
  p_project_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  WITH updates AS (
    SELECT
      (elem->>'task_id')::TEXT as task_id,
      (elem->>'new_sort_order')::INTEGER as new_sort_order
    FROM jsonb_array_elements(p_updates) elem
  )
  UPDATE business_tasks
  SET sort_order = updates.new_sort_order,
      updated_at = NOW()
  FROM updates
  WHERE business_tasks.id = updates.task_id
    AND (p_project_id IS NULL OR business_tasks.project_id::TEXT = p_project_id);
END;
$$;
