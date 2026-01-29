import { z } from 'zod';

/**
 * 草案状態スキーマ
 * BT, BR, SF, SR, AC, impl_unit いずれかの種別の草案を表す
 */
export const DraftItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['bt', 'br', 'sf', 'sr', 'ac', 'impl_unit']),
  content: z.any().optional(),
  status: z.enum(['draft', 'committed', 'discarded']).optional(),
  previewAvailable: z.boolean().optional(),
  uncertainties: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
});

/**
 * 位置情報スキーマ
 * 現在の作業位置（BD, BT, BR, SD, SF, SR, CR, project）を表す
 */
export const LocationInfoSchema = z.object({
  type: z.enum(['bd', 'bt', 'br', 'sd', 'sf', 'sr', 'cr', 'project']),
  id: z.string().optional(),
  name: z.string().optional(),
  projectId: z.string(),
  breadcrumb: z.array(z.string()).optional(),
});

/**
 * コミット済みアイテムスキーマ
 * コミット済みのBT, BR, SF, SR, AC, impl_unitを表す
 */
const CommittedItemSchema = z.object({
  type: z.enum(['bt', 'br', 'sf', 'sr', 'ac', 'impl_unit']),
  id: z.string(),
  code: z.string(),
  name: z.string(),
  committedAt: z.string(),
});

/**
 * 保留中の課題スキーマ
 * 未確定事項、質問、ブロッカー、必要な情報を表す
 */
const PendingIssueSchema = z.object({
  category: z.enum(['uncertainty', 'question', 'blocking', 'info_needed']),
  description: z.string(),
  relatedDraftId: z.string().optional(),
  createdAt: z.string(),
});

/**
 * セッションメタデータスキーマ
 * セッション全体の統計情報を表す
 */
const SessionMetadataSchema = z.object({
  lastActivity: z.string().optional(),
  totalDraftsCreated: z.number().optional(),
  totalCommits: z.number().optional(),
});

/**
 * Working Memoryメインスキーマ
 * セッション状態を構造化された形式で管理する
 */
export const WorkingMemorySchema = z.object({
  /** 現在の作業位置 */
  currentLocation: LocationInfoSchema.optional(),
  /** アクティブな草案リスト */
  activeDrafts: z.array(DraftItemSchema).optional(),
  /** コミット済みアイテムリスト */
  committedItems: z.array(CommittedItemSchema).optional(),
  /** 保留中の課題リスト */
  pendingIssues: z.array(PendingIssueSchema).optional(),
  /** セッションメタデータ */
  sessionMetadata: SessionMetadataSchema.optional(),
});

export type WorkingMemory = z.infer<typeof WorkingMemorySchema>;
export type DraftItem = z.infer<typeof DraftItemSchema>;
export type LocationInfo = z.infer<typeof LocationInfoSchema>;
export type CommittedItem = z.infer<typeof CommittedItemSchema>;
export type PendingIssue = z.infer<typeof PendingIssueSchema>;
export type SessionMetadata = z.infer<typeof SessionMetadataSchema>;
