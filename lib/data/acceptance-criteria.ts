import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { AcceptanceCriterion, AcceptanceCriterionStatus } from "@/lib/domain";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";

export type AcceptanceCriterionInput = {
  id: string;
  systemRequirementId: string;
  description: string;
  givenText?: string | null;
  whenText?: string | null;
  thenText?: string | null;
  verificationMethod?: string | null;
  status?: AcceptanceCriterionStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  evidence?: string | null;
  sortOrder?: number;
};

export type AcceptanceCriterionCreateInput = AcceptanceCriterionInput & {
  projectId: string;
};

type AcceptanceCriterionRow = {
  id: string;
  system_requirement_id: string;
  project_id: string;
  description: string;
  given_text: string | null;
  when_text: string | null;
  then_text: string | null;
  verification_method: string | null;
  status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  evidence: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

// ACは acceptance_criteria を正とし、system_requirements.acceptance_criteria_json は要約用に保持する。
const pad3 = (value: number) => String(value).padStart(3, "0");

const normalizeText = (value?: string | null): string => (value ?? "").trim();

export const acceptanceCriteriaToJson = (
	rows: AcceptanceCriterion[]
): AcceptanceCriterionJson[] => {
	const sorted = [...rows].sort((a, b) => {
		if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
		return a.id.localeCompare(b.id);
	});
	return sorted.map((row) => ({
		id: row.id,
		description: row.description ?? "",
		verification_method: row.verificationMethod ?? null,
		givenText: row.givenText ?? "",
		whenText: row.whenText ?? "",
		thenText: row.thenText ?? "",
	}));
};

export const acceptanceCriteriaJsonToInputs = (
	items: AcceptanceCriterionJson[],
	systemRequirementId: string,
	projectId: string,
	idPrefix = `AC-${systemRequirementId}-`
): AcceptanceCriterionCreateInput[] => {
	const used = new Set<string>();
	let cursor = 1;

	const meaningfulItems = items.filter((item) => {
		const fields = [
			item.description,
			item.givenText,
			item.whenText,
			item.thenText,
			item.verification_method,
		];
		return fields.some((value) => typeof value === "string" && value.trim().length > 0);
	});

	return meaningfulItems.map((item, index) => {
		let id = item.id?.trim();
		while (!id || used.has(id)) {
			id = `${idPrefix}${pad3(cursor)}`;
			cursor += 1;
		}
		used.add(id);

		return {
			id,
			systemRequirementId,
			description: item.description?.trim() ?? "",
			givenText: normalizeText(item.givenText),
			whenText: normalizeText(item.whenText),
			thenText: normalizeText(item.thenText),
			verificationMethod: item.verification_method ?? null,
			sortOrder: index,
			projectId,
		};
	});
};

const normalizeStatus = (value: unknown): AcceptanceCriterionStatus => {
  if (value === "unverified" || value === "verified_ok" || value === "verified_ng") {
    return value;
  }
  return "unverified";
};

const toAcceptanceCriterion = (row: AcceptanceCriterionRow): AcceptanceCriterion => ({
  id: row.id,
  systemRequirementId: row.system_requirement_id,
  projectId: row.project_id,
  description: row.description,
  givenText: row.given_text,
  whenText: row.when_text,
  thenText: row.then_text,
  verificationMethod: row.verification_method,
  status: normalizeStatus(row.status),
  verifiedBy: row.verified_by,
  verifiedAt: row.verified_at,
  evidence: row.evidence,
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toAcceptanceCriterionRowBase = (input: AcceptanceCriterionInput) => ({
  id: input.id,
  system_requirement_id: input.systemRequirementId,
  description: input.description,
  given_text: input.givenText ?? null,
  when_text: input.whenText ?? null,
  then_text: input.thenText ?? null,
  verification_method: input.verificationMethod ?? null,
  status: input.status ?? "unverified",
  verified_by: input.verifiedBy ?? null,
  verified_at: input.verifiedAt ?? null,
  evidence: input.evidence ?? null,
  sort_order: input.sortOrder ?? 0,
});

const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

export const listAcceptanceCriteriaBySystemRequirementId = async (
  systemRequirementId: string,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("acceptance_criteria")
    .select("*")
    .eq("system_requirement_id", systemRequirementId)
    .order("sort_order")
    .order("id");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as AcceptanceCriterionRow[]).map(toAcceptanceCriterion), error: null };
};

export const listAcceptanceCriteriaBySystemRequirementIds = async (
  systemRequirementIds: string[],
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (systemRequirementIds.length === 0) return { data: [], error: null };

  let query = supabase
    .from("acceptance_criteria")
    .select("*")
    .in("system_requirement_id", systemRequirementIds)
    .order("system_requirement_id")
    .order("sort_order")
    .order("id");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as AcceptanceCriterionRow[]).map(toAcceptanceCriterion), error: null };
};

export const listAcceptanceCriteriaByProjectId = async (projectId: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { data, error } = await supabase
    .from("acceptance_criteria")
    .select("*")
    .eq("project_id", projectId)
    .order("system_requirement_id")
    .order("sort_order")
    .order("id");

  if (error) return { data: null, error: error.message };
  return { data: (data as AcceptanceCriterionRow[]).map(toAcceptanceCriterion), error: null };
};

export const getAcceptanceCriterionById = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("acceptance_criteria")
    .select("*")
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toAcceptanceCriterion(data as AcceptanceCriterionRow), error: null };
};

export const createAcceptanceCriterion = async (input: AcceptanceCriterionCreateInput) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toAcceptanceCriterionRowBase(input),
    project_id: input.projectId,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("acceptance_criteria")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toAcceptanceCriterion(data as AcceptanceCriterionRow), error: null };
};

export const createAcceptanceCriteria = async (inputs: AcceptanceCriterionCreateInput[]) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;
  if (inputs.length === 0) return { data: [], error: null };

  const now = new Date().toISOString();
  const payload = inputs.map((input) => ({
    ...toAcceptanceCriterionRowBase(input),
    project_id: input.projectId,
    created_at: now,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("acceptance_criteria")
    .insert(payload)
    .select("*");

  if (error) return { data: null, error: error.message };
  return { data: (data as AcceptanceCriterionRow[]).map(toAcceptanceCriterion), error: null };
};

export const updateAcceptanceCriterion = async (
  id: string,
  input: Omit<AcceptanceCriterionInput, "id">,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const now = new Date().toISOString();
  const payload = {
    ...toAcceptanceCriterionRowBase({ ...input, id }),
    updated_at: now,
  };

  let query = supabase
    .from("acceptance_criteria")
    .update(payload)
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toAcceptanceCriterion(data as AcceptanceCriterionRow), error: null };
};

export const deleteAcceptanceCriterion = async (id: string, projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("acceptance_criteria")
    .delete()
    .eq("id", id);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};

export const deleteAcceptanceCriteriaBySystemRequirementId = async (
  systemRequirementId: string,
  projectId?: string
) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase
    .from("acceptance_criteria")
    .delete()
    .eq("system_requirement_id", systemRequirementId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
