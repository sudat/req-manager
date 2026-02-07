import { Check, X, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ConceptCandidate, ConceptAction } from './types';

type ConceptSuggestionCardProps = {
  candidate: ConceptCandidate;
  onAction: (action: ConceptAction) => void;
  disabled?: boolean;
};

/**
 * 概念候補提案カード（コンパクト版）
 *
 * 3行レイアウトで ~120px に収めた概念候補カード。
 * Row1: 概念名 + バッジ  /  Row2: 情報行  /  Row3: アイコン小ボタン
 */
export function ConceptSuggestionCard({
  candidate,
  onAction,
  disabled,
}: ConceptSuggestionCardProps) {
  // 情報行テキスト: matchType に応じて切り替え
  const infoText =
    candidate.matchType === 'exact' && candidate.existingDefinition
      ? `既存定義: ${candidate.existingDefinition}`
      : candidate.matchType === 'similar' && candidate.similarConcept
        ? `類似概念: ${candidate.similarConcept.name} (${candidate.similarConcept.similarityScore}%)`
        : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      {/* Row 1: ヘッダー — アイコン + 概念名 + バッジ */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="text-[14px] font-medium text-slate-900 truncate">
          {candidate.term}
        </span>
        {candidate.matchType === 'exact' ? (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 text-[11px] px-2 py-0.5 shrink-0">
            既存概念
          </Badge>
        ) : candidate.matchType === 'similar' ? (
          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 text-[11px] px-2 py-0.5 shrink-0">
            似た概念 ({candidate.similarConcept?.similarityScore}%)
          </Badge>
        ) : (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5 shrink-0">
            新規候補
          </Badge>
        )}
      </div>

      {/* Row 2: 情報行（1行truncate） */}
      {infoText && (
        <div className="mt-1.5 text-[12px] text-slate-600 truncate">
          {infoText}
        </div>
      )}

      {/* Row 3: アクション — アイコンのみの小ボタン・右端 */}
      <div className="flex justify-end gap-1.5 mt-2">
        {candidate.isExisting ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAction('approve')}
            disabled={disabled}
            className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction('approve')}
              disabled={disabled}
              className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction('hold')}
              disabled={disabled}
              className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <Clock className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction('reject')}
              disabled={disabled}
              className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
