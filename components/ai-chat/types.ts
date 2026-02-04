/**
 * AIチャット関連の型定義
 */

/**
 * BT草案の型定義
 */
export type BtDraft = {
  code: string;
  name: string;
  summary: string;
  businessContext: string;
  processSteps: { when: string; who: string; action: string }[];
  input: { name: string; source: string }[];
  output: { name: string; source: string }[];
  business_area: string;
  project_id?: string;
  concept_ids?: string[];
};

/**
 * BR草案の型定義
 */
export type BrDraft = {
  code: string;
  requirement: string;
  rationale: string;
  business_task_id: string;
  concept_ids?: string[];
};

export type DraftCommitStatus = 'idle' | 'loading' | 'success' | 'error';

export type DraftCommitState = {
  status: DraftCommitStatus;
  message?: string;
};

/**
 * 受入基準（AC）草案の型定義
 */
export type AcDraft = {
  code: string;
  given: string;
  when: string;
  then: string;
};

/**
 * システム要件（SR）草案の型定義
 */
export type SrDraft = {
  code: string;
  type: string;
  requirement: string;
  rationale: string;
  acs: AcDraft[];
};

/**
 * システム機能（SF）草案の型定義
 */
export type SfDraft = {
  code: string;
  name: string;
  description: string;
  system_domain_id: string;
  srs: SrDraft[];
};

/**
 * チャットメッセージ
 */
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  progressSteps?: ChatProgressStep[];
  btDraft?: BtDraft;
  brDraft?: BrDraft;
  sfDraft?: SfDraft;
  srDraft?: SrDraft;
};

/**
 * 途中経過のステップ情報
 */
export type ChatProgressStep = {
  id: string;
  index: number;
  title: string;
  status: 'running' | 'done' | 'error';
  detail?: string;
};

/**
 * クイックアクション
 */
export type QuickAction = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
};

/**
 * UI位置情報（Context Provider用）
 */
export type ChatLocation = {
  projectId: string;
  screen: 'BD' | 'BT' | 'BR' | 'SD' | 'SF' | 'SR' | 'AC';
  bdId?: string;
  btId?: string;
  brId?: string;
  sdId?: string;
  sfId?: string;
  srId?: string;
};

/**
 * チャット設定
 */
export type ChatConfig = {
  threadId?: string;
  resourceId: string;
  location?: ChatLocation;
  initialPrompt?: string;
};

/** スレッド履歴サマリ */
export type ThreadSummary = {
  threadId: string;
  title: string;
  updatedAt: string; // ISO 8601
  contextKey: string;
};
