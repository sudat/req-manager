import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { EntryPoint, SystemFunction, DesignItemCategory, SrfCategory, SrfStatus } from "@/lib/domain";
import { codeRefsToEntryPoints, entryPointsToCodeRefs, normalizeEntryPoints } from "@/lib/data/structured";

export type SystemFunctionInput = {
  id: string;
  systemDomainId: string | null;
  category: SrfCategory;
  title: string;
  summary: string;
  status: SrfStatus;
  relatedTaskIds: string[];
  requirementIds: string[];
  systemDesign: SystemFunction["systemDesign"];
	entryPoints?: EntryPoint[];
  codeRefs: SystemFunction["codeRefs"];
};

type SystemFunctionRow = {
  id: string;
  system_domain_id: string | null;
  category: string;
  title: string;
  summary: string;
  status: string;
  related_task_ids: string[] | null;
  requirement_ids: string[] | null;
  system_design: SystemFunction["systemDesign"] | null;
	entry_points: unknown | null;
  code_refs: SystemFunction["codeRefs"] | null;
  created_at: string;
  updated_at: string;
};

const toSystemFunction = (row: SystemFunctionRow): SystemFunction => {
	const normalizedEntryPoints = normalizeEntryPoints(row.entry_points);
	const entryPoints =
		normalizedEntryPoints.length > 0 ? normalizedEntryPoints : codeRefsToEntryPoints(row.code_refs);

	const codeRefs =
		(row.code_refs ?? []).length > 0
			? (row.code_refs ?? [])
			: entryPoints.length > 0
				? (entryPointsToCodeRefs(entryPoints) as SystemFunction["codeRefs"])
				: [];

	return {
		id: row.id,
		systemDomainId: row.system_domain_id ?? null,
		category: row.category as SrfCategory,
		title: row.title,
		summary: row.summary,
		status: row.status as SrfStatus,
		relatedTaskIds: row.related_task_ids ?? [],
		requirementIds: row.requirement_ids ?? [],
		systemDesign: row.system_design ?? [],
		entryPoints,
		codeRefs,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
};

const toSystemFunctionRowBase = (input: SystemFunctionInput) => ({
	id: input.id,
	system_domain_id: input.systemDomainId,
	category: input.category,
	title: input.title,
	summary: input.summary,
	status: input.status,
	related_task_ids: input.relatedTaskIds,
	requirement_ids: input.requirementIds,
	system_design: input.systemDesign,
});

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listSystemFunctions = async () => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("system_functions")
    .select("*")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as SystemFunctionRow[]).map(toSystemFunction), error: null };
};

export const listSystemFunctionsByDomain = async (systemDomainId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("system_functions")
    .select("*")
    .eq("system_domain_id", systemDomainId)
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as SystemFunctionRow[]).map(toSystemFunction), error: null };
};

export const getSystemFunctionById = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("system_functions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toSystemFunction(data as SystemFunctionRow), error: null };
};

export const createSystemFunction = async (input: SystemFunctionInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
	const entryPoints =
		input.entryPoints !== undefined ? input.entryPoints : codeRefsToEntryPoints(input.codeRefs);
  const payload = {
    ...toSystemFunctionRowBase(input),
		entry_points: entryPoints,
		code_refs:
			input.codeRefs.length > 0
				? input.codeRefs
				: entryPoints.length > 0
					? (entryPointsToCodeRefs(entryPoints) as SystemFunction["codeRefs"])
					: [],
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("system_functions")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toSystemFunction(data as SystemFunctionRow), error: null };
};

export const updateSystemFunction = async (id: string, input: Omit<SystemFunctionInput, "id">) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

	const { data: existing, error: fetchError } = await supabase
		.from("system_functions")
		.select("entry_points")
		.eq("id", id)
		.maybeSingle();

	if (fetchError) return { data: null, error: fetchError.message };

  const now = new Date().toISOString();
	const incomingEntryPoints =
		input.entryPoints !== undefined ? input.entryPoints : codeRefsToEntryPoints(input.codeRefs);

	const existingEntryPoints = normalizeEntryPoints(
		(existing as Pick<SystemFunctionRow, "entry_points"> | null)?.entry_points
	);
	const existingByPath = new Map(existingEntryPoints.map((p) => [p.path, p] as const));
	const mergedEntryPoints =
		input.entryPoints !== undefined
			? normalizeEntryPoints(input.entryPoints)
			: incomingEntryPoints.map((p) => existingByPath.get(p.path) ?? p);

  const payload = {
    ...toSystemFunctionRowBase({ ...input, id }),
		entry_points: mergedEntryPoints,
		code_refs:
			input.codeRefs.length > 0
				? input.codeRefs
				: mergedEntryPoints.length > 0
					? (entryPointsToCodeRefs(mergedEntryPoints) as SystemFunction["codeRefs"])
					: [],
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("system_functions")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toSystemFunction(data as SystemFunctionRow), error: null };
};

export const deleteSystemFunction = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { error } = await supabase
    .from("system_functions")
    .delete()
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const getDesignCategoryLabel = (category: DesignItemCategory): string => {
  const labels: Record<DesignItemCategory, string> = {
    database: "データベース設計",
    api: "API設計",
    logic: "ビジネスロジック",
    ui: "UI/画面設計",
    integration: "外部連携",
    batch: "バッチ処理",
    error_handling: "エラーハンドリング",
  };
  return labels[category] || category;
};
