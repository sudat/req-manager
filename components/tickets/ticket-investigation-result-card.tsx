"use client";

import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { InvestigationResult } from "@/lib/domain/value-objects";

interface TicketInvestigationResultCardProps {
  result: InvestigationResult;
}

export function TicketInvestigationResultCard({ result }: TicketInvestigationResultCardProps) {
  const { topDownResult, bottomUpResult } = result;

  const sections = [
    { label: "業務要件 (BR)", items: topDownResult.affectedBRs, color: "bg-blue-100 text-blue-800 border-blue-200" },
    { label: "システム機能 (SF)", items: topDownResult.affectedSFs, color: "bg-violet-100 text-violet-800 border-violet-200" },
    { label: "システム要件 (SR)", items: topDownResult.affectedSRs, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { label: "受入基準 (AC)", items: topDownResult.affectedACs, color: "bg-sky-100 text-sky-800 border-sky-200" },
  ];

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-4 w-4 text-brand" />
        <h3 className="text-[14px] font-semibold text-slate-900">影響調査結果</h3>
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] px-2 py-0.5 ml-auto">
          完了
        </Badge>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="text-[12px] font-medium text-slate-500 mb-1.5">{section.label}</p>
            {section.items.length === 0 ? (
              <p className="text-[12px] text-slate-400 italic">該当なし</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {section.items.map((id) => (
                  <Badge
                    key={id}
                    variant="outline"
                    className={`${section.color} text-[12px] font-mono px-2 py-0.5`}
                  >
                    {id}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* エントリポイント */}
        {topDownResult.affectedEntryPoints.length > 0 && (
          <div>
            <p className="text-[12px] font-medium text-slate-500 mb-1.5">エントリポイント</p>
            <div className="space-y-1">
              {topDownResult.affectedEntryPoints.map((ep, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400">{ep.sfId}</span>
                  <span className="text-[12px] text-slate-700 font-medium">{ep.path}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ボトムアップ（コード依存） */}
        <div>
          <p className="text-[12px] font-medium text-slate-500 mb-1.5">ボトムアップ（コード依存）</p>
          {!bottomUpResult ? (
            <p className="text-[12px] text-slate-400 italic">未実行（影響調査を再実行すると生成されます）</p>
          ) : bottomUpResult.error ? (
            <p className="text-[12px] text-rose-600">解析失敗: {bottomUpResult.error}</p>
          ) : (
            <div className="space-y-2">
              {bottomUpResult.repositoryUrl && (
                <p className="text-[12px] text-slate-600">
                  リポジトリ:{" "}
                  <span className="font-mono text-slate-900">{bottomUpResult.repositoryUrl}</span>
                </p>
              )}
              <p className="text-[12px] text-slate-600">
                影響ファイル:{" "}
                <span className="font-mono text-slate-900">{bottomUpResult.affectedFiles.length}</span>
                {" / "}
                スキャン:{" "}
                <span className="font-mono text-slate-900">
                  {bottomUpResult.explorationMetadata.totalFilesScanned}
                </span>
                {" / "}
                深さ:{" "}
                <span className="font-mono text-slate-900">
                  {bottomUpResult.explorationMetadata.maxDepthReached}
                </span>
                {" / "}
                shared:{" "}
                <span className="font-mono text-slate-900">
                  {bottomUpResult.affectedFiles.filter((f) => f.sharedModule).length}
                </span>
                {bottomUpResult.explorationMetadata.truncated && (
                  <span className="ml-2 text-amber-700">
                    （truncated: {bottomUpResult.explorationMetadata.truncationReason ?? "unknown"}）
                  </span>
                )}
              </p>
              {bottomUpResult.affectedFiles.length === 0 ? (
                <p className="text-[12px] text-slate-400 italic">該当なし</p>
              ) : (
                <>
                  <div className="max-h-28 overflow-y-auto pr-1 flex flex-wrap gap-1.5">
                    {bottomUpResult.affectedFiles.slice(0, 30).map((file) => (
                      <Badge
                        key={file.filePath}
                        variant="outline"
                        title={`depth=${file.depth}, confidence=${file.confidence.toFixed(2)}`}
                        className="bg-slate-50 text-slate-700 border-slate-200 text-[11px] font-mono px-2 py-0.5"
                      >
                        {file.filePath}
                      </Badge>
                    ))}
                  </div>
                  {bottomUpResult.affectedFiles.length > 30 && (
                    <p className="text-[12px] text-slate-400">
                      他 {bottomUpResult.affectedFiles.length - 30} 件
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
