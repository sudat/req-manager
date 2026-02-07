"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JobInput, JobOutput } from "@/lib/domain/schemas/io-schemas";
import { FieldEditor } from "./FieldEditor";

interface JobIoFormProps {
  input: JobInput;
  output: JobOutput;
  onInputChange: (input: JobInput) => void;
  onOutputChange: (output: JobOutput) => void;
  mode?: "input" | "output";
}

export function JobIoForm({
  input,
  output,
  onInputChange,
  onOutputChange,
  mode,
}: JobIoFormProps) {
  return (
    <div className="space-y-5">
      {(mode === "input" || !mode) && (
        <>
          <div className="space-y-1">
            <Label>イベント</Label>
            <Input
              value={input.event}
              onChange={(e) => onInputChange({ ...input, event: e.target.value })}
              placeholder="例: InvoiceIssued"
            />
          </div>

          <FieldEditor
            label="ペイロード"
            fields={input.payload ?? []}
            onChange={(fields) => onInputChange({ ...input, payload: fields })}
          />
        </>
      )}

      {(mode === "output" || !mode) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>結果</Label>
            <Input
              value={output.result}
              onChange={(e) => onOutputChange({ ...output, result: e.target.value })}
              placeholder="例: processed"
            />
          </div>
          <div className="space-y-1">
            <Label>次のイベント</Label>
            <Input
              value={output.nextEvent ?? ""}
              onChange={(e) => onOutputChange({ ...output, nextEvent: e.target.value })}
              placeholder="任意"
            />
          </div>
        </div>
      )}
    </div>
  );
}
