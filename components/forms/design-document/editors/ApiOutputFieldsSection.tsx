import type { ReactNode } from "react";
import { FieldEditor } from "@/components/forms/FieldEditor";
import type { ApiOutput } from "@/lib/domain/schemas/io-schemas";

export function ApiOutputFieldsSection({
  outputSchema,
  onChange,
}: {
  outputSchema: ApiOutput;
  onChange: (outputSchema: ApiOutput) => void;
}): ReactNode {
  return (
    <div className="space-y-3">
      <FieldEditor
        label="成功レスポンス項目"
        labelTooltip="成功時に返すデータ項目です。画面表示や後続処理で利用する値を記述します。"
        description="成功時のレスポンスボディ項目"
        fields={outputSchema.success.fields}
        onChange={(fields) =>
          onChange({
            ...outputSchema,
            success: { ...outputSchema.success, fields },
          })
        }
        compactPreview
      />

      {(outputSchema.error ?? []).map((errorPattern, index) => (
        <div key={index} className="rounded-md border border-red-200 bg-red-50/20 p-3">
          <div className="mb-2 text-xs text-red-700">
            エラー項目: HTTP {errorPattern.status}
            {errorPattern.description ? `（${errorPattern.description}）` : ""}
          </div>
          <FieldEditor
            label="エラーレスポンス項目"
            labelTooltip="失敗時に返すデータ項目です。errorCode・messageなど利用者/実装者が判断に使う値を記述します。"
            description="このエラーパターンで返すレスポンスボディ項目"
            fields={errorPattern.fields}
            onChange={(fields) => {
              const next = [...(outputSchema.error ?? [])];
              next[index] = { ...next[index], fields };
              onChange({ ...outputSchema, error: next });
            }}
            compactPreview
          />
        </div>
      ))}
    </div>
  );
}
