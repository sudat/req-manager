import type { EntryPoint } from "@/lib/domain";

/**
 * 受入条件定義（PRD v1.3 Phase 2）
 * 設計原則: 受入条件の定義と確認状態を分離する
 * 確認状態は AcceptanceConfirmation で管理するため、ここでは定義のみを持つ
 */
export type AcceptanceCriterionJson = {
  id: string;
  description: string;
  verification_method: string | null;
  givenText?: string;
  whenText?: string;
  thenText?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const pad3 = (n: number) => String(n).padStart(3, "0");

const defaultAcceptanceCriterion = (index: number, description: string): AcceptanceCriterionJson => ({
  id: `AC-${pad3(index + 1)}`,
  description,
  verification_method: null,
  givenText: "",
  whenText: "",
  thenText: "",
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

    const givenText =
      typeof item.givenText === "string"
        ? item.givenText
        : typeof item.given === "string"
          ? item.given
          : "";
    const whenText =
      typeof item.whenText === "string"
        ? item.whenText
        : typeof item.when === "string"
          ? item.when
          : "";
    const thenText =
      typeof item.thenText === "string"
        ? item.thenText
        : typeof item.then === "string"
          ? item.then
          : "";

    return {
      id,
      description,
      verification_method,
      givenText,
      whenText,
      thenText,
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

export const normalizeCodeRefs = (raw: unknown): Array<{ githubUrl?: string; paths: string[]; note?: string }> => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const ref = item as Record<string, unknown>;

      const paths = Array.isArray(ref.paths)
        ? ref.paths.filter((p): p is string => typeof p === "string" && p.length > 0)
        : [];

      if (paths.length === 0) return null;

      return {
        githubUrl: typeof ref.githubUrl === "string" ? ref.githubUrl : undefined,
        paths,
        note: typeof ref.note === "string" ? ref.note : undefined,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
};

