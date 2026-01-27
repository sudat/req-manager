import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { ProjectInvestigationSettings } from "@/lib/domain";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const defaultProjectInvestigationSettings: ProjectInvestigationSettings = {
  exploration: {
    default_max_depth: 5,
    default_include_patterns: [],
    default_exclude_patterns: [],
  },
  allow_paths_rule: {
    base_rule: {
      include_direct_impacts: true,
      include_indirect_impacts: true,
      confidence_threshold: 0.3,
      max_depth: 5,
    },
    shared_module_rule: {
      auto_include: true,
      notify_on_include: true,
      require_confirmation_if_count_exceeds: 10,
    },
    safety_limits: {
      max_total_files: 50,
      max_directories: 10,
      escalate_if_exceeds: true,
    },
  },
  impact_review: {
    auto_trigger_threshold: 50,
    default_aggressiveness: "moderate",
    require_human_confirmation: true,
  },
  shared_module_patterns: [],
};

const normalizeStringArray = (value: unknown, fallback: string[]) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;

const normalizeNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const normalizeBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const normalizeAggressiveness = (
  value: unknown,
  fallback: ProjectInvestigationSettings["impact_review"]["default_aggressiveness"]
): ProjectInvestigationSettings["impact_review"]["default_aggressiveness"] => {
  if (value === "conservative" || value === "moderate" || value === "aggressive") {
    return value;
  }
  return fallback;
};

export const normalizeProjectInvestigationSettings = (
  raw: unknown
): ProjectInvestigationSettings => {
  if (!isRecord(raw)) return { ...defaultProjectInvestigationSettings };

  const explorationRaw = isRecord(raw.exploration) ? raw.exploration : {};
  const allowPathsRaw = isRecord(raw.allow_paths_rule) ? raw.allow_paths_rule : {};
  const baseRuleRaw = isRecord(allowPathsRaw.base_rule) ? allowPathsRaw.base_rule : {};
  const sharedModuleRaw = isRecord(allowPathsRaw.shared_module_rule)
    ? allowPathsRaw.shared_module_rule
    : {};
  const safetyLimitsRaw = isRecord(allowPathsRaw.safety_limits) ? allowPathsRaw.safety_limits : {};
  const impactReviewRaw = isRecord(raw.impact_review) ? raw.impact_review : {};

  return {
    exploration: {
      default_max_depth: normalizeNumber(
        explorationRaw.default_max_depth,
        defaultProjectInvestigationSettings.exploration.default_max_depth
      ),
      default_include_patterns: normalizeStringArray(
        explorationRaw.default_include_patterns,
        defaultProjectInvestigationSettings.exploration.default_include_patterns
      ),
      default_exclude_patterns: normalizeStringArray(
        explorationRaw.default_exclude_patterns,
        defaultProjectInvestigationSettings.exploration.default_exclude_patterns
      ),
    },
    allow_paths_rule: {
      base_rule: {
        include_direct_impacts: normalizeBoolean(
          baseRuleRaw.include_direct_impacts,
          defaultProjectInvestigationSettings.allow_paths_rule.base_rule.include_direct_impacts
        ),
        include_indirect_impacts: normalizeBoolean(
          baseRuleRaw.include_indirect_impacts,
          defaultProjectInvestigationSettings.allow_paths_rule.base_rule.include_indirect_impacts
        ),
        confidence_threshold: normalizeNumber(
          baseRuleRaw.confidence_threshold,
          defaultProjectInvestigationSettings.allow_paths_rule.base_rule.confidence_threshold
        ),
        max_depth: normalizeNumber(
          baseRuleRaw.max_depth,
          defaultProjectInvestigationSettings.allow_paths_rule.base_rule.max_depth
        ),
      },
      shared_module_rule: {
        auto_include: normalizeBoolean(
          sharedModuleRaw.auto_include,
          defaultProjectInvestigationSettings.allow_paths_rule.shared_module_rule.auto_include
        ),
        notify_on_include: normalizeBoolean(
          sharedModuleRaw.notify_on_include,
          defaultProjectInvestigationSettings.allow_paths_rule.shared_module_rule.notify_on_include
        ),
        require_confirmation_if_count_exceeds: normalizeNumber(
          sharedModuleRaw.require_confirmation_if_count_exceeds,
          defaultProjectInvestigationSettings.allow_paths_rule.shared_module_rule
            .require_confirmation_if_count_exceeds
        ),
      },
      safety_limits: {
        max_total_files: normalizeNumber(
          safetyLimitsRaw.max_total_files,
          defaultProjectInvestigationSettings.allow_paths_rule.safety_limits.max_total_files
        ),
        max_directories: normalizeNumber(
          safetyLimitsRaw.max_directories,
          defaultProjectInvestigationSettings.allow_paths_rule.safety_limits.max_directories
        ),
        escalate_if_exceeds: normalizeBoolean(
          safetyLimitsRaw.escalate_if_exceeds,
          defaultProjectInvestigationSettings.allow_paths_rule.safety_limits.escalate_if_exceeds
        ),
      },
    },
    impact_review: {
      auto_trigger_threshold: normalizeNumber(
        impactReviewRaw.auto_trigger_threshold,
        defaultProjectInvestigationSettings.impact_review.auto_trigger_threshold
      ),
      default_aggressiveness: normalizeAggressiveness(
        impactReviewRaw.default_aggressiveness,
        defaultProjectInvestigationSettings.impact_review.default_aggressiveness
      ),
      require_human_confirmation: normalizeBoolean(
        impactReviewRaw.require_human_confirmation,
        defaultProjectInvestigationSettings.impact_review.require_human_confirmation
      ),
    },
    shared_module_patterns: normalizeStringArray(
      raw.shared_module_patterns,
      defaultProjectInvestigationSettings.shared_module_patterns
    ),
  };
};

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const getProjectInvestigationSettings = async (projectId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("projects")
    .select("investigation_settings")
    .eq("id", projectId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  const settings = normalizeProjectInvestigationSettings(data?.investigation_settings);
  return { data: settings, error: null };
};

export const updateProjectInvestigationSettings = async (
  projectId: string,
  settings: ProjectInvestigationSettings
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    investigation_settings: settings,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId)
    .select("investigation_settings")
    .single();

  if (error) return { data: null, error: error.message };
  return {
    data: normalizeProjectInvestigationSettings(data?.investigation_settings),
    error: null,
  };
};
