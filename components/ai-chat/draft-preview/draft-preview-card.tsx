import { Check, Pencil, X, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Draft, DraftAction } from './types';

type DraftPreviewCardProps = {
  draft: Draft;
  onAction: (action: DraftAction) => void;
  disabled?: boolean;
};

/**
 * 草案プレビューカード
 *
 * 生成された草案を表示し、確定/編集/やり直しのアクションを提供する。
 */
export function DraftPreviewCard({
  draft,
  onAction,
  disabled,
}: DraftPreviewCardProps) {
  const getTypeLabel = (type: Draft['type']) => {
    const labels = {
      bt: '業務タスク',
      br: '業務要件',
      sf: 'システム機能',
      sr: 'システム要件',
      ac: '受入基準',
      impl_unit: '実装単位',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: Draft['type']) => {
    const colors = {
      bt: 'bg-blue-100 text-blue-800 border-blue-200',
      br: 'bg-green-100 text-green-800 border-green-200',
      sf: 'bg-purple-100 text-purple-800 border-purple-200',
      sr: 'bg-orange-100 text-orange-800 border-orange-200',
      ac: 'bg-pink-100 text-pink-800 border-pink-200',
      impl_unit: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[type] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <Badge
            variant="outline"
            className={`${getTypeColor(draft.type)} text-[11px] font-medium px-2 py-0.5`}
          >
            {getTypeLabel(draft.type)}
          </Badge>
          <span className="text-[11px] text-slate-400 font-mono">
            {draft.id}
          </span>
        </div>
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700 text-[11px] px-2 py-0.5"
        >
          未確定
        </Badge>
      </div>

      {/* コンテンツプレビュー */}
      <div className="mb-3 p-3 rounded bg-slate-50 border border-slate-100">
        <div className="text-[13px] text-slate-700 line-clamp-3">
          {renderContent(draft.content)}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onAction('commit')}
          disabled={disabled}
          className="flex-1 h-8 gap-1.5 text-[12px] bg-slate-900 hover:bg-slate-800"
        >
          <Check className="h-3.5 w-3.5" />
          確定
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction('edit')}
          disabled={disabled}
          className="h-8 gap-1.5 text-[12px] border-slate-200 hover:bg-slate-100"
        >
          <Pencil className="h-3.5 w-3.5" />
          編集
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction('retry')}
          disabled={disabled}
          className="h-8 gap-1.5 text-[12px] border-slate-200 hover:bg-slate-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          やり直し
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction('discard')}
          disabled={disabled}
          className="h-8 w-8 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * コンテンツをプレビュー用にレンダリング
 */
function renderContent(content: any): string {
  if (!content) return '(内容なし)';

  if (typeof content === 'string') return content;

  // オブジェクトの場合は主要なフィールドを表示
  if (typeof content === 'object') {
    const preview: string[] = [];

    if (content.name) preview.push(`名前: ${content.name}`);
    if (content.title) preview.push(`タイトル: ${content.title}`);
    if (content.summary) preview.push(`概要: ${content.summary}`);
    if (content.requirement) preview.push(`要件: ${content.requirement}`);
    if (content.description) preview.push(`説明: ${content.description}`);

    return preview.length > 0
      ? preview.join(' / ')
      : JSON.stringify(content).slice(0, 100) + '...';
  }

  return String(content);
}
