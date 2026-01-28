import { Check, X, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ConceptCandidate, ConceptAction } from './types';

type ConceptSuggestionCardProps = {
  candidate: ConceptCandidate;
  onAction: (action: ConceptAction) => void;
  disabled?: boolean;
};

/**
 * 概念候補提案カード
 *
 * AIが抽出した概念候補を表示し、承認/却下/保留のアクションを提供する。
 */
export function ConceptSuggestionCard({
  candidate,
  onAction,
  disabled,
}: ConceptSuggestionCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-400" />
          <span className="text-[14px] font-medium text-slate-900">
            {candidate.term}
          </span>
          {candidate.isExisting ? (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700 text-[11px] px-2 py-0.5"
            >
              既存概念
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5"
            >
              新規候補
            </Badge>
          )}
        </div>
      </div>

      {/* コンテキスト表示 */}
      <div className="mb-3">
        <div className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">
          出現箇所
        </div>
        <div className="p-2 rounded bg-slate-50 border border-slate-100">
          <span className="text-[13px] text-slate-700">{candidate.context}</span>
        </div>
      </div>

      {/* 既存定義または提案 */}
      {candidate.isExisting && candidate.existingDefinition && (
        <div className="mb-3 p-3 rounded bg-green-50 border border-green-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-medium text-green-800 mb-1">
                既存の定義
              </div>
              <div className="text-[13px] text-green-700">
                {candidate.existingDefinition}
              </div>
            </div>
          </div>
        </div>
      )}

      {!candidate.isExisting && candidate.suggestion && (
        <div className="mb-3 p-3 rounded bg-blue-50 border border-blue-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-medium text-blue-800 mb-1">
                提案
              </div>
              <div className="text-[13px] text-blue-700">
                {candidate.suggestion}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* アクションボタン */}
      {!candidate.isExisting && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onAction('approve')}
            disabled={disabled}
            className="flex-1 h-8 gap-1.5 text-[12px] bg-green-600 hover:bg-green-700"
          >
            <Check className="h-3.5 w-3.5" />
            承認
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction('hold')}
            disabled={disabled}
            className="h-8 gap-1.5 text-[12px] border-slate-200 hover:bg-slate-100"
          >
            <Clock className="h-3.5 w-3.5" />
            保留
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction('reject')}
            disabled={disabled}
            className="h-8 w-8 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* 既存概念の場合は確認ボタンのみ */}
      {candidate.isExisting && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction('approve')}
            disabled={disabled}
            className="h-8 gap-1.5 text-[12px] border-slate-200 hover:bg-slate-100"
          >
            <Check className="h-3.5 w-3.5" />
            確認
          </Button>
        </div>
      )}
    </div>
  );
}
