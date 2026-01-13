import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { Business, BusinessArea } from "@/lib/mock/data/types";

export type BusinessInput = {
  id: string;
  name: string;
  area: BusinessArea;
  summary: string;
  businessReqCount: number;
  systemReqCount: number;
};

type BusinessRow = {
  id: string;
  name: string;
  area: string;
  summary: string;
  business_req_count: number | null;
  system_req_count: number | null;
  created_at: string;
  updated_at: string;
};

const toBusiness = (row: BusinessRow): Business => ({
  id: row.id,
  name: row.name,
  area: row.area as BusinessArea,
  summary: row.summary,
  businessReqCount: row.business_req_count ?? 0,
  systemReqCount: row.system_req_count ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toBusinessRow = (input: BusinessInput) => ({
  id: input.id,
  name: input.name,
  area: input.area,
  summary: input.summary,
  business_req_count: input.businessReqCount,
  system_req_count: input.systemReqCount,
});

const toBusinessRowPartial = (input: Partial<BusinessInput>) => {
  const row: Partial<BusinessRow> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.area !== undefined) row.area = input.area;
  if (input.summary !== undefined) row.summary = input.summary;
  if (input.businessReqCount !== undefined) row.business_req_count = input.businessReqCount;
  if (input.systemReqCount !== undefined) row.system_req_count = input.systemReqCount;
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
