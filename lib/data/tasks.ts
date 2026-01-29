import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { Task } from "@/lib/domain";
import { createCrudOperations } from "./crud-factory";

export type TaskInput = {
  id: string;
  businessId: string;
  name: string;
  summary: string;
  businessContext: string;
  processSteps: string;
  person: string;
  input: string;
  output: string;
  conceptIdsYaml: string;
  concepts: string[];
  sortOrder: number;
};

export type TaskCreateInput = TaskInput & {
  projectId: string;
};

type TaskRow = {
  id: string;
  business_id: string;
  name: string;
  summary: string;
  business_context: string | null;
  process_steps: string | null;
  person: string | null;
  input: string | null;
  output: string | null;
  concept_ids_yaml: string | null;
  concepts: string[] | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

const toTask = (row: TaskRow): Task => ({
  id: row.id,
  businessId: row.business_id,
  name: row.name,
  summary: row.summary,
  businessContext: row.business_context ?? "",
  processSteps: row.process_steps ?? "",
  person: row.person ?? "",
  input: row.input ?? "",
  output: row.output ?? "",
  conceptIdsYaml: row.concept_ids_yaml ?? "",
  concepts: row.concepts ?? [],
  businessReqCount: 0,
  systemReqCount: 0,
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toTaskRow = (input: Partial<TaskInput>) => {
  const row: Partial<TaskRow> = {};
  if (input.id !== undefined) row.id = input.id;
  if (input.businessId !== undefined) row.business_id = input.businessId;
  if (input.name !== undefined) row.name = input.name;
  if (input.summary !== undefined) row.summary = input.summary;
  if (input.businessContext !== undefined) row.business_context = input.businessContext;
  if (input.processSteps !== undefined) row.process_steps = input.processSteps;
  if (input.person !== undefined) row.person = input.person;
  if (input.input !== undefined) row.input = input.input;
  if (input.output !== undefined) row.output = input.output;
  if (input.conceptIdsYaml !== undefined) row.concept_ids_yaml = input.conceptIdsYaml;
  if (input.concepts !== undefined) row.concepts = input.concepts;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  return row;
};

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

// CRUD操作を生成
const crud = createCrudOperations<TaskRow, Task, TaskInput>({
  tableName: "business_tasks",
  toEntity: toTask,
  toRow: toTaskRow,
});

// 基本CRUD操作をエクスポート
export const listTasks = crud.list;
export const getTaskById = crud.getById;
export const createTask = crud.create;
export const updateTask = crud.update;
export const deleteTask = crud.delete;

// 特殊メソッド（個別実装）
export const listTasksByBusinessId = async (businessId: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("business_tasks")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order")
    .order("id");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as TaskRow[]).map(toTask), error: null };
};

export const listTasksByIds = async (ids: string[], projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (ids.length === 0) return { data: [], error: null };

  let query = supabase
    .from("business_tasks")
    .select("*")
    .in("id", ids)
    .order("id");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as TaskRow[]).map(toTask), error: null };
};
