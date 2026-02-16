import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type {
  ApiOutput,
  BatchOutput,
  JobOutput,
  ScreenOutput,
} from "@/lib/domain/schemas/io-schemas";
import type { StructuredDesignDocumentIoType } from "@/lib/domain/schemas/design-document-structured";
import { EmptyState } from "./EmptyState";
import { FieldsViewer } from "./FieldsViewer";
import { LabeledValue } from "./LabeledValue";
import {
  isApiOutputSchema,
  isBatchOutputSchema,
  isJobOutputSchema,
  isScreenOutputSchema,
} from "./schema-type-guards";
import { renderFieldGroup } from "./field-group-helper";

interface OutputSchemaViewerProps {
  outputSchema?: ApiOutput | ScreenOutput | BatchOutput | JobOutput;
  ioType: StructuredDesignDocumentIoType;
}

export function OutputSchemaViewer({
  outputSchema,
  ioType,
}: OutputSchemaViewerProps): ReactNode {
  if (!outputSchema) {
    return <EmptyState message="未設定" variant="inline" />;
  }

  switch (ioType) {
    case "api": {
      if (!isApiOutputSchema(outputSchema)) {
        break;
      }

      return (
        <div className="space-y-3">
          <div className="space-y-2 rounded-md border border-green-200 bg-green-50/30 p-3">
            <div className="flex items-center gap-2">
              <Badge className="border-green-200 bg-green-100 text-green-800">
                成功 {outputSchema.success.status || 200}
              </Badge>
            </div>
            {outputSchema.success.fields.length > 0 && (
              <FieldsViewer fields={outputSchema.success.fields} />
            )}
          </div>

          {outputSchema.error && outputSchema.error.length > 0 && (
            <div className="space-y-2">
              {outputSchema.error.map((err, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-md border border-red-200 bg-red-50/30 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{err.status || 400}</Badge>
                    {err.description && (
                      <span className="text-sm text-slate-600">{err.description}</span>
                    )}
                  </div>
                  {err.fields.length > 0 && <FieldsViewer fields={err.fields} />}
                </div>
              ))}
            </div>
          )}
          {renderFieldGroup("出力データ項目", outputSchema.fields)}
        </div>
      );
    }
    case "screen": {
      if (!isScreenOutputSchema(outputSchema)) {
        break;
      }

      return (
        <div className="space-y-3">
          {outputSchema.transition && (
            <LabeledValue label="遷移先" valueClassName="">
              <div className="rounded bg-slate-50 p-2 font-mono">{outputSchema.transition}</div>
            </LabeledValue>
          )}

          {outputSchema.messages && outputSchema.messages.length > 0 && (
            <LabeledValue label="メッセージ" valueClassName="">
              <div className="space-y-1 text-sm text-slate-600">
                {outputSchema.messages.map((message, index) => (
                  <div key={index}>{message}</div>
                ))}
              </div>
            </LabeledValue>
          )}

          {outputSchema.behavior && (
            <LabeledValue label="期待動作" valueClassName="text-slate-600">
              {outputSchema.behavior}
            </LabeledValue>
          )}

          {outputSchema.displayChanges && (
            <LabeledValue label="画面変化" valueClassName="text-slate-600">
              {outputSchema.displayChanges}
            </LabeledValue>
          )}
          {renderFieldGroup("出力データ項目", outputSchema.fields)}
        </div>
      );
    }
    case "batch": {
      if (!isBatchOutputSchema(outputSchema)) {
        break;
      }

      return (
        <div className="space-y-3">
          {outputSchema.summary && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-xs font-medium text-slate-500">処理サマリー</div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <div className="text-xs text-slate-400">処理件数</div>
                  <div className="font-medium">{outputSchema.summary.processedCount || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">成功</div>
                  <div className="font-medium text-green-600">
                    {outputSchema.summary.successCount || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">失敗</div>
                  <div className="font-medium text-red-600">
                    {outputSchema.summary.errorCount || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">ステータス</div>
                  <Badge variant="outline" className="text-xs">
                    {outputSchema.summary.status || "completed"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {outputSchema.nextBatch && (
            <LabeledValue label="次バッチ">{outputSchema.nextBatch}</LabeledValue>
          )}
          {renderFieldGroup("出力データ項目", outputSchema.fields)}
        </div>
      );
    }
    case "job": {
      if (!isJobOutputSchema(outputSchema)) {
        break;
      }

      return (
        <div className="space-y-3">
          {outputSchema.result && <LabeledValue label="処理結果">{outputSchema.result}</LabeledValue>}
          {outputSchema.nextEvent && <LabeledValue label="次イベント">{outputSchema.nextEvent}</LabeledValue>}
          {renderFieldGroup("出力データ項目", outputSchema.fields)}
        </div>
      );
    }
    default:
      break;
  }

  return <EmptyState message="未設定" variant="inline" />;
}
