import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { Business, BusinessArea } from "@/lib/domain";

export type BusinessInput = {
  id: string;
  name: string;
  area: BusinessArea;
  summary: string;
};

type BusinessRow = {
  id: string;
  name: string;
  area: string;
  summary: string;
  created_at: string;
  updated_at: string;
};

const toBusiness = (row: BusinessRow): Business => ({
  id: row.id,
  name: row.name,
  area: row.area as BusinessArea,
  summary: row.summary,
  businessReqCount: 0,
  systemReqCount: 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toBusinessRow = (input: BusinessInput) => ({
  id: input.id,
  name: input.name,
  area: input.area,
  summary: input.summary,
});

const toBusinessRowPartial = (input: Partial<BusinessInput>) => {
  const row: Partial<BusinessRow> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.area !== undefined) row.area = input.area;
  if (input.summary !== undefined) row.summary = input.summary;
  return row;
};

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listBusinesses = async () => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("business_domains")
    .select("*")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as BusinessRow[]).map(toBusiness), error: null };
};

export const getBusinessById = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("business_domains")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toBusiness(data as BusinessRow), error: null };
};

export const createBusiness = async (input: BusinessInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toBusinessRow(input),
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("business_domains")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toBusiness(data as BusinessRow), error: null };
};

export const updateBusiness = async (id: string, input: Partial<Omit<BusinessInput, "id">>) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toBusinessRowPartial(input),
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("business_domains")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toBusiness(data as BusinessRow), error: null };
};

export const deleteBusiness = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { error } = await supabase
    .from("business_domains")
    .delete()
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const listBusinessesWithRequirementCounts = async () => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data: businesses, error: bizError } = await supabase
    .from("business_domains")
    .select("id")
    .order("id");

  if (bizError) return { data: null, error: bizError.message };
  if (!businesses || businesses.length === 0) return { data: [], error: null };

  const businessIds = businesses.map((b) => b.id);

  const { data: tasks, error: taskError } = await supabase
    .from("business_tasks")
    .select("id, business_id")
    .in("business_id", businessIds);

  if (taskError) return { data: null, error: taskError.message };

  const taskIds = tasks?.map((t) => t.id) ?? [];

  if (taskIds.length === 0) {
    const { data: fullBusinesses, error: fullError } = await listBusinesses();
    if (fullError || !fullBusinesses) return { data: null, error: fullError ?? "Unknown error" };

    const result = fullBusinesses.map((biz) => ({
      ...biz,
      businessReqCount: 0,
      systemReqCount: 0,
    }));

    return { data: result, error: null };
  }

  const { data: businessReqs, error: brError } = await supabase
    .from("business_requirements")
    .select("task_id")
    .in("task_id", taskIds);

  if (brError) return { data: null, error: brError.message };

  const { data: systemReqs, error: srError } = await supabase
    .from("system_requirements")
    .select("task_id")
    .in("task_id", taskIds);

  if (srError) return { data: null, error: srError.message };

  const taskToBusiness = Object.fromEntries(
    tasks?.map((t) => [t.id, t.business_id]) ?? []
  );

  const businessBrCounts: Record<string, number> = {};
  const businessSrCounts: Record<string, number> = {};

  businessIds.forEach((id) => {
    businessBrCounts[id] = 0;
    businessSrCounts[id] = 0;
  });

  businessReqs?.forEach((req) => {
    const businessId = taskToBusiness[req.task_id];
    if (businessId) {
      businessBrCounts[businessId] = (businessBrCounts[businessId] ?? 0) + 1;
    }
  });

  systemReqs?.forEach((req) => {
    const businessId = taskToBusiness[req.task_id];
    if (businessId) {
      businessSrCounts[businessId] = (businessSrCounts[businessId] ?? 0) + 1;
    }
  });

  const { data: fullBusinesses, error: fullError } = await listBusinesses();
  if (fullError || !fullBusinesses) return { data: null, error: fullError ?? "Unknown error" };

  const result = fullBusinesses.map((biz) => ({
    ...biz,
    businessReqCount: businessBrCounts[biz.id] ?? 0,
    systemReqCount: businessSrCounts[biz.id] ?? 0,
  }));

  return { data: result, error: null };
};
