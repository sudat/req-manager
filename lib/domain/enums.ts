// 列挙型・共通型定義

/**
 * 領域型
 */
export type BusinessArea = string;

/**
 * チケットステータス
 */
export type TicketStatus = "open" | "review" | "approved" | "applied";

/**
 * チケット優先度
 */
export type TicketPriority = "low" | "medium" | "high";

/**
 * 業務要件の優先度（PRD v1.3）
 */
export type BusinessRequirementPriority = "Must" | "Should" | "Could";

/**
 * システム要件カテゴリ（PRD v1.3）
 * @deprecated 要件に観点は不要です。
 */
export type SystemRequirementCategory =
  | "function"
  | "data"
  | "exception"
  | "non_functional";

/**
 * SRFステータス
 */
export type SrfStatus = "not_implemented" | "implementing" | "testing" | "implemented";

/**
 * SRFカテゴリ
 * @deprecated 成果物の種別で代替。deliverables[].type を使用してください
 */
export type SrfCategory = "screen" | "internal" | "interface";

/**
 * 設計項目カテゴリ
 */
export type DesignItemCategory =
  | "database"      // データベース設計
  | "api"           // API設計
  | "logic"         // ビジネスロジック
  | "ui"            // UI/画面設計
  | "integration"   // 外部連携
  | "batch"         // バッチ処理
  | "error_handling"; // エラーハンドリング

/**
 * システム設計項目
 */
export interface SystemDesignItem {
  id: string;
  category: DesignItemCategory;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

/**
 * DD（Design Document）の種別
 */
export type DdType =
  | "screen"
  | "api"
  | "batch"
  | "external_if"
  | "model"
  | "report"
  | "job";

/**
 * DD種別ラベル定義
 */
export const DD_TYPE_LABELS: Record<DdType, string> = {
  screen: "画面",
  api: "API",
  batch: "バッチ",
  external_if: "外部I/F",
  model: "モデル",
  report: "レポート",
  job: "ジョブ",
};

/**
 * DD種別ごとの色設定（Badge用）
 */
export const DD_TYPE_COLORS: Record<DdType, string> = {
  screen: "border-violet-200 bg-violet-50 text-violet-700",
  api: "border-emerald-200 bg-emerald-50 text-emerald-700",
  batch: "border-amber-200 bg-amber-50 text-amber-700",
  external_if: "border-sky-200 bg-sky-50 text-sky-700",
  model: "border-indigo-200 bg-indigo-50 text-indigo-700",
  report: "border-rose-200 bg-rose-50 text-rose-700",
  job: "border-teal-200 bg-teal-50 text-teal-700",
};
