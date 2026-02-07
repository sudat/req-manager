"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApiInput, ApiOutput } from "@/lib/domain/schemas/io-schemas";
import type { Field } from "@/lib/domain/schemas/fields";
import { FieldEditor } from "./FieldEditor";
import { Plus, Trash2 } from "lucide-react";

interface ApiIoFormProps {
  input: ApiInput;
  output: ApiOutput;
  onInputChange: (input: ApiInput) => void;
  onOutputChange: (output: ApiOutput) => void;
  mode?: "input" | "output";
}

const createEmptyFieldList = (): Field[] => [];

export function ApiIoForm({
  input,
  output,
  onInputChange,
  onOutputChange,
  mode,
}: ApiIoFormProps) {
  const addError = () => {
    const next = output.error ? [...output.error] : [];
    next.push({ status: 400, fields: createEmptyFieldList() });
    onOutputChange({ ...output, error: next });
  };

  const updateError = (index: number, nextItem: NonNullable<ApiOutput["error"]>[number]) => {
    const list = output.error ? [...output.error] : [];
    list[index] = nextItem;
    onOutputChange({ ...output, error: list });
  };

  const removeError = (index: number) => {
    const list = output.error ? output.error.filter((_, i) => i !== index) : [];
    onOutputChange({ ...output, error: list.length > 0 ? list : undefined });
  };

  return (
    <div className="space-y-5">
      {(mode === "input" || !mode) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>メソッド</Label>
              <Select
                value={input.method}
                onValueChange={(value) =>
                  onInputChange({ ...input, method: value as ApiInput["method"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["GET", "POST", "PUT", "DELETE", "PATCH"].map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>パス</Label>
              <Input
                value={input.path}
                onChange={(e) => onInputChange({ ...input, path: e.target.value })}
                placeholder="/api/invoices"
              />
            </div>
          </div>

          <FieldEditor
            label="Query パラメータ"
            fields={input.query ?? []}
            onChange={(fields) => onInputChange({ ...input, query: fields })}
          />

          <FieldEditor
            label="Body パラメータ"
            fields={input.body ?? []}
            onChange={(fields) => onInputChange({ ...input, body: fields })}
          />
        </>
      )}

      {(mode === "output" || !mode) && (
        <>
          <div className="space-y-3">
            <Label>成功レスポンス</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">HTTPステータス</Label>
                <Input
                  type="number"
                  value={output.success.status}
                  onChange={(e) =>
                    onOutputChange({
                      ...output,
                      success: { ...output.success, status: Number(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
            <FieldEditor
              label="成功時フィールド"
              fields={output.success.fields}
              onChange={(fields) =>
                onOutputChange({ ...output, success: { ...output.success, fields } })
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>エラーレスポンス</Label>
              <Button variant="outline" onClick={addError}>
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </div>
            {output.error && output.error.length > 0 ? (
              <div className="space-y-4">
                {output.error.map((err, index) => (
                  <div key={index} className="rounded-md border p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">HTTPステータス</Label>
                        <Input
                          type="number"
                          value={err.status}
                          onChange={(e) =>
                            updateError(index, { ...err, status: Number(e.target.value) })
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeError(index)}
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <FieldEditor
                      label="エラー時フィールド"
                      fields={err.fields}
                      onChange={(fields) => updateError(index, { ...err, fields })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">エラー定義はまだありません。</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
