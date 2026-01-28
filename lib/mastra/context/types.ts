/**
 * コンテキスト注入機能の型定義
 */

/**
 * UI位置情報
 */
export interface UILocation {
  type: 'bd' | 'bt' | 'br' | 'sd' | 'sf' | 'sr' | 'cr' | 'project';
  id: string;
  name: string;
  breadcrumb: string[];
  projectId: string;
}

/**
 * Agentに注入するコンテキスト
 */
export interface AgentContext {
  product_requirement: ProductRequirement | null;
  current_location: UILocation;
  related_requirements: RelatedRequirements;
  concept_dictionary: ConceptDictionary[];
  recent_drafts: Draft[];
}

/**
 * プロダクト要件（簡易版）
 */
export interface ProductRequirement {
  id: string;
  name: string;
  tech_stack_profile: string;
  coding_conventions: string;
  quality_goals: string;
}

/**
 * 関連要件
 */
export interface RelatedRequirements {
  business_domains?: any[];
  business_tasks?: any[];
  business_requirements?: any[];
  system_domains?: any[];
  system_functions?: any[];
  system_requirements?: any[];
}

/**
 * 概念辞書
 */
export interface ConceptDictionary {
  id: string;
  term: string;
  definition: string;
  aliases?: string[];
}

/**
 * 草案
 */
export interface Draft {
  id: string;
  type: string;
  status: 'draft' | 'committed' | 'discarded';
  content: any;
  created_at: string;
}
