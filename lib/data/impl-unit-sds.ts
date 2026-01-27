import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { ImplUnitSd, ImplUnitType } from "@/lib/domain";
import { normalizeEntryPoints } from "@/lib/data/structured";

export type ImplUnitSdInput = {
  id: string;
  srfId: string;
  name: string;
  type: ImplUnitType;
  summary: string;
  entryPoints: ImplUnitSd["entryPoints"];
  designPolicy: string;
  details: Record<string, unknown>;
};

export type ImplUnitSdCreateInput = ImplUnitSdInput & {
  projectId: string;
};

type ImplUnitSdRow = {
  id: string;
  srf_id: string;
  project_id: string;
  name: string;
  type: string | null;
  summary: string | null;
  entry_points: unknown | null;
  design_policy: string | null;
  details: unknown | null;
  created_at: string;
  updated_at: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeImplUnitType = (value: unknown): ImplUnitType => {
  if (typeof value === "string" && value.length > 0) {
    const validTypes: ImplUnitType[] = ["screen", "api", "batch", "external_if"];
    if (validTypes.includes(value as ImplUnitType)) {
      return value as ImplUnitType;
    }
  }
  return "screen";
};

const normalizeDetails = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const toImplUnitSd = (row: ImplUnitSdRow): ImplUnitSd => ({
  id: row.id,
  srfId: row.srf_id,
  projectId: row.project_id,
  name: row.name,
  type: normalizeImplUnitType(row.type),
  summary: row.summary ?? "",
  entryPoints: normalizeEntryPoints(row.entry_points),
  designPolicy: row.design_policy ?? "",
  details: normalizeDetails(row.details),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toImplUnitSdRowBase = (input: ImplUnitSdInput) => ({
  id: input.id,
  srf_id: input.srfId,
  name: input.name,
  type: input.type,
  summary: input.summary,
  entry_points: input.entryPoints,
  design_policy: input.designPolicy,
  details: input.details,
});

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listImplUnitSds = async (projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("impl_unit_sds")
    .select("*")
    .order("srf_id")
    .order("id");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as ImplUnitSdRow[]).map(toImplUnitSd), error: null };
};

export const listImplUnitSdsBySrfId = async (srfId: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("impl_unit_sds")
    .select("*")
    .eq("srf_id", srfId)
    .order("id");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as ImplUnitSdRow[]).map(toImplUnitSd), error: null };
};

export const getImplUnitSdById = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("impl_unit_sds")
    .select("*")
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toImplUnitSd(data as ImplUnitSdRow), error: null };
};

export const createImplUnitSd = async (input: ImplUnitSdCreateInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toImplUnitSdRowBase(input),
    project_id: input.projectId,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("impl_unit_sds")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toImplUnitSd(data as ImplUnitSdRow), error: null };
};

export const createImplUnitSds = async (inputs: ImplUnitSdCreateInput[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (inputs.length === 0) return { data: [], error: null };

  const now = new Date().toISOString();
  const payload = inputs.map((input) => ({
    ...toImplUnitSdRowBase(input),
    project_id: input.projectId,
    created_at: now,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("impl_unit_sds")
    .insert(payload)
    .select("*");

  if (error) return { data: null, error: error.message };
  return { data: (data as ImplUnitSdRow[]).map(toImplUnitSd), error: null };
};

export const updateImplUnitSd = async (
  id: string,
  input: Omit<ImplUnitSdInput, "id">,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toImplUnitSdRowBase({ ...input, id }),
    updated_at: now,
  };

  let query = supabase
    .from("impl_unit_sds")
    .update(payload)
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toImplUnitSd(data as ImplUnitSdRow), error: null };
};

export const deleteImplUnitSd = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("impl_unit_sds")
    .delete()
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const deleteImplUnitSdsBySrfId = async (srfId: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("impl_unit_sds")
    .delete()
    .eq("srf_id", srfId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
