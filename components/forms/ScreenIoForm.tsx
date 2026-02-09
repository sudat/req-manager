"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ScreenInput, ScreenOutput } from "@/lib/domain/schemas/io-schemas";

interface ScreenIoFormProps {
  input: ScreenInput;
  output: ScreenOutput;
  onInputChange: (input: ScreenInput) => void;
  onOutputChange: (output: ScreenOutput) => void;
  mode?: "input" | "output";
}

export function ScreenIoForm({
  input,
  output,
  onInputChange,
  onOutputChange,
  mode,
}: ScreenIoFormProps) {
  return (
    <div className="space-y-5">
      {(mode === "input" || !mode) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[20%_20%_60%] gap-3">
            <div className="space-y-1">
              <Label>操作対象</Label>
              <Input
                value={input.targetElement ?? ""}
                onChange={(e) => onInputChange({ ...input, targetElement: e.target.value })}
                placeholder="例: 一括発行ボタン"
              />
            </div>
            <div className="space-y-1">
              <Label>トリガー</Label>
              <Select
                value={input.trigger}
                onValueChange={(value) =>
                  onInputChange({ ...input, trigger: value as ScreenInput["trigger"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["click", "input", "load", "select"].map((trigger) => (
                    <SelectItem key={trigger} value={trigger}>
                      {trigger}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>操作内容</Label>
              <Input
                value={input.action ?? ""}
                onChange={(e) => onInputChange({ ...input, action: e.target.value })}
                placeholder="例: 請求書を発行"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>前提条件</Label>
            <Textarea
              value={input.precondition ?? ""}
              onChange={(e) => onInputChange({ ...input, precondition: e.target.value })}
              placeholder="例: 請求対象が1件以上選択されている"
              rows={2}
            />
          </div>
        </>
      )}

      {(mode === "output" || !mode) && (
        <>
          <div className="space-y-2">
            <Label>遷移先</Label>
            <Input
              value={output.transition ?? ""}
              onChange={(e) => onOutputChange({ ...output, transition: e.target.value })}
              placeholder="例: /invoices/complete"
            />
          </div>

          <div className="space-y-2">
            <Label>メッセージ</Label>
            <Textarea
              value={(output.messages ?? []).join("\n")}
              onChange={(e) =>
                onOutputChange({
                  ...output,
                  messages: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean),
                })
              }
              placeholder="1行に1メッセージ"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>期待動作</Label>
            <Textarea
              value={output.behavior ?? ""}
              onChange={(e) => onOutputChange({ ...output, behavior: e.target.value })}
              placeholder="例: 発行ジョブをキュー投入し、一覧を再読み込み"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>画面変化</Label>
            <Textarea
              value={output.displayChanges ?? ""}
              onChange={(e) => onOutputChange({ ...output, displayChanges: e.target.value })}
              placeholder="例: 対象行のステータスを「発行待ち」に更新、トースト表示"
              rows={2}
            />
          </div>
        </>
      )}
    </div>
  );
}
