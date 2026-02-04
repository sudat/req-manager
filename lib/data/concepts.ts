import type { Concept, BusinessArea } from "@/lib/domain";
import type { OpenAIModel } from "@/lib/mastra/utils/llm-helpers";
import { createCrudOperations, createSortOrderUpdater } from "./crud-factory";

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

export const updateConceptsSortOrder = createSortOrderUpdater("concepts");

/**
 * 既存概念の検索用マップを取得
 * 用語名と同義語の小文字をキーとしたMapを返す
 *
 * @param projectId - プロジェクトID
 * @returns 用語名・同義語（小文字）をキーとした概念情報のMap
 */
export async function getConceptsLookupMap(
  projectId: string
): Promise<Map<string, { id: string; name: string; definition: string }>> {
  const supabase = (await import('@/lib/supabase/client')).supabase;
  const { data: concepts } = await supabase
    .from('concepts')
    .select('id, name, definition, synonyms')
    .eq('project_id', projectId);

  const conceptMap = new Map<string, { id: string; name: string; definition: string }>();

  // 用語名を小文字でマップに追加
  concepts?.forEach((c) => {
    if (c.name) {
      conceptMap.set(c.name.toLowerCase(), {
        id: c.id,
        name: c.name,
        definition: c.definition || '',
      });
    }

    // 同義語もマップに追加
    c.synonyms?.forEach((synonym: string) => {
      if (synonym) {
        conceptMap.set(synonym.toLowerCase(), {
          id: c.id,
          name: c.name,
          definition: c.definition || '',
        });
      }
    });
  });

  return conceptMap;
}

/**
 * LLMを使って類似概念を検索
 *
 * 文字列の完全一致がない場合、意味的な類似度をLLMで判定して類似概念を提案する。
 * 90%以上の類似度の概念は候補から除外し（別概念の可能性が低いため）、
 * 70%-89%の類似度の概念のみを返す。
 *
 * @param term - 検索対象の用語
 * @param existingConcepts - 既存概念のリスト
 * @param minThreshold - 提示する類似度の下限（デフォルト70%）
 * @param maxThreshold - 除外する類似度の上限（デフォルト90%）
 * @returns 類似した概念の配列（類似度降順）
 */
type ConceptSimilarityOptions = {
  provider?: 'openai' | 'zai';
  model?: OpenAIModel;
  temperature?: number;
  baseUrl?: string;
  verbosity?: 'low' | 'medium' | 'high';
};

export async function findSimilarConcepts(
  term: string,
  existingConcepts: Array<{ id: string; name: string; definition: string }>,
  minThreshold = 0.7,
  maxThreshold = 0.9,
  options: ConceptSimilarityOptions = {}
): Promise<Array<{ id: string; name: string; definition: string; similarityScore: number }>> {
  if (existingConcepts.length === 0) {
    return [];
  }

  const { callOpenAI } = await import('@/lib/mastra/utils/llm-helpers');

  const conceptsList = existingConcepts
    .map(c => `- ${c.name}: ${c.definition}`)
    .join('\n');

  const llmPrompt = `
以下の用語に類似した既存概念を選び、類似度スコア（0-100）をつけてください。

【対象用語】${term}

【既存概念】
${conceptsList}

【出力形式（JSON）】
[
  {
    "id": "概念ID",
    "name": "概念名",
    "similarityScore": 85
  }
]

【判定基準】
- 類似度スコア: 0-100で、意味的にどれくらい似ているか
- ${maxThreshold * 100}点以上の概念は出力しないでください（除外対象）
- ${minThreshold * 100}点未満の概念は出力しないでください（類似度不足）
- 用語が完全に異なる場合は空配列を返してください
`;

  const llmResponse = await callOpenAI<{
    similarConcepts?: Array<{ id: string; name: string; similarityScore: number }>;
  }>({
    systemPrompt: 'あなたは概念の意味的類似度を判定する専門家です。',
    userPrompt: llmPrompt,
    jsonMode: true,
    provider: options.provider,
    model: options.model,
    temperature: options.temperature,
    baseUrl: options.baseUrl,
    verbosity: options.verbosity,
    maxTokens: 600,
  });

  const results = (llmResponse.content.similarConcepts || [])
    .filter(c => c.similarityScore >= minThreshold * 100 && c.similarityScore < maxThreshold * 100)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .map(c => {
      const originalConcept = existingConcepts.find(ec => ec.id === c.id);
      return {
        id: c.id,
        name: c.name,
        definition: originalConcept?.definition || '',
        similarityScore: c.similarityScore,
      };
    });

  return results;
}
