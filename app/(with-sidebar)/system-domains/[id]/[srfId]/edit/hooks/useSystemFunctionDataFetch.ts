import { useEffect } from "react";
import { useProject } from "@/components/project/project-context";
import { getSystemFunctionById } from "@/lib/data/system-functions";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import { listImplUnitSdsBySrfId } from "@/lib/data/impl-unit-sds";
import { fromSystemRequirement } from "@/lib/data/requirement-mapper";
import { classifyDesignItems, extractTargetsFromLegacyItems } from "@/lib/data/system-design-migration";
import { toYamlText } from "@/lib/utils/yaml";
import type { SystemFunction, EntryPoint, SystemDesignItem } from "@/lib/domain";
import type { Requirement } from "@/lib/domain/forms";
import type { DesignTarget, SystemDesignItemV2 } from "@/lib/domain/schemas/system-design";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";
import type { ImplUnitSdDraft } from "@/components/forms/impl-unit-sd-list";
import type { CodeRef } from "./types";

type UseSystemFunctionDataFetchInput = {
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setExistingSrf: (srf: SystemFunction | null) => void;
	setCategory: (category: SystemFunction["category"]) => void;
	setStatus: (status: SystemFunction["status"]) => void;
	setTitle: (title: string) => void;
	setSummary: (summary: string) => void;
	setDesignPolicy: (policy: string) => void;
	setDeliverables: (deliverables: Deliverable[]) => void;
	setDesignTargets: (targets: DesignTarget[]) => void;
	setDesignItemsV2: (items: SystemDesignItemV2[]) => void;
	setSystemDesign: (items: SystemDesignItem[]) => void;
	setCodeRefs: (refs: CodeRef[]) => void;
	setEntryPoints: (points: EntryPoint[]) => void;
	setImplUnitSds: (units: ImplUnitSdDraft[]) => void;
	setSystemRequirements: (requirements: Requirement[]) => void;
};

/**
 * システム機能編集フォームのデータフェッチフック
 */
export function useSystemFunctionDataFetch(
	srfId: string,
	input: UseSystemFunctionDataFetchInput
) {
	const { currentProjectId, loading: projectLoading } = useProject();

	useEffect(() => {
		if (projectLoading || !currentProjectId) {
			input.setError("プロジェクトが選択されていません");
			input.setExistingSrf(null);
			input.setLoading(false);
			return;
		}
		let active = true;

		async function fetchData(): Promise<void> {
			input.setLoading(true);
			const { data, error: fetchError } = await getSystemFunctionById(
				srfId,
				currentProjectId ?? undefined
			);

			if (!active) return;

			if (fetchError) {
				input.setError(fetchError);
				input.setExistingSrf(null);
			} else {
				input.setError(null);
				input.setExistingSrf(data ?? null);
				if (data) {
					input.setCategory(data.category);
					input.setStatus(data.status);
					input.setTitle(data.title);
					input.setSummary(data.summary);
					input.setDesignPolicy(data.designPolicy ?? "");
					input.setDeliverables(data.deliverables ?? []);

					// システム設計項目をV2とレガシーに分類
					const { v2Items, legacyItems } = classifyDesignItems(data.systemDesign ?? []);
					input.setDesignItemsV2(v2Items);
					input.setSystemDesign(legacyItems);

					// V2アイテムから対象物を抽出
					let uniqueTargets = v2Items.reduce((acc, item) => {
						const existing = acc.find((t) => t.name === item.target.name);
						if (!existing) {
							acc.push(item.target);
						}
						return acc;
					}, [] as DesignTarget[]);

					// V2アイテムがない場合はレガシーアイテムから対象物を生成
					if (uniqueTargets.length === 0 && legacyItems.length > 0) {
						uniqueTargets = extractTargetsFromLegacyItems(legacyItems);
					}

					input.setDesignTargets(uniqueTargets);
					input.setCodeRefs((data.codeRefs ?? []) as CodeRef[]);
					input.setEntryPoints(data.entryPoints ?? []);
				}
			}

			const [{ data: sysReqs, error: sysReqError }, { data: implUnits, error: implError }] =
				await Promise.all([
					listSystemRequirementsBySrfId(srfId, currentProjectId ?? undefined),
					listImplUnitSdsBySrfId(srfId, currentProjectId ?? undefined),
				]);
			if (!active) return;

			if (sysReqError) {
				console.error("システム要件読み込みエラー:", sysReqError);
			} else {
				const requirements = sysReqs ?? [];
				// ACはデータ層で正本テーブルからマージ済み
				const mapped = requirements.map((sr) => fromSystemRequirement(sr));
				input.setSystemRequirements(mapped);
			}

			if (implError) {
				console.error("実装単位SD読み込みエラー:", implError);
			} else {
				input.setImplUnitSds(
					(implUnits ?? []).map((unit) => ({
						id: unit.id,
						name: unit.name,
						type: unit.type,
						summary: unit.summary,
						entryPoints: unit.entryPoints ?? [],
						designPolicy: unit.designPolicy ?? "",
						detailsYaml: toYamlText(unit.details ?? {}),
					}))
				);
			}

			input.setLoading(false);
		}

		fetchData();
		return () => {
			active = false;
		};
	}, [srfId, currentProjectId, projectLoading]);

	return { loading: projectLoading, error: null };
}
