import { supabase } from "@/lib/supabase/client";
import type { ImplUnitSd, ImplUnitType } from "@/lib/domain";
import { normalizeEntryPoints } from "@/lib/data/structured";
import { createCrudOperations, failIfMissingConfig } from "./crud-factory";

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

const toImplUnitSdRow = (input: Partial<ImplUnitSdInput>) => {
  const row: Partial<ImplUnitSdRow> = {};
  if (input.id !== undefined) row.id = input.id;
  if (input.srfId !== undefined) row.srf_id = input.srfId;
  if (input.name !== undefined) row.name = input.name;
  if (input.type !== undefined) row.type = input.type;
  if (input.summary !== undefined) row.summary = input.summary;
  if (input.entryPoints !== undefined) row.entry_points = input.entryPoints;
  if (input.designPolicy !== undefined) row.design_policy = input.designPolicy;
  if (input.details !== undefined) row.details = input.details;
  return row;
};

// CRUD操作を生成
const crud = createCrudOperations<ImplUnitSdRow, ImplUnitSd, ImplUnitSdInput>({
  tableName: "impl_unit_sds",
  toEntity: toImplUnitSd,
  toRow: toImplUnitSdRow,
  orderBy: ["srf_id", "id"],
});

// 基本CRUD操作をエクスポート
export const listImplUnitSds = crud.list;
export const getImplUnitSdById = crud.getById;
export const createImplUnitSd = crud.create;
export const updateImplUnitSd = crud.update;
export const deleteImplUnitSd = crud.delete;

// 特殊メソッド（個別実装）
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

export const createImplUnitSds = async (inputs: ImplUnitSdCreateInput[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (inputs.length === 0) return { data: [], error: null };

  const now = new Date().toISOString();
  const payload = inputs.map((input) => ({
    ...toImplUnitSdRow(input),
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
