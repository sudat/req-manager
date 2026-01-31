"use client";

import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BtDraft } from './types';

type DraftPreviewCardProps = {
  draft: BtDraft;
};

/**
 * BT草案プレビューカード
 *
 * AIが生成したBT草案を表形式で表示する。
 */
export function DraftPreviewCard({ draft }: DraftPreviewCardProps) {
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
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
          未確定
        </span>
      </div>

      {/* 基本情報テーブル */}
      <div className="divide-y divide-slate-200">
        <InfoRow label="コード" value={draft.code} />
        <InfoRow label="業務名" value={draft.name} />
        <InfoRow label="概要" value={draft.summary} />
        <InfoRow label="業務コンテキスト" value={draft.businessContext} />
      </div>

      {/* 業務プロセステーブル */}
      {draft.processSteps.length > 0 && (
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
              {draft.processSteps.map((step, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">{step.when}</td>
                  <td className="px-4 py-2 text-slate-700">{step.who}</td>
                  <td className="px-4 py-2 text-slate-700">{step.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* インプットテーブル */}
      {draft.input.length > 0 && (
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
              {draft.input.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">{item.name}</td>
                  <td className="px-4 py-2 text-slate-700">{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* アウトプットテーブル */}
      {draft.output.length > 0 && (
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
              {draft.output.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">{item.name}</td>
                  <td className="px-4 py-2 text-slate-700">{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
