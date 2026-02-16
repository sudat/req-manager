import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FoldableStructuredSection } from "../FoldableStructuredSection";
import { DB_OPERATIONS, EVENT_DESTINATIONS } from "../constants";
import { removeAtIndex, updateAtIndex } from "@/lib/utils/array-updates";
import type { StructuredSpecEditorProps } from "./types";
import type { SideEffectResponse } from "@/lib/domain/schemas/side-effects";
import {
  SideEffectResponseFields,
  type SideEffectExceptionOption,
} from "./shared/SideEffectResponseFields";
import { SideEffectSectionEditor } from "./shared/SideEffectSectionEditor";

interface SideEffectsEditorProps {
  spec: StructuredSpecEditorProps["spec"];
  updateStructuredSpec: StructuredSpecEditorProps["updateStructuredSpec"];
}

const EMPTY_SELECT_VALUE = "__none__";
const FILE_OUTPUT_FORMATS = ["csv", "json", "xml", "pdf", "txt"] as const;

function mergeResponse(
  current: SideEffectResponse | undefined,
  patch: Partial<SideEffectResponse>
): SideEffectResponse | undefined {
  const next: SideEffectResponse = {
    ...(current ?? {}),
    ...patch,
  };
  const hasValue = Boolean(
    next.successLabel ||
      next.successSchemaRef ||
      next.errorLabel ||
      next.errorSchemaRef ||
      next.errorExceptionRef
  );
  return hasValue ? next : undefined;
}

