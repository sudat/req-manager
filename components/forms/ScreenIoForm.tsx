"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ScreenInput, ScreenOutput } from "@/lib/domain/schemas/io-schemas";
import { FieldEditor } from "./FieldEditor";

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          </div>

          <FieldEditor
            label="画面要素"
            fields={input.elements ?? []}
            onChange={(fields) => onInputChange({ ...input, elements: fields })}
          />
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
        </>
      )}
    </div>
  );
}
