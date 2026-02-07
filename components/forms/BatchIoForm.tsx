"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BatchInput, BatchOutput } from "@/lib/domain/schemas/io-schemas";
import { FieldEditor } from "./FieldEditor";

interface BatchIoFormProps {
  input: BatchInput;
  output: BatchOutput;
  onInputChange: (input: BatchInput) => void;
  onOutputChange: (output: BatchOutput) => void;
  mode?: "input" | "output";
}

export function BatchIoForm({
  input,
  output,
  onInputChange,
  onOutputChange,
  mode,
}: BatchIoFormProps) {
  return (
    <div className="space-y-5">
      {(mode === "input" || !mode) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>スケジュール</Label>
              <Input
                value={input.schedule}
                onChange={(e) => onInputChange({ ...input, schedule: e.target.value })}
                placeholder="例: 0 2 * * *"
              />
            </div>
            <div className="space-y-1">
              <Label>入力ソース</Label>
              <Input
                value={input.source}
                onChange={(e) => onInputChange({ ...input, source: e.target.value })}
                placeholder="例: s3://bucket/path"
              />
            </div>
          </div>

          <FieldEditor
            label="パラメータ"
            fields={input.parameters ?? []}
            onChange={(fields) => onInputChange({ ...input, parameters: fields })}
          />
        </>
      )}

      {(mode === "output" || !mode) && (
        <div className="space-y-3">
          <Label>出力サマリ</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">処理件数</Label>
              <Input
                type="number"
                value={output.summary.processedCount}
                onChange={(e) =>
                  onOutputChange({
                    ...output,
                    summary: { ...output.summary, processedCount: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">成功件数</Label>
              <Input
                type="number"
                value={output.summary.successCount}
                onChange={(e) =>
                  onOutputChange({
                    ...output,
                    summary: { ...output.summary, successCount: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">失敗件数</Label>
              <Input
                type="number"
                value={output.summary.errorCount}
                onChange={(e) =>
                  onOutputChange({
                    ...output,
                    summary: { ...output.summary, errorCount: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ステータス</Label>
              <Select
                value={output.summary.status}
                onValueChange={(value) =>
                  onOutputChange({
                    ...output,
                    summary: { ...output.summary, status: value as BatchOutput["summary"]["status"] },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["completed", "partial", "failed"].map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">実行時間(ms)</Label>
              <Input
                type="number"
                value={output.summary.executionTimeMs ?? ""}
                onChange={(e) =>
                  onOutputChange({
                    ...output,
                    summary: {
                      ...output.summary,
                      executionTimeMs: e.target.value === "" ? undefined : Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">次バッチ</Label>
              <Input
                value={output.nextBatch ?? ""}
                onChange={(e) => onOutputChange({ ...output, nextBatch: e.target.value })}
                placeholder="次のバッチID（任意）"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
