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
 * SRFステータス
 */
export type SrfStatus = "not_implemented" | "implementing" | "testing" | "implemented";

/**
 * SRFカテゴリ
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
