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
  business_domain_id: string;
  concept_ids?: string[];
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
