import { useEffect } from "react";
import { useProject } from "@/components/project/project-context";
import { getSystemFunctionById } from "@/lib/data/system-functions";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import { listDesignDocumentsBySrfId, listDesignDocuments } from "@/lib/data/design-documents";
import { listDdDependenciesBySourceIds, listDdCallersByTargetIds } from "@/lib/data/requirement-links";
import { fromSystemRequirement } from "@/lib/data/requirement-mapper";
import { classifyDesignItems, extractTargetsFromLegacyItems } from "@/lib/data/system-design-migration";
import { parseStructuredDetails } from "@/lib/utils/design-documents/structured-compat";
import type { SystemFunction, EntryPoint, SystemDesignItem } from "@/lib/domain";
import type { Requirement } from "@/lib/domain/forms";
import type { DesignTarget, SystemDesignItemV2 } from "@/lib/domain/schemas/system-design";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";
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
	setDesignTargets: (targets: DesignTarget[]) => void;
	setDesignItemsV2: (items: SystemDesignItemV2[]) => void;
	setSystemDesign: (items: SystemDesignItem[]) => void;
	setCodeRefs: (refs: CodeRef[]) => void;
	setEntryPoints: (points: EntryPoint[]) => void;
	setDesignDocuments: (units: DesignDocumentDraft[]) => void;
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
				currentProjectId
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

			const [
				{ data: sysReqs, error: sysReqError },
				{ data: ddUnits, error: implError },
				{ data: allDds, error: allDdsError },
			] =
				await Promise.all([
					listSystemRequirementsBySrfId(srfId, currentProjectId),
					listDesignDocumentsBySrfId(srfId, currentProjectId),
					listDesignDocuments(currentProjectId),
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
				console.error("DD読み込みエラー:", implError);
			} else {
				const ddIds = (ddUnits ?? []).map((unit) => unit.id);
				const dependencyMap = new Map<string, DesignDocumentDraft["dependencies"]>();
				const callerMap = new Map<string, DesignDocumentDraft["callers"]>();
				const callerDdToSfIdMap = new Map<string, string>(
					(allDds ?? []).map((dd) => [dd.id, dd.srfId])
				);

				if (allDdsError) {
					console.error("全DD読み込みエラー:", allDdsError);
				}
				if (ddIds.length > 0) {
					const { data: dependencies, error: dependencyError } =
						await listDdDependenciesBySourceIds(ddIds, currentProjectId);
					if (!active) return;
					if (dependencyError) {
						console.error("DD依存リンク読み込みエラー:", dependencyError);
					} else {
						const ddIdSet = new Set(ddIds);
						for (const dependency of dependencies ?? []) {
							if (!ddIdSet.has(dependency.targetDdId)) continue;
							const current = dependencyMap.get(dependency.sourceDdId) ?? [];
							current.push({
								targetDdId: dependency.targetDdId,
								callType: dependency.callType,
								callId: dependency.callId,
								message: dependency.message,
								returnsLabel: dependency.returnsLabel,
								returnSchemaRef: dependency.returnSchemaRef,
								errorLabel: dependency.errorLabel,
								errorSchemaRef: dependency.errorSchemaRef,
								errorExceptionRef: dependency.errorExceptionRef,
								ruleRef: dependency.ruleRef,
								asyncCompletion: dependency.asyncCompletion,
							});
							dependencyMap.set(dependency.sourceDdId, current);
						}
					}

					const { data: callers, error: callerError } =
						await listDdCallersByTargetIds(ddIds, currentProjectId);
					if (!active) return;
					if (callerError) {
						console.error("DD呼び出し元リンク読み込みエラー:", callerError);
					} else {
						for (const caller of callers ?? []) {
							const current = callerMap.get(caller.targetDdId) ?? [];
							current.push({
								callerType: caller.callerType,
								callerDdId: caller.callerDdId,
								callType: caller.callType,
								callerSfId:
									caller.callerType === "system" && caller.callerDdId
										? callerDdToSfIdMap.get(caller.callerDdId) ?? ""
										: undefined,
							});
							callerMap.set(caller.targetDdId, current);
						}
					}
				}

				input.setDesignDocuments(
					(ddUnits ?? []).map((unit) => {
						const { structuredSpec, parseError } = parseStructuredDetails(
							unit.details
						);
						return {
							id: unit.id,
							name: unit.name,
							type: unit.type,
							summary: unit.summary,
							entryPoints: unit.entryPoints ?? [],
							designPolicy: unit.designPolicy ?? "",
							dependencies: dependencyMap.get(unit.id) ?? [],
							structuredSpec,
							structuredSpecParseError: parseError,
							callers: callerMap.get(unit.id) ?? [],
						};
					})
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
