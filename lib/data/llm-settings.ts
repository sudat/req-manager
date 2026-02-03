import { supabase } from "@/lib/supabase/client";
import { failIfMissingConfig } from "./crud-factory";
import type { ProjectLlmSettings } from "@/lib/domain";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const defaultProjectLlmSettings: ProjectLlmSettings = {
  provider: "openai",
  model: "gpt-5-mini",
  temperature: 1,
  base_url: "https://api.openai.com/v1",
  verbosity: "low",
};

const normalizeProvider = (
  value: unknown,
  fallback: ProjectLlmSettings["provider"]
): ProjectLlmSettings["provider"] => {
  if (value === "openai" || value === "anthropic" || value === "google" || value === "azure") {
    return value;
  }
  return fallback;
};

const normalizeVerbosity = (
  value: unknown,
  fallback: ProjectLlmSettings["verbosity"]
): ProjectLlmSettings["verbosity"] => {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return fallback;
};

const normalizeString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const normalizeNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const normalizeProjectLlmSettings = (raw: unknown): ProjectLlmSettings => {
  if (!isRecord(raw)) return { ...defaultProjectLlmSettings };

  const rawBaseUrl = normalizeString(raw.base_url, defaultProjectLlmSettings.base_url).replace(/\/$/, "");
  const normalizedBaseUrl = rawBaseUrl.endsWith("/v1") ? rawBaseUrl : `${rawBaseUrl}/v1`;

  return {
    provider: normalizeProvider(raw.provider, defaultProjectLlmSettings.provider),
    model: normalizeString(raw.model, defaultProjectLlmSettings.model),
    temperature: normalizeNumber(raw.temperature, defaultProjectLlmSettings.temperature),
    base_url: normalizedBaseUrl,
    verbosity: normalizeVerbosity(raw.verbosity, defaultProjectLlmSettings.verbosity),
  };
};

export const getProjectLlmSettings = async (projectId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("projects")
    .select("llm_settings")
    .eq("id", projectId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  const settings = normalizeProjectLlmSettings(data?.llm_settings);
  return { data: settings, error: null };
};

export const updateProjectLlmSettings = async (
  projectId: string,
  settings: ProjectLlmSettings
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    llm_settings: settings,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId)
    .select("llm_settings")
    .single();

  if (error) return { data: null, error: error.message };
  return {
    data: normalizeProjectLlmSettings(data?.llm_settings),
    error: null,
  };
};
