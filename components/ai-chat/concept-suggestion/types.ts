/**
 * 概念候補提案関連の型定義
 */

/**
 * 概念候補
 */
export interface ConceptCandidate {
  term: string;
  context: string;
  isExisting: boolean;
  existingDefinition?: string;
  suggestion?: string;
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
