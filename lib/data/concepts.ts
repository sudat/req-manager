import type { Concept, BusinessArea } from "@/lib/domain";
import { createCrudOperations } from "./crud-factory";

export type ConceptInput = {
  id: string;
  name: string;
  synonyms: string[];
  areas: BusinessArea[];
  definition: string;
  relatedDocs: string[];
  requirementCount: number;
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
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toConceptRow = (input: Partial<ConceptInput>) => {
  const row: Partial<ConceptRow> = {};
  if (input.id !== undefined) row.id = input.id;
  if (input.name !== undefined) row.name = input.name;
  if (input.synonyms !== undefined) row.synonyms = input.synonyms;
  if (input.areas !== undefined) row.areas = input.areas;
  if (input.definition !== undefined) row.definition = input.definition;
  if (input.relatedDocs !== undefined) row.related_docs = input.relatedDocs;
  if (input.requirementCount !== undefined) row.requirement_count = input.requirementCount;
  return row;
};

// CRUD操作を生成
const crud = createCrudOperations<ConceptRow, Concept, ConceptInput>({
  tableName: "concepts",
  toEntity: toConcept,
  toRow: toConceptRow,
});

// CRUD操作をエクスポート
export const listConcepts = crud.list;
export const getConceptById = crud.getById;
export const createConcept = crud.create;
export const updateConcept = crud.update;
export const deleteConcept = crud.delete;
