"use client";

import { FileCode2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toYamlText } from "@/lib/utils/yaml";
import { DD_TYPE_LABELS, DD_TYPE_COLORS } from "@/lib/domain/enums";
import type { DdDraft, DraftCommitState } from "./types";

type DdDraftCardProps = {
  draft: DdDraft;
  commitState?: DraftCommitState;
  onCommit?: () => void;
};

export function DdDraftCard({ draft, commitState, onCommit }: DdDraftCardProps) {
  const status = commitState?.status ?? "idle";
  const statusLabel =
    status === "success"
      ? "登録済"
      : status === "loading"
        ? "登録中"
        : status === "error"
          ? "登録失敗"
          : "未確定";
  const statusClass =
    status === "success"
      ? "bg-emerald-100 text-emerald-700"
      : status === "loading"
        ? "bg-sky-100 text-sky-700"
        : status === "error"
          ? "bg-rose-100 text-rose-700"
          : "bg-amber-100 text-amber-700";

  const typeLabel = DD_TYPE_LABELS[draft.type] ?? draft.type;
  const typeColor = DD_TYPE_COLORS[draft.type] ?? "border-slate-200 bg-slate-50 text-slate-700";
  const entryPoints = draft.entryPoints ?? [];
  const detailsText = toYamlText(draft.details ?? {}).trim();

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600" />
          <h3 className="text-[13px] font-semibold text-slate-700">DD草案</h3>
        </div>
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium", statusClass)}>
          {statusLabel}
        </span>
      </div>

      <div className="divide-y divide-slate-200">
        <InfoRow label="ID" value={draft.id} />
        <InfoRow label="名称" value={draft.name} />
        <InfoRow label="種別" value={typeLabel} valueClassName={typeColor} />
        {draft.summary && <InfoRow label="概要" value={draft.summary} />}
      </div>

      <div className="border-t border-slate-200">
        <div className="px-4 py-2 bg-slate-50">
          <h4 className="text-[12px] font-semibold text-slate-700">エントリポイント</h4>
        </div>
        {entryPoints.length === 0 ? (
          <div className="px-4 py-3 text-[12px] text-slate-500">未設定</div>
        ) : (
          <div className="px-4 py-3 space-y-2">
            {entryPoints.map((entry, index) => (
              <div key={`${entry.path}-${index}`} className="flex items-start gap-2 text-[12px]">
                <FileCode2 className="h-4 w-4 text-slate-500 mt-0.5" />
                <div className="space-y-0.5">
                  <code className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {entry.path}
                  </code>
                  {(entry.type || entry.responsibility) && (
                    <div className="text-[11px] text-slate-600">
                      {entry.type && <span className="font-medium">({entry.type})</span>}
                      {entry.type && entry.responsibility && " "}
                      {entry.responsibility && <span>- {entry.responsibility}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {draft.designPolicy && (
        <div className="border-t border-slate-200">
          <div className="px-4 py-2 bg-slate-50">
            <h4 className="text-[12px] font-semibold text-slate-700">設計方針</h4>
          </div>
          <div className="px-4 py-3 text-[12px] text-slate-600 whitespace-pre-wrap">
            {draft.designPolicy}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200">
        <div className="px-4 py-2 bg-slate-50">
          <h4 className="text-[12px] font-semibold text-slate-700">details</h4>
        </div>
        <div className="px-4 py-3">
          {detailsText ? (
            <pre className="text-[11px] text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-md p-3 border border-slate-200">
              {detailsText}
            </pre>
          ) : (
            <div className="text-[12px] text-slate-500">未設定</div>
          )}
        </div>
      </div>

      {onCommit && status !== "success" && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <div className="text-[11px] text-rose-600 min-h-[16px]">
            {status === "error" ? commitState?.message : ""}
          </div>
          <Button
            size="sm"
            onClick={onCommit}
            disabled={status === "loading"}
            className="h-8 px-4 text-[12px] bg-slate-900 hover:bg-slate-800"
          >
            {status === "loading" ? "登録中..." : "登録する"}
          </Button>
        </div>
      )}
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

function InfoRow({ label, value, valueClassName }: InfoRowProps) {
  return (
    <div className="flex">
      <div className="w-40 flex-shrink-0 px-4 py-2 bg-slate-50 text-[12px] font-medium text-slate-600">
        {label}
      </div>
      <div className="flex-1 px-4 py-2 text-[12px] text-slate-700 whitespace-pre-wrap">
        {valueClassName ? (
          <Badge variant="outline" className={`${valueClassName} text-[11px] font-medium`}>
            {value}
          </Badge>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
