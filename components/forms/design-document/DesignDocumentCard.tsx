"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { HierarchicalEditor } from "@/components/forms/hierarchical-editor";
import { EntryPointsInlineEditor } from "@/components/forms/entry-points/EntryPointsInlineEditor";
import { FieldEditor } from "@/components/forms/FieldEditor";
import type { DdType } from "@/lib/domain";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";
import { DD_TYPE_LABELS } from "@/lib/domain/enums";
import {
  createEmptyStructuredDesignDocumentSpec,
  ddTypeToStructuredIoType,
  type StructuredDesignDocumentSpec,
} from "@/lib/domain/schemas/design-document-structured";
import { syncStructuredSpecToDdType } from "@/lib/utils/design-documents/structured-compat";

type DesignDocumentCardProps = {
  item: DesignDocumentDraft;
  onUpdate: (patch: Partial<DesignDocumentDraft>) => void;
  onDelete: () => void;
};

const DD_TYPES: { value: DdType; label: string }[] = [
  { value: "screen", label: DD_TYPE_LABELS.screen },
  { value: "api", label: DD_TYPE_LABELS.api },
  { value: "batch", label: DD_TYPE_LABELS.batch },
  { value: "external_if", label: DD_TYPE_LABELS.external_if },
  { value: "model", label: DD_TYPE_LABELS.model },
  { value: "report", label: DD_TYPE_LABELS.report },
  { value: "job", label: DD_TYPE_LABELS.job },
];

const EXCEPTION_TYPES = [
  "validation",
  "state",
  "permission",
  "external",
  "timeout",
  "conflict",
] as const;

const RECOVERY_TYPES = [
  "none",
  "retry_immediate",
  "retry_with_backoff",
  "fallback",
  "manual_intervention",
  "circuit_breaker",
] as const;

const EVENT_DESTINATIONS = ["queue", "topic", "webhook"] as const;

const DB_OPERATIONS = ["insert", "update", "delete", "upsert"] as const;

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

const SCREEN_TRIGGERS = ["click", "input", "load", "select"] as const;

