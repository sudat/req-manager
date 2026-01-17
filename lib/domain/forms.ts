// フォーム関連型定義
// components/forms/types.ts と TaskKnowledge で使う型を統合

/**
 * 選択ダイアログタイプ
 */
export type SelectionDialogType = "concepts" | "system" | "domain";

/**
 * 要件タイプ
 */
export type RequirementType = "業務要件" | "システム要件";

/**
 * 要件
 */
export type Requirement = {
  id: string;
  type: RequirementType;
  title: string;
  summary: string;
  conceptIds: string[];
  srfId: string | null;
  systemDomainIds: string[];
  acceptanceCriteria: string[];
};

/**
 * 選択ダイアログ状態
 */
export type SelectionDialogState = {
  type: SelectionDialogType;
  reqId: string;
} | null;

/**
 * 選択可能アイテム
 */
export type SelectableItem = {
  id: string;
  name: string;
};

/**
 * 設計書
 */
export type DesignDoc = {
  id: string;
  title: string;
  category: "画面" | "データ" | "IF" | "業務ルール" | "その他";
  source: "内部" | "外部リンク";
  content: string;
  url?: string;
};

/**
 * コード参照
 */
export type CodeRef = {
  paths: string[];
};
