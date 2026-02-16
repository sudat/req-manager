import type { DdType } from "@/lib/domain";
import { DD_TYPE_LABELS } from "@/lib/domain/enums";
import { BUSINESS_RULE_TYPE_LABELS } from "@/lib/domain/labels";

export const DD_TYPES: { value: DdType; label: string }[] = [
  { value: "screen", label: DD_TYPE_LABELS.screen },
  { value: "api", label: DD_TYPE_LABELS.api },
  { value: "batch", label: DD_TYPE_LABELS.batch },
  { value: "external_if", label: DD_TYPE_LABELS.external_if },
  { value: "model", label: DD_TYPE_LABELS.model },
  { value: "report", label: DD_TYPE_LABELS.report },
  { value: "job", label: DD_TYPE_LABELS.job },
];

export const EXCEPTION_TYPES = [
  "validation",
  "state",
  "permission",
  "external",
  "timeout",
  "conflict",
] as const;

export const RECOVERY_TYPES = [
  "none",
  "retry_immediate",
  "retry_with_backoff",
  "fallback",
  "manual_intervention",
  "circuit_breaker",
] as const;

export const EVENT_DESTINATIONS = ["queue", "topic", "webhook"] as const;

export const DB_OPERATIONS = ["insert", "update", "delete", "upsert"] as const;

export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

export const SCREEN_TRIGGERS = ["click", "input", "load", "select"] as const;

export const BUSINESS_RULE_TYPES = ["validate", "read", "derive", "decide"] as const;

export { BUSINESS_RULE_TYPE_LABELS };

export const MODEL_RELATIONSHIP_TYPES = ["1:1", "1:N", "N:1", "N:M"] as const;
