/**
 * 概念候補提案関連の型定義
 */

/**
 * 概念候補のマッチタイプ
 */
export type ConceptMatchType = 'exact' | 'similar' | 'new';

/**
 * 概念候補
 */
export interface ConceptCandidate {
  term: string;
  context: string;
  isExisting: boolean;
  existingDefinition?: string;
  suggestion?: string;

  // 類似概念関連（新規追加）
  matchType?: ConceptMatchType;
  similarConcept?: {
    id: string;
    name: string;
    definition: string;
    similarityScore: number; // 0-100
  };
}

/**
 * 概念候補のアクション
 */
export type ConceptAction = 'approve' | 'reject' | 'hold';

/**
 * 概念承認時の詳細情報
 */
export interface ConceptApproval {
  term: string;
  definition: string;
  aliases?: string[];
  category?: string;
}
