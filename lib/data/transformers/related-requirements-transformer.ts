import type { RelatedRequirementInfo } from "@/lib/domain/value-objects";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";
import { listBrIdsBySrId, listRequirementLinksBySource } from "@/lib/data/requirement-links";
import type { RequirementLink } from "@/lib/domain";

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
 * 関連要件情報を構築する
 * @param sysReqs - システム要件リスト
 * @param sysReqToBizReqsMap - システム要件ID→業務要件IDマップ
 * @param businessReqMap - 業務要件ID→業務要件マップ
 * @param taskBusinessMap - タスクID→ビジネスIDマップ
 * @param conceptMap - コンセプトID→コンセプト名マップ
 * @returns 関連要件情報リスト
 */
export function buildRelatedRequirements(
	sysReqs: SystemRequirement[],
	sysReqToBizReqsMap: Map<string, string[]>,
	businessReqMap: Map<string, BusinessRequirement>,
	taskBusinessMap: Map<string, string>,
	conceptMap: Map<string, string>,
): RelatedRequirementInfo[] {
	const result: RelatedRequirementInfo[] = [];

	for (const sysReq of sysReqs) {
		const systemReqConcepts = sysReq.conceptIds.map((id) => ({
			id,
			name: conceptMap.get(id) ?? id,
		}));

		const relatedBizReqIds = sysReqToBizReqsMap.get(sysReq.id) ?? [];

		// 関連業務要件をまとめて取得
		const relatedBusinessReqs = relatedBizReqIds
			.map((id) => businessReqMap.get(id))
			.filter((req): req is BusinessRequirement => req !== undefined);

		// 関連業務要件がない場合、1つだけ表示
		if (relatedBusinessReqs.length === 0) {
			result.push({
				systemReqId: sysReq.id,
				systemReqTitle: sysReq.title,
				systemReqSummary: sysReq.summary,
				systemReqConcepts,
				systemReqImpacts: sysReq.impacts,
				systemReqAcceptanceCriteria: sysReq.acceptanceCriteria,
				systemReqAcceptanceCriteriaJson: sysReq.acceptanceCriteriaJson,
				businessReqId: "",
				businessReqTitle: "",
				businessId: taskBusinessMap.get(sysReq.taskId) ?? "",
				taskId: sysReq.taskId,
				relatedBusinessReqs: [],
			});
			continue;
		}

		// 1つのシステム要件に対して、関連するすべての業務要件の情報を含める
		// メインの業務要件（最初のもの）を表示用に使用
		const mainBizReq = relatedBusinessReqs[0];
		const mainBusinessId = taskBusinessMap.get(mainBizReq.taskId) ?? "";

		result.push({
			systemReqId: sysReq.id,
			systemReqTitle: sysReq.title,
			systemReqSummary: sysReq.summary,
			systemReqConcepts,
			systemReqImpacts: sysReq.impacts,
			systemReqAcceptanceCriteria: sysReq.acceptanceCriteria,
			systemReqAcceptanceCriteriaJson: sysReq.acceptanceCriteriaJson,
			businessReqId: mainBizReq.id,
			businessReqTitle: mainBizReq.title,
			businessId: mainBusinessId,
			taskId: mainBizReq.taskId,
			// 関連業務要件のリスト（UI側で使用可能）
			relatedBusinessReqs: relatedBusinessReqs.map((req) => ({
				id: req.id,
				title: req.title,
				taskId: req.taskId,
				businessId: taskBusinessMap.get(req.taskId) ?? "",
			})),
		});
	}

	return result;
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

	// 各SR IDに対して並列でBR IDsを取得
	const promises = systemRequirementIds.map(async (srId) => {
		const brIds = await listBrIdsBySrId(srId, projectId);
		return { srId, brIds };
	});

	const results = await Promise.all(promises);

	for (const { srId, brIds } of results) {
		if (brIds.length > 0) {
			map.set(srId, brIds);
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
	const result: RelatedRequirementInfo[] = [];

	// 各SRに対して、関連するBRの疑義情報を並列で取得
	const suspectInfoPromises = sysReqs.map(async (sysReq) => {
		const suspectInfo = await fetchBrSuspectInfo(sysReq.id, projectId);
		return { srId: sysReq.id, suspectInfo };
	});

	const suspectInfoResults = await Promise.all(suspectInfoPromises);

	// SR IDから疑義情報マップへのマップを作成
	const suspectInfoMap = new Map<
		string,
		Map<string, { suspect: boolean; suspectReason: string | null }>
	>();
	for (const { srId, suspectInfo } of suspectInfoResults) {
		suspectInfoMap.set(srId, suspectInfo);
	}

	for (const sysReq of sysReqs) {
		const systemReqConcepts = sysReq.conceptIds.map((id) => ({
			id,
			name: conceptMap.get(id) ?? id,
		}));

		const relatedBizReqIds = sysReqToBizReqsMap.get(sysReq.id) ?? [];
		const suspectInfo = suspectInfoMap.get(sysReq.id) ?? new Map();

		// 関連業務要件をまとめて取得
		const relatedBusinessReqs = relatedBizReqIds
			.map((id) => businessReqMap.get(id))
			.filter((req): req is BusinessRequirement => req !== undefined);

		// 関連業務要件がない場合、1つだけ表示
		if (relatedBusinessReqs.length === 0) {
			result.push({
				systemReqId: sysReq.id,
				systemReqTitle: sysReq.title,
				systemReqSummary: sysReq.summary,
				systemReqConcepts,
				systemReqImpacts: sysReq.impacts,
				systemReqAcceptanceCriteria: sysReq.acceptanceCriteria,
				systemReqAcceptanceCriteriaJson: sysReq.acceptanceCriteriaJson,
				businessReqId: "",
				businessReqTitle: "",
				businessId: taskBusinessMap.get(sysReq.taskId) ?? "",
				taskId: sysReq.taskId,
				relatedBusinessReqs: [],
			});
			continue;
		}

		// 1つのシステム要件に対して、関連するすべての業務要件の情報を含める
		const mainBizReq = relatedBusinessReqs[0];
		const mainBusinessId = taskBusinessMap.get(mainBizReq.taskId) ?? "";

		result.push({
			systemReqId: sysReq.id,
			systemReqTitle: sysReq.title,
			systemReqSummary: sysReq.summary,
			systemReqConcepts,
			systemReqImpacts: sysReq.impacts,
			systemReqAcceptanceCriteria: sysReq.acceptanceCriteria,
			systemReqAcceptanceCriteriaJson: sysReq.acceptanceCriteriaJson,
			businessReqId: mainBizReq.id,
			businessReqTitle: mainBizReq.title,
			businessId: mainBusinessId,
			taskId: mainBizReq.taskId,
			// 関連業務要件のリスト（疑義情報付き）
			relatedBusinessReqs: relatedBusinessReqs.map((req) => {
				const info = suspectInfo.get(req.id);
				return {
					id: req.id,
					title: req.title,
					taskId: req.taskId,
					businessId: taskBusinessMap.get(req.taskId) ?? "",
					suspect: info?.suspect,
					suspectReason: info?.suspectReason,
				};
			}),
		});
	}

	return result;
}
