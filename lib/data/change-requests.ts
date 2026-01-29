import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type {
	ChangeRequest,
	ChangeRequestStatus,
	ChangeRequestPriority,
} from "@/lib/domain/value-objects";
import { createCrudOperations } from "./crud-factory";

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

// crud-factoryを使用した基本CRUD操作
const changeRequestCrud = createCrudOperations<ChangeRequestRow, ChangeRequest, ChangeRequestInput>({
  tableName: "change_requests",
  toEntity: toChangeRequest,
  toRow: toChangeRequestRowBase as (input: ChangeRequestInput) => Partial<ChangeRequestRow>,
  orderBy: ["created_at"],
});

export const listChangeRequests = changeRequestCrud.list;
export const getChangeRequestById = changeRequestCrud.getById;

// 独自検索メソッド（ticket_id による検索）
export const getChangeRequestByTicketId = async (ticketId: string, projectId?: string) => {
	const configError = getSupabaseConfigError();
	if (configError) return { data: null, error: configError };

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

export const createChangeRequest = changeRequestCrud.create;

// updateChangeRequestはticketIdを除外する必要があるため独自実装
export const updateChangeRequest = async (
	id: string,
	input: Omit<ChangeRequestInput, "ticketId">,
	projectId?: string
) => {
	const configError = getSupabaseConfigError();
	if (configError) return { data: null, error: configError };

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

export const deleteChangeRequest = changeRequestCrud.delete;

// 追加の検索・更新メソッド（独自実装のまま維持）
export const updateChangeRequestStatus = async (
	id: string,
	status: ChangeRequestStatus,
	projectId?: string
) => {
	const configError = getSupabaseConfigError();
	if (configError) return { data: null, error: configError };

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
	const configError = getSupabaseConfigError();
	if (configError) return { data: null, error: configError };

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
	const configError = getSupabaseConfigError();
	if (configError) return { data: null, error: configError };

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
