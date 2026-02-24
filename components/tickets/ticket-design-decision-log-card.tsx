"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollText } from "lucide-react";
import { createDesignDecisionLog, updateDesignDecisionLogStatus } from "@/lib/data/design-decision-logs";
import type { DesignDecisionLog, DesignDecisionLogTargetType } from "@/lib/domain/value-objects";

interface TicketDesignDecisionLogCardProps {
  changeRequestId: string;
  initialLogs: DesignDecisionLog[];
  targetOptions: Array<{
    targetType: DesignDecisionLogTargetType;
    targetId: string;
    label: string;
  }>;
}

const statusLabel: Record<DesignDecisionLog["status"], string> = {
  proposed: "提案",
  confirmed: "確定",
  rejected: "却下",
};

const createdByLabel: Record<DesignDecisionLog["createdBy"], string> = {
  agent: "Agent",
  human: "人",
};

const targetTypeLabel: Record<DesignDecisionLogTargetType, string> = {
  bt: "BT",
  br: "BR",
  sf: "SF",
  sr: "SR",
  ac: "AC",
  impl_unit: "DD",
  change_request: "CR",
};

export function TicketDesignDecisionLogCard({
  changeRequestId,
  initialLogs,
  targetOptions,
}: TicketDesignDecisionLogCardProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [targetType, setTargetType] = useState<DesignDecisionLogTargetType>("change_request");
  const [targetId, setTargetId] = useState(changeRequestId);
  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const visibleTargetOptions = targetOptions.filter((opt) => opt.targetType === targetType);

  const handleSave = async () => {
    const trimmedDecision = decision.trim();
    const trimmedRationale = rationale.trim();
    const trimmedTargetId = targetId.trim();
    if (!trimmedTargetId || !trimmedDecision || !trimmedRationale) {
      setError("対象ID・決定内容・根拠メモを全部入力してな。");
      return;
    }

    setSaving(true);
    setError(null);

    const { data, error: saveError } = await createDesignDecisionLog({
      changeRequestId,
      createdBy: "human",
      contextTargetType: targetType,
      contextTargetId: trimmedTargetId,
      contextField: "impact_investigation",
      decision: trimmedDecision,
      rationaleType: "user_input",
      rationaleExplanation: trimmedRationale,
      status: "confirmed",
      confirmedBy: "manual_user",
      confirmedAt: new Date().toISOString(),
    });

    if (saveError || !data) {
      setError(saveError ?? "設計決定ログの保存に失敗したで。");
      setSaving(false);
      return;
    }

    setLogs((prev) => [data, ...prev]);
    setDecision("");
    setRationale("");
    setTargetId(trimmedTargetId);
    setSaving(false);
  };

  const handleConfirm = async (logId: string) => {
    setError(null);
    setUpdatingId(logId);
    const { data, error: updateError } = await updateDesignDecisionLogStatus(logId, "confirmed", {
      confirmedBy: "manual_user",
    });
    if (updateError || !data) {
      setError(updateError ?? "承認更新に失敗したで。");
      setUpdatingId(null);
      return;
    }
    setLogs((prev) => prev.map((log) => (log.id === logId ? data : log)));
    setUpdatingId(null);
  };

  const handleReject = async (logId: string) => {
    setError(null);
    setUpdatingId(logId);
    const { data, error: updateError } = await updateDesignDecisionLogStatus(logId, "rejected", {
      reviewNote,
    });
    if (updateError || !data) {
      setError(updateError ?? "差し戻し更新に失敗したで。");
      setUpdatingId(null);
      return;
    }
    setLogs((prev) => prev.map((log) => (log.id === logId ? data : log)));
    setUpdatingId(null);
    setRejectingId(null);
    setReviewNote("");
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-slate-600" />
        <h3 className="text-[14px] font-semibold text-slate-900">設計決定ログ（なぜメモ）</h3>
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-medium text-slate-600">対象種別</label>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as DesignDecisionLogTargetType)}
          className="w-full h-9 rounded-md border border-slate-200 px-2 text-[13px] bg-white"
          disabled={saving}
        >
          {(Object.keys(targetTypeLabel) as DesignDecisionLogTargetType[]).map((key) => (
            <option key={key} value={key}>
              {targetTypeLabel[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-medium text-slate-600">対象ID</label>
        <Input
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          placeholder="例: BR-AR-0003-0001"
          disabled={saving}
        />
        {visibleTargetOptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTargetOptions.map((opt) => (
              <button
                key={`${opt.targetType}:${opt.targetId}`}
                type="button"
                onClick={() => setTargetId(opt.targetId)}
                className="text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                disabled={saving}
                title={opt.label}
              >
                {opt.targetId}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-medium text-slate-600">決定内容</label>
        <Textarea
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          placeholder="例: 影響範囲の初期対象を BR-AR-0003-0001, BR-AR-0003-0002 に限定する"
          className="min-h-[72px]"
          disabled={saving}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-medium text-slate-600">根拠メモ（なぜ）</label>
        <Textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="例: 変更要求の背景が請求書送信導線の改善に限定されるため"
          className="min-h-[88px]"
          disabled={saving}
        />
      </div>

      {error && (
        <p className="text-[12px] text-rose-600">{error}</p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-8 text-[12px]"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "保存中..." : "ログを追加"}
        </Button>
      </div>

      <div className="border-t border-slate-100 pt-3 space-y-2">
        <p className="text-[12px] text-slate-500">記録済みログ ({logs.length})</p>
        {logs.length === 0 ? (
          <p className="text-[12px] text-slate-400 italic">まだログはないで。</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-md border border-slate-200 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {statusLabel[log.status]}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {createdByLabel[log.createdBy]}
                  </Badge>
                  <span className="text-[11px] text-slate-500 ml-auto">
                    {new Date(log.createdAt).toLocaleString("ja-JP")}
                  </span>
                </div>
                <p className="text-[13px] text-slate-900">{log.decision}</p>
                <p className="text-[12px] text-slate-600">{log.rationale.explanation}</p>
                <p className="font-mono text-[11px] text-slate-500">
                  {targetTypeLabel[log.context.targetType]}: {log.context.targetId}
                </p>
                {log.createdBy === "agent" && log.status === "proposed" && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {rejectingId === log.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="差し戻し理由（任意）"
                          className="min-h-[64px]"
                          disabled={updatingId !== null}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px]"
                            disabled={updatingId !== null}
                            onClick={() => {
                              setRejectingId(null);
                              setReviewNote("");
                            }}
                          >
                            キャンセル
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] border-rose-300 text-rose-700"
                            disabled={updatingId !== null}
                            onClick={() => handleReject(log.id)}
                          >
                            {updatingId === log.id ? "更新中..." : "差し戻し実行"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] border-emerald-300 text-emerald-700"
                          disabled={updatingId !== null}
                          onClick={() => handleConfirm(log.id)}
                        >
                          {updatingId === log.id ? "更新中..." : "承認"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] border-rose-300 text-rose-700"
                          disabled={updatingId !== null}
                          onClick={() => setRejectingId(log.id)}
                        >
                          差し戻し
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
