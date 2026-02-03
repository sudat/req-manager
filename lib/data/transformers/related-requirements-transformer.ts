import type { RelatedRequirementInfo } from "@/lib/domain/value-objects";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";
import {
	listRequirementLinksBySource,
	listRequirementLinksBySourceIds,
} from "@/lib/data/requirement-links";

// ========================================
// Type Definitions
// ========================================

export interface BusinessRequirement {
	id: string;
	taskId: string;
	title: string;
	relatedSystemRequirementIds?: string[];
}

export interface SystemRequirement {
	id: string;
	taskId: string;
	title: string;
	summary: string;
	conceptIds: string[];
	impacts: string[];
	acceptanceCriteria: string[];
	acceptanceCriteriaJson: AcceptanceCriterionJson[];
	businessRequirementIds: string[];
}

// ========================================
// Transformer Functions
// ========================================

/**
 * レガシーデータからシステム要件ID→業務要件IDマップを構築する
 * @param businessRequirements - 業務要件リスト
 * @returns システム要件IDから業務要件ID配列へのマップ
 */
export function buildSysReqToBizReqsMap(
	businessRequirements: BusinessRequirement[]
): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const bizReq of businessRequirements) {
		for (const sysReqId of bizReq.relatedSystemRequirementIds ?? []) {
			const list = map.get(sysReqId);
			if (list) {
				list.push(bizReq.id);
			} else {
				map.set(sysReqId, [bizReq.id]);
			}
		}
	}
	return map;
}

/**
 * システム要件の配列からシステム要件ID→業務要件IDマップを構築する
 * @param systemRequirements - システム要件リスト
 * @param legacyMap - レガシーデータから構築されたマップ（フォールバック用）
 * @returns システム要件IDから業務要件ID配列へのマップ
 */
export function buildSysReqToBizReqsMapFromSystemReqs(
	systemRequirements: SystemRequirement[],
	legacyMap: Map<string, string[]>
): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const req of systemRequirements) {
		if (req.businessRequirementIds.length > 0) {
			map.set(req.id, req.businessRequirementIds);
			continue;
		}
		const legacy = legacyMap.get(req.id);
		if (legacy) {
			map.set(req.id, legacy);
		}
	}
	return map;
}

/**
 * 1つのシステム要件から関連要件エントリを構築する共通関数
 */
function buildRelatedRequirementEntry(
	sysReq: SystemRequirement,
	businessReqMap: Map<string, BusinessRequirement>,
	taskBusinessMap: Map<string, string>,
	conceptMap: Map<string, string>,
	relatedBizReqIds: string[],
	suspectInfo?: Map<string, { suspect: boolean; suspectReason: string | null }>
): RelatedRequirementInfo {
	const systemReqConcepts = sysReq.conceptIds.map((id) => ({
		id,
		name: conceptMap.get(id) ?? id,
	}));

	const relatedBusinessReqs = relatedBizReqIds
		.map((id) => businessReqMap.get(id))
		.filter((req): req is BusinessRequirement => req !== undefined);

	const base = {
		systemReqId: sysReq.id,
		systemReqTitle: sysReq.title,
		systemReqSummary: sysReq.summary,
		systemReqConcepts,
		systemReqImpacts: sysReq.impacts,
		systemReqAcceptanceCriteria: sysReq.acceptanceCriteria,
		systemReqAcceptanceCriteriaJson: sysReq.acceptanceCriteriaJson,
	};

	if (relatedBusinessReqs.length === 0) {
		return {
			...base,
			businessReqId: "",
			businessReqTitle: "",
			businessId: taskBusinessMap.get(sysReq.taskId) ?? "",
			taskId: sysReq.taskId,
			relatedBusinessReqs: [],
		};
	}

	const mainBizReq = relatedBusinessReqs[0];

	return {
		...base,
		businessReqId: mainBizReq.id,
		businessReqTitle: mainBizReq.title,
		businessId: taskBusinessMap.get(mainBizReq.taskId) ?? "",
		taskId: mainBizReq.taskId,
		relatedBusinessReqs: relatedBusinessReqs.map((req) => {
			const info = suspectInfo?.get(req.id);
			return {
				id: req.id,
				title: req.title,
				taskId: req.taskId,
				businessId: taskBusinessMap.get(req.taskId) ?? "",
				...(info && { suspect: info.suspect, suspectReason: info.suspectReason }),
			};
		}),
	};
}

/**
 * 関連要件情報を構築する
 */
export function buildRelatedRequirements(
	sysReqs: SystemRequirement[],
	sysReqToBizReqsMap: Map<string, string[]>,
	businessReqMap: Map<string, BusinessRequirement>,
	taskBusinessMap: Map<string, string>,
	conceptMap: Map<string, string>,
): RelatedRequirementInfo[] {
	return sysReqs.map((sysReq) =>
		buildRelatedRequirementEntry(
			sysReq,
			businessReqMap,
			taskBusinessMap,
			conceptMap,
			sysReqToBizReqsMap.get(sysReq.id) ?? []
		)
	);
}

// ========================================
// Phase 2: requirement_links ベースの関数
// ========================================

/**
 * requirement_linksテーブルからシステム要件ID→業務要件IDマップを構築する
 * @param systemRequirementIds - システム要件IDの配列
 * @param projectId - プロジェクトID
 * @returns システム要件IDから業務要件ID配列へのマップ
 */
