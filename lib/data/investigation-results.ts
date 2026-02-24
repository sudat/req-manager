import { supabase } from "@/lib/supabase/client";
import { failIfMissingConfig } from "./crud-factory";
import type { InvestigationResult, InvestigationResultStatus } from "@/lib/domain/value-objects";

export type InvestigationResultInput = {
	changeRequestId: string;
	projectId: string;
	status?: InvestigationResultStatus;
	topDownResult?: InvestigationResult["topDownResult"];
	bottomUpResult?: InvestigationResult["bottomUpResult"];
	suspectLinksDetected?: InvestigationResult["suspectLinksDetected"];
};

type InvestigationResultRow = {
	id: string;
	change_request_id: string;
	project_id: string;
	status: string;
	top_down_result: unknown | null;
	bottom_up_result: unknown | null;
	suspect_links_detected: unknown | null;
	created_at: string;
	updated_at: string;
};

const normalizeStatus = (value: unknown): InvestigationResultStatus => {
	if (value === "pending" || value === "running" || value === "completed" || value === "failed") return value;
	return "pending";
};

const normalizeTopDownResult = (value: unknown): InvestigationResult["topDownResult"] => {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		const obj = value as Record<string, unknown>;
		return {
			affectedBRs: Array.isArray(obj.affectedBRs) ? (obj.affectedBRs as string[]) : [],
			affectedSFs: Array.isArray(obj.affectedSFs) ? (obj.affectedSFs as string[]) : [],
			affectedSRs: Array.isArray(obj.affectedSRs) ? (obj.affectedSRs as string[]) : [],
			affectedACs: Array.isArray(obj.affectedACs) ? (obj.affectedACs as string[]) : [],
			affectedEntryPoints: Array.isArray(obj.affectedEntryPoints)
				? (obj.affectedEntryPoints as Array<{ sfId: string; path: string }>)
				: [],
		};
	}
	return { affectedBRs: [], affectedSFs: [], affectedSRs: [], affectedACs: [], affectedEntryPoints: [] };
};

const normalizeBottomUpResult = (
	value: unknown
): InvestigationResult["bottomUpResult"] | undefined => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	const obj = value as Record<string, unknown>;

	const explorationRaw =
		obj.explorationMetadata && typeof obj.explorationMetadata === "object" && !Array.isArray(obj.explorationMetadata)
			? (obj.explorationMetadata as Record<string, unknown>)
			: {};

		const affectedFilesRaw = Array.isArray(obj.affectedFiles) ? obj.affectedFiles : [];
		const affectedFiles = affectedFilesRaw
			.filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item))
			.map((raw) => {
			const impactType: "direct" | "indirect" = raw.impactType === "direct" ? "direct" : "indirect";

			let dependencyType: "import" | "type" | "runtime" | "config" = "import";
			if (
				raw.dependencyType === "type" ||
				raw.dependencyType === "runtime" ||
				raw.dependencyType === "config"
			) {
				dependencyType = raw.dependencyType;
			}

			let changeLikelihood: "high" | "medium" | "low" = "low";
			if (
				raw.changeLikelihood === "high" ||
				raw.changeLikelihood === "medium" ||
				raw.changeLikelihood === "low"
			) {
				changeLikelihood = raw.changeLikelihood;
			}

				return {
					filePath: typeof raw.filePath === "string" ? raw.filePath : "",
					impactType,
				depth: typeof raw.depth === "number" ? raw.depth : 0,
				confidence: typeof raw.confidence === "number" ? raw.confidence : 0,
				changeLikelihood,
				reason: typeof raw.reason === "string" ? raw.reason : "",
				dependencyChain: Array.isArray(raw.dependencyChain)
					? (raw.dependencyChain as unknown[]).filter((v): v is string => typeof v === "string")
					: [],
				dependencyType,
				sharedModule: typeof raw.sharedModule === "boolean" ? raw.sharedModule : undefined,
			};
		})
		.filter((item) => item.filePath.length > 0);

	return {
		repositoryUrl: typeof obj.repositoryUrl === "string" ? obj.repositoryUrl : null,
		error: typeof obj.error === "string" ? obj.error : obj.error === null ? null : null,
		explorationMetadata: {
			totalFilesScanned: typeof explorationRaw.totalFilesScanned === "number" ? explorationRaw.totalFilesScanned : 0,
			totalDependenciesFound: typeof explorationRaw.totalDependenciesFound === "number" ? explorationRaw.totalDependenciesFound : 0,
			maxDepthReached: typeof explorationRaw.maxDepthReached === "number" ? explorationRaw.maxDepthReached : 0,
			truncated: typeof explorationRaw.truncated === "boolean" ? explorationRaw.truncated : false,
			truncationReason:
				typeof explorationRaw.truncationReason === "string" ? explorationRaw.truncationReason : null,
		},
		affectedFiles,
	};
};

const normalizeSuspectLinks = (value: unknown): InvestigationResult["suspectLinksDetected"] => {
	if (Array.isArray(value)) return value as InvestigationResult["suspectLinksDetected"];
	return [];
};

const toInvestigationResult = (row: InvestigationResultRow): InvestigationResult => ({
	id: row.id,
	changeRequestId: row.change_request_id,
	projectId: row.project_id,
	status: normalizeStatus(row.status),
	topDownResult: normalizeTopDownResult(row.top_down_result),
	bottomUpResult: normalizeBottomUpResult(row.bottom_up_result),
	suspectLinksDetected: normalizeSuspectLinks(row.suspect_links_detected),
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

export const createInvestigationResult = async (input: InvestigationResultInput) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();
	const payload = {
		change_request_id: input.changeRequestId,
		project_id: input.projectId,
		status: normalizeStatus(input.status),
		top_down_result: input.topDownResult ?? null,
		bottom_up_result: input.bottomUpResult ?? null,
		suspect_links_detected: input.suspectLinksDetected ?? [],
		created_at: now,
		updated_at: now,
	};

	const { data, error } = await supabase
		.from("investigation_results")
		.insert(payload)
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toInvestigationResult(data as InvestigationResultRow), error: null };
};

export const getInvestigationResultByChangeRequestId = async (changeRequestId: string, projectId?: string) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	let query = supabase
		.from("investigation_results")
		.select("*")
		.eq("change_request_id", changeRequestId)
		.order("created_at", { ascending: false });

	if (projectId) {
		query = query.eq("project_id", projectId);
	}

	const { data, error } = await query.maybeSingle();

	if (error) return { data: null, error: error.message };
	if (!data) return { data: null, error: null };
	return { data: toInvestigationResult(data as InvestigationResultRow), error: null };
};

export const updateInvestigationResult = async (
	id: string,
	input: Partial<Pick<InvestigationResultInput, "status" | "topDownResult" | "bottomUpResult" | "suspectLinksDetected">>
) => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const now = new Date().toISOString();
	const payload: Record<string, unknown> = { updated_at: now };
	if (input.status !== undefined) payload.status = normalizeStatus(input.status);
	if (input.topDownResult !== undefined) payload.top_down_result = input.topDownResult;
	if (input.bottomUpResult !== undefined) payload.bottom_up_result = input.bottomUpResult;
	if (input.suspectLinksDetected !== undefined) payload.suspect_links_detected = input.suspectLinksDetected;

	const { data, error } = await supabase
		.from("investigation_results")
		.update(payload)
		.eq("id", id)
		.select("*")
		.single();

	if (error) return { data: null, error: error.message };
	return { data: toInvestigationResult(data as InvestigationResultRow), error: null };
};
