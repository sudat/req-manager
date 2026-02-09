"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type {
  ApiInput,
  BatchInput,
  JobInput,
  ScreenInput,
} from "@/lib/domain/schemas/io-schemas";
import type { StructuredDesignDocumentIoType } from "@/lib/domain/schemas/design-document-structured";
import type { Field } from "@/lib/domain/schemas/fields";
import { EmptyState } from "./EmptyState";
import { FieldsViewer } from "./FieldsViewer";
import { LabeledValue } from "./LabeledValue";

interface InputSchemaViewerProps {
  inputSchema?: ApiInput | ScreenInput | BatchInput | JobInput;
  ioType: StructuredDesignDocumentIoType;
  elements?: Field[];
}

type StructuredInputSchema = InputSchemaViewerProps["inputSchema"];

function isApiInputSchema(inputSchema: StructuredInputSchema): inputSchema is ApiInput {
  return Boolean(inputSchema && "method" in inputSchema);
}

function isScreenInputSchema(inputSchema: StructuredInputSchema): inputSchema is ScreenInput {
  return Boolean(inputSchema && "trigger" in inputSchema);
}

function isBatchInputSchema(inputSchema: StructuredInputSchema): inputSchema is BatchInput {
  return Boolean(inputSchema && "schedule" in inputSchema);
}

function isJobInputSchema(inputSchema: StructuredInputSchema): inputSchema is JobInput {
  return Boolean(inputSchema && "event" in inputSchema);
}

function renderFieldGroup(label: string, fields: Field[] | undefined): ReactNode {
  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <LabeledValue label={label} labelClassName="font-medium" valueClassName="">
      <FieldsViewer fields={fields} />
    </LabeledValue>
  );
}

export function InputSchemaViewer({
  inputSchema,
  ioType,
  elements,
}: InputSchemaViewerProps): ReactNode {
  if (!inputSchema) {
    return <EmptyState message="未設定" variant="inline" />;
  }

  switch (ioType) {
    case "api": {
      if (!isApiInputSchema(inputSchema)) {
        break;
      }

      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="font-mono">
              {inputSchema.method || "GET"}
            </Badge>
            <span className="font-mono text-sm text-slate-700">{inputSchema.path || "/"}</span>
          </div>

          {renderFieldGroup("クエリパラメータ", inputSchema.query)}
          {renderFieldGroup("リクエストボディ", inputSchema.body)}
        </div>
      );
    }
    case "screen": {
      if (!isScreenInputSchema(inputSchema)) {
        break;
      }

      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <LabeledValue label="操作対象" valueClassName="font-medium">
              {inputSchema.targetElement || "未設定"}
            </LabeledValue>
            <LabeledValue label="トリガー" valueClassName="">
              <Badge variant="outline">{inputSchema.trigger || "click"}</Badge>
            </LabeledValue>
            <LabeledValue label="操作内容" valueClassName="font-medium">
              {inputSchema.action || "未設定"}
            </LabeledValue>
          </div>

          {inputSchema.precondition && (
            <LabeledValue label="前提条件" valueClassName="rounded bg-slate-50 p-2 text-slate-600">
              {inputSchema.precondition}
            </LabeledValue>
          )}

          {renderFieldGroup("入力要素", elements)}
        </div>
      );
    }
    case "batch": {
      if (!isBatchInputSchema(inputSchema)) {
        break;
      }

      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <LabeledValue label="スケジュール" valueClassName="font-medium">
              {inputSchema.schedule || "未設定"}
            </LabeledValue>
            <LabeledValue label="入力ソース" valueClassName="font-medium">
              {inputSchema.source || "未設定"}
            </LabeledValue>
          </div>

          {renderFieldGroup("パラメータ", inputSchema.parameters)}
        </div>
      );
    }
    case "job": {
      if (!isJobInputSchema(inputSchema)) {
        break;
      }

      return (
        <div className="space-y-3">
          <LabeledValue label="トリガーイベント" valueClassName="font-medium">
            {inputSchema.event || "未設定"}
          </LabeledValue>

          {renderFieldGroup("ペイロード", inputSchema.payload)}
        </div>
      );
    }
    default:
      break;
  }

  return <EmptyState message="未設定" variant="inline" />;
}
