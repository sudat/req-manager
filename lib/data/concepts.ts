import type { Concept, BusinessArea } from "@/lib/domain";
import { createCrudOperations, failIfMissingConfig } from "./crud-factory";
import { supabase } from "@/lib/supabase/client";

export type ConceptInput = {
  id: string;
  name: string;
  synonyms: string[];
  areas: BusinessArea[];
  definition: string;
  relatedDocs: string[];
  requirementCount: number;
  sortOrder: number;
};

export type ConceptCreateInput = ConceptInput & {
  projectId: string;
};

type ConceptRow = {
  id: string;
  name: string;
  synonyms: string[] | null;
  areas: string[] | null;
  definition: string | null;
  related_docs: string[] | null;
  requirement_count: number | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

const toConcept = (row: ConceptRow): Concept => ({
  id: row.id,
  name: row.name,
  synonyms: row.synonyms ?? [],
  areas: (row.areas ?? []) as BusinessArea[],
  definition: row.definition ?? "",
  relatedDocs: row.related_docs ?? [],
  requirementCount: row.requirement_count ?? 0,
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toConceptRow = (input: ConceptInput): Partial<ConceptRow> => {
  const row: Partial<ConceptRow> = {};
  if (input.id !== undefined) row.id = input.id;
  if (input.name !== undefined) row.name = input.name;
  if (input.synonyms !== undefined) row.synonyms = input.synonyms;
  if (input.areas !== undefined) row.areas = input.areas;
  if (input.definition !== undefined) row.definition = input.definition;
  if (input.relatedDocs !== undefined) row.related_docs = input.relatedDocs;
  if (input.requirementCount !== undefined) row.requirement_count = input.requirementCount;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  return row;
};

// CRUD操作を生成
const crud = createCrudOperations<ConceptRow, Concept, ConceptInput>({
  tableName: "concepts",
  toEntity: toConcept,
  toRow: toConceptRow,
  orderBy: ["sort_order", "id"],
});

// CRUD操作をエクスポート
export const listConcepts = crud.list;
export const getConceptById = crud.getById;
export const createConcept = crud.create;
export const updateConcept = crud.update;
export const deleteConcept = crud.delete;

// 並び替え用型
export type ConceptSortOrderUpdate = {
	id: string;
	sortOrder: number;
};

// 並び替え一括更新
export const updateConceptsSortOrder = async (
	updates: ConceptSortOrderUpdate[],
	projectId?: string
): Promise<{ data: boolean | null; error: string | null }> => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	// 個別にUPDATEを実行
	const updatePromises = updates.map((update) => {
		let query = supabase
			.from("concepts")
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
