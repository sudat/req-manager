import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listDesignDocumentsBySrfId, listDesignDocuments } from "@/lib/data/design-documents";
import { listDdDependenciesBySourceIds, listDdCallersByTargetIds } from "@/lib/data/requirement-links";
import { supabase } from "@/lib/supabase/client";
import { saveDesignDocuments } from "@/lib/utils/system-functions/save-system-function";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";
import {
	parseStructuredDetails,
	syncStructuredSpecToDdType,
} from "@/lib/utils/design-documents/structured-compat";

export function useDesignDocumentsForm(srfId: string, systemDomainId: string, projectId: string) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// フォーム状態
	const [designDocuments, setDesignDocuments] = useState<DesignDocumentDraft[]>([]);
	const [allModelDDs, setAllModelDDs] = useState<DesignDocumentDraft[]>([]);
	const [allDDs, setAllDDs] = useState<DesignDocumentDraft[]>([]);
	const [allSFs, setAllSFs] = useState<{ id: string; title: string; domainName?: string }[]>([]);

	// データフェッチ
	useEffect(() => {
		let cancelled = false;

		async function fetchData() {
			setLoading(true);
			setError(null);

			// 現在のシステム機能の設計書を取得
			const { data: ddList, error: ddError } = await listDesignDocumentsBySrfId(
				srfId,
				projectId
			);

			if (cancelled) return;

				if (ddError) {
					setError(ddError);
					setLoading(false);
					return;
				}

				const ddIds = (ddList ?? []).map((dd) => dd.id);
				const dependencyMap = new Map<DesignDocumentDraft["id"], DesignDocumentDraft["dependencies"]>();
				const callerMap = new Map<DesignDocumentDraft["id"], DesignDocumentDraft["callers"]>();

				if (ddIds.length > 0) {
					// 依存（発信方向）を取得
					const { data: dependencies, error: dependencyError } =
						await listDdDependenciesBySourceIds(ddIds, projectId);

					if (cancelled) return;

					if (dependencyError) {
						setError(dependencyError);
						setLoading(false);
						return;
					}

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

					// 呼び出し元（受信方向）を取得
					const { data: callers, error: callerError } =
						await listDdCallersByTargetIds(ddIds, projectId);

					if (cancelled) return;

					if (callerError) {
						setError(callerError);
						setLoading(false);
						return;
					}

					for (const caller of callers ?? []) {
						const current = callerMap.get(caller.targetDdId) ?? [];
						current.push({
							callerType: caller.callerType,
							callerDdId: caller.callerDdId,
							callType: caller.callType,
							// callerSfId はDBに保存されていないため、callerDdIdから推測する必要がある
							// 現状は空文字列にしておき、Phase 2.5 で改善する
							callerSfId: "",
						});
						callerMap.set(caller.targetDdId, current);
					}
				}

			// DesignDocumentをDesignDocumentDraftに変換
			let drafts: DesignDocumentDraft[] = (ddList ?? []).map((dd) => {
					const { structuredSpec, parseError } = parseStructuredDetails(dd.details);
					return {
					id: dd.id,
					name: dd.name,
					type: dd.type || "screen",
						summary: dd.summary,
						designPolicy: dd.designPolicy,
						entryPoints: dd.entryPoints ?? [],
						dependencies: dependencyMap.get(dd.id) ?? [],
						callers: callerMap.get(dd.id) ?? [],
						structuredSpec: structuredSpec
							? syncStructuredSpecToDdType(structuredSpec, dd.type || "screen")
							: undefined,
						structuredSpecParseError: parseError,
					};
			});

			// プロジェクト全体のモデル型設計書を取得（関連設定用）
			const { data: allDDs, error: allError } = await listDesignDocuments(projectId);

			if (cancelled) return;

			if (!allError && allDDs) {
				const ddToSfIdMap = new Map(allDDs.map((dd) => [dd.id, dd.srfId]));
				drafts = drafts.map((draft) => ({
					...draft,
					callers: (draft.callers ?? []).map((caller) =>
						caller.callerType === "system" && caller.callerDdId
							? { ...caller, callerSfId: ddToSfIdMap.get(caller.callerDdId) ?? "" }
							: caller
					),
				}));

				const allDrafts: DesignDocumentDraft[] = allDDs.map((dd) => {
					const { structuredSpec, parseError } = parseStructuredDetails(dd.details);
					return {
						id: dd.id,
						name: dd.name,
						type: dd.type || "screen",
						summary: dd.summary,
						designPolicy: dd.designPolicy,
						entryPoints: dd.entryPoints ?? [],
						dependencies: [],
						callers: [],
						structuredSpec: structuredSpec
							? syncStructuredSpecToDdType(structuredSpec, dd.type || "screen")
							: undefined,
						structuredSpecParseError: parseError,
					};
				});

				setAllDDs(allDrafts);

				const modelDrafts = allDrafts.filter((dd) => dd.type === "model");
				setAllModelDDs(modelDrafts);
			}

			setDesignDocuments(drafts);

			// プロジェクト全体のシステム機能を取得（呼び出し元SF選択用）
			// システム領域をJOINしてdomainNameを取得
			const { data: systemFunctions, error: sfError } = await supabase
				.from("system_functions")
				.select(`
					id,
					title,
					system_domain_id,
					system_domains!inner(name, sort_order)
				`)
				.eq("project_id", projectId)
				.order("sort_order", { foreignTable: "system_domains", ascending: true })
				.order("id", { ascending: true });

			if (cancelled) return;

			if (!sfError && systemFunctions) {
				setAllSFs(systemFunctions.map((sf: any) => ({
					id: sf.id,
					title: sf.title,
					domainName: sf.system_domains?.name || "その他"
				})));
			}

			setLoading(false);
		}

		fetchData();

		return () => {
			cancelled = true;
		};
	}, [srfId, projectId]);

	// 保存処理
	const handleSave = async (onSuccess?: () => void) => {
		setSaving(true);
		setError(null);

		const { error: saveError } = await saveDesignDocuments({
			srfId,
			designDocuments,
			projectId,
		});

		if (saveError) {
			setError(saveError);
			setSaving(false);
			return;
		}

		// 成功時コールバック
		onSuccess?.();

		// 詳細画面へ遷移
		router.push(`/system/${systemDomainId}/${srfId}`);
	};

	return {
		loading,
		saving,
		error,
		// フォーム状態
		designDocuments,
		setDesignDocuments,
		allModelDDs,
		allDDs,
		allSFs,
		// アクション
		handleSave,
	};
}
