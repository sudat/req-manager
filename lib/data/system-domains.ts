import { createCrudOperations, failIfMissingConfig } from "./crud-factory";
import { supabase } from "@/lib/supabase/client";

export type SystemDomain = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SystemDomainInput = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
};

export type SystemDomainCreateInput = SystemDomainInput & {
  projectId: string;
};

type SystemDomainRow = {
  id: string;
  name: string;
  description: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

const toSystemDomain = (row: SystemDomainRow): SystemDomain => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toSystemDomainRow = (input: Partial<SystemDomainInput>) => {
  const row: Partial<SystemDomainRow> = {};
  if (input.id !== undefined) row.id = input.id;
  if (input.name !== undefined) row.name = input.name;
  if (input.description !== undefined) row.description = input.description;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  return row;
};

// CRUD操作を生成（sort_order + id でソート）
const crud = createCrudOperations<SystemDomainRow, SystemDomain, SystemDomainInput>({
  tableName: "system_domains",
  toEntity: toSystemDomain,
  toRow: toSystemDomainRow,
  orderBy: ["sort_order", "id"],
});

// CRUD操作をエクスポート
export const listSystemDomains = crud.list;
export const getSystemDomainById = crud.getById;
export const createSystemDomain = crud.create;
export const updateSystemDomain = crud.update;
export const deleteSystemDomain = crud.delete;

// 並び替え用型
export type SystemDomainSortOrderUpdate = {
	id: string;
	sortOrder: number;
};

// 並び替え一括更新
export const updateSystemDomainsSortOrder = async (
	updates: SystemDomainSortOrderUpdate[],
	projectId?: string
): Promise<{ data: boolean | null; error: string | null }> => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	// RPC関数を使わず、個別にUPDATEを実行
	const updatePromises = updates.map((update) => {
		let query = supabase
			.from("system_domains")
			.update({ sort_order: update.sortOrder, updated_at: new Date().toISOString() })
			.eq("id", update.id);

		// projectIdがある場合のみフィルタを適用
		if (projectId) {
			query = query.eq("project_id", projectId);
		}

		return query;
	});

	const results = await Promise.all(updatePromises);

	// いずれかのUPDATEでエラーがあれば最初のエラーを返す
	const firstError = results.find((r) => r.error)?.error;
	if (firstError) return { data: null, error: firstError.message };

	return { data: true, error: null };
};
