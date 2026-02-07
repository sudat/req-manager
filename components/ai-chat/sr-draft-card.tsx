"use client";

import { useState } from 'react';
import { FileCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SrDraft, AcDraft, DraftCommitState } from './types';

type SrDraftCardProps = {
  draft: SrDraft;
  commitState?: DraftCommitState;
  onCommit?: () => void;
  commitDisabled?: boolean;
  commitDisabledMessage?: string;
};

/**
 * SR草案プレビューカード
 *
 * AIが生成したシステム要件（SR）草案を表形式で表示する。
 */
export function SrDraftCard({
  draft,
  commitState,
  onCommit,
  commitDisabled,
  commitDisabledMessage,
}: SrDraftCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const status = commitState?.status ?? 'idle';
  const statusLabel =
    status === 'success'
      ? '登録済'
      : status === 'loading'
        ? '登録中'
        : status === 'error'
          ? '登録失敗'
          : '未確定';
  const statusClass =
    status === 'success'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'loading'
        ? 'bg-sky-100 text-sky-700'
        : status === 'error'
          ? 'bg-rose-100 text-rose-700'
          : 'bg-amber-100 text-amber-700';
  const isDisabled = commitDisabled || status === 'loading';

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-slate-600" />
          <h3 className="text-[13px] font-semibold text-slate-700">
            システム要件草案
          </h3>
        </div>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium', statusClass)}>
          {statusLabel}
        </span>
      </div>

      {/* 基本情報テーブル */}
      <div className="divide-y divide-slate-200">
        <InfoRow label="コード" value={draft.code} />
        <InfoRow label="タイプ" value={draft.type} />
        <InfoRow label="タイトル" value={draft.title || draft.requirement} />
        <InfoRow label="概要" value={draft.summary || draft.requirement} />
        <InfoRow label="根拠" value={draft.rationale} />
      </div>

      {/* 受入基準一覧 */}
      {draft.acs.length > 0 && (
        <div className="border-t border-slate-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <h4 className="text-[12px] font-semibold text-slate-700">
              受入基準 ({draft.acs.length}件)
            </h4>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {isExpanded && (
            <div className="divide-y divide-slate-100">
              {draft.acs.map((ac) => (
                <AcListItem key={ac.code} ac={ac} />
              ))}
            </div>
          )}
        </div>
      )}

      {onCommit && status !== 'success' && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <div className="text-[11px] text-rose-600 min-h-[16px]">
            {commitDisabled
              ? commitDisabledMessage ?? '先に上位の要件を確定してください'
              : status === 'error'
                ? commitState?.message
                : ''}
          </div>
          <Button
            size="sm"
            onClick={onCommit}
            disabled={isDisabled}
            className={cn(
              'h-8 px-4 text-[12px]',
              isDisabled ? 'bg-slate-300 text-white hover:bg-slate-300' : 'bg-slate-900 hover:bg-slate-800'
            )}
          >
            {status === 'loading' ? '登録中...' : '登録する'}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * AC一覧アイテム
 */
function AcListItem({ ac }: { ac: AcDraft }) {
  return (
    <div className="px-4 py-3 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-mono text-slate-400 mt-0.5">{ac.code}</span>
        <div className="flex-1 space-y-1">
          {ac.title && (
            <div className="text-[11px] text-slate-700">
              <span className="font-medium text-slate-500">タイトル:</span> {ac.title}
            </div>
          )}
          <div className="text-[11px] text-slate-700">
            <span className="font-medium text-slate-500">Given:</span> {ac.given}
          </div>
          <div className="text-[11px] text-slate-700">
            <span className="font-medium text-slate-500">When:</span> {ac.when}
          </div>
          <div className="text-[11px] text-slate-700">
            <span className="font-medium text-slate-500">Then:</span> {ac.then}
          </div>
        </div>
      </div>
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

/**
 * 情報行コンポーネント
 */
function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex">
      <div className="w-40 flex-shrink-0 px-4 py-2 bg-slate-50 text-[12px] font-medium text-slate-600">
        {label}
      </div>
      <div className="flex-1 px-4 py-2 text-[12px] text-slate-700 whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}
