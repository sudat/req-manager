import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ScreenOutput } from "@/lib/domain/schemas/io-schemas";

export function ScreenOutputSection({
  outputSchema,
  onChange,
}: {
  outputSchema: ScreenOutput;
  onChange: (outputSchema: ScreenOutput) => void;
}): ReactNode {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">遷移先</Label>
        <Input
          value={outputSchema.transition ?? ""}
          onChange={(e) => onChange({ ...outputSchema, transition: e.target.value })}
          placeholder="例: /invoices/complete"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">メッセージ</Label>
        <Textarea
          value={(outputSchema.messages ?? []).join("\n")}
          onChange={(e) =>
            onChange({
              ...outputSchema,
              messages: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean),
            })
          }
          placeholder="1行に1メッセージ"
          rows={3}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">期待動作</Label>
        <Textarea
          value={outputSchema.behavior ?? ""}
          onChange={(e) => onChange({ ...outputSchema, behavior: e.target.value })}
          placeholder="例: 発行ジョブをキュー投入し、一覧を再読み込み"
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">画面変化</Label>
        <Textarea
          value={outputSchema.displayChanges ?? ""}
          onChange={(e) => onChange({ ...outputSchema, displayChanges: e.target.value })}
          placeholder="例: 対象行のステータスを「発行待ち」に更新、トースト表示"
          rows={2}
        />
      </div>
    </div>
  );
}
