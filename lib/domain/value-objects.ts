// 値オブジェクト型定義

import type { AcceptanceCriterionJson } from "@/lib/data/structured";
import type { SystemRequirementCategory } from "@/lib/domain";

/**
 * 関連要件情報
 */
export interface RelatedRequirementInfo {
  systemReqId: string;       // SR-AR-0003-0001
  systemReqTitle: string;
  systemReqSummary?: string;           // システム要件の概要
  systemReqCategory?: SystemRequirementCategory;  // システム要件のカテゴリ（function/data/exception/non_functional）
  systemReqConcepts?: { id: string; name: string }[];  // 関連概念
  systemReqImpacts?: string[];         // 影響領域
  systemReqAcceptanceCriteria?: string[];  // 受入条件（レガシー）
  systemReqAcceptanceCriteriaJson?: AcceptanceCriterionJson[];  // 受入条件（構造化）
  businessReqId: string;     // BR-AR-0003-0001
  businessReqTitle: string;
  businessId: string;        // AR
  businessArea?: string | null;  // AR/AP/GL
  taskId: string;            // BT-AR-0003
  relatedBusinessReqs?: Array<{    // 関連する業務要件のリスト（複数の場合）
    id: string;
    title: string;
    taskId: string;
    businessId: string; // AR
    businessArea?: string | null;
    suspect?: boolean;              // 疑義フラグ（Phase 4.6で追加）
    suspectReason?: string | null;  // 疑義理由（Phase 4.6で追加）
  }>;
}

/**
 * チケット詳細用：要件参照
 */
export interface TicketRequirementReference {
  id: string;      // "BR-AR-0003-0001" or "BR-TICKET-CR-004-001"
  title: string;   // "適格請求書（インボイス）形式で請求書を発行する"
  type: "業務要件" | "システム要件";
  businessName?: string; // 例: 債権管理
  area?: BusinessArea;   // 例: AR
}

/**
 * チケット変更項目
 */
export interface TicketChangeItem {
  refId: string;     // 要件ID
  refTitle: string;  // 要件タイトル
  refType: "業務要件" | "システム要件";
  changeType: "追加" | "変更" | "削除";
  beforeText: string;
  afterText: string;
  acceptanceCriteria: string[];
  businessName?: string; // 例: 債権管理
  area?: BusinessArea;   // 例: AR
}

/**
 * チケット詳細用：概念参照
 */
export interface TicketConceptReference {
  id: string;      // "C001"
  name: string;    // "インボイス制度"
  status: "レビュー中" | "承認済" | "却下";
}

/**
 * チケット詳細用：版適用履歴
 */
export interface TicketVersionApplication {
  version: string;       // "v2.0"
  appliedDate: string;   // "2024-01-20"
  status: "適用済" | "適用待ち" | "適用失敗";
}

/**
 * プロジェクト設定（将来的な永続化を考慮）
 */
export interface ProjectSettings {
  projectName: string;
  projectDescription: string;
  reviewLinkThreshold: "low" | "medium" | "high";
  autoSaveEnabled: boolean;
  githubRepositoryUrl?: string;
}

/**
 * システム機能のエントリポイント（PRD v1.3）
 */
export interface EntryPoint {
  path: string;
  type: string | null;
  responsibility: string | null;
}

/**
 * 変更要求（PRD v1.3 Phase 2）
 */
