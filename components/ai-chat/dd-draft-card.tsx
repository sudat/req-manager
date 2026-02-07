"use client";

import { FileCode2, FileText, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toYamlText, parseYamlObject } from "@/lib/utils/yaml";
import { DD_TYPE_LABELS, DD_TYPE_COLORS } from "@/lib/domain/enums";
import type { DdType } from "@/lib/domain/enums";
import { EntryPointsInlineEditor } from "@/components/forms/entry-points/EntryPointsInlineEditor";
import { useDraftEdit } from "@/hooks/use-draft-edit";
import { DraftInfoRow } from "./draft-info-row";
import type { DdDraft, DraftCommitState } from "./types";

type DdDraftCardProps = {
  draft: DdDraft;
  commitState?: DraftCommitState;
  onCommit?: () => void;
  onUpdateDraft?: (updated: DdDraft) => void;
};

export function DdDraftCard({ draft, commitState, onCommit, onUpdateDraft }: DdDraftCardProps) {
  const { isEditing, currentDraft, startEdit, cancelEdit, saveEdit, updateField, canEdit } = useDraftEdit(draft, onUpdateDraft);

  const status = commitState?.status ?? "idle";
  const isLocked = status === "success" || status === "loading";
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

  const typeLabel = DD_TYPE_LABELS[currentDraft.type] ?? currentDraft.type;
  const typeColor = DD_TYPE_COLORS[currentDraft.type] ?? "border-slate-200 bg-slate-50 text-slate-700";
  const entryPoints = currentDraft.entryPoints ?? [];
  const detailsText = toYamlText(currentDraft.details ?? {}).trim();

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600" />
          <h3 className="text-[13px] font-semibold text-slate-700">DD草案</h3>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && !isLocked && !isEditing && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] text-slate-500" onClick={startEdit}>
              <Pencil className="h-3 w-3" />
              編集
            </Button>
          )}
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium", statusClass)}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        <DraftInfoRow label="ID" value={currentDraft.id} isEditing={isEditing} readOnly />
        {currentDraft.code && <DraftInfoRow label="コード" value={currentDraft.code} isEditing={isEditing} readOnly />}
        <DraftInfoRow label="名称" value={currentDraft.name} isEditing={isEditing} onChange={(v) => updateField("name", v)} />
        {isEditing ? (
          <div className="flex">
            <div className="w-40 flex-shrink-0 px-4 py-2 bg-slate-50 text-[12px] font-medium text-slate-600">種別</div>
            <div className="flex-1 px-4 py-2">
              <select
                value={currentDraft.type}
                onChange={(e) => updateField("type", e.target.value as DdType)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-3 text-[12px]"
              >
                {Object.entries(DD_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <DraftInfoRow label="種別" value={typeLabel} valueClassName={typeColor} />
        )}
        <DraftInfoRow label="概要" value={currentDraft.summary} isEditing={isEditing} multiline onChange={(v) => updateField("summary", v)} />
        <DraftInfoRow label="SRF ID" value={currentDraft.srfId} isEditing={isEditing} readOnly />
      </div>

      {/* エントリポイント */}
      {isEditing ? (
        <div className="border-t border-slate-200 px-4 py-3">
          <EntryPointsInlineEditor
            entryPoints={entryPoints}
            onChange={(v) => updateField("entryPoints", v)}
          />
        </div>
      ) : (
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
      )}

      {/* 設計方針 */}
      {(currentDraft.designPolicy || isEditing) && (
        <div className="border-t border-slate-200">
          <div className="px-4 py-2 bg-slate-50">
            <h4 className="text-[12px] font-semibold text-slate-700">設計方針</h4>
          </div>
          <div className="px-4 py-3">
            {isEditing ? (
              <Textarea
                value={currentDraft.designPolicy ?? ""}
                onChange={(e) => updateField("designPolicy", e.target.value)}
                className="min-h-[60px] text-[12px]"
              />
            ) : (
              <div className="text-[12px] text-slate-600 whitespace-pre-wrap">
                {currentDraft.designPolicy}
              </div>
            )}
          </div>
        </div>
      )}

      {/* details (YAML) */}
      <div className="border-t border-slate-200">
        <div className="px-4 py-2 bg-slate-50">
          <h4 className="text-[12px] font-semibold text-slate-700">details</h4>
        </div>
        <div className="px-4 py-3">
          {isEditing ? (
            <Textarea
              value={detailsText}
              onChange={(e) => {
                const parsed = parseYamlObject(e.target.value);
                updateField("details", Object.keys(parsed).length > 0 ? parsed : { _raw: e.target.value });
              }}
              className="min-h-[80px] text-[11px] font-mono"
              placeholder="YAML形式で入力"
            />
          ) : detailsText ? (
            <pre className="text-[11px] text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-md p-3 border border-slate-200">
              {detailsText}
            </pre>
          ) : (
            <div className="text-[12px] text-slate-500">未設定</div>
          )}
        </div>
      </div>

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
      ) : onCommit && status !== "success" ? (
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
      ) : null}
    </div>
  );
}
