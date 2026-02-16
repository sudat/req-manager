import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { Project } from "@/lib/domain";
import { createCrudOperations } from "./crud-factory";

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

// crud-factoryを使用した基本CRUD操作
// projectsテーブルはproject_idカラムを持たないので、projectIdColumnは存在しないカラム名を指定
const projectCrud = createCrudOperations<ProjectRow, Project, ProjectInput>({
  tableName: "projects",
  toEntity: toProject,
  toRow: toProjectRow,
  orderBy: ["created_at"],
  projectIdColumn: "_no_project_id_",  // projectsテーブルはproject_idでフィルタしない
});

// listProjectsはprojectIdを受け取らない独自実装にする必要がある
export const listProjects = async () => {
  const configError = getSupabaseConfigError();
  if (configError) return { data: null, error: configError };

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data as ProjectRow[]).map(toProject), error: null };
};

export const getProjectById = async (id: string) => {
  // projectIdパラメータなしでgetByIdを呼び出す
  return projectCrud.getById(id);
};

// createProjectはprojectsテーブル専用の実装（project_idカラムを付与しない）
export const createProject = async (input: ProjectInput) => {
  const configError = getSupabaseConfigError();
  if (configError) return { data: null, error: configError };

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
  return projectCrud.update(id, input);
};

export const deleteProject = async (id: string) => {
  return projectCrud.delete(id);
};