export interface ChangeRequest {
  id: string;                    // UUID
  ticketId: string;              // CR-001
  title: string;
  description: string | null;
  background: string | null;
  expectedBenefit: string | null;
  status: ChangeRequestStatus;
  priority: ChangeRequestPriority;
  requestedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 影響範囲（PRD v1.3 Phase 2）
 */
export interface ImpactScope {
  id: string;
  changeRequestId: string;
  targetType: ImpactScopeTargetType;
  targetId: string;
  targetTitle: string;
  rationale: string | null;
  confirmed: boolean;
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 受入条件確認状態（PRD v1.3 Phase 2）
 * 設計原則: 変更要求ごとに独立した版管理を行う
 */
export interface AcceptanceConfirmation {
  id: string;
  changeRequestId: string;
  acceptanceCriterionId: string;
  acceptanceCriterionSourceType: AcceptanceCriterionSourceType;
  acceptanceCriterionSourceId: string;
  acceptanceCriterionDescription: string;
  acceptanceCriterionVerificationMethod: string | null;
  status: AcceptanceConfirmationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  evidence: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ChangeRequestStatus = 'open' | 'review' | 'approved' | 'applied';
export type ChangeRequestPriority = 'low' | 'medium' | 'high';
export type ImpactScopeTargetType = 'business_requirement' | 'system_requirement' | 'system_function' | 'file';
export type AcceptanceCriterionSourceType = 'business_requirement' | 'system_requirement';
export type AcceptanceConfirmationStatus = 'unverified' | 'verified_ok' | 'verified_ng';

/**
 * 影響調査結果ステータス（Phase 5）
 */
export type InvestigationResultStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * 影響調査結果（Phase 5）
 */
export interface InvestigationResult {
  id: string;
  changeRequestId: string;
  projectId: string;
  status: InvestigationResultStatus;
  topDownResult: {
    affectedBRs: string[];
    affectedSFs: string[];
    affectedSRs: string[];
    affectedACs: string[];
    affectedEntryPoints: Array<{ sfId: string; path: string }>;
  };
  bottomUpResult?: {
    repositoryUrl: string | null;
    error?: string | null;
    explorationMetadata: {
      totalFilesScanned: number;
      totalDependenciesFound: number;
      maxDepthReached: number;
      truncated: boolean;
      truncationReason?: string | null;
    };
    affectedFiles: Array<{
      filePath: string;
      impactType: "direct" | "indirect";
      depth: number;
      confidence: number;
      changeLikelihood: "high" | "medium" | "low";
      reason: string;
      dependencyChain: string[];
      dependencyType: "import" | "type" | "runtime" | "config";
      sharedModule?: boolean;
    }>;
  };
  suspectLinksDetected: Array<{
    id: string;
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    linkType: string;
    suspectReason: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type DesignDecisionLogCreatedBy = "agent" | "human";
export type DesignDecisionLogStatus = "proposed" | "confirmed" | "rejected";
export type DesignDecisionLogRationaleType =
  | "pr_reference"
  | "ac_reference"
  | "convention"
  | "inference"
  | "user_input";
export type DesignDecisionLogTargetType =
  | "bt"
  | "br"
  | "sf"
  | "sr"
  | "ac"
  | "impl_unit"
  | "change_request";

export interface DesignDecisionLog {
  id: string;
  changeRequestId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: DesignDecisionLogCreatedBy;
  context: {
    targetType: DesignDecisionLogTargetType;
    targetId: string;
    field?: string | null;
  };
  decision: string;
  rationale: {
    type: DesignDecisionLogRationaleType;
    reference?: string | null;
    explanation: string;
  };
  status: DesignDecisionLogStatus;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
}

/**
 * 改修指示パッケージ（PRD 6.8）
 */
export interface ModificationPackage {
  taskId: string;
  crId: string;
  projectId: string;
  repositoryUrl: string;
  baseBranch: string;
  execution: {
    workingBranch: string;
    allowPaths: string[];
    denyPaths?: string[];
    maxRuntimeSec: number;
    idempotencyKey: string;
  };
  productRequirement: {
    targetUsers: string;
    experienceGoals: string;
    qualityGoals: string;
    designSystem: string;
    uxGuidelines: string;
    techStackProfile: string;
    codingConventions: string | null;
    forbiddenChoices: string | null;
  } | null;
  businessTask: string;
  businessRequirements: string[];
  systemFunctions: string[];
  systemRequirements: string[];
  acceptanceCriteria: string[];
  investigationRefs: {
    investigationId: string;
    investigationResultSummary: string;
    impactReviewId?: string;
    impactReviewResultSummary?: string;
  };
  implementationUnits: Array<{
    ddId: string;
    type: "screen" | "api" | "batch" | "external_if" | "model" | "report" | "job";
    name: string;
    entryPoint: string;
    designDetails: Record<string, unknown>;
  }>;
  modificationSummary: string;
  modificationDetails: string;
  targets: Array<{
    ddId: string;
    entryPoint: string;
    description: string;
    relatedRequirements: string[];
  }>;
  constraints: string[];
  prohibitions: string[];
  codingGuidelines: string;
  testCommands: string[];
  residualRisks?: Array<{
    riskType: string;
    description: string;
    severity: "high" | "medium" | "low";
    mitigation: string;
  }>;
  excludedFromScope?: Array<{
    filePath: string;
    exclusionReason: string;
    excludedBy: "auto_rule" | "ai_review" | "human_decision";
  }>;
}

// Import types used in value objects
import type { BusinessArea } from "./enums";
