/**
 * 草案プレビュー関連の型定義
 */

/**
 * 草案タイプ
 */
export type DraftType = 'bt' | 'br' | 'sf' | 'sr' | 'ac' | 'impl_unit';

/**
 * 草案ステータス
 */
export type DraftStatus = 'draft' | 'committed' | 'discarded';

/**
 * 草案データ
 */
export interface Draft {
  id: string;
  type: DraftType;
  status: DraftStatus;
  content: any;
  created_at: string;
  project_id?: string;
}

/**
 * 草案プレビューアクション
 */
export type DraftAction = 'commit' | 'edit' | 'discard' | 'retry';
