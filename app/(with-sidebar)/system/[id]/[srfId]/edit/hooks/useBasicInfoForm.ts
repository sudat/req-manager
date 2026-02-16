import { useState, useEffect } from "react";
import { getSystemFunctionById } from "@/lib/data/system-functions";
import { saveBasicInfo } from "@/lib/utils/system-functions/save-system-function";
import type { SystemFunction, SrfCategory, SrfStatus } from "@/lib/domain";
import { useEditFormLifecycle } from "@/hooks/use-edit-form-lifecycle";

export function useBasicInfoForm(srfId: string, systemDomainId: string, projectId: string) {
	const { loading, saving, error, setLoading, setError, runSave } = useEditFormLifecycle(
		`/system/${systemDomainId}/${srfId}`
	);
	const [existingSrf, setExistingSrf] = useState<SystemFunction | null>(null);

	// フォーム状態
	const [category, setCategory] = useState<SrfCategory>("screen");
	const [status, setStatus] = useState<SrfStatus>("not_implemented");
	const [title, setTitle] = useState("");
	const [summary, setSummary] = useState("");
	const [designPolicy, setDesignPolicy] = useState("");

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
			setCategory(srf.category);
			setStatus(srf.status);
			setTitle(srf.title);
			setSummary(srf.summary);
			setDesignPolicy(srf.designPolicy);
			setLoading(false);
		}

		fetchData();

		return () => {
			cancelled = true;
		};
	}, [srfId, projectId, setError, setLoading]);

	// 保存処理
	const handleSave = async (onSuccess?: () => void) => {
		await runSave(
			async () => {
				if (!existingSrf) return "システム機能が見つかりません";

				const { error: saveError } = await saveBasicInfo({
					srfId,
					existingSrf,
					systemDomainId,
					category,
					status,
					title,
					summary,
					designPolicy,
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
		category,
		setCategory,
		status,
		setStatus,
		title,
		setTitle,
		summary,
		setSummary,
		designPolicy,
		setDesignPolicy,
		// アクション
		handleSave,
	};
}
