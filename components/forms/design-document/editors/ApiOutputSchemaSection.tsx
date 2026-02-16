import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiOutput } from "@/lib/domain/schemas/io-schemas";

export function ApiOutputSchemaSection({
  outputSchema,
  onChange,
}: {
  outputSchema: ApiOutput;
  onChange: (outputSchema: ApiOutput) => void;
}): ReactNode {
  const addErrorPattern = () => {
    onChange({
      ...outputSchema,
      error: [
        ...(outputSchema.error ?? []),
        { status: 400, fields: [], description: "" },
      ],
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border-2 border-green-200 bg-green-50/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-green-800 font-semibold">成功ステータスコード</Label>
          <Input
            type="number"
            className="w-24 h-8"
            value={outputSchema.success.status}
            onChange={(e) =>
              onChange({
                ...outputSchema,
                success: {
                  ...outputSchema.success,
                  status: e.target.value === "" ? 200 : Number(e.target.value),
                },
              })
            }
            placeholder="200"
          />
        </div>
        <p className="text-xs text-green-700">成功時に返すHTTPステータスコードを定義します</p>
      </div>

      <div className="rounded-md border-2 border-red-200 bg-red-50/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-red-800 font-semibold">エラーパターン</Label>
            <p className="text-xs text-red-700 mt-1">発生しうるエラーのステータスコードと条件を定義します</p>
          </div>
          <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addErrorPattern}>
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
        {(outputSchema.error ?? []).map((errorPattern, index) => (
          <div key={index} className="rounded-md border border-red-300 bg-white p-2 space-y-2">
            <div className="grid gap-2 md:grid-cols-[auto_1fr_auto] items-center">
              <Input
                type="number"
                className="w-24"
                placeholder="400"
                value={errorPattern.status}
                onChange={(e) => {
                  const next = [...(outputSchema.error ?? [])];
                  next[index] = { ...next[index], status: e.target.value === "" ? 400 : Number(e.target.value) };
                  onChange({ ...outputSchema, error: next });
                }}
              />
              <Input
                placeholder="説明（例: メールアドレスが既に登録されている場合）"
                value={errorPattern.description ?? ""}
                onChange={(e) => {
                  const next = [...(outputSchema.error ?? [])];
                  next[index] = { ...next[index], description: e.target.value };
                  onChange({ ...outputSchema, error: next });
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onChange({
                    ...outputSchema,
                    error: (outputSchema.error ?? []).filter((_, i) => i !== index),
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
