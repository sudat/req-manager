import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { RequirementLink, RequirementLinkNodeType } from "@/lib/domain";

export type RequirementLinkInput = {
  sourceType: RequirementLinkNodeType;
  sourceId: string;
  targetType: RequirementLinkNodeType;
  targetId: string;
  linkType: string;
  suspect?: boolean;
  suspectReason?: string | null;
};

export type RequirementLinkCreateInput = RequirementLinkInput & {
  projectId: string;
};

type RequirementLinkRow = {
  id: string;
  project_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_type: string;
  suspect: boolean | null;
  suspect_reason: string | null;
  created_at: string;
  updated_at: string;
};

const normalizeNodeType = (value: unknown): RequirementLinkNodeType => {
  if (typeof value === "string" && value.length > 0) return value;
  return "br";
};

const toRequirementLink = (row: RequirementLinkRow): RequirementLink => ({
  id: row.id,
  projectId: row.project_id,
  sourceType: normalizeNodeType(row.source_type),
  sourceId: row.source_id,
  targetType: normalizeNodeType(row.target_type),
  targetId: row.target_id,
  linkType: row.link_type,
  suspect: row.suspect ?? false,
  suspectReason: row.suspect_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRequirementLinkRowBase = (input: RequirementLinkInput) => ({
  source_type: input.sourceType,
  source_id: input.sourceId,
  target_type: input.targetType,
  target_id: input.targetId,
  link_type: input.linkType,
  suspect: input.suspect ?? false,
  suspect_reason: input.suspectReason ?? null,
});

const toRequirementLinkRowPartial = (input: Partial<RequirementLinkInput>) => {
  const row: Partial<RequirementLinkRow> = {};
  if (input.sourceType !== undefined) row.source_type = input.sourceType;
  if (input.sourceId !== undefined) row.source_id = input.sourceId;
  if (input.targetType !== undefined) row.target_type = input.targetType;
  if (input.targetId !== undefined) row.target_id = input.targetId;
  if (input.linkType !== undefined) row.link_type = input.linkType;
  if (input.suspect !== undefined) row.suspect = input.suspect;
  if (input.suspectReason !== undefined) row.suspect_reason = input.suspectReason;
  return row;
};

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listRequirementLinksByProjectId = async (projectId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("requirement_links")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data: (data as RequirementLinkRow[]).map(toRequirementLink), error: null };
};

export const listRequirementLinksBySource = async (
  sourceType: RequirementLinkNodeType,
  sourceId: string,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("requirement_links")
    .select("*")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .order("created_at", { ascending: true });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as RequirementLinkRow[]).map(toRequirementLink), error: null };
};

export const listRequirementLinksByTarget = async (
  targetType: RequirementLinkNodeType,
  targetId: string,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("requirement_links")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: true });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as RequirementLinkRow[]).map(toRequirementLink), error: null };
};

export const createRequirementLink = async (input: RequirementLinkCreateInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toRequirementLinkRowBase(input),
    project_id: input.projectId,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("requirement_links")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toRequirementLink(data as RequirementLinkRow), error: null };
};

export const createRequirementLinks = async (inputs: RequirementLinkCreateInput[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (inputs.length === 0) return { data: [], error: null };

  const now = new Date().toISOString();
  const payload = inputs.map((input) => ({
    ...toRequirementLinkRowBase(input),
    project_id: input.projectId,
    created_at: now,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("requirement_links")
    .insert(payload)
    .select("*");

  if (error) return { data: null, error: error.message };
  return { data: (data as RequirementLinkRow[]).map(toRequirementLink), error: null };
};

export const updateRequirementLink = async (
  id: string,
  input: Partial<RequirementLinkInput>,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toRequirementLinkRowPartial(input),
    updated_at: now,
  };

  let query = supabase
    .from("requirement_links")
    .update(payload)
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toRequirementLink(data as RequirementLinkRow), error: null };
};

export const deleteRequirementLink = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("requirement_links")
    .delete()
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const deleteRequirementLinksBySource = async (
  sourceType: RequirementLinkNodeType,
  sourceId: string,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("requirement_links")
    .delete()
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const deleteRequirementLinksByTarget = async (
  targetType: RequirementLinkNodeType,
  targetId: string,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("requirement_links")
    .delete()
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
