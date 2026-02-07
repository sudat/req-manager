"use client";

import { useState } from 'react';
import { Layers, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDraftEdit } from '@/hooks/use-draft-edit';
import { DraftInfoRow } from './draft-info-row';
import type { SfDraft, SrDraft, DraftCommitState } from './types';

type SfDraftCardProps = {
  draft: SfDraft;
  commitState?: DraftCommitState;
  onCommit?: () => void;
  onUpdateDraft?: (updated: SfDraft) => void;
};

/**
 * SF草案プレビューカード
 *
 * AIが生成したシステム機能（SF）草案を表形式で表示する。
 */
export function SfDraftCard({ draft, commitState, onCommit, onUpdateDraft }: SfDraftCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { isEditing, currentDraft, startEdit, cancelEdit, saveEdit, updateField, canEdit } = useDraftEdit(draft, onUpdateDraft);

  const baseStatus = commitState?.status ?? 'idle';
  const status = currentDraft.isCommitted && baseStatus === 'idle' ? 'success' : baseStatus;
  const isLocked = currentDraft.isCommitted === true || status === 'success' || status === 'loading';
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
          <Layers className="h-4 w-4 text-slate-600" />
          <h3 className="text-[13px] font-semibold text-slate-700">
            システム機能草案
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && !isLocked && !isEditing && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] text-slate-500" onClick={startEdit}>
              <Pencil className="h-3 w-3" />
              編集
            </Button>
          )}
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium', statusClass)}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* 基本情報テーブル */}
      <div className="divide-y divide-slate-200">
        <DraftInfoRow label="コード" value={currentDraft.code} isEditing={isEditing} readOnly />
        <DraftInfoRow label="機能名" value={currentDraft.name} isEditing={isEditing} onChange={(v) => updateField('name', v)} />
        <DraftInfoRow label="説明" value={currentDraft.description} isEditing={isEditing} multiline onChange={(v) => updateField('description', v)} />
      </div>

      {/* システム要件一覧（読取専用） */}
      {currentDraft.srs.length > 0 && (
        <div className="border-t border-slate-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <h4 className="text-[12px] font-semibold text-slate-700">
              システム要件 ({currentDraft.srs.length}件)
            </h4>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {isExpanded && (
            <div className="divide-y divide-slate-100">
              {currentDraft.srs.map((sr) => (
                <SrListItem key={sr.code} sr={sr} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 編集アクション or 登録ボタン */}
      {isEditing ? (
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <Button variant="ghost" size="sm" className="h-8 px-4 text-[12px]" onClick={cancelEdit}>
            キャンセル
          </Button>
          <Button size="sm" className="h-8 px-4 text-[12px] bg-slate-900 hover:bg-slate-800" onClick={saveEdit}>
            保存
          </Button>
        </div>
      ) : onCommit && !isLocked ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <div className="text-[11px] text-rose-600 min-h-[16px]">
            {status === 'error' ? commitState?.message : ''}
          </div>
          <Button
            size="sm"
            onClick={onCommit}
            className="h-8 px-4 text-[12px] bg-slate-900 hover:bg-slate-800"
          >
            登録する
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * SR一覧アイテム
 */
function SrListItem({ sr }: { sr: SrDraft }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const title = sr.title || sr.requirement;
  const summary = sr.summary || sr.requirement;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-[11px] font-mono text-slate-500">{sr.code}</span>
          <span className="text-[12px] text-slate-700 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">AC: {sr.acs.length}件</span>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-slate-400" />
          ) : (
            <ChevronRight className="h-3 w-3 text-slate-400" />
          )}
        </div>
      </button>

          {isExpanded && (
            <div className="px-4 pb-2 bg-slate-50/50">
              <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                <div className="text-[11px] text-slate-600">
                  <span className="font-medium">タイプ:</span> {sr.type}
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-medium">概要:</span> {summary}
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-medium">根拠:</span> {sr.rationale}
                </div>
            {sr.acs.length > 0 && (
              <div className="mt-2">
                <div className="text-[10px] font-medium text-slate-500 mb-1">受入基準:</div>
                <div className="space-y-1">
                  {sr.acs.map((ac) => (
                    <div key={ac.code} className="text-[10px] text-slate-600">
                      <span className="font-mono text-slate-400">{ac.code}:</span>{' '}
                      Given {ac.given} When {ac.when} Then {ac.then}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
