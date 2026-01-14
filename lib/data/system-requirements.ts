import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";

export type SystemRequirement = {
	id: string;
	taskId: string;
	srfId: string | null;
	title: string;
	summary: string;
	conceptIds: string[];
	impacts: string[];
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
	acceptanceCriteria: string[];
	systemDomainIds: string[];
	sortOrder: number;
};

type SystemRequirementRow = {
	id: string;
	task_id: string;
	srf_id: string | null;
	title: string;
	summary: string;
	concept_ids: string[] | null;
	impacts: string[] | null;
	acceptance_criteria: string[] | null;
	system_domain_ids: string[] | null;
	sort_order: number | null;
	created_at: string;
	updated_at: string;
};

const toSystemRequirement = (row: SystemRequirementRow): SystemRequirement => ({
	id: row.id,
	taskId: row.task_id,
	srfId: row.srf_id ?? null,
	title: row.title,
	summary: row.summary,
	conceptIds: row.concept_ids ?? [],
	impacts: row.impacts ?? [],
	acceptanceCriteria: row.acceptance_criteria ?? [],
	systemDomainIds: row.system_domain_ids ?? [],
	sortOrder: row.sort_order ?? 0,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toSystemRequirementRow = (input: SystemRequirementInput) => ({
	id: input.id,
	task_id: input.taskId,
	srf_id: input.srfId,
	title: input.title,
	summary: input.summary,
	concept_ids: input.conceptIds,
	impacts: input.impacts,
	acceptance_criteria: input.acceptanceCriteria,
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

export const listSystemRequirementsByTaskId = async (taskId: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const { data, error } = await supabase
		.from("system_requirements")
		.select("*")
		.eq("task_id", taskId)
		.order("sort_order")
		.order("id");

	if (error) return { data: null, error: error.message };
	return { data: (data as SystemRequirementRow[]).map(toSystemRequirement), error: null };
};

export const listSystemRequirementsByIds = async (ids: string[]) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;
	if (ids.length === 0) return { data: [], error: null };

	const { data, error } = await supabase
		.from("system_requirements")
		.select("*")
		.in("id", ids)
		.order("id");

	if (error) return { data: null, error: error.message };
	return { data: (data as SystemRequirementRow[]).map(toSystemRequirement), error: null };
};

export const createSystemRequirements = async (inputs: SystemRequirementInput[]) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;
	if (inputs.length === 0) return { data: [], error: null };

	const now = new Date().toISOString();
	const payload = inputs.map((input) => ({
		...toSystemRequirementRow(input),
		created_at: now,
		updated_at: now,
	}));

	const { data, error } = await supabase
		.from("system_requirements")
		.insert(payload)
		.select("*");

	if (error) return { data: null, error: error.message };
	return { data: (data as SystemRequirementRow[]).map(toSystemRequirement), error: null };
};

export const listSystemRequirementsBySrfId = async (srfId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("system_requirements")
    .select("*")
    .eq("srf_id", srfId)
    .order("sort_order")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as SystemRequirementRow[]).map(toSystemRequirement), error: null };
};

export const createSystemRequirement = async (input: SystemRequirementInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toSystemRequirementRow(input),
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

export const updateSystemRequirement = async (id: string, input: Omit<SystemRequirementInput, "id">) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toSystemRequirementRow({ ...input, id }),
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("system_requirements")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toSystemRequirement(data as SystemRequirementRow), error: null };
};

export const deleteSystemRequirement = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { error } = await supabase
    .from("system_requirements")
    .delete()
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
