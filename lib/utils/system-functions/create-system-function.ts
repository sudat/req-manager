import { createSystemFunction } from "@/lib/data/system-functions";
import { createSystemRequirements } from "@/lib/data/system-requirements";
import { createImplUnitSds } from "@/lib/data/impl-unit-sds";
import {
	createAcceptanceCriteria,
	acceptanceCriteriaJsonToInputs,
} from "@/lib/data/acceptance-criteria";
import type { BusinessRequirement } from "@/lib/data/business-requirements";
import { prepareSystemRequirementInputs } from "@/lib/utils/system-functions/prepare-system-requirements";
import { normalizeEntryPointsInput } from "@/lib/utils/system-functions/entry-points";
import { parseYamlObject } from "@/lib/utils/yaml";
import type { SrfCategory, SrfStatus, EntryPoint } from "@/lib/domain";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";
import type { ImplUnitSdDraft } from "@/components/forms/impl-unit-sd-list";
import type { SystemRequirementCard } from "@/app/(with-sidebar)/system-domains/[id]/create/types";
import {
	createRequirementLinks,
	type RequirementLinkCreateInput,
} from "@/lib/data/requirement-links";

type CreateSystemFunctionInput = {
	nextId: string;
	systemDomainId: string;
	category: SrfCategory;
	title: string;
	summary: string;
	designPolicy: string;
	status: SrfStatus;
	deliverables: Deliverable[];
	entryPoints: EntryPoint[];
	implUnitSds: ImplUnitSdDraft[];
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
		deliverables,
		entryPoints,
		implUnitSds,
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
		deliverables,
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

	// 4. 実装単位SDを作成
	if (implUnitSds.length > 0) {
		const implInputs = implUnitSds.map((unit) => ({
			id: unit.id,
			srfId: nextId,
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
