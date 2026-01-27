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
 * @deprecated 要件に観点は不要。成果物への紐づけ（relatedDeliverableIds）を使用してください
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
 * 実装単位の種別
 */
export type ImplUnitType = "screen" | "api" | "batch" | "external_if";

/**
 * 実装単位の種別ラベル定義
 */
export const IMPL_UNIT_TYPE_LABELS: Record<ImplUnitType, string> = {
  screen: "画面",
  api: "API",
  batch: "バッチ",
  external_if: "外部I/F",
};

/**
 * 実装単位の種別ごとの色設定（Badge用）
 */
export const IMPL_UNIT_TYPE_COLORS: Record<ImplUnitType, string> = {
  screen: "border-violet-200 bg-violet-50 text-violet-700",
  api: "border-emerald-200 bg-emerald-50 text-emerald-700",
  batch: "border-amber-200 bg-amber-50 text-amber-700",
  external_if: "border-sky-200 bg-sky-50 text-sky-700",
};
