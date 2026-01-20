// 値オブジェクト型定義

import type { AcceptanceCriterionJson } from "@/lib/data/structured";

/**
 * 関連要件情報
 */
export interface RelatedRequirementInfo {
  systemReqId: string;       // SR-TASK-003-001
  systemReqTitle: string;
  systemReqSummary?: string;           // システム要件の概要
  systemReqConcepts?: { id: string; name: string }[];  // 関連概念
  systemReqImpacts?: string[];         // 影響領域
  systemReqAcceptanceCriteria?: string[];  // 受入条件（レガシー）
  systemReqAcceptanceCriteriaJson?: AcceptanceCriterionJson[];  // 受入条件（構造化）
  businessReqId: string;     // BR-TASK-003-001
  businessReqTitle: string;
  businessId: string;        // BIZ-001
  taskId: string;            // TASK-003
  relatedBusinessReqs?: Array<{    // 関連する業務要件のリスト（複数の場合）
    id: string;
    title: string;
    taskId: string;
    businessId: string;
  }>;
}

/**
 * チケット詳細用：要件参照
 */
export interface TicketRequirementReference {
  id: string;      // "BR-TASK-003-001" or "BR-TICKET-CR-004-001"
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

// Import types used in value objects
import type { BusinessArea } from "./enums";
