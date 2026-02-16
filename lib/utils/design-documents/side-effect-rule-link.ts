import type { SideEffect } from "@/lib/domain/schemas/side-effects";

export type RuleSideEffectKind = "db" | "api" | "event" | "file";

export type RuleSideEffectSummary = {
  kind: RuleSideEffectKind;
  label: string;
};

const SIDE_EFFECT_KIND_LABELS: Record<RuleSideEffectKind, string> = {
  db: "DB",
  api: "API",
  event: "Event",
  file: "File",
};

function pushRuleSideEffect(
  map: Map<string, RuleSideEffectSummary[]>,
  ruleRef: string | undefined,
  item: RuleSideEffectSummary
): void {
  const normalizedRuleRef = ruleRef?.trim();
  if (!normalizedRuleRef) return;

  const current = map.get(normalizedRuleRef) ?? [];
  map.set(normalizedRuleRef, [...current, item]);
}

export function collectSideEffectsByRuleName(
  sideEffects?: SideEffect
): Map<string, RuleSideEffectSummary[]> {
  const map = new Map<string, RuleSideEffectSummary[]>();
  if (!sideEffects) return map;

  for (const operation of sideEffects.dbOperations ?? []) {
    pushRuleSideEffect(map, operation.ruleRef, {
      kind: "db",
      label: `${operation.operation.toUpperCase()} ${operation.table || "(table未設定)"}`,
    });
  }

  for (const apiCall of sideEffects.externalApiCalls ?? []) {
    pushRuleSideEffect(map, apiCall.ruleRef, {
      kind: "api",
      label: `${apiCall.method} ${apiCall.endpoint || "(endpoint未設定)"}`,
    });
  }

  for (const event of sideEffects.events ?? []) {
    pushRuleSideEffect(map, event.ruleRef, {
      kind: "event",
      label: `EVENT ${event.eventType || "(eventType未設定)"}`,
    });
  }

  for (const fileOutput of sideEffects.fileOutputs ?? []) {
    pushRuleSideEffect(map, fileOutput.ruleRef, {
      kind: "file",
      label: `FILE ${fileOutput.format} ${fileOutput.path || "(path未設定)"}`,
    });
  }

  return map;
}

export function countSideEffects(sideEffects?: SideEffect): number {
  if (!sideEffects) return 0;

  return (
    (sideEffects.dbOperations?.length ?? 0) +
    (sideEffects.externalApiCalls?.length ?? 0) +
    (sideEffects.events?.length ?? 0) +
    (sideEffects.fileOutputs?.length ?? 0)
  );
}

export function getSideEffectKindLabel(kind: RuleSideEffectKind): string {
  return SIDE_EFFECT_KIND_LABELS[kind];
}
