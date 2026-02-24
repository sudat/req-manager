import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { Business, BusinessArea } from "@/lib/domain";
import { createCrudOperations, createSortOrderUpdater } from "./crud-factory";

export type BusinessInput = {
  name: string;
  area: BusinessArea;
  summary: string;
  sortOrder: number;
};

export type BusinessCreateInput = BusinessInput & {
  projectId: string;
};

type BusinessRow = {
  name: string;
  area: string;
  summary: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

const toBusiness = (row: BusinessRow): Business => ({
  id: row.area,
  name: row.name,
  area: row.area as BusinessArea,
  summary: row.summary,
  businessReqCount: 0,
  systemReqCount: 0,
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toBusinessRow = (input: BusinessInput) => {
  const row: Partial<BusinessRow> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.area !== undefined) row.area = input.area;
  if (input.summary !== undefined) row.summary = input.summary;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  return row;
};

// crud-factoryを使用した基本CRUD操作
const businessCrud = createCrudOperations<BusinessRow, Business, BusinessInput>({
  tableName: "business_domains",
  toEntity: toBusiness,
  toRow: toBusinessRow,
  idColumn: "area",
  orderBy: ["sort_order", "area"],
});

export const listBusinesses = businessCrud.list;
// 独自検索メソッド（area による検索）
export const getBusinessByArea = async (area: string, projectId?: string) => {
  const configError = getSupabaseConfigError();
  if (configError) return { data: null, error: configError };

  const normalizedArea = area.trim().toUpperCase();
  if (!normalizedArea) return { data: null, error: null };

  let query = supabase
    .from("business_domains")
    .select("*")
    .eq("area", normalizedArea);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toBusiness(data as BusinessRow), error: null };
};

export const getBusinessByKey = async (key: string, projectId?: string) => {
  const trimmed = key.trim();
  if (!trimmed) return { data: null, error: null };
  return getBusinessByArea(trimmed, projectId);
};

export const createBusiness = businessCrud.create;
export const updateBusiness = businessCrud.update;
export const deleteBusiness = businessCrud.delete;

export const listBusinessesWithRequirementCounts = async (projectId?: string) => {
  const configError = getSupabaseConfigError();
  if (configError) return { data: null, error: configError };

  let query = supabase
    .from("business_domains")
    .select("area")
    .order("sort_order")
    .order("area");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data: businesses, error: bizError } = await query;

  if (bizError) return { data: null, error: bizError.message };
  if (!businesses || businesses.length === 0) return { data: [], error: null };

  const businessAreas = businesses.map((b) => b.area);

  let taskQuery = supabase
    .from("business_tasks")
    .select("id, business_area")
    .in("business_area", businessAreas);

  if (projectId) {
    taskQuery = taskQuery.eq("project_id", projectId);
  }

  const { data: tasks, error: taskError } = await taskQuery;

  if (taskError) return { data: null, error: taskError.message };

  const taskIds = tasks?.map((t) => t.id) ?? [];

  if (taskIds.length === 0) {
    const { data: fullBusinesses, error: fullError } = await listBusinesses(projectId);
    if (fullError || !fullBusinesses) return { data: null, error: fullError ?? "Unknown error" };

    const result = fullBusinesses.map((biz) => ({
      ...biz,
      businessReqCount: 0,
      systemReqCount: 0,
    }));

    return { data: result, error: null };
  }

  let brQuery = supabase
    .from("business_requirements")
    .select("task_id")
    .in("task_id", taskIds);

  if (projectId) {
    brQuery = brQuery.eq("project_id", projectId);
  }

  const { data: businessReqs, error: brError } = await brQuery;

  if (brError) return { data: null, error: brError.message };

  let srQuery = supabase
    .from("system_requirements")
    .select("task_id")
    .in("task_id", taskIds);

  if (projectId) {
    srQuery = srQuery.eq("project_id", projectId);
  }

  const { data: systemReqs, error: srError } = await srQuery;

  if (srError) return { data: null, error: srError.message };

  const taskToBusiness = Object.fromEntries(
    tasks?.map((t) => [t.id, t.business_area]) ?? []
  );

  const businessBrCounts: Record<string, number> = {};
  const businessSrCounts: Record<string, number> = {};

  businessAreas.forEach((area) => {
    businessBrCounts[area] = 0;
    businessSrCounts[area] = 0;
  });

  businessReqs?.forEach((req) => {
    const businessArea = taskToBusiness[req.task_id];
    if (businessArea) {
      businessBrCounts[businessArea] = (businessBrCounts[businessArea] ?? 0) + 1;
    }
  });

  systemReqs?.forEach((req) => {
    const businessArea = taskToBusiness[req.task_id];
    if (businessArea) {
      businessSrCounts[businessArea] = (businessSrCounts[businessArea] ?? 0) + 1;
    }
  });

  const { data: fullBusinesses, error: fullError } = await listBusinesses(projectId);
  if (fullError || !fullBusinesses) return { data: null, error: fullError ?? "Unknown error" };

  const result = fullBusinesses.map((biz) => ({
    ...biz,
    businessReqCount: businessBrCounts[biz.area] ?? 0,
    systemReqCount: businessSrCounts[biz.area] ?? 0,
  }));

  return { data: result, error: null };
};

export const updateBusinessesSortOrder = createSortOrderUpdater("business_domains", "area");
