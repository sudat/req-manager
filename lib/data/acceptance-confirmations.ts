import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type {
	AcceptanceConfirmation,
	AcceptanceCriterionSourceType,
	AcceptanceConfirmationStatus,
} from "@/lib/domain/value-objects";

export type AcceptanceConfirmationInput = {
	changeRequestId: string;
	acceptanceCriterionId: string;
	acceptanceCriterionSourceType: AcceptanceCriterionSourceType;
	acceptanceCriterionSourceId: string;
	acceptanceCriterionDescription: string;
	acceptanceCriterionVerificationMethod?: string | null;
	status?: AcceptanceConfirmationStatus;
	verifiedBy?: string | null;
	verifiedAt?: string | null;
	evidence?: string | null;
};

type AcceptanceConfirmationRow = {
	id: string;
	change_request_id: string;
	acceptance_criterion_id: string;
	acceptance_criterion_source_type: string;
	acceptance_criterion_source_id: string;
	acceptance_criterion_description: string;
	acceptance_criterion_verification_method: string | null;
	status: string;
	verified_by: string | null;
	verified_at: string | null;
	evidence: string | null;
	created_at: string;
	updated_at: string;
};

const normalizeSourceType = (value: unknown): AcceptanceCriterionSourceType => {
	if (value === "business_requirement" || value === "system_requirement") {
		return value;
	}
	return "business_requirement";
};

const normalizeConfirmationStatus = (value: unknown): AcceptanceConfirmationStatus => {
	if (value === "unverified" || value === "verified_ok" || value === "verified_ng") {
		return value;
	}
	return "unverified";
};

const toAcceptanceConfirmation = (row: AcceptanceConfirmationRow): AcceptanceConfirmation => ({
	id: row.id,
	changeRequestId: row.change_request_id,
	acceptanceCriterionId: row.acceptance_criterion_id,
	acceptanceCriterionSourceType: normalizeSourceType(row.acceptance_criterion_source_type),
	acceptanceCriterionSourceId: row.acceptance_criterion_source_id,
	acceptanceCriterionDescription: row.acceptance_criterion_description,
	acceptanceCriterionVerificationMethod: row.acceptance_criterion_verification_method,
	status: normalizeConfirmationStatus(row.status),
	verifiedBy: row.verified_by,
	verifiedAt: row.verified_at,
	evidence: row.evidence,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toAcceptanceConfirmationRowBase = (input: AcceptanceConfirmationInput) => ({
	change_request_id: input.changeRequestId,
	acceptance_criterion_id: input.acceptanceCriterionId,
	acceptance_criterion_source_type: input.acceptanceCriterionSourceType,
	acceptance_criterion_source_id: input.acceptanceCriterionSourceId,
	acceptance_criterion_description: input.acceptanceCriterionDescription,
	acceptance_criterion_verification_method: input.acceptanceCriterionVerificationMethod ?? null,
	status: input.status ?? "unverified",
	verified_by: input.verifiedBy ?? null,
	verified_at: input.verifiedAt ?? null,
	evidence: input.evidence ?? null,
});

const failIfMissingConfig = () => {
	const error = getSupabaseConfigError();
	if (error) {
		return { data: null, error };
	}
	return null;
};

export const listAcceptanceConfirmationsByChangeRequestId = async (changeRequestId: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const { data, error } = await supabase
		.from("change_request_acceptance_confirmations")
		.select("*")
		.eq("change_request_id", changeRequestId)
		.order("created_at", { ascending: true });

	if (error) return { data: null, error: error.message };
	return { data: (data as AcceptanceConfirmationRow[]).map(toAcceptanceConfirmation), error: null };
};

export const createAcceptanceConfirmation = async (input: AcceptanceConfirmationInput) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();
	const payload = {
		...toAcceptanceConfirmationRowBase(input),
		created_at: now,
		updated_at: now,
	};

	const { data, error } = await supabase
		.from("change_request_acceptance_confirmations")
		.insert(payload)
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toAcceptanceConfirmation(data as AcceptanceConfirmationRow), error: null };
};

export const createAcceptanceConfirmations = async (inputs: AcceptanceConfirmationInput[]) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;
	if (inputs.length === 0) return { data: [], error: null };

	const now = new Date().toISOString();
	const payload = inputs.map((input) => ({
		...toAcceptanceConfirmationRowBase(input),
		created_at: now,
		updated_at: now,
	}));

	const { data, error } = await supabase
		.from("change_request_acceptance_confirmations")
		.insert(payload)
		.select("*");

	if (error) return { data: null, error: error.message };
	return { data: (data as AcceptanceConfirmationRow[]).map(toAcceptanceConfirmation), error: null };
};

export const updateAcceptanceConfirmation = async (id: string, input: Omit<AcceptanceConfirmationInput, "changeRequestId">) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();
	const payload = {
		acceptance_criterion_id: input.acceptanceCriterionId,
		acceptance_criterion_source_type: input.acceptanceCriterionSourceType,
		acceptance_criterion_source_id: input.acceptanceCriterionSourceId,
		acceptance_criterion_description: input.acceptanceCriterionDescription,
		acceptance_criterion_verification_method: input.acceptanceCriterionVerificationMethod ?? null,
		status: input.status ?? "unverified",
		verified_by: input.verifiedBy ?? null,
		verified_at: input.verifiedAt ?? null,
		evidence: input.evidence ?? null,
		updated_at: now,
	};

	const { data, error } = await supabase
		.from("change_request_acceptance_confirmations")
		.update(payload)
		.eq("id", id)
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toAcceptanceConfirmation(data as AcceptanceConfirmationRow), error: null };
};

export const updateAcceptanceConfirmationStatus = async (
	id: string,
	status: AcceptanceConfirmationStatus,
	verifiedBy: string,
	evidence?: string
) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();
	const normalizedStatus = normalizeConfirmationStatus(status);

	const { data, error } = await supabase
		.from("change_request_acceptance_confirmations")
		.update({
			status: normalizedStatus,
			verified_by: verifiedBy,
			verified_at: now,
			evidence: evidence ?? null,
			updated_at: now,
		})
		.eq("id", id)
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toAcceptanceConfirmation(data as AcceptanceConfirmationRow), error: null };
};

export const deleteAcceptanceConfirmation = async (id: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const { error } = await supabase
		.from("change_request_acceptance_confirmations")
		.delete()
		.eq("id", id);

	if (error) return { data: null, error: error.message };
	return { data: true, error: null };
};

export const deleteAcceptanceConfirmationsByChangeRequestId = async (changeRequestId: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const { error } = await supabase
		.from("change_request_acceptance_confirmations")
		.delete()
		.eq("change_request_id", changeRequestId);

	if (error) return { data: null, error: error.message };
	return { data: true, error: null };
};

export const getAcceptanceConfirmationCompletionStatus = async (changeRequestId: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const { data, error } = await supabase
		.from("change_request_acceptance_confirmations")
		.select("status")
		.eq("change_request_id", changeRequestId);

	if (error) return { data: null, error: error.message };

	const confirmations = data as Array<{ status: string }>;
	const total = confirmations.length;
	const verified = confirmations.filter((c) => c.status === "verified_ok").length;
	const pending = total - verified;

	return {
		data: {
			total,
			verified,
			pending,
			completionRate: total > 0 ? (verified / total) * 100 : 100,
		},
		error: null,
	};
};

export type AcceptanceConfirmationCompletionStatus = {
	total: number;
	verified: number;
	pending: number;
	completionRate: number;
};
