import { supabase } from "@/lib/supabase/client";
import type { DesignDocument, DdType } from "@/lib/domain";
import { normalizeEntryPoints } from "@/lib/data/structured";
import { createCrudOperations, failIfMissingConfig } from "./crud-factory";

export type DesignDocumentInput = {
  id: string;
  srfId: string;
  name: string;
  type: DdType;
  summary: string;
  entryPoints: DesignDocument["entryPoints"];
  designPolicy: string;
  details: Record<string, unknown>;
};

export type DesignDocumentCreateInput = DesignDocumentInput & {
  projectId: string;
};

type DesignDocumentRow = {
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

const normalizeDdType = (value: unknown): DdType => {
  if (typeof value === "string" && value.length > 0) {
    const validTypes: DdType[] = ["screen", "api", "batch", "external_if", "model", "report", "job"];
    if (validTypes.includes(value as DdType)) {
      return value as DdType;
    }
  }
  return "screen";
};

const normalizeDetails = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const toDesignDocument = (row: DesignDocumentRow): DesignDocument => ({
  id: row.id,
  srfId: row.srf_id,
  projectId: row.project_id,
  name: row.name,
  type: normalizeDdType(row.type),
  summary: row.summary ?? "",
  entryPoints: normalizeEntryPoints(row.entry_points),
  designPolicy: row.design_policy ?? "",
  details: normalizeDetails(row.details),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toDesignDocumentRow = (input: Partial<DesignDocumentInput>) => {
  const row: Partial<DesignDocumentRow> = {};
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
const crud = createCrudOperations<DesignDocumentRow, DesignDocument, DesignDocumentInput>({
  tableName: "design_documents",
  toEntity: toDesignDocument,
  toRow: toDesignDocumentRow,
  orderBy: ["srf_id", "id"],
});

// 基本CRUD操作をエクスポート
export const listDesignDocuments = crud.list;
export const getDesignDocumentById = crud.getById;
export const createDesignDocument = crud.create;
export const updateDesignDocument = crud.update;
export const deleteDesignDocument = crud.delete;

// 特殊メソッド（個別実装）
export const listDesignDocumentsBySrfId = async (srfId: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("design_documents")
    .select("*")
    .eq("srf_id", srfId)
    .order("id");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as DesignDocumentRow[]).map(toDesignDocument), error: null };
};

export const createDesignDocuments = async (inputs: DesignDocumentCreateInput[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (inputs.length === 0) return { data: [], error: null };

  const now = new Date().toISOString();
  const payload = inputs.map((input) => ({
    ...toDesignDocumentRow(input),
    project_id: input.projectId,
    created_at: now,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("design_documents")
    .insert(payload)
    .select("*");

  if (error) return { data: null, error: error.message };
  return { data: (data as DesignDocumentRow[]).map(toDesignDocument), error: null };
};

export const deleteDesignDocumentsBySrfId = async (srfId: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("design_documents")
    .delete()
    .eq("srf_id", srfId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
