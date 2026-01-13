import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { SystemFunction, DesignItemCategory, SrfCategory, SrfStatus } from "@/lib/mock/data/types";

export type SystemFunctionInput = {
  id: string;
  systemDomainId: string | null;
  designDocNo: string;
  category: SrfCategory;
  summary: string;
  status: SrfStatus;
  relatedTaskIds: string[];
  requirementIds: string[];
  systemDesign: SystemFunction["systemDesign"];
  codeRefs: SystemFunction["codeRefs"];
};

type SystemFunctionRow = {
  id: string;
  system_domain_id: string | null;
  design_doc_no: string;
  category: string;
  summary: string;
  status: string;
  related_task_ids: string[] | null;
  requirement_ids: string[] | null;
  system_design: SystemFunction["systemDesign"] | null;
  code_refs: SystemFunction["codeRefs"] | null;
  created_at: string;
  updated_at: string;
};

const toSystemFunction = (row: SystemFunctionRow): SystemFunction => ({
  id: row.id,
  systemDomainId: row.system_domain_id ?? null,
  designDocNo: row.design_doc_no,
  category: row.category as SrfCategory,
  summary: row.summary,
  status: row.status as SrfStatus,
  relatedTaskIds: row.related_task_ids ?? [],
  requirementIds: row.requirement_ids ?? [],
  systemDesign: row.system_design ?? [],
  codeRefs: row.code_refs ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toSystemFunctionRow = (input: SystemFunctionInput) => ({
  id: input.id,
  system_domain_id: input.systemDomainId,
  design_doc_no: input.designDocNo,
  category: input.category,
  summary: input.summary,
  status: input.status,
  related_task_ids: input.relatedTaskIds,
  requirement_ids: input.requirementIds,
  system_design: input.systemDesign,
  code_refs: input.codeRefs,
});

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listSystemFunctions = async () => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("system_functions")
    .select("*")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as SystemFunctionRow[]).map(toSystemFunction), error: null };
};

export const listSystemFunctionsByDomain = async (systemDomainId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("system_functions")
    .select("*")
    .eq("system_domain_id", systemDomainId)
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as SystemFunctionRow[]).map(toSystemFunction), error: null };
};

export const getSystemFunctionById = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("system_functions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toSystemFunction(data as SystemFunctionRow), error: null };
};

export const createSystemFunction = async (input: SystemFunctionInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toSystemFunctionRow(input),
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

export const updateSystemFunction = async (id: string, input: Omit<SystemFunctionInput, "id">) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toSystemFunctionRow({ ...input, id }),
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("system_functions")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toSystemFunction(data as SystemFunctionRow), error: null };
};

export const deleteSystemFunction = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { error } = await supabase
    .from("system_functions")
    .delete()
    .eq("id", id);

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
