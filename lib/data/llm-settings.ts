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

const providerDefaults: Record<ProjectLlmSettings["provider"], ProjectLlmSettings> = {
  openai: { ...defaultProjectLlmSettings },
  zai: {
    provider: "zai",
    model: "glm-4.7",
    temperature: 1,
    base_url: "https://api.z.ai/api/coding/paas/v4",
    verbosity: "low",
  },
  anthropic: { ...defaultProjectLlmSettings, provider: "anthropic" },
  google: { ...defaultProjectLlmSettings, provider: "google" },
  azure: { ...defaultProjectLlmSettings, provider: "azure" },
};

export const getProviderLlmDefaults = (
  provider: ProjectLlmSettings["provider"]
): ProjectLlmSettings => ({
  ...providerDefaults[provider],
});

const OPENAI_CHAT_MODELS = new Set([
  "gpt-5.2",
  "gpt-5.2-chat-latest",
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
]);

const normalizeProvider = (
  value: unknown,
  fallback: ProjectLlmSettings["provider"]
): ProjectLlmSettings["provider"] => {
  if (value === "openai" || value === "anthropic" || value === "google" || value === "azure" || value === "zai") {
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

  const provider = normalizeProvider(raw.provider, defaultProjectLlmSettings.provider);
  const defaults = providerDefaults[provider] ?? defaultProjectLlmSettings;
  const rawBaseUrl = normalizeString(raw.base_url, defaults.base_url).replace(/\/$/, "");
  const normalizedBaseUrl =
    provider === "openai" && !rawBaseUrl.endsWith("/v1")
      ? `${rawBaseUrl}/v1`
      : rawBaseUrl;
  const modelCandidate = normalizeString(raw.model, defaults.model);
  const isOpenAiDefault = normalizedBaseUrl.includes("api.openai.com");
  const normalizedModel =
    provider === "openai" && isOpenAiDefault && !OPENAI_CHAT_MODELS.has(modelCandidate)
      ? defaults.model
      : modelCandidate;

  return {
    provider,
    model: normalizedModel,
    temperature: normalizeNumber(raw.temperature, defaults.temperature),
    base_url: normalizedBaseUrl,
    verbosity: normalizeVerbosity(raw.verbosity, defaults.verbosity ?? defaultProjectLlmSettings.verbosity),
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
