"use client";

import { FileText, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDraftEdit } from '@/hooks/use-draft-edit';
import { DraftInfoRow } from './draft-info-row';
import { ProcessStepsEditor, KeySourceEditor } from './draft-edit-fields';
import type { BtDraft, DraftCommitState } from './types';

type DraftPreviewCardProps = {
  draft: BtDraft;
  commitState?: DraftCommitState;
  onCommit?: () => void;
  onUpdateDraft?: (updated: BtDraft) => void;
};

/**
 * BT草案プレビューカード
 *
 * AIが生成したBT草案を表形式で表示する。
 */
export function DraftPreviewCard({ draft, commitState, onCommit, onUpdateDraft }: DraftPreviewCardProps) {
  const { isEditing, currentDraft, startEdit, cancelEdit, saveEdit, updateField, canEdit } = useDraftEdit(draft, onUpdateDraft);

  const isCommitted = Boolean(currentDraft.isCommitted);
  const status = isCommitted ? 'success' : commitState?.status ?? 'idle';
  const isLocked = status === 'success' || status === 'loading';
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
            業務タスク草案
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
        <DraftInfoRow label="業務名" value={currentDraft.name} isEditing={isEditing} onChange={(v) => updateField('name', v)} />
        <DraftInfoRow label="概要" value={currentDraft.summary} isEditing={isEditing} multiline onChange={(v) => updateField('summary', v)} />
      </div>

      {/* 業務プロセス */}
      {isEditing ? (
        <ProcessStepsEditor steps={currentDraft.processSteps} onChange={(v) => updateField('processSteps', v)} />
      ) : currentDraft.processSteps.length > 0 ? (
        <div className="border-t border-slate-200">
          <div className="px-4 py-2 bg-slate-50">
            <h4 className="text-[12px] font-semibold text-slate-700">業務プロセス</h4>
          </div>
          <table className="w-full text-[12px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">いつ</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">だれが</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">何を</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentDraft.processSteps.map((step, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">{step.when}</td>
                  <td className="px-4 py-2 text-slate-700">{step.who}</td>
                  <td className="px-4 py-2 text-slate-700">{step.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* インプット */}
      {isEditing ? (
        <KeySourceEditor label="インプット" sourceLabel="取得元" items={currentDraft.input} onChange={(v) => updateField('input', v)} />
      ) : currentDraft.input.length > 0 ? (
        <div className="border-t border-slate-200">
          <div className="px-4 py-2 bg-slate-50">
            <h4 className="text-[12px] font-semibold text-slate-700">インプット</h4>
          </div>
          <table className="w-full text-[12px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">名称</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">取得元</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentDraft.input.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">{item.name}</td>
                  <td className="px-4 py-2 text-slate-700">{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* アウトプット */}
      {isEditing ? (
        <KeySourceEditor label="アウトプット" sourceLabel="出力先" items={currentDraft.output} onChange={(v) => updateField('output', v)} />
      ) : currentDraft.output.length > 0 ? (
        <div className="border-t border-slate-200">
          <div className="px-4 py-2 bg-slate-50">
            <h4 className="text-[12px] font-semibold text-slate-700">アウトプット</h4>
          </div>
          <table className="w-full text-[12px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">名称</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">出力先</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentDraft.output.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">{item.name}</td>
                  <td className="px-4 py-2 text-slate-700">{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

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
      ) : onCommit && status !== 'success' ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <div className="text-[11px] text-rose-600 min-h-[16px]">
            {status === 'error' ? commitState?.message : ''}
          </div>
          <Button
            size="sm"
            onClick={onCommit}
            disabled={status === 'loading'}
            className="h-8 px-4 text-[12px] bg-slate-900 hover:bg-slate-800"
          >
            {status === 'loading' ? '登録中...' : '登録する'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
