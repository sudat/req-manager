import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";

export type SystemDomain = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SystemDomainInput = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
};

type SystemDomainRow = {
  id: string;
  name: string;
  description: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

const toSystemDomain = (row: SystemDomainRow): SystemDomain => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toSystemDomainRow = (input: SystemDomainInput) => ({
  id: input.id,
  name: input.name,
  description: input.description,
  sort_order: input.sortOrder,
});

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listSystemDomains = async () => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("system_domains")
    .select("*")
    .order("sort_order")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as SystemDomainRow[]).map(toSystemDomain), error: null };
};

export const getSystemDomainById = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("system_domains")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toSystemDomain(data as SystemDomainRow), error: null };
};

export const createSystemDomain = async (input: SystemDomainInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toSystemDomainRow(input),
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("system_domains")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toSystemDomain(data as SystemDomainRow), error: null };
};

export const updateSystemDomain = async (id: string, input: Omit<SystemDomainInput, "id">) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toSystemDomainRow({ ...input, id }),
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("system_domains")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toSystemDomain(data as SystemDomainRow), error: null };
};

export const deleteSystemDomain = async (id: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { error } = await supabase
    .from("system_domains")
    .delete()
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