export function DesignDocumentCard({
  item,
  onUpdate,
  onDelete,
}: DesignDocumentCardProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);

  const updateStructuredSpec = (
    updater: (current: StructuredDesignDocumentSpec) => StructuredDesignDocumentSpec
  ) => {
    if (!item.structuredSpec) return;
    onUpdate({
      structuredSpec: updater(item.structuredSpec),
      structuredSpecParseError: undefined,
    });
  };

  const handleEnableStructuredSpec = () => {
    onUpdate({
      structuredSpec: createEmptyStructuredDesignDocumentSpec(ddTypeToStructuredIoType(item.type)),
      structuredSpecParseError: undefined,
    });
  };

  const handleDisableStructuredSpec = () => {
    onUpdate({ structuredSpec: undefined, structuredSpecParseError: undefined });
  };

  const handleTypeChange = (nextType: DdType) => {
    if (!item.structuredSpec) {
      onUpdate({
        type: nextType,
        structuredSpec: createEmptyStructuredDesignDocumentSpec(ddTypeToStructuredIoType(nextType)),
        structuredSpecParseError: undefined,
      });
      return;
    }
    onUpdate({
      type: nextType,
      structuredSpec: syncStructuredSpecToDdType(item.structuredSpec, nextType),
      structuredSpecParseError: undefined,
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="pl-4 border-l-4 border-indigo-500 bg-slate-50/50 rounded-md p-4">
        <CollapsibleTrigger className="w-full cursor-pointer">
          <div className="flex items-center gap-3 text-left">
            <ChevronDown className={cn("h-5 w-5 text-slate-500 transition-transform shrink-0", isOpen && "rotate-180")} />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-mono text-sm text-slate-500 shrink-0">{item.id}</span>
              <span className="text-base font-medium text-slate-900 truncate">{item.name || "（未設定）"}</span>
            </div>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-medium">
              {DD_TYPE_LABELS[item.type]}
            </Badge>
          </div>
        </CollapsibleTrigger>

        {isOpen && (
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="icon"
              title="削除"
              aria-label={`${item.name || "DD"} を削除`}
              className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        <CollapsibleContent className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">
              DD名<span className="text-rose-500">*</span>
            </Label>
            <Input
              value={item.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="例: 請求書PDF生成バッチ"
              className="text-[14px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">
              種別<span className="text-rose-500">*</span>
            </Label>
            <Select value={item.type} onValueChange={(value) => handleTypeChange(value as DdType)}>
              <SelectTrigger className="text-[14px]">
                <SelectValue placeholder="種別を選択" />
              </SelectTrigger>
              <SelectContent>
                {DD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">
              概要<span className="text-rose-500">*</span>
            </Label>
            <Textarea
              value={item.summary}
              onChange={(e) => onUpdate({ summary: e.target.value })}
              placeholder="入出力と責務の概要を記述"
              className="min-h-[90px] text-[14px]"
            />
          </div>

          <EntryPointsInlineEditor
            entryPoints={item.entryPoints}
            onChange={(entryPoints) => onUpdate({ entryPoints })}
          />

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">設計方針</Label>
            <Textarea
              value={item.designPolicy}
              onChange={(e) => onUpdate({ designPolicy: e.target.value })}
              placeholder="横断的な設計方針を記述"
              className="min-h-[90px] text-[14px]"
            />
          </div>

          <div className="rounded-md border border-slate-200 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[13px] font-semibold text-slate-800">構造化設計（Control Plane）</div>
                <div className="text-[12px] text-slate-500">
                  入出力・副作用・例外・非機能を構造化して定義します
                </div>
              </div>
              {item.structuredSpec ? (
                <Button type="button" variant="outline" size="sm" onClick={handleDisableStructuredSpec}>
                  構造化を解除
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={handleEnableStructuredSpec}>
                  <Plus className="h-4 w-4 mr-1" />
                  構造化を開始
                </Button>
              )}
            </div>

            {item.structuredSpecParseError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>既存構造化データを読み込めませんでした</AlertTitle>
                <AlertDescription>{item.structuredSpecParseError}</AlertDescription>
              </Alert>
            )}

            {item.structuredSpec && (
              <StructuredSpecEditor
                spec={item.structuredSpec}
                onChange={(next) =>
                  onUpdate({ structuredSpec: next, structuredSpecParseError: undefined })
                }
                updateStructuredSpec={updateStructuredSpec}
              />
            )}
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                details（自由記述）を編集
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <HierarchicalEditor
                label="details"
                value={item.detailsYaml ?? ""}
                onChange={(value) => onUpdate({ detailsYaml: value })}
                placeholder={"例: api_definition:\n  method: POST\n  endpoint: /api/v1/users"}
                helperText="既存互換のため保持しています。構造化設計が優先して利用されます。"
              />
            </CollapsibleContent>
          </Collapsible>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function StructuredSpecEditor({
  spec,
  onChange,
  updateStructuredSpec,
}: {
  spec: StructuredDesignDocumentSpec;
  onChange: (next: StructuredDesignDocumentSpec) => void;
  updateStructuredSpec: (
    updater: (current: StructuredDesignDocumentSpec) => StructuredDesignDocumentSpec
  ) => void;
}): ReactNode {
  const addDbOperation = () => {
    updateStructuredSpec((current) => ({
      ...current,
      sideEffects: {
        ...current.sideEffects,
        dbOperations: [
          ...(current.sideEffects.dbOperations ?? []),
          { table: "", operation: "insert", condition: "" },
        ],
      },
    }));
  };

  const addExternalApi = () => {
    updateStructuredSpec((current) => ({
      ...current,
      sideEffects: {
        ...current.sideEffects,
        externalApiCalls: [
          ...(current.sideEffects.externalApiCalls ?? []),
          { endpoint: "", method: "POST" },
        ],
      },
    }));
  };

  const addEvent = () => {
    updateStructuredSpec((current) => ({
      ...current,
      sideEffects: {
        ...current.sideEffects,
        events: [
          ...(current.sideEffects.events ?? []),
          { eventType: "", destination: "topic", payload: [] },
        ],
      },
    }));
  };

  const addException = () => {
    updateStructuredSpec((current) => ({
      ...current,
      exceptions: [
        ...current.exceptions,
        {
          type: "validation",
          condition: "",
          errorCode: "",
          message: "",
          recovery: "none",
        },
      ],
    }));
  };

  return (
    <div className="space-y-4">
      {spec.ioType === "api" && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">HTTPメソッド</Label>
            <Select
              value={(spec.inputSchema && "method" in spec.inputSchema ? spec.inputSchema.method : "POST") as string}
              onValueChange={(method) =>
                updateStructuredSpec((current) => {
                  if (!current.inputSchema || !("method" in current.inputSchema)) return current;
                  return {
                    ...current,
                    inputSchema: { ...current.inputSchema, method: method as (typeof HTTP_METHODS)[number] },
                  };
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">パス</Label>
            <Input
              value={
                spec.inputSchema && "path" in spec.inputSchema ? spec.inputSchema.path : ""
              }
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  if (!current.inputSchema || !("path" in current.inputSchema)) return current;
                  return {
                    ...current,
                    inputSchema: { ...current.inputSchema, path: e.target.value },
                  };
                })
              }
            />
          </div>
        </div>
      )}

      {spec.ioType === "screen" && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">ルート</Label>
            <Input
              value={spec.typeDetail?.ioType === "screen" ? spec.typeDetail.route ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: { ioType: "screen", route: e.target.value },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">トリガー</Label>
            <Select
              value={
                spec.typeDetail?.ioType === "screen"
                  ? spec.typeDetail.trigger ?? "click"
                  : "click"
              }
              onValueChange={(value) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: {
                    ioType: "screen",
                    trigger: value as (typeof SCREEN_TRIGGERS)[number],
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCREEN_TRIGGERS.map((trigger) => (
                  <SelectItem key={trigger} value={trigger}>
                    {trigger}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {spec.ioType === "batch" && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">スケジュール</Label>
            <Input
              value={spec.typeDetail?.ioType === "batch" ? spec.typeDetail.schedule ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: { ioType: "batch", schedule: e.target.value },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">入力ソース</Label>
            <Input
              value={spec.typeDetail?.ioType === "batch" ? spec.typeDetail.source ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: { ioType: "batch", source: e.target.value },
                }))
              }
            />
          </div>
        </div>
      )}

      {spec.ioType === "job" && (
        <div className="space-y-1">
          <Label className="text-xs">イベント</Label>
          <Input
            value={spec.typeDetail?.ioType === "job" ? spec.typeDetail.event ?? "" : ""}
            onChange={(e) =>
              updateStructuredSpec((current) => ({
                ...current,
                typeDetail: { ioType: "job", event: e.target.value },
              }))
            }
          />
        </div>
      )}

      {spec.ioType === "external_if" && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">プロトコル</Label>
            <Input
              value={spec.typeDetail?.ioType === "external_if" ? spec.typeDetail.protocol ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: { ioType: "external_if", protocol: e.target.value },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">エンドポイント</Label>
            <Input
              value={spec.typeDetail?.ioType === "external_if" ? spec.typeDetail.endpoint ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: { ioType: "external_if", endpoint: e.target.value },
                }))
              }
            />
          </div>
        </div>
      )}

      {/* model型とreport型はtypeDetailから詳細項目を削除（entryPointsとoutputSchemaで代替） */}

      <FieldEditor
        label="入力フィールド"
        fields={spec.inputFields}
        onChange={(fields) => onChange({ ...spec, inputFields: fields })}
      />
      <FieldEditor
        label="出力フィールド"
        fields={spec.outputFields}
        onChange={(fields) => onChange({ ...spec, outputFields: fields })}
      />

      <div className="space-y-2">
        <Label className="text-xs">副作用（概要）</Label>
        <Textarea
          value={spec.sideEffects.description}
          onChange={(e) =>
            updateStructuredSpec((current) => ({
              ...current,
              sideEffects: { ...current.sideEffects, description: e.target.value },
            }))
          }
          rows={2}
          placeholder="DB更新、外部API呼び出し、イベント発行など"
        />
      </div>

      <div className="space-y-2 rounded-md border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <Label>副作用: DB操作</Label>
          <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addDbOperation}>
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
        {(spec.sideEffects.dbOperations ?? []).map((op, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_4fr_auto] items-center">
            <Input
              placeholder="table"
              value={op.table}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.dbOperations ?? [])];
                  next[index] = { ...next[index], table: e.target.value };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, dbOperations: next },
                  };
                })
              }
            />
            <Select
              value={op.operation}
              onValueChange={(value) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.dbOperations ?? [])];
                  next[index] = {
                    ...next[index],
                    operation: value as (typeof DB_OPERATIONS)[number],
                  };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, dbOperations: next },
                  };
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DB_OPERATIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="condition"
              value={op.condition ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.dbOperations ?? [])];
                  next[index] = { ...next[index], condition: e.target.value };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, dbOperations: next },
                  };
                })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                updateStructuredSpec((current) => ({
                  ...current,
                  sideEffects: {
                    ...current.sideEffects,
                    dbOperations: (current.sideEffects.dbOperations ?? []).filter((_, i) => i !== index),
                  },
                }))
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <Label>副作用: 外部API</Label>
          <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addExternalApi}>
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
        {(spec.sideEffects.externalApiCalls ?? []).map((apiCall, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_4fr_auto] items-center">
            <Input
              placeholder="endpoint"
              value={apiCall.endpoint}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.externalApiCalls ?? [])];
                  next[index] = { ...next[index], endpoint: e.target.value };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, externalApiCalls: next },
                  };
                })
              }
            />
            <Select
              value={apiCall.method}
              onValueChange={(value) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.externalApiCalls ?? [])];
                  next[index] = {
                    ...next[index],
                    method: value as "GET" | "POST" | "PUT" | "DELETE",
                  };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, externalApiCalls: next },
                  };
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["GET", "POST", "PUT", "DELETE"].map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="retry: maxRetries"
              value={apiCall.retryPolicy?.maxRetries?.toString() ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.externalApiCalls ?? [])];
                  next[index] = {
                    ...next[index],
                    retryPolicy: {
                      maxRetries: e.target.value === "" ? 0 : Number(e.target.value),
                      backoffMs: next[index].retryPolicy?.backoffMs ?? 1000,
                    },
                  };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, externalApiCalls: next },
                  };
                })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                updateStructuredSpec((current) => ({
                  ...current,
                  sideEffects: {
                    ...current.sideEffects,
                    externalApiCalls: (current.sideEffects.externalApiCalls ?? []).filter((_, i) => i !== index),
                  },
                }))
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <Label>副作用: イベント発行</Label>
          <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addEvent}>
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
        {(spec.sideEffects.events ?? []).map((event, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_4fr_auto] items-center">
            <Input
              placeholder="eventType"
              value={event.eventType}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.events ?? [])];
                  next[index] = { ...next[index], eventType: e.target.value };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, events: next },
                  };
                })
              }
            />
            <Select
              value={event.destination}
              onValueChange={(value) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.events ?? [])];
                  next[index] = {
                    ...next[index],
                    destination: value as (typeof EVENT_DESTINATIONS)[number],
                  };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, events: next },
                  };
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_DESTINATIONS.map((destination) => (
                  <SelectItem key={destination} value={destination}>
                    {destination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="delayMs"
              type="number"
              value={event.delayMs ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.events ?? [])];
                  next[index] = {
                    ...next[index],
                    delayMs: e.target.value === "" ? undefined : Number(e.target.value),
                  };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, events: next },
                  };
                })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                updateStructuredSpec((current) => ({
                  ...current,
                  sideEffects: {
                    ...current.sideEffects,
                    events: (current.sideEffects.events ?? []).filter((_, i) => i !== index),
                  },
                }))
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <Label>例外</Label>
          <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addException}>
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
        {spec.exceptions.map((exception, index) => (
          <div key={index} className="space-y-2">
            <div className="grid gap-2 md:grid-cols-3">
              <Select
                value={exception.type}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => {
                    const next = [...current.exceptions];
                    next[index] = { ...next[index], type: value as (typeof EXCEPTION_TYPES)[number] };
                    return { ...current, exceptions: next };
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXCEPTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="errorCode"
                value={exception.errorCode}
                onChange={(e) =>
                  updateStructuredSpec((current) => {
                    const next = [...current.exceptions];
                    next[index] = { ...next[index], errorCode: e.target.value };
                    return { ...current, exceptions: next };
                  })
                }
              />
              <Input
                placeholder="httpStatus"
                type="number"
                value={exception.httpStatus ?? ""}
                onChange={(e) =>
                  updateStructuredSpec((current) => {
                    const next = [...current.exceptions];
                    next[index] = {
                      ...next[index],
                      httpStatus: e.target.value === "" ? undefined : Number(e.target.value),
                    };
                    return { ...current, exceptions: next };
                  })
                }
              />
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder="condition"
                value={exception.condition}
                onChange={(e) =>
                  updateStructuredSpec((current) => {
                    const next = [...current.exceptions];
                    next[index] = { ...next[index], condition: e.target.value };
                    return { ...current, exceptions: next };
                  })
                }
              />
              <Input
                placeholder="message"
                value={exception.message}
                onChange={(e) =>
                  updateStructuredSpec((current) => {
                    const next = [...current.exceptions];
                    next[index] = { ...next[index], message: e.target.value };
                    return { ...current, exceptions: next };
                  })
                }
              />
              <Select
                value={exception.recovery}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => {
                    const next = [...current.exceptions];
                    next[index] = { ...next[index], recovery: value as (typeof RECOVERY_TYPES)[number] };
                    return { ...current, exceptions: next };
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECOVERY_TYPES.map((recovery) => (
                    <SelectItem key={recovery} value={recovery}>
                      {recovery}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-slate-200 p-3 space-y-3">
        <Label>非機能要件</Label>
        <div className="grid gap-2 md:grid-cols-1">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">応答時間P95（例: 200ms）</Label>
            <Input
              placeholder="例: 200ms"
              value={spec.nonFunctional.responseTimeP95 ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  nonFunctional: {
                    ...current.nonFunctional,
                    responseTimeP95: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">稼働率（例: 99.9%）</Label>
            <Input
              placeholder="例: 99.9%"
              value={spec.nonFunctional.uptime ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  nonFunctional: {
                    ...current.nonFunctional,
                    uptime: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">認証方式（任意）</Label>
            <Select
              value={spec.nonFunctional.authMethod}
              onValueChange={(value) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  nonFunctional: {
                    ...current.nonFunctional,
                    authMethod: value as "oauth2" | "oidc" | "api_key" | "mfa",
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                <SelectItem value="oidc">OpenID Connect</SelectItem>
                <SelectItem value="api_key">APIキー</SelectItem>
                <SelectItem value="mfa">多要素認証</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

    </div>
  );
}
