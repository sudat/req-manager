import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type {
	ChangeRequest,
	ChangeRequestStatus,
	ChangeRequestPriority,
} from "@/lib/domain/value-objects";

export type ChangeRequestInput = {
	ticketId: string;
	title: string;
	description?: string | null;
	background?: string | null;
	expectedBenefit?: string | null;
	status?: ChangeRequestStatus;
	priority?: ChangeRequestPriority;
	requestedBy?: string | null;
};

export type ChangeRequestCreateInput = ChangeRequestInput & {
	projectId: string;
};

type ChangeRequestRow = {
	id: string;
	ticket_id: string;
	title: string;
	description: string | null;
	background: string | null;
	expected_benefit: string | null;
	status: string;
	priority: string;
	requested_by: string | null;
	created_at: string;
	updated_at: string;
};

const normalizeStatus = (value: unknown): ChangeRequestStatus => {
	if (value === "open" || value === "review" || value === "approved" || value === "applied") return value;
	return "open";
};

const normalizePriority = (value: unknown): ChangeRequestPriority => {
	if (value === "low" || value === "medium" || value === "high") return value;
	return "medium";
};

const toChangeRequest = (row: ChangeRequestRow): ChangeRequest => ({
	id: row.id,
	ticketId: row.ticket_id,
	title: row.title,
	description: row.description,
	background: row.background,
	expectedBenefit: row.expected_benefit,
	status: normalizeStatus(row.status),
	priority: normalizePriority(row.priority),
	requestedBy: row.requested_by,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toChangeRequestRowBase = (input: Omit<ChangeRequestInput, "ticketId"> & { ticketId: string }) => ({
	ticket_id: input.ticketId,
	title: input.title,
	description: input.description ?? null,
	background: input.background ?? null,
	expected_benefit: input.expectedBenefit ?? null,
	status: normalizeStatus(input.status),
	priority: normalizePriority(input.priority),
	requested_by: input.requestedBy ?? null,
});

const failIfMissingConfig = () => {
	const error = getSupabaseConfigError();
	if (error) {
		return { data: null, error };
	}
	return null;
};

export const listChangeRequests = async (projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	let query = supabase
		.from("change_requests")
		.select("*")
		.order("created_at", { ascending: false });

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query;

	if (error) return { data: null, error: error.message };
	return { data: (data as ChangeRequestRow[]).map(toChangeRequest), error: null };
};

export const getChangeRequestById = async (id: string, projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	let query = supabase
		.from("change_requests")
		.select("*")
		.eq("id", id);

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query.maybeSingle();

	if (error) return { data: null, error: error.message };
	if (!data) return { data: null, error: null };
	return { data: toChangeRequest(data as ChangeRequestRow), error: null };
};

export const getChangeRequestByTicketId = async (ticketId: string, projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	let query = supabase
		.from("change_requests")
		.select("*")
		.eq("ticket_id", ticketId);

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query.maybeSingle();

	if (error) return { data: null, error: error.message };
	if (!data) return { data: null, error: null };
	return { data: toChangeRequest(data as ChangeRequestRow), error: null };
};

export const createChangeRequest = async (input: ChangeRequestCreateInput) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();
	const payload = {
		...toChangeRequestRowBase(input),
		project_id: input.projectId,
		created_at: now,
		updated_at: now,
	};

	const { data, error } = await supabase
		.from("change_requests")
		.insert(payload)
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toChangeRequest(data as ChangeRequestRow), error: null };
};

export const updateChangeRequest = async (
	id: string,
	input: Omit<ChangeRequestInput, "ticketId">,
	projectId?: string
) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();
	const payload = {
		...toChangeRequestRowBase({ ...input, ticketId: "" }),
		updated_at: now,
	};
	// Remove empty ticketId from payload
	const { ticket_id: _, ...payloadWithoutTicketId } = payload;

	let query = supabase
		.from("change_requests")
		.update(payloadWithoutTicketId)
		.eq("id", id);

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toChangeRequest(data as ChangeRequestRow), error: null };
};

export const deleteChangeRequest = async (id: string, projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	let query = supabase
		.from("change_requests")
		.delete()
		.eq("id", id);

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { error } = await query;

	if (error) return { data: null, error: error.message };
	return { data: true, error: null };
};

export const updateChangeRequestStatus = async (
	id: string,
	status: ChangeRequestStatus,
	projectId?: string
) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();
	const normalizedStatus = normalizeStatus(status);

	let query = supabase
		.from("change_requests")
		.update({ status: normalizedStatus, updated_at: now })
		.eq("id", id);

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toChangeRequest(data as ChangeRequestRow), error: null };
};

export const listChangeRequestsByStatus = async (status: ChangeRequestStatus, projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const normalizedStatus = normalizeStatus(status);

	let query = supabase
		.from("change_requests")
		.select("*")
		.eq("status", normalizedStatus)
		.order("created_at", { ascending: false });

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query;
	if (error) return { data: null, error: error.message };
	return { data: (data as ChangeRequestRow[]).map(toChangeRequest), error: null };
};

export const listChangeRequestsByPriority = async (priority: ChangeRequestPriority, projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const normalizedPriority = normalizePriority(priority);

	let query = supabase
		.from("change_requests")
		.select("*")
		.eq("priority", normalizedPriority)
		.order("created_at", { ascending: false });

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query;
	if (error) return { data: null, error: error.message };
	return { data: (data as ChangeRequestRow[]).map(toChangeRequest), error: null };
};
