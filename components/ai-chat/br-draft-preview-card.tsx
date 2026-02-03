"use client";

import { FileText } from 'lucide-react';
import type { BrDraft } from './types';

type BrDraftPreviewCardProps = {
  draft: BrDraft;
};

/**
 * BR草案プレビューカード
 *
 * AIが生成したBR草案を表形式で表示する。
 */
export function BrDraftPreviewCard({ draft }: BrDraftPreviewCardProps) {
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
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
          未確定
        </span>
      </div>

      {/* 基本情報テーブル */}
      <div className="divide-y divide-slate-200">
        <InfoRow label="コード" value={draft.code} />
        <InfoRow label="要件" value={draft.requirement} />
        <InfoRow label="根拠" value={draft.rationale} />
        <InfoRow label="業務タスクID" value={draft.business_task_id} />
      </div>
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
