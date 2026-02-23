import type { ReactNode } from "react";
import { FieldEditor } from "@/components/forms/FieldEditor";
import { FoldableStructuredSection } from "../FoldableStructuredSection";
import type { ApiOutput, ScreenOutput } from "@/lib/domain/schemas/io-schemas";
import type { StructuredSpecEditorProps } from "./types";
import { ApiOutputFieldsSection } from "./ApiOutputFieldsSection";
import { ApiOutputSchemaSection } from "./ApiOutputSchemaSection";
import { ScreenOutputSection } from "./ScreenOutputSection";

interface OutputSchemaEditorProps {
  spec: StructuredSpecEditorProps["spec"];
  onChange: StructuredSpecEditorProps["onChange"];
}

export function OutputSchemaEditor({ spec, onChange }: OutputSchemaEditorProps): ReactNode {
  if (spec.ioType === "model") {
    return null;
  }

  const defaultScreenOutput: ScreenOutput = {
    transition: "",
    messages: [],
    behavior: "",
    displayChanges: "",
    fields: [],
  };

  const defaultApiOutput: ApiOutput = {
    success: { status: 200, fields: [] },
    error: [],
    fields: [],
  };

  return (
    <FoldableStructuredSection
      title="出力スキーマ"
      description="処理結果として返す振る舞い・ステータスを定義します"
      titleTooltip="処理後の振る舞いを記述します。画面なら遷移先・表示メッセージ、APIなら成功/エラーのステータスコードなどを定義してください。"
      defaultOpen={false}
    >
      {spec.ioType === "api" ? (
        <ApiOutputSchemaSection
          outputSchema={
            spec.outputSchema && "success" in spec.outputSchema
              ? spec.outputSchema
              : defaultApiOutput
          }
          onChange={(outputSchema) => onChange({ ...spec, outputSchema })}
        />
      ) : spec.ioType === "screen" ? (
        <ScreenOutputSection
          outputSchema={
            spec.outputSchema && "messages" in spec.outputSchema
              ? spec.outputSchema
              : defaultScreenOutput
          }
          onChange={(outputSchema) => onChange({ ...spec, outputSchema })}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          この種別は出力スキーマの専用入力UIが未実装です。
        </p>
      )}

      <div className="mt-4">
        {spec.ioType === "api" ? (
          <ApiOutputFieldsSection
            outputSchema={
              spec.outputSchema && "success" in spec.outputSchema
                ? spec.outputSchema
                : defaultApiOutput
            }
            onChange={(outputSchema) => onChange({ ...spec, outputSchema })}
          />
        ) : (
          <FieldEditor
            fields={spec.outputSchema?.fields || []}
            onChange={(fields) =>
              onChange({
                ...spec,
                outputSchema: spec.outputSchema
                  ? { ...spec.outputSchema, fields }
                  : undefined,
              })
            }
            compactPreview
          />
        )}
      </div>
    </FoldableStructuredSection>
  );
}
