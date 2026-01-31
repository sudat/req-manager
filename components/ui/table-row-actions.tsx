import React from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TableRowActionsProps {
  /** 照会（詳細表示）ページのURL */
  viewHref?: string;
  /** 編集ページのURL */
  editHref?: string;
  /** 削除ボタンクリック時のハンドラ */
  onDelete?: () => void;
  /** 削除ボタンを非表示にするか（デフォルト: false） */
  hideDelete?: boolean;
  /** 削除ボタンのホバー色（デフォルト: 'slate'） */
  deleteHoverColor?: 'slate' | 'rose';
}

/**
 * テーブル行の操作ボタン（照会・編集・削除）
 *
 * 一覧ページのテーブル行で使用する標準的な操作ボタンを提供する。
 * Eye（照会）、Pencil（編集）、Trash2（削除）の3つのボタンを統一されたスタイルで表示。
 *
 * @example
 * <TableRowActions
 *   viewHref={`/business/${id}`}
 *   editHref={`/business/${id}/edit`}
 *   onDelete={() => handleDelete(id)}
 * />
 *
 * @example
 * // 削除ボタンを赤色ホバーにする場合
 * <TableRowActions
 *   viewHref={`/system/${id}`}
 *   editHref={`/system/${id}/edit`}
 *   onDelete={() => handleDelete(id)}
 *   deleteHoverColor="rose"
 * />
 */
export function TableRowActions({
  viewHref,
  editHref,
  onDelete,
  hideDelete = false,
  deleteHoverColor = 'slate',
}: TableRowActionsProps) {
  const buttonBaseClass = 'h-8 w-8 rounded-md border-slate-200';
  const deleteHoverClass =
    deleteHoverColor === 'rose'
      ? 'hover:bg-rose-600 hover:text-white hover:border-rose-600'
      : 'hover:bg-slate-900 hover:text-white hover:border-slate-900';

  return (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
      {/* 照会ボタン */}
      {viewHref && (
        <Link href={viewHref}>
          <Button
            size="icon"
            variant="outline"
            title="照会"
            className={`${buttonBaseClass} hover:bg-slate-900 hover:text-white hover:border-slate-900`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      )}

      {/* 編集ボタン */}
      {editHref && (
        <Link href={editHref}>
          <Button
            size="icon"
            variant="outline"
            title="編集"
            className={`${buttonBaseClass} hover:bg-slate-900 hover:text-white hover:border-slate-900`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
      )}

      {/* 削除ボタン */}
      {!hideDelete && onDelete && (
        <Button
          size="icon"
          variant="outline"
          title="削除"
          className={`${buttonBaseClass} ${deleteHoverClass}`}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
