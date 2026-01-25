import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { Project } from "@/lib/domain";

export type ProjectInput = {
  name: string;
  description?: string | null;
  githubUrl?: string | null;
  reviewLinkThreshold?: 'low' | 'medium' | 'high' | null;
  autoSave?: boolean | null;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  github_url: string | null;
  review_link_threshold: string;
  auto_save: boolean;
  created_at: string;
  updated_at: string;
};

const toProject = (row: ProjectRow): Project => ({
  id: row.id,
  name: row.name,
  description: row.description,
  githubUrl: row.github_url,
  reviewLinkThreshold: row.review_link_threshold as 'low' | 'medium' | 'high',
  autoSave: row.auto_save,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toProjectRow = (input: ProjectInput) => ({
  name: input.name,
  description: input.description ?? null,
  github_url: input.githubUrl ?? null,
  review_link_threshold: input.reviewLinkThreshold ?? 'medium',
  auto_save: input.autoSave ?? true,
});

const toProjectRowPartial = (input: Partial<ProjectInput>) => {
  const row: Partial<ProjectRow> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.description !== undefined) row.description = input.description ?? null;
  if (input.githubUrl !== undefined) row.github_url = input.githubUrl;
  if (input.reviewLinkThreshold !== undefined) {
    row.review_link_threshold = input.reviewLinkThreshold ?? 'medium';
  }
  if (input.autoSave !== undefined) row.auto_save = input.autoSave ?? true;
  return row;
};

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listProjects = async () => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data as ProjectRow[]).map(toProject), error: null };
};

export const getProjectById = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toProject(data as ProjectRow), error: null };
};

export const createProject = async (input: ProjectInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toProjectRow(input),
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toProject(data as ProjectRow), error: null };
};

export const updateProject = async (id: string, input: Partial<ProjectInput>) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toProjectRowPartial(input),
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toProject(data as ProjectRow), error: null };
};

export const deleteProject = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
