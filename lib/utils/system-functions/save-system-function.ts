import { updateSystemFunction } from "@/lib/data/system-functions";
import {
	deleteSystemRequirementsBySrfId,
	createSystemRequirements,
	listSystemRequirementsBySrfId,
} from "@/lib/data/system-requirements";
import {
	deleteImplUnitSdsBySrfId,
	createImplUnitSds,
} from "@/lib/data/impl-unit-sds";
import {
	createAcceptanceCriteria,
	acceptanceCriteriaJsonToInputs,
} from "@/lib/data/acceptance-criteria";
import { syncBrSrLinksToRequirementLinks } from "@/lib/data/task-sync";
import { normalizeEntryPointsInput } from "./entry-points";
import { parseYamlObject } from "@/lib/utils/yaml";
import type { Requirement } from "@/lib/domain/forms";
import type { SystemDesignItem, EntryPoint, CodeRef } from "@/lib/domain";
import type { DesignTarget, SystemDesignItemV2 } from "@/lib/domain/schemas/system-design";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";
import type { SystemFunction, SrfCategory, SrfStatus } from "@/lib/domain";
import type { ImplUnitSdDraft } from "@/components/forms/impl-unit-sd-list";

type SaveSystemFunctionInput = {
	srfId: string;
	existingSrf: SystemFunction;
	systemDomainId: string;
	category: SrfCategory;
	status: SrfStatus;
	title: string;
	summary: string;
	designPolicy: string;
	deliverables: Deliverable[];
	designItemsV2: SystemDesignItemV2[];
	systemDesign: SystemDesignItem[];
	entryPoints: EntryPoint[];
	implUnitSds: ImplUnitSdDraft[];
	codeRefs: CodeRef[];
	systemRequirements: Requirement[];
	projectId: string;
};

/**
 * システム機能とその関連データを保存
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
		deliverables,
		designItemsV2,
		systemDesign,
		entryPoints,
		implUnitSds,
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
			deliverables,
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
			relatedDeliverableIds: req.relatedDeliverableIds ?? [],
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

	// 5. 実装単位SDを保存（既存削除 + 再作成）
	const { error: implDeleteError } = await deleteImplUnitSdsBySrfId(srfId, projectId);
	if (implDeleteError) {
		return { error: implDeleteError };
	}

	if (implUnitSds.length > 0) {
		const implInputs = implUnitSds.map((unit) => ({
			id: unit.id,
			srfId,
			name: unit.name.trim(),
			type: unit.type || "screen",
			summary: unit.summary.trim(),
			entryPoints: normalizeEntryPointsInput(unit.entryPoints),
			designPolicy: unit.designPolicy.trim(),
			details: parseYamlObject(unit.detailsYaml),
			projectId,
		}));
		const { error: implError } = await createImplUnitSds(implInputs);
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
