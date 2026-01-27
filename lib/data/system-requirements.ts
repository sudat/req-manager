import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { SystemRequirementCategory } from "@/lib/domain";
import type { AcceptanceCriterion } from "@/lib/domain";
import {
	acceptanceCriteriaJsonToLegacy,
	type AcceptanceCriterionJson,
} from "@/lib/data/structured";
import {
	acceptanceCriteriaToJson,
	listAcceptanceCriteriaBySystemRequirementIds,
} from "@/lib/data/acceptance-criteria";

export const getSystemRequirementCategoryLabel = (category: SystemRequirementCategory): string => {
	const labels: Record<SystemRequirementCategory, string> = {
		function: "機能",
		data: "データ",
		exception: "例外",
		non_functional: "非機能",
	};
	return labels[category] || category;
};

export type SystemRequirement = {
	id: string;
	taskId: string;
	srfId: string | null;
	title: string;
	summary: string;
	conceptIds: string[];
	impacts: string[];
	category: SystemRequirementCategory;
	categoryRaw?: string | null;
	businessRequirementIds: string[];
	relatedDeliverableIds: string[];
	acceptanceCriteriaJson: AcceptanceCriterionJson[];
	acceptanceCriteria: string[];
	systemDomainIds: string[];
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
};

export type SystemRequirementInput = {
	id: string;
	taskId: string;
	srfId: string | null;
	title: string;
	summary: string;
	conceptIds: string[];
	impacts: string[];
	category?: SystemRequirementCategory;
	businessRequirementIds?: string[];
	relatedDeliverableIds?: string[];
	acceptanceCriteriaJson?: AcceptanceCriterionJson[];
	acceptanceCriteria: string[];
	systemDomainIds: string[];
	sortOrder: number;
};

export type SystemRequirementCreateInput = SystemRequirementInput & {
	projectId: string;
};

type SystemRequirementRow = {
	id: string;
	task_id: string;
	srf_id: string | null;
	title: string;
	summary: string;
	concept_ids: string[] | null;
	impacts: string[] | null;
	category: string | null;
	business_requirement_ids: string[] | null;
	related_deliverable_ids: string[] | null;
	acceptance_criteria_json: unknown | null;
	acceptance_criteria: string[] | null;
	system_domain_ids: string[] | null;
	sort_order: number | null;
	created_at: string;
	updated_at: string;
};

const normalizeCategory = (value: unknown): SystemRequirementCategory => {
	if (
		value === "function" ||
		value === "data" ||
		value === "exception" ||
		value === "non_functional"
	) {
		return value;
	}
	if (value === "auth") return "non_functional";
	return "function";
};

