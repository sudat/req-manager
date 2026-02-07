import type { EntryPoint, DdType } from "@/lib/domain";

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
  isCommitted?: boolean;
};

/**
 * BR草案の型定義
 */
export type BrDraft = {
  code: string;
  requirement: string;
  rationale: string;
  business_task_id: string | null;
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
  title?: string;
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
  businessRequirementIds?: string[];
  title?: string;
  summary?: string;
  task_id?: string;
  project_id?: string;
  srf_ids?: string[];
  system_domain_ids?: string[];
  concept_ids?: string[];
  impacts?: string[];
};

/**
 * DD草案の型定義
 */
export type DdDraft = {
  id: string;
  code?: string;
  srfId: string;
  name: string;
  type: DdType;
  summary: string;
  entryPoints: EntryPoint[];
  designPolicy?: string;
  details?: Record<string, unknown>;
  project_id?: string;
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
  project_id?: string;
  isCommitted?: boolean;
  brIds?: string[];
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
  brDrafts?: BrDraft[];
  sfDraft?: SfDraft;
  srDraft?: SrDraft;
  srDrafts?: SrDraft[];
  ddDraft?: DdDraft;
  ddDrafts?: DdDraft[];
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

/**
 * 草案インライン編集時の更新ペイロード
 */
export type DraftUpdatePayload = {
  messageId: string;
  type: 'bt' | 'br' | 'sf' | 'sr' | 'dd';
  code: string;
  content: BtDraft | BrDraft | SfDraft | SrDraft | DdDraft;
};

/** スレッド履歴サマリ */
export type ThreadSummary = {
  threadId: string;
  title: string;
  updatedAt: string; // ISO 8601
  contextKey: string;
};
