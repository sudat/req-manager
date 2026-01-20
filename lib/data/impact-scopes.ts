import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type {
	ImpactScope,
	ImpactScopeTargetType,
} from "@/lib/domain/value-objects";

export type ImpactScopeInput = {
	changeRequestId: string;
	targetType: ImpactScopeTargetType;
	targetId: string;
	targetTitle: string;
	rationale?: string | null;
	confirmed?: boolean;
	confirmedBy?: string | null;
	confirmedAt?: string | null;
};

type ImpactScopeRow = {
	id: string;
	change_request_id: string;
	target_type: string;
	target_id: string;
	target_title: string;
	rationale: string | null;
	confirmed: boolean;
	confirmed_by: string | null;
	confirmed_at: string | null;
	created_at: string;
	updated_at: string;
};

const normalizeTargetType = (value: unknown): ImpactScopeTargetType => {
	if (
		value === "business_requirement" ||
		value === "system_requirement" ||
		value === "system_function" ||
		value === "file"
	) {
		return value;
	}
	return "business_requirement";
};

const toImpactScope = (row: ImpactScopeRow): ImpactScope => ({
	id: row.id,
	changeRequestId: row.change_request_id,
	targetType: normalizeTargetType(row.target_type),
	targetId: row.target_id,
	targetTitle: row.target_title,
	rationale: row.rationale,
	confirmed: row.confirmed,
	confirmedBy: row.confirmed_by,
	confirmedAt: row.confirmed_at,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toImpactScopeRowBase = (input: ImpactScopeInput) => ({
	change_request_id: input.changeRequestId,
	target_type: normalizeTargetType(input.targetType),
	target_id: input.targetId,
	target_title: input.targetTitle,
	rationale: input.rationale ?? null,
	confirmed: input.confirmed ?? false,
	confirmed_by: input.confirmedBy ?? null,
	confirmed_at: input.confirmedAt ?? null,
});

const failIfMissingConfig = () => {
	const error = getSupabaseConfigError();
	if (error) {
		return { data: null, error };
	}
	return null;
};

export const listImpactScopesByChangeRequestId = async (changeRequestId: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const { data, error } = await supabase
		.from("change_request_impact_scopes")
		.select("*")
		.eq("change_request_id", changeRequestId)
		.order("created_at", { ascending: true });

	if (error) return { data: null, error: error.message };
	return { data: (data as ImpactScopeRow[]).map(toImpactScope), error: null };
};

export const createImpactScope = async (input: ImpactScopeInput) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();
	const payload = {
		...toImpactScopeRowBase(input),
		created_at: now,
		updated_at: now,
	};

	const { data, error } = await supabase
		.from("change_request_impact_scopes")
		.insert(payload)
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toImpactScope(data as ImpactScopeRow), error: null };
};

export const createImpactScopes = async (inputs: ImpactScopeInput[]) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;
	if (inputs.length === 0) return { data: [], error: null };

	const now = new Date().toISOString();
	const payload = inputs.map((input) => ({
		...toImpactScopeRowBase(input),
		created_at: now,
		updated_at: now,
	}));

	const { data, error } = await supabase
		.from("change_request_impact_scopes")
		.insert(payload)
		.select("*");

	if (error) return { data: null, error: error.message };
	return { data: (data as ImpactScopeRow[]).map(toImpactScope), error: null };
};

export const updateImpactScope = async (id: string, input: Omit<ImpactScopeInput, "changeRequestId">) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();
	const payload = {
		target_type: input.targetType,
		target_id: input.targetId,
		target_title: input.targetTitle,
		rationale: input.rationale ?? null,
		confirmed: input.confirmed ?? false,
		confirmed_by: input.confirmedBy ?? null,
		confirmed_at: input.confirmedAt ?? null,
		updated_at: now,
	};

	const { data, error } = await supabase
		.from("change_request_impact_scopes")
		.update(payload)
		.eq("id", id)
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toImpactScope(data as ImpactScopeRow), error: null };
};

export const confirmImpactScope = async (id: string, confirmedBy: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();

	const { data, error } = await supabase
		.from("change_request_impact_scopes")
		.update({
			confirmed: true,
			confirmed_by: confirmedBy,
			confirmed_at: now,
			updated_at: now,
		})
		.eq("id", id)
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toImpactScope(data as ImpactScopeRow), error: null };
};

export const deleteImpactScope = async (id: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const { error } = await supabase
		.from("change_request_impact_scopes")
		.delete()
		.eq("id", id);

	if (error) return { data: null, error: error.message };
	return { data: true, error: null };
};

export const deleteImpactScopesByChangeRequestId = async (changeRequestId: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const { error } = await supabase
		.from("change_request_impact_scopes")
		.delete()
		.eq("change_request_id", changeRequestId);

	if (error) return { data: null, error: error.message };
	return { data: true, error: null };
};
