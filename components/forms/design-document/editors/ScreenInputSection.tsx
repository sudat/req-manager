import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ScreenInput } from "@/lib/domain/schemas/io-schemas";
import { SCREEN_TRIGGERS } from "../constants";

export function ScreenInputSection({
  inputSchema,
  onChange,
}: {
  inputSchema: ScreenInput;
  onChange: (inputSchema: ScreenInput) => void;
}): ReactNode {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-1 md:grid-cols-[20%_20%_60%]">
        <div className="space-y-1">
          <Label className="text-xs">操作対象</Label>
          <Input
            value={inputSchema.targetElement ?? ""}
            onChange={(e) => onChange({ ...inputSchema, targetElement: e.target.value })}
            placeholder="例: 一括発行ボタン"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">トリガー</Label>
          <Select
            value={inputSchema.trigger}
            onValueChange={(value) =>
              onChange({ ...inputSchema, trigger: value as ScreenInput["trigger"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCREEN_TRIGGERS.map((trigger) => (
                <SelectItem key={trigger} value={trigger}>
                  {trigger}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">操作内容</Label>
          <Input
            value={inputSchema.action ?? ""}
            onChange={(e) => onChange({ ...inputSchema, action: e.target.value })}
            placeholder="例: 請求書を発行"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">前提条件</Label>
        <Textarea
          value={inputSchema.precondition ?? ""}
          onChange={(e) => onChange({ ...inputSchema, precondition: e.target.value })}
          placeholder="例: 請求対象が1件以上選択されている"
          rows={2}
        />
      </div>
    </div>
  );
}
