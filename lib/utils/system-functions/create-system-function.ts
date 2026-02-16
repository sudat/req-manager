import { createSystemFunction } from "@/lib/data/system-functions";
import { createSystemRequirements } from "@/lib/data/system-requirements";
import { createDesignDocuments } from "@/lib/data/design-documents";
import {
	createAcceptanceCriteria,
	acceptanceCriteriaJsonToInputs,
} from "@/lib/data/acceptance-criteria";
import type { BusinessRequirement } from "@/lib/data/business-requirements";
import { prepareSystemRequirementInputs } from "@/lib/utils/system-functions/prepare-system-requirements";
import { normalizeEntryPointsInput } from "@/lib/utils/system-functions/entry-points";
import { composeStructuredDetails } from "@/lib/utils/design-documents/structured-compat";
import type { SrfCategory, SrfStatus, EntryPoint } from "@/lib/domain";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";
import type { SystemRequirementCard } from "@/app/(with-sidebar)/system/[id]/create/types";
import {
	createRequirementLinks,
	syncDdDependenciesForSrf,
	type RequirementLinkCreateInput,
} from "@/lib/data/requirement-links";
import type { DdDependencyLink } from "@/lib/domain/dd-dependency";

type CreateSystemFunctionInput = {
	nextId: string;
	systemDomainId: string;
	category: SrfCategory;
	title: string;
	summary: string;
	designPolicy: string;
	status: SrfStatus;
	entryPoints: EntryPoint[];
	designDocuments: DesignDocumentDraft[];
	systemRequirements: SystemRequirementCard[];
	businessRequirements: BusinessRequirement[];
	projectId: string;
};

/**
 * システム機能とその関連データ（システム要件、受入基準、実装単位SD）を作成
 */
export async function createSystemFunctionWithRelations(
	input: CreateSystemFunctionInput
): Promise<{ error: string | null }> {
	const {
		nextId,
		systemDomainId,
		category,
		title,
		summary,
		designPolicy,
		status,
		entryPoints,
		designDocuments,
		systemRequirements,
		businessRequirements,
		projectId,
	} = input;

	// 1. システム機能を作成
	const normalizedEntryPoints = normalizeEntryPointsInput(entryPoints);
	const { error: saveError } = await createSystemFunction({
		id: nextId,
		systemDomainId,
		category,
		title: title.trim(),
		summary: summary.trim(),
		designPolicy: designPolicy.trim(),
		status,
		relatedTaskIds: [],
		requirementIds: systemRequirements.map((sr) => sr.id),
		systemDesign: [],
		codeRefs: [],
		entryPoints: normalizedEntryPoints,
		projectId,
	});

	if (saveError) {
		return { error: saveError };
	}

	// 2. システム要件を作成
	const sysReqInputs = prepareSystemRequirementInputs(
		systemRequirements,
		businessRequirements,
		nextId,
		projectId
	);

	const { error: sysReqError } = await createSystemRequirements(sysReqInputs);
	if (sysReqError) {
		return { error: sysReqError };
	}

	// 3. 受入基準を作成
	const acceptanceInputs = systemRequirements.flatMap((req) =>
		acceptanceCriteriaJsonToInputs(
			req.acceptanceCriteriaJson ?? [],
			req.id,
			projectId
		)
	);
	const { error: acError } = await createAcceptanceCriteria(acceptanceInputs);
	if (acError) {
		return { error: acError };
	}

	// 4. DDを作成
	if (designDocuments.length > 0) {
		const implInputs = designDocuments.map((unit) => ({
			id: unit.id,
			srfId: nextId,
			name: unit.name.trim(),
			type: unit.type || "screen",
			summary: unit.summary.trim(),
			entryPoints: normalizeEntryPointsInput(unit.entryPoints),
			designPolicy: unit.designPolicy.trim(),
			details: composeStructuredDetails(unit.structuredSpec),
			projectId,
		}));
		const { error: implError } = await createDesignDocuments(implInputs);
		if (implError) {
			return { error: implError };
		}
	}

	const validDdIds = designDocuments.map((dd) => dd.id);
	const dependencyUniqueKeys = new Set<string>();
	const ddDependencies: DdDependencyLink[] = [];
	const validDdIdSet = new Set(validDdIds);

	for (const sourceDd of designDocuments) {
		for (const dependency of sourceDd.dependencies ?? []) {
			if (!validDdIdSet.has(dependency.targetDdId)) continue;
			if (sourceDd.id === dependency.targetDdId) continue;

			const key = `${sourceDd.id}:${dependency.targetDdId}:${dependency.callType}`;
			if (dependencyUniqueKeys.has(key)) continue;
			dependencyUniqueKeys.add(key);
			ddDependencies.push({
				sourceDdId: sourceDd.id,
				targetDdId: dependency.targetDdId,
				callType: dependency.callType,
			});
		}
	}

	const { error: dependencySyncError } = await syncDdDependenciesForSrf({
		projectId,
		sourceDdIdsToReset: validDdIds,
		validDdIds,
		dependencies: ddDependencies,
	});
	if (dependencySyncError) {
		return { error: `DD依存リンク同期エラー: ${dependencySyncError}` };
	}

	// 5. requirement_linksにSR↔BRリンクを作成
	const linkInputs: RequirementLinkCreateInput[] = [];
	const linkKeys = new Set<string>();
	for (const sr of systemRequirements) {
		for (const brId of sr.businessRequirementIds ?? []) {
			const key = `${sr.id}:${brId}`;
			if (linkKeys.has(key)) continue;
			linkKeys.add(key);
			linkInputs.push({
				projectId,
				sourceType: "sr",
				sourceId: sr.id,
				targetType: "br",
				targetId: brId,
				linkType: "derived_from",
				suspect: false,
			});
		}
	}

	if (linkInputs.length > 0) {
		const { error: linkError } = await createRequirementLinks(linkInputs);
		if (linkError) {
			return { error: linkError };
		}
	}

	return { error: null };
}
