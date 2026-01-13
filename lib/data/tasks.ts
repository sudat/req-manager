import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { Task } from "@/lib/mock/data/types";

export type TaskInput = {
  id: string;
  businessId: string;
  name: string;
  summary: string;
  person: string;
  input: string;
  output: string;
  concepts: string[];
  businessReqCount: number;
  systemReqCount: number;
  sortOrder: number;
};

type TaskRow = {
  id: string;
  business_id: string;
  name: string;
  summary: string;
  person: string | null;
  input: string | null;
  output: string | null;
  concepts: string[] | null;
  business_req_count: number | null;
  system_req_count: number | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

const toTask = (row: TaskRow): Task => ({
  id: row.id,
  businessId: row.business_id,
  name: row.name,
  summary: row.summary,
  person: row.person ?? "",
  input: row.input ?? "",
  output: row.output ?? "",
  concepts: row.concepts ?? [],
  businessReqCount: row.business_req_count ?? 0,
  systemReqCount: row.system_req_count ?? 0,
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toTaskRow = (input: TaskInput) => ({
  id: input.id,
  business_id: input.businessId,
  name: input.name,
  summary: input.summary,
  person: input.person,
  input: input.input,
  output: input.output,
  concepts: input.concepts,
  business_req_count: input.businessReqCount,
  system_req_count: input.systemReqCount,
  sort_order: input.sortOrder,
});

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listTasks = async () => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("business_tasks")
    .select("*")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as TaskRow[]).map(toTask), error: null };
};

export const listTasksByBusinessId = async (businessId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("business_tasks")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as TaskRow[]).map(toTask), error: null };
};

export const getTaskById = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("business_tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toTask(data as TaskRow), error: null };
};

export const createTask = async (input: TaskInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toTaskRow(input),
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("business_tasks")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toTask(data as TaskRow), error: null };
};

export const updateTask = async (id: string, input: Omit<TaskInput, "id">) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toTaskRow({ ...input, id }),
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("business_tasks")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toTask(data as TaskRow), error: null };
};

export const deleteTask = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { error } = await supabase
    .from("business_tasks")
    .delete()
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
