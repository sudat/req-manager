import { useState, useEffect, useCallback } from "react";
import { getSystemFunctionById } from "@/lib/data/system-functions";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import { fromSystemRequirement } from "@/lib/data/requirement-mapper";
import { saveSystemRequirements } from "@/lib/utils/system-functions/save-system-function";
import { getSrIdSpecForSystemFunction } from "@/lib/utils/id-rules";
import { nextSequentialId } from "@/lib/utils/requirement-id";
import type { SystemFunction } from "@/lib/domain";
import type { Requirement } from "@/lib/domain/forms";
import { useEditFormLifecycle } from "@/hooks/use-edit-form-lifecycle";

export function useSystemRequirementsForm(
	srfId: string,
	systemDomainId: string,
	projectId: string
) {
	const { loading, saving, error, setLoading, setError, runSave } = useEditFormLifecycle(
		`/system/${systemDomainId}/${srfId}`
	);
	const [existingSrf, setExistingSrf] = useState<SystemFunction | null>(null);

	// フォーム状態
	const [systemRequirements, setSystemRequirements] = useState<Requirement[]>([]);

	// データフェッチ
	useEffect(() => {
		let cancelled = false;

		async function fetchData() {
			setLoading(true);
			setError(null);

			const { data: srf, error: srfError } = await getSystemFunctionById(srfId, projectId);

			if (cancelled) return;

			if (srfError || !srf) {
				setError(srfError || "システム機能が見つかりません");
				setLoading(false);
				return;
			}

			setExistingSrf(srf);

			// システム要件を取得
			const { data: srList, error: srError } = await listSystemRequirementsBySrfId(
				srfId,
				projectId
			);

			if (cancelled) return;

			if (srError) {
				setError(srError);
				setLoading(false);
				return;
			}

			setSystemRequirements((srList ?? []).map((sr) => fromSystemRequirement(sr)));
			setLoading(false);
		}

		fetchData();

		return () => {
			cancelled = true;
		};
	}, [srfId, projectId, setError, setLoading]);

	// システム要件を追加
	const addSystemRequirement = useCallback((): void => {
		const existingIds = systemRequirements.map((req) => req.id);
		const spec = getSrIdSpecForSystemFunction(systemDomainId, srfId, existingIds);
		const prefix = spec.prefix.endsWith("-") ? spec.prefix.slice(0, -1) : spec.prefix;
		const newId = nextSequentialId(prefix, existingIds, spec.padLength);
		const existingTaskId = systemRequirements[0]?.taskId ?? "";

		setSystemRequirements((prev) => [
			...prev,
			{
				id: newId,
				type: "システム要件",
				title: "",
				summary: "",
				goal: "",
				constraints: "",
				owner: "",
				conceptIds: [],
				srfIds: [srfId],
				systemDomainIds: [],
				acceptanceCriteria: [],
				acceptanceCriteriaJson: [],
				category: "function",
				businessRequirementIds: [],
				relatedSystemRequirementIds: [],
				taskId: existingTaskId,
			},
		]);
	}, [srfId, systemDomainId, systemRequirements]);

	// システム要件を更新
	const updateSystemRequirement = useCallback((reqId: string, patch: Partial<Requirement>): void => {
		setSystemRequirements((prev) =>
			prev.map((req) => (req.id === reqId ? { ...req, ...patch } : req))
		);
	}, []);

	// システム要件を削除
	const removeSystemRequirement = useCallback((reqId: string): void => {
		setSystemRequirements((prev) => prev.filter((req) => req.id !== reqId));
	}, []);

	// 保存処理
	const handleSave = async (onSuccess?: () => void) => {
		await runSave(
			async () => {
				if (!existingSrf) return "システム機能が見つかりません";

				const { error: saveError } = await saveSystemRequirements({
					srfId,
					existingSrf,
					systemDomainId,
					systemRequirements,
					projectId,
				});

				return saveError;
			},
			{ onSuccess }
		);
	};

	return {
		loading,
		saving,
		error,
		existingSrf,
		// フォーム状態
		systemRequirements,
		setSystemRequirements,
		// アクション
		addSystemRequirement,
		updateSystemRequirement,
		removeSystemRequirement,
		handleSave,
	};
}
