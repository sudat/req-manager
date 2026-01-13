import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";

export type BusinessRequirement = {
  id: string;
  taskId: string;
  title: string;
  summary: string;
  conceptIds: string[];
  srfId: string | null;
  systemDomainIds: string[];
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
  acceptance_criteria: string[] | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

const toBusinessRequirement = (row: BusinessRequirementRow): BusinessRequirement => ({
  id: row.id,
  taskId: row.task_id,
  title: row.title,
  summary: row.summary,
  conceptIds: row.concept_ids ?? [],
  srfId: row.srf_id ?? null,
  systemDomainIds: row.system_domain_ids ?? [],
  acceptanceCriteria: row.acceptance_criteria ?? [],
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toBusinessRequirementRow = (input: BusinessRequirementInput) => ({
  id: input.id,
  task_id: input.taskId,
  title: input.title,
  summary: input.summary,
  concept_ids: input.conceptIds,
  srf_id: input.srfId,
  system_domain_ids: input.systemDomainIds,
  acceptance_criteria: input.acceptanceCriteria,
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

export const createBusinessRequirements = async (inputs: BusinessRequirementInput[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (inputs.length === 0) return { data: [], error: null };

  const now = new Date().toISOString();
  const payload = inputs.map((input) => ({
    ...toBusinessRequirementRow(input),
    created_at: now,
    updated_at: now,
  }));

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

  const now = new Date().toISOString();
  const payload = {
    ...toBusinessRequirementRow({ ...input, id }),
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