export async function buildSysReqToBizReqsMapFromLinks(
	systemRequirementIds: string[],
	projectId: string
): Promise<Map<string, string[]>> {
	const map = new Map<string, string[]>();

	if (systemRequirementIds.length === 0) {
		return map;
	}

	const { data: links, error } = await listRequirementLinksBySourceIds(
		"sr",
		systemRequirementIds,
		projectId
	);

	if (error || !links) {
		return map;
	}

	for (const link of links) {
		if (link.targetType !== "br" || link.linkType !== "derived_from") continue;
		const list = map.get(link.sourceId);
		if (list) {
			list.push(link.targetId);
		} else {
			map.set(link.sourceId, [link.targetId]);
		}
	}

	return map;
}

/**
 * ハイブリッド版: requirement_linksと配列カラムの両方から読み取る（移行期間用）
 * @param systemRequirements - システム要件リスト
 * @param projectId - プロジェクトID
 * @param useLinks - requirement_linksを使用するかどうか（デフォルト: true）
 * @returns システム要件IDから業務要件ID配列へのマップ
 */
export async function buildSysReqToBizReqsMapHybrid(
	systemRequirements: SystemRequirement[],
	projectId: string,
	useLinks: boolean = true
): Promise<Map<string, string[]>> {
	if (!useLinks) {
		// 配列カラムのみ使用（レガシーモード）
		return buildSysReqToBizReqsMapFromSystemReqs(systemRequirements, new Map());
	}

	// requirement_linksから取得
	const srIds = systemRequirements.map((sr) => sr.id);
	const linksMap = await buildSysReqToBizReqsMapFromLinks(srIds, projectId);

	// フォールバック: requirement_linksになければ配列カラムから
	const hybridMap = new Map<string, string[]>();
	for (const sr of systemRequirements) {
		const fromLinks = linksMap.get(sr.id);
		if (fromLinks && fromLinks.length > 0) {
			// requirement_links優先
			hybridMap.set(sr.id, fromLinks);
		} else if (sr.businessRequirementIds.length > 0) {
			// フォールバック: 配列カラム
			hybridMap.set(sr.id, sr.businessRequirementIds);
		}
	}

	return hybridMap;
}

// ========================================
// Phase 4.6: 疑義情報を含むトランスフォーマー
// ========================================

/**
 * SR IDから関連するBRリンクの疑義情報を取得するヘルパー関数
 * @param srId - システム要件ID
 * @param projectId - プロジェクトID
 * @returns BR IDから疑義情報へのマップ
 */
async function fetchBrSuspectInfo(
	srId: string,
	projectId: string
): Promise<Map<string, { suspect: boolean; suspectReason: string | null }>> {
	const { data: links, error } = await listRequirementLinksBySource("sr", srId, projectId);

	if (error || !links) {
		return new Map();
	}

	const map = new Map();
	for (const link of links) {
		if (link.targetType === "br" && link.linkType === "derived_from") {
			map.set(link.targetId, {
				suspect: link.suspect,
				suspectReason: link.suspectReason,
			});
		}
	}

	return map;
}

/**
 * 関連要件情報を構築する（疑義情報付き版）
 *
 * ## 使用例
 *
 * ```typescript
 * const relatedRequirements = await buildRelatedRequirementsWithSuspicion(
 *   sysReqs,
 *   sysReqToBizReqsMap,
 *   businessReqMap,
 *   taskBusinessMap,
 *   conceptMap,
 *   projectId
 * );
 * ```
 *
 * @param sysReqs - システム要件リスト
 * @param sysReqToBizReqsMap - システム要件ID→業務要件IDマップ
 * @param businessReqMap - 業務要件ID→業務要件マップ
 * @param taskBusinessMap - タスクID→ビジネスIDマップ
 * @param conceptMap - コンセプトID→コンセプト名マップ
 * @param projectId - プロジェクトID（requirement_linksから疑義情報を取得するために使用）
 * @returns 関連要件情報リスト（疑義情報付き）
 */
export async function buildRelatedRequirementsWithSuspicion(
	sysReqs: SystemRequirement[],
	sysReqToBizReqsMap: Map<string, string[]>,
	businessReqMap: Map<string, BusinessRequirement>,
	taskBusinessMap: Map<string, string>,
	conceptMap: Map<string, string>,
	projectId: string
): Promise<RelatedRequirementInfo[]> {
	// 各SRに対して、関連するBRの疑義情報を並列で取得
	const suspectInfoResults = await Promise.all(
		sysReqs.map(async (sysReq) => {
			const suspectInfo = await fetchBrSuspectInfo(sysReq.id, projectId);
			return { srId: sysReq.id, suspectInfo };
		})
	);

	const suspectInfoMap = new Map(
		suspectInfoResults.map(({ srId, suspectInfo }) => [srId, suspectInfo])
	);

	return sysReqs.map((sysReq) =>
		buildRelatedRequirementEntry(
			sysReq,
			businessReqMap,
			taskBusinessMap,
			conceptMap,
			sysReqToBizReqsMap.get(sysReq.id) ?? [],
			suspectInfoMap.get(sysReq.id)
		)
	);
}
