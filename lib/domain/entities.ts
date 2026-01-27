// ドメインエンティティ型定義
import type { BusinessArea, TicketStatus, TicketPriority, SrfCategory, SrfStatus, SystemDesignItem } from './enums';
import type { TicketRequirementReference, TicketChangeItem, TicketConceptReference, TicketVersionApplication, EntryPoint } from './value-objects';
import type { SystemDesignItemV2 } from './schemas/system-design';
import type { Deliverable } from './schemas/deliverable';

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
  summary: string;         // 業務概要（description）
  businessContext: string; // 業務コンテキスト（Markdown）
  processSteps: string;    // タスク内の流れ（YAML）
  input: string;           // インプット（YAML）
  output: string;          // アウトプット（YAML）
  conceptIdsYaml: string;  // 関連概念ID（YAML）
  /** @deprecated 3.3から除外。既存データ互換のため保持 */
  person: string;          // 担当者
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
  /** @deprecated 成果物の種別で代替。deliverables[].type を使用してください */
  category: SrfCategory;   // screen
  title: string;           // 機能名
  summary: string;         // 説明
  designPolicy: string;    // 横断的な設計方針
  status: SrfStatus;       // implemented
  relatedTaskIds: string[];  // [TASK-001] (外部キー配列)
  requirementIds: string[];  // [SR-TASK-001-001] (関連要件ID)
  /** @deprecated deliverablesに移行中。新規はdeliverables[].designを使用してください */
  systemDesign: (SystemDesignItem | SystemDesignItemV2)[];  // システム設計項目配列（V2とレガシーの混在対応）
  /** @deprecated deliverablesに統合されました。deliverables[].entryPointを使用してください */
  entryPoints?: EntryPoint[];  // PRD v1.3（DB: system_functions.entry_points）
  deliverables: Deliverable[];  // 成果物配列（新構造）
  codeRefs: {
    githubUrl?: string;
    paths: string[];
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Project（プロジェクト）
 */
export interface Project {
  id: string;              // UUID
  name: string;            // プロジェクト名
  description: string | null;  // 説明
  githubUrl: string | null;    // GitHubリポジトリURL
  reviewLinkThreshold: 'low' | 'medium' | 'high';  // 要確認リンク判定基準
  autoSave: boolean;       // 自動保存有効フラグ
  investigationSettings?: ProjectInvestigationSettings; // /settings 用の詳細設定
  createdAt: string;       // ISO日付
  updatedAt: string;       // ISO日付
}

/**
 * ProjectInvestigationSettings（PRD 6.15）
 */
export type ProjectInvestigationSettings = {
  exploration: {
    default_max_depth: number;
    default_include_patterns: string[];
    default_exclude_patterns: string[];
  };
  allow_paths_rule: {
    base_rule: {
      include_direct_impacts: boolean;
      include_indirect_impacts: boolean;
      confidence_threshold: number;
      max_depth: number;
    };
    shared_module_rule: {
      auto_include: boolean;
      notify_on_include: boolean;
      require_confirmation_if_count_exceeds: number;
    };
    safety_limits: {
      max_total_files: number;
      max_directories: number;
      escalate_if_exceeds: boolean;
    };
  };
  impact_review: {
    auto_trigger_threshold: number;
    default_aggressiveness: "conservative" | "moderate" | "aggressive";
    require_human_confirmation: boolean;
  };
  shared_module_patterns: string[];
};

/**
 * ProductRequirement（プロダクト要件 / PR）
 */
export interface ProductRequirement {
  id: string;              // PR-001
  projectId: string;       // UUID
  targetUsers: string;     // Markdown
  experienceGoals: string; // Markdown
  qualityGoals: string;    // Markdown
  designSystem: string;    // Markdown
  uxGuidelines: string;    // Markdown
  techStackProfile: string; // YAML
  codingConventions: string | null; // YAML
  forbiddenChoices: string | null; // YAML
  createdAt: string;
  updatedAt: string;
}

/**
 * AcceptanceCriterion（受入基準 / AC）
 */
export type AcceptanceCriterionStatus = "unverified" | "verified_ok" | "verified_ng";

export interface AcceptanceCriterion {
  id: string;              // AC-001
  systemRequirementId: string; // SR-XXX
  projectId: string;       // UUID
  description: string;
  givenText: string | null;
  whenText: string | null;
  thenText: string | null;
  verificationMethod: string | null;
  status: AcceptanceCriterionStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  evidence: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * ImplUnitSD（実装単位SD）
 * PRD 3.9準拠: 4種類に限定
 */
export type ImplUnitType = "screen" | "api" | "batch" | "external_if";

export interface ImplUnitSd {
  id: string;              // IU-XXX
  srfId: string;           // SRF-XXX
  projectId: string;       // UUID
  name: string;
  type: ImplUnitType;
  summary: string;
  entryPoints: EntryPoint[];
  designPolicy: string;
  details: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * RequirementLink（要件リンク）
 */
export type RequirementLinkNodeType = "bd" | "bt" | "br" | "sd" | "sf" | "sr" | "ac" | "impl_unit" | string;

export interface RequirementLink {
  id: string;              // UUID
  projectId: string;       // UUID
  sourceType: RequirementLinkNodeType;
  sourceId: string;
  targetType: RequirementLinkNodeType;
  targetId: string;
  linkType: string;
  suspect: boolean;
  suspectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// Note: Related types (BusinessArea, TicketStatus, etc.) are defined in enums.ts
// and should be imported from there when using this file
// This file only contains the core entity interfaces
