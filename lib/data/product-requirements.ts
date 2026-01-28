import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { ProductRequirement } from "@/lib/domain";

export type ProductRequirementInput = {
  id: string;
  targetUsers: string;
  experienceGoals: string;
  qualityGoals: string;
  designSystem: string;
  uxGuidelines: string;
  techStackProfile: string;
  codingConventions?: string | null;
  forbiddenChoices?: string | null;
};

export type ProductRequirementCreateInput = ProductRequirementInput & {
  projectId: string;
};

type ProductRequirementRow = {
  id: string;
  project_id: string;
  target_users: string;
  experience_goals: string;
  quality_goals: string;
  design_system: string;
  ux_guidelines: string;
  tech_stack_profile: string | null;
  coding_conventions: string | null;
  forbidden_choices: string | null;
  created_at: string;
  updated_at: string;
};

const toProductRequirement = (row: ProductRequirementRow): ProductRequirement => ({
  id: row.id,
  projectId: row.project_id,
  targetUsers: row.target_users,
  experienceGoals: row.experience_goals,
  qualityGoals: row.quality_goals,
  designSystem: row.design_system,
  uxGuidelines: row.ux_guidelines,
  // JSONBカラムを文字列としてそのまま返す（既存のYAMLデータも自動変換）
  techStackProfile: row.tech_stack_profile ?? "{}",
  codingConventions: row.coding_conventions,
  forbiddenChoices: row.forbidden_choices,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toProductRequirementRowBase = (input: ProductRequirementInput) => ({
  id: input.id,
  target_users: input.targetUsers,
  experience_goals: input.experienceGoals,
  quality_goals: input.qualityGoals,
  design_system: input.designSystem,
  ux_guidelines: input.uxGuidelines,
  tech_stack_profile: input.techStackProfile,
  coding_conventions: input.codingConventions ?? null,
  forbidden_choices: input.forbiddenChoices ?? null,
});

const toProductRequirementRowPartial = (input: Partial<ProductRequirementInput>) => {
  const row: Partial<ProductRequirementRow> = {};
  if (input.targetUsers !== undefined) row.target_users = input.targetUsers;
  if (input.experienceGoals !== undefined) row.experience_goals = input.experienceGoals;
  if (input.qualityGoals !== undefined) row.quality_goals = input.qualityGoals;
  if (input.designSystem !== undefined) row.design_system = input.designSystem;
  if (input.uxGuidelines !== undefined) row.ux_guidelines = input.uxGuidelines;
  if (input.techStackProfile !== undefined) row.tech_stack_profile = input.techStackProfile;
  if (input.codingConventions !== undefined) row.coding_conventions = input.codingConventions;
  if (input.forbiddenChoices !== undefined) row.forbidden_choices = input.forbiddenChoices;
  return row;
};

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listProductRequirements = async (projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("product_requirements")
    .select("*")
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as ProductRequirementRow[]).map(toProductRequirement), error: null };
};

export const getProductRequirementById = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("product_requirements")
    .select("*")
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toProductRequirement(data as ProductRequirementRow), error: null };
};

export const getProductRequirementByProjectId = async (projectId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("product_requirements")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toProductRequirement(data as ProductRequirementRow), error: null };
};

export const createProductRequirement = async (input: ProductRequirementCreateInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toProductRequirementRowBase(input),
    project_id: input.projectId,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("product_requirements")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toProductRequirement(data as ProductRequirementRow), error: null };
};

export const updateProductRequirement = async (
  id: string,
  input: Partial<Omit<ProductRequirementInput, "id">>,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toProductRequirementRowPartial(input),
    updated_at: now,
  };

  let query = supabase
    .from("product_requirements")
    .update(payload)
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toProductRequirement(data as ProductRequirementRow), error: null };
};

export const deleteProductRequirement = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("product_requirements")
    .delete()
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
