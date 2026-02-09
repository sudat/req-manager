"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type {
  ApiInput,
  ScreenInput,
  BatchInput,
  JobInput,
} from "@/lib/domain/schemas/io-schemas";
import type { StructuredDesignDocumentIoType } from "@/lib/domain/schemas/design-document-structured";
import type { Field } from "@/lib/domain/schemas/fields";
import { FieldsViewer } from "./FieldsViewer";

interface InputSchemaViewerProps {
  inputSchema?: ApiInput | ScreenInput | BatchInput | JobInput;
  ioType: StructuredDesignDocumentIoType;
  elements?: Field[];
}

export function InputSchemaViewer({
  inputSchema,
  ioType,
  elements,
}: InputSchemaViewerProps): ReactNode {
  if (!inputSchema) {
    return <div className="text-sm text-slate-400 italic">未設定</div>;
  }

  // APIタイプ
  if (ioType === "api" && "method" in inputSchema) {
    const apiInput = inputSchema as ApiInput;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="font-mono">{apiInput.method || "GET"}</Badge>
          <span className="font-mono text-sm text-slate-700">{apiInput.path || "/"}</span>
        </div>
        
        {apiInput.query && apiInput.query.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">クエリパラメータ</div>
            <FieldsViewer fields={apiInput.query} />
          </div>
        )}
        
        {apiInput.body && apiInput.body.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">リクエストボディ</div>
            <FieldsViewer fields={apiInput.body} />
          </div>
        )}
      </div>
    );
  }

  // 画面タイプ
  if (ioType === "screen" && "trigger" in inputSchema) {
    const screenInput = inputSchema as ScreenInput;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">操作対象</div>
            <div className="text-sm font-medium">{screenInput.targetElement || "未設定"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-500">トリガー</div>
            <Badge variant="outline">{screenInput.trigger || "click"}</Badge>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-500">操作内容</div>
            <div className="text-sm font-medium">{screenInput.action || "未設定"}</div>
          </div>
        </div>
        
        {screenInput.precondition && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">前提条件</div>
            <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{screenInput.precondition}</div>
          </div>
        )}
        
        {elements && elements.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">入力要素</div>
            <FieldsViewer fields={elements} />
          </div>
        )}
      </div>
    );
  }

  // バッチタイプ
  if (ioType === "batch" && "schedule" in inputSchema) {
    const batchInput = inputSchema as BatchInput;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">スケジュール</div>
            <div className="text-sm font-medium">{batchInput.schedule || "未設定"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-500">入力ソース</div>
            <div className="text-sm font-medium">{batchInput.source || "未設定"}</div>
          </div>
        </div>
        
        {batchInput.parameters && batchInput.parameters.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">パラメータ</div>
            <FieldsViewer fields={batchInput.parameters} />
          </div>
        )}
      </div>
    );
  }

  // ジョブタイプ
  if (ioType === "job" && "event" in inputSchema) {
    const jobInput = inputSchema as JobInput;
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-xs text-slate-500">トリガーイベント</div>
          <div className="text-sm font-medium">{jobInput.event || "未設定"}</div>
        </div>
        
        {jobInput.payload && jobInput.payload.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">ペイロード</div>
            <FieldsViewer fields={jobInput.payload} />
          </div>
        )}
      </div>
    );
  }

  return <div className="text-sm text-slate-400 italic">未設定</div>;
}
