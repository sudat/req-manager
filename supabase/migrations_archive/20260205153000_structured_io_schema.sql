-- Structured IO schema plan (no apply)
-- This migration is a placeholder for structured IO schema enablement.
-- We keep all changes within system_functions.deliverables JSONB for compatibility.

-- Suggested JSONB shape (deliverables[].design.function):
-- {
--   "ioType": "api" | "screen" | "batch" | "job",
--   "structuredInput": { ... },
--   "structuredOutput": { ... },
--   "structuredSideEffects": { ... },
--   "input": "..."  // deprecated
--   "output": "..." // deprecated
--   "sideEffects": "..." // deprecated
-- }

COMMENT ON COLUMN system_functions.deliverables IS
'Array of deliverable objects. Each deliverable has:
- id: string
- name: string
- type: "screen" | "batch" | "api" | "job" | "template" | "service"
- entryPoint: string | null
- design.function: supports structured IO
  - ioType: "api" | "screen" | "batch" | "job"
  - structuredInput: object
  - structuredOutput: object
  - structuredSideEffects: object
  - input/output/sideEffects: deprecated text'
;
