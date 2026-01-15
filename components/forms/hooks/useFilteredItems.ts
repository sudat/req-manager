"use client";

import { useMemo } from "react";
import type { SelectableItem } from "@/lib/domain/forms";

/**
 * アイテムリストのフィルタリングを行うフック
 * @param items アイテムリスト
 * @param searchQuery 検索クエリ
 * @returns フィルタリング後のアイテムリスト
 */
export function useFilteredItems(
	items: SelectableItem[],
	searchQuery: string
): SelectableItem[] {
	const normalizedSearch = searchQuery.trim().toLowerCase();
	return useMemo(() => {
		if (!normalizedSearch) return items;
		return items.filter((item) =>
			`${item.id} ${item.name}`.toLowerCase().includes(normalizedSearch)
		);
	}, [items, normalizedSearch]);
}
