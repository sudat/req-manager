import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { BusinessRequirementPriority } from "@/lib/domain";
import {
	acceptanceCriteriaJsonToLegacy,
	legacyAcceptanceCriteriaToJson,
	mergeAcceptanceCriteriaJsonWithLegacy,
	normalizeAcceptanceCriteriaJson,
	type AcceptanceCriterionJson,
} from "@/lib/data/structured";

export type BusinessRequirement = {
	id: string;
	taskId: string;
	title: string;
	summary: string;
	conceptIds: string[];
	srfId: string | null;
	systemDomainIds: string[];
	impacts: string[];
	relatedSystemRequirementIds: string[];
	priority: BusinessRequirementPriority;
	acceptanceCriteriaJson: AcceptanceCriterionJson[];
	acceptanceCriteria: string[];
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
};

export type BusinessRequirementInput = {
	id: string;
	taskId: string;
	title: string;
	summary: string;
	conceptIds: string[];
	srfId: string | null;
	systemDomainIds: string[];
	impacts: string[];
	relatedSystemRequirementIds: string[];
	priority?: BusinessRequirementPriority;
	acceptanceCriteriaJson?: AcceptanceCriterionJson[];
	acceptanceCriteria: string[];
	sortOrder: number;
};

type BusinessRequirementRow = {
	id: string;
	task_id: string;
	title: string;
	summary: string;
	concept_ids: string[] | null;
	srf_id: string | null;
	system_domain_ids: string[] | null;
	impacts: string[] | null;
	related_system_requirement_ids: string[] | null;
	priority: string | null;
	acceptance_criteria_json: unknown | null;
	acceptance_criteria: string[] | null;
	sort_order: number | null;
	created_at: string;
	updated_at: string;
};

const normalizePriority = (value: unknown): BusinessRequirementPriority => {
	if (value === "Must" || value === "Should" || value === "Could") return value;
	return "Must";
};

const toBusinessRequirement = (row: BusinessRequirementRow): BusinessRequirement => {
	const normalizedJson = normalizeAcceptanceCriteriaJson(row.acceptance_criteria_json);
	const acceptanceCriteriaJson =
		normalizedJson.length > 0
			? normalizedJson
			: legacyAcceptanceCriteriaToJson(row.acceptance_criteria ?? []);

	return {
		id: row.id,
		taskId: row.task_id,
		title: row.title,
		summary: row.summary,
		conceptIds: row.concept_ids ?? [],
		srfId: row.srf_id ?? null,
		systemDomainIds: row.system_domain_ids ?? [],
		impacts: row.impacts ?? [],
		relatedSystemRequirementIds: row.related_system_requirement_ids ?? [],
		priority: normalizePriority(row.priority),
		acceptanceCriteriaJson,
		acceptanceCriteria: acceptanceCriteriaJsonToLegacy(acceptanceCriteriaJson),
		sortOrder: row.sort_order ?? 0,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
};

const toBusinessRequirementRowBase = (input: BusinessRequirementInput) => ({
	id: input.id,
	task_id: input.taskId,
	title: input.title,
	summary: input.summary,
	concept_ids: input.conceptIds,
	srf_id: input.srfId,
	system_domain_ids: input.systemDomainIds,
	impacts: input.impacts,
	related_system_requirement_ids: input.relatedSystemRequirementIds,
	sort_order: input.sortOrder,
});

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listBusinessRequirementsByTaskId = async (taskId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("business_requirements")
    .select("*")
    .eq("task_id", taskId)
    .order("sort_order")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as BusinessRequirementRow[]).map(toBusinessRequirement), error: null };
};

export const listBusinessRequirementsByIds = async (ids: string[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (ids.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("business_requirements")
    .select("*")
    .in("id", ids)
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as BusinessRequirementRow[]).map(toBusinessRequirement), error: null };
};

export const listBusinessRequirementsByTaskIds = async (taskIds: string[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (taskIds.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("business_requirements")
    .select("*")
    .in("task_id", taskIds)
    .order("task_id")
    .order("sort_order")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as BusinessRequirementRow[]).map(toBusinessRequirement), error: null };
};

export const createBusinessRequirements = async (inputs: BusinessRequirementInput[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (inputs.length === 0) return { data: [], error: null };

  const now = new Date().toISOString();
  const payload = inputs.map((input) => {
		const acceptanceCriteriaJson = normalizeAcceptanceCriteriaJson(
			input.acceptanceCriteriaJson ?? legacyAcceptanceCriteriaToJson(input.acceptanceCriteria)
		);

		return {
			...toBusinessRequirementRowBase(input),
		priority: input.priority ?? "Must",
		acceptance_criteria_json: acceptanceCriteriaJson,
		acceptance_criteria: acceptanceCriteriaJsonToLegacy(acceptanceCriteriaJson),
    created_at: now,
    updated_at: now,
		};
	});

  const { data, error } = await supabase
    .from("business_requirements")
    .insert(payload)
    .select("*");

  if (error) return { data: null, error: error.message };
  return { data: (data as BusinessRequirementRow[]).map(toBusinessRequirement), error: null };
};

export const updateBusinessRequirement = async (id: string, input: Omit<BusinessRequirementInput, "id">) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

	const { data: existing, error: fetchError } = await supabase
		.from("business_requirements")
		.select("priority, acceptance_criteria_json")
		.eq("id", id)
		.maybeSingle();

	if (fetchError) return { data: null, error: fetchError.message };

  const now = new Date().toISOString();
	const acceptanceCriteriaJson =
		input.acceptanceCriteriaJson !== undefined
			? normalizeAcceptanceCriteriaJson(input.acceptanceCriteriaJson)
			: mergeAcceptanceCriteriaJsonWithLegacy(
					(existing as Pick<BusinessRequirementRow, "acceptance_criteria_json"> | null)
						?.acceptance_criteria_json,
					input.acceptanceCriteria
			  );

  const payload = {
    ...toBusinessRequirementRowBase({ ...input, id }),
		...(input.priority !== undefined
			? { priority: input.priority }
			: { priority: normalizePriority((existing as BusinessRequirementRow | null)?.priority) }),
		acceptance_criteria_json: acceptanceCriteriaJson,
		acceptance_criteria: acceptanceCriteriaJsonToLegacy(acceptanceCriteriaJson),
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("business_requirements")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toBusinessRequirement(data as BusinessRequirementRow), error: null };
};

export const deleteBusinessRequirement = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { error } = await supabase
    .from("business_requirements")
    .delete()
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const listBusinessRequirements = async () => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("business_requirements")
    .select("*")
    .order("task_id")
    .order("sort_order")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as BusinessRequirementRow[]).map(toBusinessRequirement), error: null };
};
