import { useMemo, useState } from "react";

/**
 * リストフィルタの設定
 */
export type ListFilterConfig<T> = {
  /** フィルタ対象のアイテムリスト */
  items: T[];

  /** 検索対象フィールドを返す関数 */
  searchFields: (item: T) => string[];

  /** ステータスフィールド名（オプション） */
  statusField?: keyof T;
};

/**
 * リストフィルタの返り値
 */
export type ListFilterReturn<T> = {
  /** 検索クエリ */
  searchQuery: string;

  /** ステータスフィルタ */
  statusFilter: string;

  /** フィルタ済みアイテムリスト */
  filteredItems: T[];

  /** 検索クエリ更新関数 */
  setSearchQuery: (query: string) => void;

  /** ステータスフィルタ更新関数 */
  setStatusFilter: (filter: string) => void;
};

/**
 * 汎用リストフィルタフック
 *
 * テキスト検索とステータスフィルタの共通ロジックを提供
 *
 * @example
 * ```ts
 * const {
 *   searchQuery,
 *   statusFilter,
 *   filteredItems,
 *   setSearchQuery,
 *   setStatusFilter,
 * } = useListFilter({
 *   items: changeRequests,
 *   searchFields: (cr) => [cr.title, cr.ticketId],
 *   statusField: 'status',
 * });
 * ```
 */
export function useListFilter<T>(config: ListFilterConfig<T>): ListFilterReturn<T> {
  const { items, searchFields, statusField } = config;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      // 検索フィルタ
      const matchSearch = normalizedQuery
        ? searchFields(item)
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : true;

      // ステータスフィルタ（statusFieldが指定されている場合のみ）
      const matchStatus =
        statusField && statusFilter !== "all"
          ? item[statusField] === statusFilter
          : true;

      return matchSearch && matchStatus;
    });
  }, [items, searchQuery, statusFilter, searchFields, statusField]);

  return {
    searchQuery,
    statusFilter,
    filteredItems,
    setSearchQuery,
    setStatusFilter,
  };
}