export function SideEffectsEditor({
  spec,
  updateStructuredSpec,
}: SideEffectsEditorProps): ReactNode {
  if (spec.ioType === "model") {
    return null;
  }

  const ruleRefOptions = Array.from(
    new Set(
      (spec.coreLogic.rules ?? [])
        .map((rule) => rule.name?.trim())
        .filter((name): name is string => Boolean(name))
    )
  );
  const hasRuleRefOptions = ruleRefOptions.length > 0;
  const defaultRuleRef = ruleRefOptions[0];
  const exceptionOptions = (spec.exceptions ?? [])
    .map((exception) => {
      const code = exception.errorCode?.trim();
      if (!code) return null;
      const detail = exception.condition?.trim() || exception.message?.trim() || exception.type;
      return {
        code,
        label: `${code}: ${detail}`,
      };
    })
    .filter((item): item is SideEffectExceptionOption => Boolean(item));

  const addDbOperation = () => {
    updateStructuredSpec((current) => ({
      ...current,
      sideEffects: {
        ...current.sideEffects,
        dbOperations: [
          ...(current.sideEffects.dbOperations ?? []),
          { table: "", operation: "insert", condition: "", ruleRef: defaultRuleRef },
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
          { endpoint: "", method: "POST", ruleRef: defaultRuleRef },
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
          { eventType: "", destination: "topic", payload: [], ruleRef: defaultRuleRef },
        ],
      },
    }));
  };

  const addFileOutput = () => {
    updateStructuredSpec((current) => ({
      ...current,
      sideEffects: {
        ...current.sideEffects,
        fileOutputs: [
          ...(current.sideEffects.fileOutputs ?? []),
          { id: "", path: "", format: "csv", ruleRef: defaultRuleRef },
        ],
      },
    }));
  };

  return (
    <FoldableStructuredSection
      title="副作用"
      description="DB更新・外部連携・イベント発行を定義します"
      titleTooltip="この機能の実行により発生する外部への影響を記述します。DB更新、外部API呼び出し、イベント発行などを具体化してください。"
    >
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
        {!hasRuleRefOptions && (
          <p className="text-xs text-amber-700">
            先にコアロジックでルール名を定義してください。副作用は「どのルールで呼び出すか」を必須で紐付けます。
          </p>
        )}
      </div>

      <SideEffectSectionEditor
        label="副作用: DB操作"
        tooltip="どのテーブルに、どんな操作（insert/update/delete/upsert）をするかを記述します。必要なら条件も記述してください。"
        description="データベースへの読み書き操作を定義します"
        onAdd={addDbOperation}
        disabled={!hasRuleRefOptions}
      >
        {(spec.sideEffects.dbOperations ?? []).map((op, index) => (
          <div key={index} className="space-y-2 rounded-md border border-slate-100 p-2">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_4fr_auto] items-center">
              <Input
                placeholder="table"
                value={op.table}
                onChange={(e) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      dbOperations: updateAtIndex(current.sideEffects.dbOperations, index, {
                        table: e.target.value,
                      }),
                    },
                  }))
                }
              />
              <Select
                value={op.operation}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      dbOperations: updateAtIndex(current.sideEffects.dbOperations, index, {
                        operation: value as (typeof DB_OPERATIONS)[number],
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger className="w-full">
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
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      dbOperations: updateAtIndex(current.sideEffects.dbOperations, index, {
                        condition: e.target.value,
                      }),
                    },
                  }))
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
                      dbOperations: removeAtIndex(current.sideEffects.dbOperations, index),
                    },
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder="id（任意）"
                value={op.id ?? ""}
                onChange={(e) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      dbOperations: updateAtIndex(current.sideEffects.dbOperations, index, {
                        id: e.target.value,
                      }),
                    },
                  }))
                }
              />
              <Select
                value={op.ruleRef ?? EMPTY_SELECT_VALUE}
                disabled={!hasRuleRefOptions}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      dbOperations: updateAtIndex(current.sideEffects.dbOperations, index, {
                        ruleRef: value === EMPTY_SELECT_VALUE ? undefined : value,
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="呼び出しルール（必須）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>未設定（保存不可）</SelectItem>
                  {ruleRefOptions.map((ruleName) => (
                    <SelectItem key={ruleName} value={ruleName}>
                      {ruleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={op.activation ?? EMPTY_SELECT_VALUE}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      dbOperations: updateAtIndex(current.sideEffects.dbOperations, index, {
                        activation: value === EMPTY_SELECT_VALUE
                          ? undefined
                          : (value as "auto" | "force" | "none"),
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="activation（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>activation未指定</SelectItem>
                  <SelectItem value="auto">auto</SelectItem>
                  <SelectItem value="force">force</SelectItem>
                  <SelectItem value="none">none</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SideEffectResponseFields
              response={op.response}
              exceptionOptions={exceptionOptions}
              onPatch={(patch) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  sideEffects: {
                    ...current.sideEffects,
                    dbOperations: updateAtIndex(current.sideEffects.dbOperations, index, {
                      response: mergeResponse(
                        (current.sideEffects.dbOperations ?? [])[index]?.response,
                        patch
                      ),
                    }),
                  },
                }))
              }
            />
            {!op.ruleRef && (
              <p className="text-xs text-red-600">
                この副作用を呼び出すコアロジックのルールを選択してください。
              </p>
            )}
          </div>
        ))}
      </SideEffectSectionEditor>

      <SideEffectSectionEditor
        label="副作用: 外部API"
        tooltip="外部システムに対して呼び出すAPIのエンドポイント、HTTPメソッド、再試行方針を記述します。"
        description="外部システムへのAPI呼び出しを定義します"
        onAdd={addExternalApi}
        disabled={!hasRuleRefOptions}
      >
        {(spec.sideEffects.externalApiCalls ?? []).map((apiCall, index) => (
          <div key={index} className="space-y-2 rounded-md border border-slate-100 p-2">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_4fr_auto] items-center">
              <Input
                placeholder="endpoint"
                value={apiCall.endpoint}
                onChange={(e) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      externalApiCalls: updateAtIndex(current.sideEffects.externalApiCalls, index, {
                        endpoint: e.target.value,
                      }),
                    },
                  }))
                }
              />
              <Select
                value={apiCall.method}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      externalApiCalls: updateAtIndex(current.sideEffects.externalApiCalls, index, {
                        method: value as "GET" | "POST" | "PUT" | "DELETE",
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger className="w-full">
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
                    const currentApiCall = (current.sideEffects.externalApiCalls ?? [])![index];
                    return {
                      ...current,
                      sideEffects: {
                        ...current.sideEffects,
                        externalApiCalls: updateAtIndex(current.sideEffects.externalApiCalls, index, {
                          retryPolicy: {
                            maxRetries: e.target.value === "" ? 0 : Number(e.target.value),
                            backoffMs: currentApiCall.retryPolicy?.backoffMs ?? 1000,
                          },
                        }),
                      },
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
                      externalApiCalls: removeAtIndex(current.sideEffects.externalApiCalls, index),
                    },
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder="id（任意）"
                value={apiCall.id ?? ""}
                onChange={(e) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      externalApiCalls: updateAtIndex(current.sideEffects.externalApiCalls, index, {
                        id: e.target.value,
                      }),
                    },
                  }))
                }
              />
              <Select
                value={apiCall.ruleRef ?? EMPTY_SELECT_VALUE}
                disabled={!hasRuleRefOptions}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      externalApiCalls: updateAtIndex(current.sideEffects.externalApiCalls, index, {
                        ruleRef: value === EMPTY_SELECT_VALUE ? undefined : value,
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="呼び出しルール（必須）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>未設定（保存不可）</SelectItem>
                  {ruleRefOptions.map((ruleName) => (
                    <SelectItem key={ruleName} value={ruleName}>
                      {ruleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={apiCall.activation ?? EMPTY_SELECT_VALUE}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      externalApiCalls: updateAtIndex(current.sideEffects.externalApiCalls, index, {
                        activation: value === EMPTY_SELECT_VALUE
                          ? undefined
                          : (value as "auto" | "force" | "none"),
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="activation（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>activation未指定</SelectItem>
                  <SelectItem value="auto">auto</SelectItem>
                  <SelectItem value="force">force</SelectItem>
                  <SelectItem value="none">none</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SideEffectResponseFields
              response={apiCall.response}
              exceptionOptions={exceptionOptions}
              onPatch={(patch) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  sideEffects: {
                    ...current.sideEffects,
                    externalApiCalls: updateAtIndex(current.sideEffects.externalApiCalls, index, {
                      response: mergeResponse(
                        (current.sideEffects.externalApiCalls ?? [])[index]?.response,
                        patch
                      ),
                    }),
                  },
                }))
              }
            />
            {!apiCall.ruleRef && (
              <p className="text-xs text-red-600">
                この副作用を呼び出すコアロジックのルールを選択してください。
              </p>
            )}
          </div>
        ))}
      </SideEffectSectionEditor>

      <SideEffectSectionEditor
        label="副作用: イベント発行"
        tooltip="発行するイベント種別、宛先（queue/topic/webhook）、必要に応じて遅延時間を記述します。"
        description="メッセージキューやトピックへのイベント発行を定義します"
        onAdd={addEvent}
        disabled={!hasRuleRefOptions}
      >
        {(spec.sideEffects.events ?? []).map((event, index) => (
          <div key={index} className="space-y-2 rounded-md border border-slate-100 p-2">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_4fr_auto] items-center">
              <Input
                placeholder="eventType"
                value={event.eventType}
                onChange={(e) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      events: updateAtIndex(current.sideEffects.events, index, {
                        eventType: e.target.value,
                      }),
                    },
                  }))
                }
              />
              <Select
                value={event.destination}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      events: updateAtIndex(current.sideEffects.events, index, {
                        destination: value as (typeof EVENT_DESTINATIONS)[number],
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger className="w-full">
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
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      events: updateAtIndex(current.sideEffects.events, index, {
                        delayMs: e.target.value === "" ? undefined : Number(e.target.value),
                      }),
                    },
                  }))
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
                      events: removeAtIndex(current.sideEffects.events, index),
                    },
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder="id（任意）"
                value={event.id ?? ""}
                onChange={(e) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      events: updateAtIndex(current.sideEffects.events, index, {
                        id: e.target.value,
                      }),
                    },
                  }))
                }
              />
              <Select
                value={event.ruleRef ?? EMPTY_SELECT_VALUE}
                disabled={!hasRuleRefOptions}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      events: updateAtIndex(current.sideEffects.events, index, {
                        ruleRef: value === EMPTY_SELECT_VALUE ? undefined : value,
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="呼び出しルール（必須）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>未設定（保存不可）</SelectItem>
                  {ruleRefOptions.map((ruleName) => (
                    <SelectItem key={ruleName} value={ruleName}>
                      {ruleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={event.activation ?? EMPTY_SELECT_VALUE}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      events: updateAtIndex(current.sideEffects.events, index, {
                        activation: value === EMPTY_SELECT_VALUE
                          ? undefined
                          : (value as "auto" | "force" | "none"),
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="activation（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>activation未指定</SelectItem>
                  <SelectItem value="auto">auto</SelectItem>
                  <SelectItem value="force">force</SelectItem>
                  <SelectItem value="none">none</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SideEffectResponseFields
              response={event.response}
              exceptionOptions={exceptionOptions}
              onPatch={(patch) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  sideEffects: {
                    ...current.sideEffects,
                    events: updateAtIndex(current.sideEffects.events, index, {
                      response: mergeResponse(
                        (current.sideEffects.events ?? [])[index]?.response,
                        patch
                      ),
                    }),
                  },
                }))
              }
            />
            {!event.ruleRef && (
              <p className="text-xs text-red-600">
                この副作用を呼び出すコアロジックのルールを選択してください。
              </p>
            )}
          </div>
        ))}
      </SideEffectSectionEditor>

      <SideEffectSectionEditor
        label="副作用: ファイル出力"
        tooltip="生成ファイルのパスと形式を定義します。CSV/JSON/PDFなどの出力仕様を記述してください。"
        description="ファイルシステム/ストレージへの出力を定義します"
        onAdd={addFileOutput}
        disabled={!hasRuleRefOptions}
      >
        {(spec.sideEffects.fileOutputs ?? []).map((fileOutput, index) => (
          <div key={index} className="space-y-2 rounded-md border border-slate-100 p-2">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_4fr_auto] items-center">
              <Input
                placeholder="id（任意）"
                value={fileOutput.id ?? ""}
                onChange={(e) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      fileOutputs: updateAtIndex(current.sideEffects.fileOutputs, index, {
                        id: e.target.value,
                      }),
                    },
                  }))
                }
              />
              <Select
                value={fileOutput.format}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      fileOutputs: updateAtIndex(current.sideEffects.fileOutputs, index, {
                        format: value as (typeof FILE_OUTPUT_FORMATS)[number],
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_OUTPUT_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="path"
                value={fileOutput.path}
                onChange={(e) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      fileOutputs: updateAtIndex(current.sideEffects.fileOutputs, index, {
                        path: e.target.value,
                      }),
                    },
                  }))
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
                      fileOutputs: removeAtIndex(current.sideEffects.fileOutputs, index),
                    },
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Select
                value={fileOutput.ruleRef ?? EMPTY_SELECT_VALUE}
                disabled={!hasRuleRefOptions}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      fileOutputs: updateAtIndex(current.sideEffects.fileOutputs, index, {
                        ruleRef: value === EMPTY_SELECT_VALUE ? undefined : value,
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="呼び出しルール（必須）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>未設定（保存不可）</SelectItem>
                  {ruleRefOptions.map((ruleName) => (
                    <SelectItem key={ruleName} value={ruleName}>
                      {ruleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={fileOutput.activation ?? EMPTY_SELECT_VALUE}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    sideEffects: {
                      ...current.sideEffects,
                      fileOutputs: updateAtIndex(current.sideEffects.fileOutputs, index, {
                        activation: value === EMPTY_SELECT_VALUE
                          ? undefined
                          : (value as "auto" | "force" | "none"),
                      }),
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="activation（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>activation未指定</SelectItem>
                  <SelectItem value="auto">auto</SelectItem>
                  <SelectItem value="force">force</SelectItem>
                  <SelectItem value="none">none</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SideEffectResponseFields
              response={fileOutput.response}
              exceptionOptions={exceptionOptions}
              onPatch={(patch) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  sideEffects: {
                    ...current.sideEffects,
                    fileOutputs: updateAtIndex(current.sideEffects.fileOutputs, index, {
                      response: mergeResponse(
                        (current.sideEffects.fileOutputs ?? [])[index]?.response,
                        patch
                      ),
                    }),
                  },
                }))
              }
            />
            {!fileOutput.ruleRef && (
              <p className="text-xs text-red-600">
                この副作用を呼び出すコアロジックのルールを選択してください。
              </p>
            )}
          </div>
        ))}
      </SideEffectSectionEditor>
    </FoldableStructuredSection>
  );
}
