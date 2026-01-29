import { useState } from "react";
import { updateRequirementLink } from "@/lib/data/requirement-links";
import type { RequirementLink } from "@/lib/domain";

export function useLinkBatchOperations(
	links: RequirementLink[],
	setLinks: React.Dispatch<React.SetStateAction<RequirementLink[]>>,
	currentProjectId: string | null
) {
	const [confirmingId, setConfirmingId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isBatchConfirming, setIsBatchConfirming] = useState(false);

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

	// 選択状態をトグルするハンドラー
	const handleToggleSelect = (linkId: string) => {
		setSelectedIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(linkId)) {
				newSet.delete(linkId);
			} else {
				newSet.add(linkId);
			}
			return newSet;
		});
	};

	// 全選択/全解除ハンドラー
	const handleToggleSelectAll = () => {
		const suspectLinks = links.filter((link) => link.suspect);
		if (selectedIds.size === suspectLinks.length) {
			// 全選択されている場合は全解除
			setSelectedIds(new Set());
		} else {
			// 全選択
			setSelectedIds(new Set(suspectLinks.map((link) => link.id)));
		}
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

		setSelectedIds(new Set());
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
