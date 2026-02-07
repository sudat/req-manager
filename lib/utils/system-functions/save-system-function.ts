import { updateSystemFunction } from "@/lib/data/system-functions";
import {
	deleteSystemRequirementsBySrfId,
	createSystemRequirements,
	listSystemRequirementsBySrfId,
} from "@/lib/data/system-requirements";
import {
	deleteDesignDocumentsBySrfId,
	createDesignDocuments,
} from "@/lib/data/design-documents";
import {
	createAcceptanceCriteria,
	acceptanceCriteriaJsonToInputs,
} from "@/lib/data/acceptance-criteria";
import { syncBrSrLinksToRequirementLinks } from "@/lib/data/task-sync";
import { normalizeEntryPointsInput } from "./entry-points";
import { parseYamlObject } from "@/lib/utils/yaml";
import { composeStructuredDetails } from "@/lib/utils/design-documents/structured-compat";
import type { Requirement } from "@/lib/domain/forms";
import type { SystemDesignItem, EntryPoint, CodeRef } from "@/lib/domain";
import type { DesignTarget, SystemDesignItemV2 } from "@/lib/domain/schemas/system-design";
import type { SystemFunction, SrfCategory, SrfStatus } from "@/lib/domain";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";

type SaveSystemFunctionInput = {
	srfId: string;
	existingSrf: SystemFunction;
	systemDomainId: string;
	category: SrfCategory;
	status: SrfStatus;
	title: string;
	summary: string;
	designPolicy: string;
	designItemsV2: SystemDesignItemV2[];
	systemDesign: SystemDesignItem[];
	entryPoints: EntryPoint[];
	designDocuments: DesignDocumentDraft[];
	codeRefs: CodeRef[];
	systemRequirements: Requirement[];
	projectId: string;
};

/**
 * 基本情報のみを保存（SR/DDは既存データを維持）
 */
export async function saveBasicInfo(input: {
	srfId: string;
	existingSrf: SystemFunction;
	systemDomainId: string;
	category: SrfCategory;
	status: SrfStatus;
	title: string;
	summary: string;
	designPolicy: string;
	projectId: string;
}): Promise<{ error: string | null }> {
	const {
		srfId,
		existingSrf,
		systemDomainId,
		category,
		status,
		title,
		summary,
		designPolicy,
		projectId,
	} = input;

	// 既存のSR/DD/entryPoints/codeRefsは維持
	const { error: saveError } = await updateSystemFunction(
		srfId,
		{
			systemDomainId,
			category,
			status,
			title,
			summary,
			designPolicy,
			relatedTaskIds: existingSrf.relatedTaskIds ?? [],
			requirementIds: existingSrf.requirementIds ?? [],
			systemDesign: existingSrf.systemDesign ?? [],
			entryPoints: existingSrf.entryPoints ?? [],
			codeRefs: existingSrf.codeRefs ?? [],
		},
		projectId
	);

	if (saveError) {
		return { error: saveError };
	}

	return { error: null };
}

/**
 * システム要件のみを保存（基本情報/DDは触らない）
 */
export async function saveSystemRequirements(input: {
	srfId: string;
	existingSrf: SystemFunction;
	systemDomainId: string;
	systemRequirements: Requirement[];
	projectId: string;
}): Promise<{ error: string | null }> {
	const { srfId, existingSrf, systemDomainId, systemRequirements, projectId } = input;

	// 1. 既存SRのIDを取得（リンク削除用）
	const { data: existingSystemReqs, error: existingSrError } =
		await listSystemRequirementsBySrfId(srfId, projectId);
	if (existingSrError) {
		return { error: existingSrError };
	}
	const existingSrIds = (existingSystemReqs ?? []).map((req) => req.id);

	// 2. システム要件を保存（既存削除 + 再作成）
	await deleteSystemRequirementsBySrfId(srfId, projectId);

	if (systemRequirements.length > 0) {
		const sysReqInputs = systemRequirements.map((req, index) => ({
			id: req.id,
			taskId: req.taskId || "",
			srfIds: [srfId],
			title: req.title,
			summary: req.summary,
			conceptIds: req.conceptIds,
			impacts: [],
			category: req.category,
			acceptanceCriteriaJson: req.acceptanceCriteriaJson,
			acceptanceCriteria: req.acceptanceCriteria,
			systemDomainIds: req.systemDomainIds,
			sortOrder: index,
			projectId,
		}));

		const { error: sysReqError } = await createSystemRequirements(sysReqInputs);
		if (sysReqError) {
			return { error: sysReqError };
		}
	}

	// 3. 受入基準を保存
	const acceptanceInputs = systemRequirements.flatMap((req) =>
		acceptanceCriteriaJsonToInputs(req.acceptanceCriteriaJson ?? [], req.id, projectId)
	);
	const { error: acError } = await createAcceptanceCriteria(acceptanceInputs);
	if (acError) {
		return { error: acError };
	}

	// 4. requirement_linksにSR↔BRリンクを同期
	const linkError = await syncBrSrLinksToRequirementLinks(
		systemRequirements.map((req) => ({
			id: req.id,
			businessRequirementIds: req.businessRequirementIds ?? [],
		})),
		projectId,
		{ deleteSourceIds: existingSrIds }
	);
	if (linkError) {
		return { error: `リンク同期エラー: ${linkError}` };
	}

	// 5. system_functionsのrequirementIdsを更新
	const { error: updateError } = await updateSystemFunction(
		srfId,
		{
			systemDomainId,
			category: existingSrf.category,
			status: existingSrf.status,
			title: existingSrf.title,
			summary: existingSrf.summary,
			designPolicy: existingSrf.designPolicy,
			relatedTaskIds: existingSrf.relatedTaskIds ?? [],
			requirementIds: systemRequirements.map((req) => req.id),
			systemDesign: existingSrf.systemDesign ?? [],
			entryPoints: existingSrf.entryPoints ?? [],
			codeRefs: existingSrf.codeRefs ?? [],
		},
		projectId
	);

	if (updateError) {
		return { error: updateError };
	}

	return { error: null };
}

