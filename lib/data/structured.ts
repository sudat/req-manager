import type { EntryPoint } from "@/lib/domain";

export type AcceptanceCriterionJson = {
  id: string;
  description: string;
  verification_method: string | null;
  status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  evidence: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const pad3 = (n: number) => String(n).padStart(3, "0");

const defaultAcceptanceCriterion = (index: number, description: string): AcceptanceCriterionJson => ({
  id: `AC-${pad3(index + 1)}`,
  description,
  verification_method: null,
  status: null,
  verified_by: null,
  verified_at: null,
  evidence: null,
});

export const normalizeAcceptanceCriteriaJson = (raw: unknown): AcceptanceCriterionJson[] => {
  if (!Array.isArray(raw)) return [];

  return raw.map((item, index) => {
    if (!isRecord(item)) return defaultAcceptanceCriterion(index, "");

    const id =
      typeof item.id === "string" && item.id.length > 0 ? item.id : `AC-${pad3(index + 1)}`;

    const description = typeof item.description === "string" ? item.description : "";

    const verification_method =
      typeof item.verification_method === "string" ? item.verification_method : null;

    const status = typeof item.status === "string" ? item.status : null;
    const verified_by = typeof item.verified_by === "string" ? item.verified_by : null;
    const verified_at = typeof item.verified_at === "string" ? item.verified_at : null;
    const evidence = typeof item.evidence === "string" ? item.evidence : null;

    return {
      id,
      description,
      verification_method,
      status,
      verified_by,
      verified_at,
      evidence,
    };
  });
};

export const legacyAcceptanceCriteriaToJson = (legacy: string[]): AcceptanceCriterionJson[] =>
  legacy.map((description, index) => defaultAcceptanceCriterion(index, description));

export const acceptanceCriteriaJsonToLegacy = (items: AcceptanceCriterionJson[]): string[] =>
  items.map((item) => item.description);

export const mergeAcceptanceCriteriaJsonWithLegacy = (
  baseJson: unknown,
  legacy: string[]
): AcceptanceCriterionJson[] => {
  const normalized = normalizeAcceptanceCriteriaJson(baseJson);

  const merged: AcceptanceCriterionJson[] = [];
  for (let i = 0; i < legacy.length; i += 1) {
    const description = legacy[i] ?? "";
    const existing = normalized[i];
    if (existing) {
      merged.push({ ...existing, description });
      continue;
    }
    merged.push(defaultAcceptanceCriterion(i, description));
  }

  return merged;
};

export const normalizeEntryPoints = (raw: unknown): EntryPoint[] => {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const result: EntryPoint[] = [];

  for (const item of raw) {
    if (!isRecord(item)) continue;
    if (typeof item.path !== "string" || item.path.length === 0) continue;
    if (seen.has(item.path)) continue;

    seen.add(item.path);
    result.push({
      path: item.path,
      type: typeof item.type === "string" ? item.type : null,
      responsibility: typeof item.responsibility === "string" ? item.responsibility : null,
    });
  }

  return result;
};

type CodeRefLike = { paths?: string[] | null };

export const codeRefsToEntryPoints = (codeRefs: CodeRefLike[] | null | undefined): EntryPoint[] => {
  const paths: string[] = [];
  for (const ref of codeRefs ?? []) {
    for (const path of ref.paths ?? []) {
      if (typeof path === "string" && path.length > 0) paths.push(path);
    }
  }

  const seen = new Set<string>();
  return paths
    .filter((path) => {
      if (seen.has(path)) return false;
      seen.add(path);
      return true;
    })
    .map((path) => ({ path, type: null, responsibility: null }));
};

export const entryPointsToCodeRefs = (entryPoints: EntryPoint[]): Array<{ paths: string[] }> => [
  { paths: entryPoints.map((p) => p.path) },
];

