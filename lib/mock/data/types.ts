// 共通型定義
// DB置き換えを考慮したORMモデルを意識した型定義

// ============================================
// プロジェクト設定関連の型定義
// ============================================

/**
 * プロジェクト設定（将来的な永続化を考慮）
 */
export interface ProjectSettings {
  projectName: string;
  projectDescription: string;
  suspectLinkThreshold: "low" | "medium" | "high";
  autoSaveEnabled: boolean;
  githubRepositoryUrl?: string;
}

// 領域型
export type BusinessArea = string;

// チケットステータス
export type TicketStatus = "open" | "review" | "approved" | "applied";

// チケット優先度
export type TicketPriority = "low" | "medium" | "high";

// SRFステータス
export type SrfStatus = "not_implemented" | "implementing" | "testing" | "implemented";

// SRFカテゴリ
export type SrfCategory = "screen" | "internal" | "interface";

// 設計項目カテゴリ
export type DesignItemCategory =
  | "database"      // データベース設計
  | "api"           // API設計
  | "logic"         // ビジネスロジック
  | "ui"            // UI/画面設計
  | "integration"   // 外部連携
  | "batch"         // バッチ処理
  | "error_handling"; // エラーハンドリング

// システム設計項目
export interface SystemDesignItem {
  id: string;
  category: DesignItemCategory;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

// 関連要件情報
export interface RelatedRequirementInfo {
  systemReqId: string;       // SR-TASK-003-001
  systemReqTitle: string;
  systemReqSummary?: string;           // システム要件の概要
  systemReqConcepts?: { id: string; name: string }[];  // 関連概念
  systemReqImpacts?: string[];         // 影響領域
  systemReqAcceptanceCriteria?: string[];  // 受入条件
  businessReqId: string;     // BR-TASK-003-001
  businessReqTitle: string;
  businessId: string;        // BIZ-001
  taskId: string;            // TASK-003
}

// Business（業務）
export interface Business {
  id: string;              // BIZ-001
  name: string;            // 債権管理
  area: BusinessArea;      // AR
  summary: string;         // 業務の概要説明
  businessReqCount: number;  // 業務要件数
  systemReqCount: number;    // システム要件数
  createdAt: string;       // ISO日付
  updatedAt: string;       // ISO日付
}

// Task（業務タスク）
export interface Task {
  id: string;              // TASK-001
  businessId: string;      // BIZ-001 (外部キー)
  name: string;            // 請求書発行
  summary: string;         // 業務概要
  person: string;          // 担当者
  input: string;           // インプット
  output: string;          // アウトプット
  concepts: string[];      // 関連概念ID配列 [C001, C002]
  businessReqCount: number;  // 業務要件数
  systemReqCount: number;    // システム要件数
  sortOrder: number;       // 表示順序
  createdAt: string;
  updatedAt: string;
}

// Ticket（変更要求）
export interface Ticket {
  id: string;              // CR-001
  title: string;           // インボイス制度対応
  description: string;     // 詳細説明
  businessIds: string[];   // [BIZ-001, BIZ-003] (外部キー配列)
  areas: BusinessArea[];   // [AR, GL]
  status: TicketStatus;    // approved
  targetVersions: string[];  // [v2.0, v2.1]
  priority: TicketPriority;
  requestedBy: string;     // 申請者
  createdAt: string;
  updatedAt: string;

  // 詳細ページ用フィールド
  background?: string;     // 背景・目的の詳細
  impactRequirements?: TicketRequirementReference[];  // 影響要件
  relatedConcepts?: TicketConceptReference[];         // 関連概念（AI候補）
  versionHistory?: TicketVersionApplication[];        // 版適用履歴
}

// チケット詳細用：要件参照
export interface TicketRequirementReference {
  id: string;      // "BR-TASK-003-001" or "BR-TICKET-CR-004-001"
  title: string;   // "適格請求書（インボイス）形式で請求書を発行する"
  type: "業務要件" | "システム要件";
}

// チケット詳細用：概念参照
export interface TicketConceptReference {
  id: string;      // "C001"
  name: string;    // "インボイス制度"
  status: "レビュー中" | "承認済" | "却下";
}

// チケット詳細用：版適用履歴
export interface TicketVersionApplication {
  version: string;       // "v2.0"
  appliedDate: string;   // "2024-01-20"
  status: "適用済" | "適用待ち" | "適用失敗";
}

// Concept（概念辞書）
export interface Concept {
  id: string;              // C001
  name: string;            // インボイス制度
  synonyms: string[];      // ["適格請求書", "適格請求書等保存方式"]
  areas: BusinessArea[];   // [AR, GL]
  definition: string;      // 定義・説明
  relatedDocs: string[];   // 関連ドキュメントURL
  requirementCount: number;  // 使用要件数
  createdAt: string;
  updatedAt: string;
}

// SystemFunction（システム機能）
export interface SystemFunction {
  id: string;              // SRF-001
  systemDomainId?: string | null; // システム領域ID（例: AR）
  designDocNo: string;     // DD-TASK-001-001
  category: SrfCategory;   // screen
  title: string;           // 機能名
  summary: string;         // 説明
  status: SrfStatus;       // implemented
  relatedTaskIds: string[];  // [TASK-001] (外部キー配列)
  requirementIds: string[];  // [SR-TASK-001-001] (関連要件ID)
  systemDesign: SystemDesignItem[];  // システム設計項目配列
  codeRefs: {
    githubUrl?: string;
    paths: string[];
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}
