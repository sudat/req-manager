"use client";

import { useState } from 'react';
import { Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SfDraft, SrDraft } from './types';

type SfDraftCardProps = {
  draft: SfDraft;
};

/**
 * SF草案プレビューカード
 *
 * AIが生成したシステム機能（SF）草案を表形式で表示する。
 */
export function SfDraftCard({ draft }: SfDraftCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
          未確定
        </span>
      </div>

      {/* 基本情報テーブル */}
      <div className="divide-y divide-slate-200">
        <InfoRow label="コード" value={draft.code} />
        <InfoRow label="機能名" value={draft.name} />
        <InfoRow label="説明" value={draft.description} />
      </div>

      {/* システム要件一覧 */}
      {draft.srs.length > 0 && (
        <div className="border-t border-slate-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <h4 className="text-[12px] font-semibold text-slate-700">
              システム要件 ({draft.srs.length}件)
            </h4>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {isExpanded && (
            <div className="divide-y divide-slate-100">
              {draft.srs.map((sr) => (
                <SrListItem key={sr.code} sr={sr} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SR一覧アイテム
 */
function SrListItem({ sr }: { sr: SrDraft }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-[11px] font-mono text-slate-500">{sr.code}</span>
          <span className="text-[12px] text-slate-700 truncate">{sr.requirement}</span>
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
