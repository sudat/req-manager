/**
 * AIチャット関連の型定義
 */

/**
 * チャットメッセージ
 */
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
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