const toSystemRequirement = (row: SystemRequirementRow): SystemRequirement => {
	return {
		id: row.id,
		taskId: row.task_id,
		srfId: row.srf_id ?? null,
		title: row.title,
		summary: row.summary,
		conceptIds: row.concept_ids ?? [],
		impacts: row.impacts ?? [],
		category: normalizeCategory(row.category),
		categoryRaw: row.category,
		businessRequirementIds: row.business_requirement_ids ?? [],
		relatedDeliverableIds: row.related_deliverable_ids ?? [],
		// 受入条件は正本テーブル acceptance_criteria からマージする
		acceptanceCriteriaJson: [],
		acceptanceCriteria: [],
		systemDomainIds: row.system_domain_ids ?? [],
		sortOrder: row.sort_order ?? 0,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
};

const toSystemRequirementRowBase = (input: SystemRequirementInput) => ({
	id: input.id,
	task_id: input.taskId,
	srf_id: input.srfId,
	title: input.title,
	summary: input.summary,
	concept_ids: input.conceptIds,
	impacts: input.impacts,
	system_domain_ids: input.systemDomainIds,
	sort_order: input.sortOrder,
});

const failIfMissingConfig = () => {
	const error = getSupabaseConfigError();
	if (error) {
		return { data: null, error };
	}
	return null;
};

const mergeAcceptanceCriteriaFromCanonical = async (
	requirements: SystemRequirement[],
	projectId?: string
) => {
	if (requirements.length === 0) return { data: [], error: null };

	const ids = requirements.map((req) => req.id);
	const { data: acceptanceRows, error } = await listAcceptanceCriteriaBySystemRequirementIds(
		ids,
		projectId
	);
	if (error) return { data: null, error };

	const acceptanceMap = new Map<string, AcceptanceCriterion[]>();
	for (const row of acceptanceRows ?? []) {
		const list = acceptanceMap.get(row.systemRequirementId);
		if (list) {
			list.push(row);
		} else {
			acceptanceMap.set(row.systemRequirementId, [row]);
		}
	}

	const merged = requirements.map((req) => {
		const canonical = acceptanceMap.get(req.id);
		if (!canonical || canonical.length === 0) return req;
		const acceptanceCriteriaJson = acceptanceCriteriaToJson(canonical);
		return {
			...req,
			acceptanceCriteriaJson,
			acceptanceCriteria: acceptanceCriteriaJsonToLegacy(acceptanceCriteriaJson),
		};
	});

	return { data: merged, error: null };
};

export const listSystemRequirementsByTaskId = async (taskId: string, projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	let query = supabase
		.from("system_requirements")
		.select("*")
		.eq("task_id", taskId)
		.order("sort_order")
		.order("id");

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query;
	if (error) return { data: null, error: error.message };
	const mapped = (data as SystemRequirementRow[]).map(toSystemRequirement);
	return mergeAcceptanceCriteriaFromCanonical(mapped, projectId);
};

export const listSystemRequirementsByIds = async (ids: string[], projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;
	if (ids.length === 0) return { data: [], error: null };

	let query = supabase.from("system_requirements").select("*").in("id", ids).order("id");

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query;
	if (error) return { data: null, error: error.message };
	const mapped = (data as SystemRequirementRow[]).map(toSystemRequirement);
	return mergeAcceptanceCriteriaFromCanonical(mapped, projectId);
};

export const listSystemRequirements = async (projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	let query = supabase.from("system_requirements").select("*").order("task_id").order("sort_order").order("id");

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query;
	if (error) return { data: null, error: error.message };
	const mapped = (data as SystemRequirementRow[]).map(toSystemRequirement);
	return mergeAcceptanceCriteriaFromCanonical(mapped, projectId);
};

export const createSystemRequirements = async (inputs: SystemRequirementCreateInput[]) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;
	if (inputs.length === 0) return { data: [], error: null };

	const now = new Date().toISOString();
	const payload = inputs.map((input) => {
		return {
			...toSystemRequirementRowBase(input),
			project_id: input.projectId,
			category: input.category ?? "function",
			business_requirement_ids: input.businessRequirementIds ?? [],
			related_deliverable_ids: input.relatedDeliverableIds ?? [],
			created_at: now,
			updated_at: now,
		};
	});

	const { data, error } = await supabase
		.from("system_requirements")
		.insert(payload)
		.select("*");

	if (error) return { data: null, error: error.message };
	return { data: (data as SystemRequirementRow[]).map(toSystemRequirement), error: null };
};

export const listSystemRequirementsBySrfId = async (srfId: string, projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	let query = supabase
		.from("system_requirements")
		.select("*")
		.eq("srf_id", srfId)
		.order("sort_order")
		.order("id");

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query;
	if (error) return { data: null, error: error.message };
	const mapped = (data as SystemRequirementRow[]).map(toSystemRequirement);
	return mergeAcceptanceCriteriaFromCanonical(mapped, projectId);
};

export const createSystemRequirement = async (input: SystemRequirementCreateInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toSystemRequirementRowBase(input),
		project_id: input.projectId,
		category: input.category ?? "function",
		business_requirement_ids: input.businessRequirementIds ?? [],
		related_deliverable_ids: input.relatedDeliverableIds ?? [],
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("system_requirements")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toSystemRequirement(data as SystemRequirementRow), error: null };
};

export const updateSystemRequirement = async (
	id: string,
	input: Omit<SystemRequirementInput, "id">,
	projectId?: string
) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	let fetchQuery = supabase
		.from("system_requirements")
		.select("category, business_requirement_ids, related_deliverable_ids")
		.eq("id", id);

	if (projectId) {
		fetchQuery = fetchQuery.eq("project_id", projectId);
	}

	const { data: existing, error: fetchError } = await fetchQuery.maybeSingle();
	if (fetchError) return { data: null, error: fetchError.message };

	const existingRow = existing as SystemRequirementRow | null;
	const now = new Date().toISOString();

	const payload = {
		...toSystemRequirementRowBase({ ...input, id }),
		category: input.category ?? normalizeCategory(existingRow?.category),
		business_requirement_ids: input.businessRequirementIds ?? existingRow?.business_requirement_ids ?? [],
		related_deliverable_ids: input.relatedDeliverableIds ?? existingRow?.related_deliverable_ids ?? [],
		updated_at: now,
	};

	let updateQuery = supabase
		.from("system_requirements")
		.update(payload)
		.eq("id", id);

	if (projectId) {
		updateQuery = updateQuery.eq("project_id", projectId);
	}

	const { data, error } = await updateQuery.select("*").single();
	if (error) return { data: null, error: error.message };
	return { data: toSystemRequirement(data as SystemRequirementRow), error: null };
};

export const deleteSystemRequirement = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("system_requirements")
    .delete()
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const deleteSystemRequirementsBySrfId = async (srfId: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("system_requirements")
    .delete()
    .eq("srf_id", srfId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
