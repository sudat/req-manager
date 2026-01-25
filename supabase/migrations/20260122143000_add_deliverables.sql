-- Phase 1: Add deliverables and related_deliverable_ids columns
-- This migration introduces the new "deliverables" concept to replace:
-- - system_functions.category (SrfCategory)
-- - system_functions.entry_points
-- - system_functions.system_design
-- - system_requirements.category (SystemRequirementCategory)

-- Add deliverables column to system_functions
ALTER TABLE system_functions
  ADD COLUMN IF NOT EXISTS deliverables jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN system_functions.deliverables IS
'Array of deliverable objects. Each deliverable has:
- id: string (unique identifier)
- name: string (Japanese name, e.g., "発行指示画面")
- type: "screen" | "batch" | "api" | "job" | "template" | "service"
- entryPoint: string | null (URL, file path, or API endpoint)
- design: object with perspectives (function, data, exception, auth, non_functional)
  - function: { input, process, output, sideEffects }
  - data: { fields, tables, constraints, migration }
  - exception: { errorCases, userNotification, logging, recovery }
  - auth: { roles, operations, boundary }
  - non_functional: { performance, availability, monitoring, security, scalability }';

-- Add related_deliverable_ids column to system_requirements
ALTER TABLE system_requirements
  ADD COLUMN IF NOT EXISTS related_deliverable_ids text[] NOT NULL DEFAULT '{}'::text[];

-- Add comment
COMMENT ON COLUMN system_requirements.related_deliverable_ids IS
'Array of deliverable IDs that this system requirement is related to.
Replaces the old category-based relationship.';

-- Create index for deliverables JSONB queries
CREATE INDEX IF NOT EXISTS idx_system_functions_deliverables
  ON system_functions USING gin (deliverables);

-- Create index for related_deliverable_ids array queries
CREATE INDEX IF NOT EXISTS idx_system_requirements_related_deliverables
  ON system_requirements USING gin (related_deliverable_ids);

-- Note: Old columns (category, entry_points, system_design) are kept for backward compatibility
-- They will be marked as deprecated in the application code and eventually removed in a future migration
-- after data migration is complete.
