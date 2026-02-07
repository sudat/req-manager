"use client";

import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { BrDraft, DraftCommitState } from './types';

type BrDraftPreviewCardProps = {
  draft: BrDraft;
  commitState?: DraftCommitState;
  commitDisabled?: boolean;
  commitDisabledMessage?: string;
  onCommit?: () => void;
};

/**
 * BR草案プレビューカード
 *
 * AIが生成したBR草案を表形式で表示する。
 * BT未確定の場合は登録ボタンを無効化する。
 */
export function BrDraftPreviewCard({ draft, commitState, commitDisabled, commitDisabledMessage, onCommit }: BrDraftPreviewCardProps) {
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
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600" />
          <h3 className="text-[13px] font-semibold text-slate-700">
            業務要件草案
          </h3>
        </div>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium', statusClass)}>
          {statusLabel}
        </span>
      </div>

      {/* 基本情報テーブル */}
      <div className="divide-y divide-slate-200">
        <InfoRow label="コード" value={draft.code} />
        <InfoRow label="要件" value={draft.requirement} />
        <InfoRow label="根拠" value={draft.rationale} />
        <InfoRow label="業務タスクID" value={draft.business_task_id ?? '未確定'} />
      </div>

      {onCommit && status !== 'success' && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <div className="text-[11px] text-rose-600 min-h-[16px]">
            {commitDisabled ? commitDisabledMessage : (status === 'error' ? commitState?.message : '')}
          </div>
          <Button
            size="sm"
            onClick={onCommit}
            disabled={commitDisabled || status === 'loading'}
            className={cn('h-8 px-4 text-[12px]', commitDisabled || status === 'loading' ? 'bg-slate-300 hover:bg-slate-300' : 'bg-slate-900 hover:bg-slate-800')}
          >
            {status === 'loading' ? '登録中...' : '登録する'}
          </Button>
        </div>
      )}
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

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
