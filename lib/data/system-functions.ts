import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { EntryPoint, SystemFunction, DesignItemCategory, SrfCategory, SrfStatus } from "@/lib/domain";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";
import {
	codeRefsToEntryPoints,
	entryPointsToCodeRefs,
	normalizeEntryPoints,
	normalizeCodeRefs,
} from "@/lib/data/structured";
import { migrateToDeliverables } from "./deliverable-migration";

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
  deliverables: Deliverable[];
  codeRefs: SystemFunction["codeRefs"];
};

export type SystemFunctionCreateInput = SystemFunctionInput & {
	projectId: string;
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
  deliverables: unknown | null;
  code_refs: unknown | null;
  created_at: string;
  updated_at: string;
};

const toSystemFunction = (row: SystemFunctionRow): SystemFunction => {
	const normalizedEntryPoints = normalizeEntryPoints(row.entry_points);
	const normalizedCodeRefs = normalizeCodeRefs(row.code_refs);

	const entryPoints =
		normalizedEntryPoints.length > 0
			? normalizedEntryPoints
			: codeRefsToEntryPoints(normalizedCodeRefs);

	const codeRefs =
		normalizedCodeRefs.length > 0
			? normalizedCodeRefs
			: entryPoints.length > 0
				? (entryPointsToCodeRefs(entryPoints) as SystemFunction["codeRefs"])
				: [];

	// deliverables の読み込み（既存データがない場合は自動変換）
	let deliverables: Deliverable[] = [];
	if (row.deliverables && Array.isArray(row.deliverables)) {
		deliverables = row.deliverables as Deliverable[];
	} else {
		// 既存データから自動変換
		const systemDesign = row.system_design ?? [];
		deliverables = migrateToDeliverables(systemDesign, normalizedEntryPoints);
	}

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
		deliverables,
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
	deliverables: input.deliverables,
});

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listSystemFunctions = async (projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("system_functions")
    .select("*")
    .order("id");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as SystemFunctionRow[]).map(toSystemFunction), error: null };
};

export const listSystemFunctionsByDomain = async (systemDomainId: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("system_functions")
    .select("*")
    .eq("system_domain_id", systemDomainId)
    .order("id");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as SystemFunctionRow[]).map(toSystemFunction), error: null };
};

export const getSystemFunctionById = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("system_functions")
    .select("*")
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toSystemFunction(data as SystemFunctionRow), error: null };
};

export const createSystemFunction = async (input: SystemFunctionCreateInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
	const entryPoints =
		input.entryPoints !== undefined ? input.entryPoints : codeRefsToEntryPoints(input.codeRefs);
  const payload = {
    ...toSystemFunctionRowBase(input),
		project_id: input.projectId,
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

export const updateSystemFunction = async (
  id: string,
  input: Omit<SystemFunctionInput, "id">,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

	let fetchQuery = supabase
		.from("system_functions")
		.select("entry_points")
		.eq("id", id);

	if (projectId) {
		fetchQuery = fetchQuery.eq("project_id", projectId);
	}

	const { data: existing, error: fetchError } = await fetchQuery.maybeSingle();

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

  let updateQuery = supabase
    .from("system_functions")
    .update(payload)
    .eq("id", id);

  if (projectId) {
    updateQuery = updateQuery.eq("project_id", projectId);
  }

  const { data, error } = await updateQuery
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toSystemFunction(data as SystemFunctionRow), error: null };
};

export const deleteSystemFunction = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("system_functions")
    .delete()
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

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
