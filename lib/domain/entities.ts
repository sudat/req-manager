// ドメインエンティティ型定義

/**
 * Business（業務）
 */
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

/**
 * Task（業務タスク）
 */
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

/**
 * Ticket（変更要求）
 */
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
  changeSummary?: string;  // 変更要約（1行）
  expectedBenefit?: string; // 期待効果（1行）
  background?: string;     // 背景・目的の詳細
  impactRequirements?: TicketRequirementReference[];  // 影響要件
  changeItems?: TicketChangeItem[]; // 変更内容（要件ごと）
  relatedConcepts?: TicketConceptReference[];         // 関連概念（AI候補）
  versionHistory?: TicketVersionApplication[];        // 版適用履歴
}

/**
 * Concept（概念辞書）
 */
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

/**
 * SystemFunction（システム機能）
 */
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

// Note: Related types (BusinessArea, TicketStatus, etc.) are defined in enums.ts
// and should be imported from there when using this file
// This file only contains the core entity interfaces
