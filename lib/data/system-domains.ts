import { createCrudOperations, createSortOrderUpdater } from "./crud-factory";

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

export const updateSystemDomainsSortOrder = createSortOrderUpdater("system_domains");
