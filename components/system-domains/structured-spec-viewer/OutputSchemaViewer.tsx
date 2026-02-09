"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type {
  ApiOutput,
  ScreenOutput,
  BatchOutput,
  JobOutput,
} from "@/lib/domain/schemas/io-schemas";
import type { StructuredDesignDocumentIoType } from "@/lib/domain/schemas/design-document-structured";
import { FieldsViewer } from "./FieldsViewer";

interface OutputSchemaViewerProps {
  outputSchema?: ApiOutput | ScreenOutput | BatchOutput | JobOutput;
  ioType: StructuredDesignDocumentIoType;
}

export function OutputSchemaViewer({
  outputSchema,
  ioType,
}: OutputSchemaViewerProps): ReactNode {
  if (!outputSchema) {
    return <div className="text-sm text-slate-400 italic">未設定</div>;
  }

  // APIタイプ
  if (ioType === "api" && "success" in outputSchema) {
    const apiOutput = outputSchema as ApiOutput;
    return (
      <div className="space-y-3">
        {/* 成功時 */}
        <div className="rounded-md border border-green-200 bg-green-50/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              成功 {apiOutput.success.status || 200}
            </Badge>
          </div>
          {apiOutput.success.fields.length > 0 && (
            <FieldsViewer fields={apiOutput.success.fields} />
          )}
        </div>

        {/* エラー時 */}
        {apiOutput.error && apiOutput.error.length > 0 && (
          <div className="space-y-2">
            {apiOutput.error.map((err, index) => (
              <div
                key={index}
                className="rounded-md border border-red-200 bg-red-50/30 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{err.status || 400}</Badge>
                  {err.description && (
                    <span className="text-sm text-slate-600">{err.description}</span>
                  )}
                </div>
                {err.fields.length > 0 && (
                  <FieldsViewer fields={err.fields} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 画面タイプ
  if (ioType === "screen" && "transition" in outputSchema) {
    const screenOutput = outputSchema as ScreenOutput;
    return (
      <div className="space-y-3">
        {screenOutput.transition && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">遷移先</div>
            <div className="text-sm font-mono bg-slate-50 p-2 rounded">{screenOutput.transition}</div>
          </div>
        )}
        
        {screenOutput.messages && screenOutput.messages.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">メッセージ</div>
            <div className="space-y-1">
              {screenOutput.messages.map((msg, index) => (
                <div key={index} className="text-sm text-slate-600">{msg}</div>
              ))}
            </div>
          </div>
        )}
        
        {screenOutput.behavior && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">期待動作</div>
            <div className="text-sm text-slate-600">{screenOutput.behavior}</div>
          </div>
        )}
        
        {screenOutput.displayChanges && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">画面変化</div>
            <div className="text-sm text-slate-600">{screenOutput.displayChanges}</div>
          </div>
        )}
      </div>
    );
  }

  // バッチタイプ
  if (ioType === "batch" && "summary" in outputSchema) {
    const batchOutput = outputSchema as BatchOutput;
    return (
      <div className="space-y-3">
        {batchOutput.summary && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium text-slate-500 mb-2">処理サマリー</div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <div className="text-xs text-slate-400">処理件数</div>
                <div className="font-medium">{batchOutput.summary.processedCount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">成功</div>
                <div className="font-medium text-green-600">{batchOutput.summary.successCount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">失敗</div>
                <div className="font-medium text-red-600">{batchOutput.summary.errorCount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">ステータス</div>
                <Badge variant="outline" className="text-xs">{batchOutput.summary.status || "completed"}</Badge>
              </div>
            </div>
          </div>
        )}
        
        {batchOutput.nextBatch && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">次バッチ</div>
            <div className="text-sm">{batchOutput.nextBatch}</div>
          </div>
        )}
      </div>
    );
  }

  // ジョブタイプ
  if (ioType === "job" && "result" in outputSchema) {
    const jobOutput = outputSchema as JobOutput;
    return (
      <div className="space-y-3">
        {jobOutput.result && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">処理結果</div>
            <div className="text-sm">{jobOutput.result}</div>
          </div>
        )}
        
        {jobOutput.nextEvent && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">次イベント</div>
            <div className="text-sm">{jobOutput.nextEvent}</div>
          </div>
        )}
      </div>
    );
  }

  return <div className="text-sm text-slate-400 italic">未設定</div>;
}
