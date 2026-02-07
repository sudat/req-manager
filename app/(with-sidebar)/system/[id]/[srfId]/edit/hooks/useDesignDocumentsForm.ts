import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listDesignDocumentsBySrfId } from "@/lib/data/design-documents";
import { saveDesignDocuments } from "@/lib/utils/system-functions/save-system-function";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";
import { parseStructuredDetails } from "@/lib/utils/design-documents/structured-compat";
import { toYamlText } from "@/lib/utils/yaml";

export function useDesignDocumentsForm(srfId: string, systemDomainId: string, projectId: string) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// フォーム状態
	const [designDocuments, setDesignDocuments] = useState<DesignDocumentDraft[]>([]);

	// データフェッチ
	useEffect(() => {
		let cancelled = false;

		async function fetchData() {
			setLoading(true);
			setError(null);

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

			// DesignDocumentをDesignDocumentDraftに変換
			const drafts: DesignDocumentDraft[] = (ddList ?? []).map((dd) => {
				const { structuredSpec, legacyDetails, parseError } = parseStructuredDetails(dd.details);
				return {
					id: dd.id,
					name: dd.name,
					type: dd.type || "screen",
					summary: dd.summary,
					designPolicy: dd.designPolicy,
					entryPoints: dd.entryPoints ?? [],
					detailsYaml: toYamlText(legacyDetails),
					structuredSpec,
					structuredSpecParseError: parseError,
				};
			});

			setDesignDocuments(drafts);
			setLoading(false);
		}

		fetchData();

		return () => {
			cancelled = true;
		};
	}, [srfId, projectId]);

	// 保存処理
	const handleSave = async () => {
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

		// 成功時は詳細画面へ遷移
		router.push(`/system/${systemDomainId}/${srfId}`);
	};

	return {
		loading,
		saving,
		error,
		// フォーム状態
		designDocuments,
		setDesignDocuments,
		// アクション
		handleSave,
	};
}