/**
 * DDのみを保存（基本情報/SRは触らない）
 */
export async function saveDesignDocuments(input: {
	srfId: string;
	designDocuments: DesignDocumentDraft[];
	projectId: string;
}): Promise<{ error: string | null }> {
	const { srfId, designDocuments, projectId } = input;

	// 1. DDを保存（既存削除 + 再作成）
	const { error: implDeleteError } = await deleteDesignDocumentsBySrfId(srfId, projectId);
	if (implDeleteError) {
		return { error: implDeleteError };
	}

	if (designDocuments.length > 0) {
		const implInputs = designDocuments.map((unit) => ({
			id: unit.id,
			srfId,
			name: unit.name.trim(),
			type: unit.type || "screen",
			summary: unit.summary.trim(),
			entryPoints: normalizeEntryPointsInput(unit.entryPoints),
			designPolicy: unit.designPolicy.trim(),
			details: composeStructuredDetails({
				structuredSpec: unit.structuredSpec,
				legacyDetails: parseYamlObject(unit.detailsYaml),
			}),
			projectId,
		}));
		const { error: implError } = await createDesignDocuments(implInputs);
		if (implError) {
			return { error: implError };
		}
	}

	return { error: null };
}

/**
 * システム機能とその関連データを保存（旧関数: 非推奨）
 * @deprecated 分割された saveBasicInfo / saveSystemRequirements / saveDesignDocuments を使用してください
 */
export async function saveSystemFunction(
	input: SaveSystemFunctionInput
): Promise<{ error: string | null }> {
	const {
		srfId,
		existingSrf,
		systemDomainId,
		category,
		status,
		title,
		summary,
		designPolicy,
		designItemsV2,
		systemDesign,
		entryPoints,
		designDocuments,
		codeRefs,
		systemRequirements,
		projectId,
	} = input;

	const normalizedEntryPoints = normalizeEntryPointsInput(entryPoints);

	// V2とレガシーをマージ
	const mergedDesignItems = [...designItemsV2, ...systemDesign];

	// 1. システム機能を更新
	const { error: saveError } = await updateSystemFunction(
		srfId,
		{
			systemDomainId,
			category,
			status,
			title,
			summary,
			designPolicy,
			relatedTaskIds: existingSrf.relatedTaskIds ?? [],
			requirementIds: systemRequirements.map((req) => req.id),
			systemDesign: mergedDesignItems,
			entryPoints: normalizedEntryPoints,
			codeRefs,
		},
		projectId
	);

	if (saveError) {
		return { error: saveError };
	}

	// 2. 既存SRのIDを取得（リンク削除用）
	const { data: existingSystemReqs, error: existingSrError } =
		await listSystemRequirementsBySrfId(srfId, projectId);
	if (existingSrError) {
		return { error: existingSrError };
	}
	const existingSrIds = (existingSystemReqs ?? []).map((req) => req.id);

	// 3. システム要件を保存（既存削除 + 再作成）
	await deleteSystemRequirementsBySrfId(srfId, projectId);

	if (systemRequirements.length > 0) {
		const sysReqInputs = systemRequirements.map((req, index) => ({
			id: req.id,
			taskId: req.taskId || "",
			srfIds: [srfId],
			title: req.title,
			summary: req.summary,
			conceptIds: req.conceptIds,
			impacts: [],
			category: req.category,
			acceptanceCriteriaJson: req.acceptanceCriteriaJson,
			acceptanceCriteria: req.acceptanceCriteria,
			systemDomainIds: req.systemDomainIds,
			sortOrder: index,
			projectId,
		}));

		const { error: sysReqError } = await createSystemRequirements(sysReqInputs);
		if (sysReqError) {
			return { error: sysReqError };
		}
	}

	// 4. 受入基準を保存
	const acceptanceInputs = systemRequirements.flatMap((req) =>
		acceptanceCriteriaJsonToInputs(req.acceptanceCriteriaJson ?? [], req.id, projectId)
	);
	const { error: acError } = await createAcceptanceCriteria(acceptanceInputs);
	if (acError) {
		return { error: acError };
	}

	// 5. DDを保存（既存削除 + 再作成）
	const { error: implDeleteError } = await deleteDesignDocumentsBySrfId(srfId, projectId);
	if (implDeleteError) {
		return { error: implDeleteError };
	}

	if (designDocuments.length > 0) {
		const implInputs = designDocuments.map((unit) => ({
			id: unit.id,
			srfId,
			name: unit.name.trim(),
			type: unit.type || "screen",
			summary: unit.summary.trim(),
			entryPoints: normalizeEntryPointsInput(unit.entryPoints),
			designPolicy: unit.designPolicy.trim(),
			details: composeStructuredDetails({
				structuredSpec: unit.structuredSpec,
				legacyDetails: parseYamlObject(unit.detailsYaml),
			}),
			projectId,
		}));
		const { error: implError } = await createDesignDocuments(implInputs);
		if (implError) {
			return { error: implError };
		}
	}

	// 6. requirement_linksにSR↔BRリンクを同期
	const linkError = await syncBrSrLinksToRequirementLinks(
		systemRequirements.map((req) => ({
			id: req.id,
			businessRequirementIds: req.businessRequirementIds ?? [],
		})),
		projectId,
		{ deleteSourceIds: existingSrIds }
	);
	if (linkError) {
		return { error: `リンク同期エラー: ${linkError}` };
	}

	return { error: null };
}
