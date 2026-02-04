import { useState, useMemo } from "react";
import { updateRequirementLink } from "@/lib/data/requirement-links";
import type { RequirementLink } from "@/lib/domain";
import { useSetSelection } from "./use-set-selection";

export function useLinkBatchOperations(
	links: RequirementLink[],
	setLinks: React.Dispatch<React.SetStateAction<RequirementLink[]>>,
	currentProjectId: string | null
) {
	const [confirmingId, setConfirmingId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [isBatchConfirming, setIsBatchConfirming] = useState(false);

	// 疑義リンクのみを対象とする
	const suspectLinks = useMemo(() => links.filter((link) => link.suspect), [links]);
	const { selectedIds, toggleSelect: handleToggleSelect, toggleSelectAll: handleToggleSelectAll, clearSelection } = useSetSelection(suspectLinks, (link) => link.id);

	// 疑義リンクを確認するハンドラー
	const handleConfirmLink = async (linkId: string) => {
		setConfirmingId(linkId);
		setActionError(null);

		const { data, error } = await updateRequirementLink(
			linkId,
			{ suspect: false },
			currentProjectId ?? undefined
		);

		if (error) {
			setActionError(`リンクの確認に失敗しました: ${error}`);
		} else if (data) {
			// ローカルstateを更新（再fetchを回避）
			setLinks((prev) => prev.map((link) => (link.id === linkId ? data : link)));
		}

		setConfirmingId(null);
	};

	// 一括確認ハンドラー
	const handleBatchConfirm = async () => {
		if (selectedIds.size === 0) return;

		setIsBatchConfirming(true);
		setActionError(null);

		const idsToUpdate = Array.from(selectedIds);
		let successCount = 0;
		let firstError: string | null = null;

		for (const linkId of idsToUpdate) {
			const { error } = await updateRequirementLink(
				linkId,
				{ suspect: false },
				currentProjectId ?? undefined
			);

			if (error) {
				if (!firstError) firstError = error;
			} else {
				successCount++;
				// ローカルstateを更新
				setLinks((prev) =>
					prev.map((link) =>
						link.id === linkId ? { ...link, suspect: false, updatedAt: new Date().toISOString() } : link
					)
				);
			}
		}

		if (firstError) {
			setActionError(`一括確認で一部エラーが発生しました: ${firstError}（成功: ${successCount}/${idsToUpdate.length}）`);
		}

		clearSelection();
		setIsBatchConfirming(false);
	};

	return {
		confirmingId,
		actionError,
		setActionError,
		selectedIds,
		isBatchConfirming,
		handleConfirmLink,
		handleToggleSelect,
		handleToggleSelectAll,
		handleBatchConfirm,
	};
}
