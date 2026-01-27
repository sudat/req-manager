import { updateSystemFunction } from "@/lib/data/system-functions";
import {
	deleteSystemRequirementsBySrfId,
	createSystemRequirements,
} from "@/lib/data/system-requirements";
import {
	deleteImplUnitSdsBySrfId,
	createImplUnitSds,
} from "@/lib/data/impl-unit-sds";
import {
	createAcceptanceCriteria,
	acceptanceCriteriaJsonToInputs,
} from "@/lib/data/acceptance-criteria";
import { listBusinessRequirementsByIds } from "@/lib/data/business-requirements";
import { linkBusinessRequirements } from "./link-business-requirements";
import type { SystemRequirementLinkCard } from "./link-business-requirements";
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

type SystemRequirementCard = {
	id: string;
	title: string;
	summary: string;
	businessRequirementIds: string[];
	acceptanceCriteriaJson: unknown[];
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

	// 2. システム要件を保存（既存削除 + 再作成）
	await deleteSystemRequirementsBySrfId(srfId, projectId);

	if (systemRequirements.length > 0) {
		const sysReqInputs = systemRequirements.map((req, index) => ({
			id: req.id,
			taskId: req.taskId || "",
			srfId: srfId,
			title: req.title,
			summary: req.summary,
			conceptIds: req.conceptIds,
			impacts: [],
			category: req.category,
			businessRequirementIds: req.businessRequirementIds ?? [],
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

	// 3. 受入基準を保存
	const acceptanceInputs = systemRequirements.flatMap((req) =>
		acceptanceCriteriaJsonToInputs(req.acceptanceCriteriaJson ?? [], req.id, projectId)
	);
	const { error: acError } = await createAcceptanceCriteria(acceptanceInputs);
	if (acError) {
		return { error: acError };
	}

	// 4. 実装単位SDを保存（既存削除 + 再作成）
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

	// 5. 双方向参照の同期
	const relatedBizReqIds = Array.from(
		new Set(systemRequirements.flatMap((req) => req.businessRequirementIds ?? []))
	);

	if (relatedBizReqIds.length > 0) {
		const { data: relatedBizReqs, error: bizFetchError } =
			await listBusinessRequirementsByIds(relatedBizReqIds, projectId);

		if (!bizFetchError && relatedBizReqs && relatedBizReqs.length > 0) {
			const sysReqCards: SystemRequirementCard[] = systemRequirements
				.filter((req) => (req.businessRequirementIds?.length ?? 0) > 0)
				.map((req) => ({
					id: req.id,
					title: req.title,
					summary: req.summary,
					businessRequirementIds: req.businessRequirementIds ?? [],
					acceptanceCriteriaJson: req.acceptanceCriteriaJson ?? [],
				}));

			const linkError = await linkBusinessRequirements(
				sysReqCards as SystemRequirementLinkCard[],
				relatedBizReqs,
				projectId
			);
			if (linkError) {
				return { error: `双方向参照同期エラー: ${linkError}` };
			}
		}
	}

	return { error: null };
}
