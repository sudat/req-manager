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
import { FoldableStructuredSection } from "../FoldableStructuredSection";
import { updateAtIndex } from "@/lib/utils/array-updates";
import type { StructuredSpecEditorProps } from "./types";
import type {
  SequenceAsyncCompletion,
  SequenceStep,
} from "@/lib/domain/schemas/sequence";
import { normalizeOptionalText } from "./shared/OptionalText";
import {
  appendSequenceStep,
  patchSequenceStep,
  removeSequenceStep,
} from "./shared/sequence-update";

type SequenceEditorProps = {
  spec: StructuredSpecEditorProps["spec"];
  updateStructuredSpec: StructuredSpecEditorProps["updateStructuredSpec"];
};

const EMPTY_SELECT_VALUE = "__none__";

type SupportedStepKind = "call" | "effect_ref" | "note" | "ref";

function createStepId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function mergeAsyncCompletion(
  current: SequenceAsyncCompletion | undefined,
  patch: Partial<SequenceAsyncCompletion>
): SequenceAsyncCompletion | undefined {
  const next: SequenceAsyncCompletion = {
    ...(current ?? {}),
    ...patch,
  };
  const hasValue = Object.values(next).some((value) => value !== undefined);
  return hasValue ? next : undefined;
}

function createDefaultStep(kind: SupportedStepKind): SequenceStep {
  switch (kind) {
    case "call":
      return {
        kind: "call",
        id: createStepId("call"),
        targetDdId: "",
        callType: "sync",
      };
    case "effect_ref":
      return {
        kind: "effect_ref",
        ref: "db:operation_id",
      };
    case "note":
      return {
        kind: "note",
        text: "",
      };
    case "ref":
      return {
        kind: "ref",
        title: "",
        target: { ddId: "" },
      };
    default:
      return {
        kind: "note",
        text: "",
      };
  }
}

export function SequenceEditor({
  spec,
  updateStructuredSpec,
}: SequenceEditorProps): ReactNode {
  if (spec.ioType === "model") {
    return null;
  }

  const sequence = spec.sequence ?? { mode: "auto" as const, steps: [] };
  const mode = sequence.mode ?? "auto";

  const effectRefOptions = [
    ...(spec.sideEffects.dbOperations ?? [])
      .filter((operation) => operation.id?.trim())
      .map((operation) => ({
        value: `db:${operation.id!.trim()}`,
        label: `DB: ${operation.id} (${operation.table})`,
      })),
    ...(spec.sideEffects.externalApiCalls ?? [])
      .filter((apiCall) => apiCall.id?.trim())
      .map((apiCall) => ({
        value: `api:${apiCall.id!.trim()}`,
        label: `API: ${apiCall.id} (${apiCall.method} ${apiCall.endpoint})`,
      })),
    ...(spec.sideEffects.events ?? [])
      .filter((event) => event.id?.trim())
      .map((event) => ({
        value: `event:${event.id!.trim()}`,
        label: `Event: ${event.id} (${event.eventType})`,
      })),
    ...(spec.sideEffects.fileOutputs ?? [])
      .filter((fileOutput) => fileOutput.id?.trim())
      .map((fileOutput) => ({
        value: `file:${fileOutput.id!.trim()}`,
        label: `File: ${fileOutput.id} (${fileOutput.path})`,
      })),
  ];
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
    .filter((item): item is { code: string; label: string } => Boolean(item));

  const updateSequence = (
    updater: (current: NonNullable<typeof spec.sequence>) => NonNullable<typeof spec.sequence>
  ) => {
    updateStructuredSpec((current) => ({
      ...current,
      version: "2",
      sequence: updater(current.sequence ?? { mode: "auto", steps: [] }),
    }));
  };

  const patchStep = (index: number, patch: Partial<SequenceStep>) => {
    updateSequence((current) => patchSequenceStep(current, index, patch));
  };

  return (
    <FoldableStructuredSection
      title="シーケンス制御（任意）"
      description="通常は自動生成、必要時のみ手動ステップで順序を明示します"
      titleTooltip="迷う場合は mode=auto のままで問題ありません。複雑な順序制御が必要な時だけ guided を使ってください。"
    >
      <div className="space-y-3">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">モード</Label>
            <Select
              value={mode}
              onValueChange={(value) =>
                updateSequence((current) => ({
                  ...current,
                  mode: value as "auto" | "guided",
                  steps:
                    value === "guided" && current.steps.length === 0
                      ? [createDefaultStep("call")]
                      : current.steps,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">auto（推奨）</SelectItem>
                <SelectItem value="guided">guided（順序を手動指定）</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">開始アクター（任意）</Label>
            <Input
              placeholder="例: 請求書発行画面"
              value={sequence.entryActor?.label ?? ""}
              onChange={(e) =>
                updateSequence((current) => ({
                  ...current,
                  entryActor:
                    e.target.value.trim().length === 0
                      ? undefined
                      : { label: e.target.value },
                }))
              }
            />
          </div>
        </div>

        {mode === "guided" && (
          <div className="space-y-2 rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700">手動ステップ</div>
                <p className="text-xs text-muted-foreground">
                  call / effect_ref / ref / note の順で処理を並べます
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={EMPTY_SELECT_VALUE}
                  onValueChange={(value) => {
                    if (value === EMPTY_SELECT_VALUE) return;
                    updateSequence((current) =>
                      appendSequenceStep(current, createDefaultStep(value as SupportedStepKind))
                    );
                  }}
                >
                  <SelectTrigger className="w-[190px] h-8">
                    <SelectValue placeholder="ステップ追加" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_SELECT_VALUE}>種別を選択</SelectItem>
                    <SelectItem value="call">call（DD呼び出し）</SelectItem>
                    <SelectItem value="effect_ref">effect_ref（副作用参照）</SelectItem>
                    <SelectItem value="ref">ref（別シーケンス参照）</SelectItem>
                    <SelectItem value="note">note（注記）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(sequence.steps ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">ステップが未定義です</p>
            ) : (
              <div className="space-y-2">
                {(sequence.steps ?? []).map((step, index) => (
                  <div key={`${step.kind}-${index}`} className="space-y-2 rounded-md border border-slate-100 p-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Step {index + 1}</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateSequence((current) => removeSequenceStep(current, index))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {step.kind === "call" && (
                      <div className="space-y-2">
                        <div className="grid gap-2 md:grid-cols-2">
                          <Input
                            placeholder="call id"
                            value={step.id}
                            onChange={(e) =>
                              patchStep(index, { id: e.target.value })
                            }
                          />
                          <Input
                            placeholder="target DD ID"
                            value={step.targetDdId}
                            onChange={(e) =>
                              patchStep(index, { targetDdId: e.target.value })
                            }
                          />
                          <Select
                            value={step.callType}
                            onValueChange={(value) =>
                              updateSequence((current) => {
                                const currentStep = current.steps[index];
                                const nextAsyncCompletion =
                                  value === "async" &&
                                  currentStep &&
                                  currentStep.kind === "call"
                                    ? currentStep.asyncCompletion ?? {}
                                    : undefined;
                                return {
                                  ...current,
                                  steps: updateAtIndex(current.steps, index, {
                                    callType: value as "sync" | "async",
                                    asyncCompletion: nextAsyncCompletion,
                                  }),
                                };
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sync">sync</SelectItem>
                              <SelectItem value="async">async</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="message（任意）"
                            value={step.message ?? ""}
                            onChange={(e) =>
                              patchStep(index, {
                                message: normalizeOptionalText(e.target.value),
                              })
                            }
                          />
                          <Input
                            placeholder="returnLabel（任意）"
                            value={step.returnLabel ?? ""}
                            onChange={(e) =>
                              updateSequence((current) => ({
                                ...current,
                                steps: updateAtIndex(current.steps, index, {
                                  returnLabel: normalizeOptionalText(e.target.value),
                                }),
                              }))
                            }
                          />
                          <Input
                            placeholder="returnSchemaRef（任意）"
                            value={step.returnSchemaRef ?? ""}
                            onChange={(e) =>
                              updateSequence((current) => ({
                                ...current,
                                steps: updateAtIndex(current.steps, index, {
                                  returnSchemaRef: normalizeOptionalText(e.target.value),
                                }),
                              }))
                            }
                          />
                        </div>

                        <div className="grid gap-2 rounded-md border border-slate-100 bg-slate-50/70 p-2 md:grid-cols-3">
                          <Input
                            placeholder="errorLabel（任意）"
                            value={step.errorLabel ?? ""}
                            onChange={(e) =>
                              updateSequence((current) => ({
                                ...current,
                                steps: updateAtIndex(current.steps, index, {
                                  errorLabel: normalizeOptionalText(e.target.value),
                                }),
                              }))
                            }
                          />
                          <Input
                            placeholder="errorSchemaRef（任意）"
                            value={step.errorSchemaRef ?? ""}
                            onChange={(e) =>
                              updateSequence((current) => ({
                                ...current,
                                steps: updateAtIndex(current.steps, index, {
                                  errorSchemaRef: normalizeOptionalText(e.target.value),
                                }),
                              }))
                            }
                          />
                          <Select
                            value={step.errorExceptionRef ?? EMPTY_SELECT_VALUE}
                            onValueChange={(value) =>
                              updateSequence((current) => ({
                                ...current,
                                steps: updateAtIndex(current.steps, index, {
                                  errorExceptionRef:
                                    value === EMPTY_SELECT_VALUE ? undefined : value,
                                }),
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="失敗時例外（任意）" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY_SELECT_VALUE}>失敗時例外なし</SelectItem>
                              {exceptionOptions.map((option) => (
                                <SelectItem key={option.code} value={option.code}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {(step.errorLabel || step.errorSchemaRef) && !step.errorExceptionRef && (
                          <p className="text-xs text-amber-700">
                            errorLabel / errorSchemaRef を設定した場合は失敗時例外も選択してください。
                          </p>
                        )}

                        {step.callType === "async" && (
                          <div className="space-y-2 rounded-md border border-slate-100 bg-slate-50/70 p-2">
                            <div className="text-[11px] font-medium text-slate-600">
                              asyncCompletion（任意）
                            </div>
                            <div className="grid gap-2 md:grid-cols-3">
                              <Input
                                placeholder="callbackToDdId（任意）"
                                value={step.asyncCompletion?.callbackToDdId ?? ""}
                                onChange={(e) =>
                                  updateSequence((current) => {
                                    const currentStep = current.steps[index];
                                    if (!currentStep || currentStep.kind !== "call") return current;
                                    return {
                                      ...current,
                                      steps: updateAtIndex(current.steps, index, {
                                        asyncCompletion: mergeAsyncCompletion(
                                          currentStep.asyncCompletion,
                                          {
                                            callbackToDdId: normalizeOptionalText(e.target.value),
                                          }
                                        ),
                                      }),
                                    };
                                  })
                                }
                              />
                              <Input
                                placeholder="message（任意）"
                                value={step.asyncCompletion?.message ?? ""}
                                onChange={(e) =>
                                  updateSequence((current) => {
                                    const currentStep = current.steps[index];
                                    if (!currentStep || currentStep.kind !== "call") return current;
                                    return {
                                      ...current,
                                      steps: updateAtIndex(current.steps, index, {
                                        asyncCompletion: mergeAsyncCompletion(
                                          currentStep.asyncCompletion,
                                          {
                                            message: normalizeOptionalText(e.target.value),
                                          }
                                        ),
                                      }),
                                    };
                                  })
                                }
                              />
                              <Input
                                placeholder="timeoutMs（任意）"
                                type="number"
                                value={step.asyncCompletion?.timeoutMs ?? ""}
                                onChange={(e) =>
                                  updateSequence((current) => {
                                    const currentStep = current.steps[index];
                                    if (!currentStep || currentStep.kind !== "call") return current;
                                    return {
                                      ...current,
                                      steps: updateAtIndex(current.steps, index, {
                                        asyncCompletion: mergeAsyncCompletion(
                                          currentStep.asyncCompletion,
                                          {
                                            timeoutMs:
                                              e.target.value === ""
                                                ? undefined
                                                : Number(e.target.value),
                                          }
                                        ),
                                      }),
                                    };
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              <Input
                                placeholder="successLabel（任意）"
                                value={step.asyncCompletion?.successLabel ?? ""}
                                onChange={(e) =>
                                  updateSequence((current) => {
                                    const currentStep = current.steps[index];
                                    if (!currentStep || currentStep.kind !== "call") return current;
                                    return {
                                      ...current,
                                      steps: updateAtIndex(current.steps, index, {
                                        asyncCompletion: mergeAsyncCompletion(
                                          currentStep.asyncCompletion,
                                          {
                                            successLabel: normalizeOptionalText(e.target.value),
                                          }
                                        ),
                                      }),
                                    };
                                  })
                                }
                              />
                              <Input
                                placeholder="successSchemaRef（任意）"
                                value={step.asyncCompletion?.successSchemaRef ?? ""}
                                onChange={(e) =>
                                  updateSequence((current) => {
                                    const currentStep = current.steps[index];
                                    if (!currentStep || currentStep.kind !== "call") return current;
                                    return {
                                      ...current,
                                      steps: updateAtIndex(current.steps, index, {
                                        asyncCompletion: mergeAsyncCompletion(
                                          currentStep.asyncCompletion,
                                          {
                                            successSchemaRef: normalizeOptionalText(e.target.value),
                                          }
                                        ),
                                      }),
                                    };
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-2 md:grid-cols-3">
                              <Input
                                placeholder="errorLabel（任意）"
                                value={step.asyncCompletion?.errorLabel ?? ""}
                                onChange={(e) =>
                                  updateSequence((current) => {
                                    const currentStep = current.steps[index];
                                    if (!currentStep || currentStep.kind !== "call") return current;
                                    return {
                                      ...current,
                                      steps: updateAtIndex(current.steps, index, {
                                        asyncCompletion: mergeAsyncCompletion(
                                          currentStep.asyncCompletion,
                                          {
                                            errorLabel: normalizeOptionalText(e.target.value),
                                          }
                                        ),
                                      }),
                                    };
                                  })
                                }
                              />
                              <Input
                                placeholder="errorSchemaRef（任意）"
                                value={step.asyncCompletion?.errorSchemaRef ?? ""}
                                onChange={(e) =>
                                  updateSequence((current) => {
                                    const currentStep = current.steps[index];
                                    if (!currentStep || currentStep.kind !== "call") return current;
                                    return {
                                      ...current,
                                      steps: updateAtIndex(current.steps, index, {
                                        asyncCompletion: mergeAsyncCompletion(
                                          currentStep.asyncCompletion,
                                          {
                                            errorSchemaRef: normalizeOptionalText(e.target.value),
                                          }
                                        ),
                                      }),
                                    };
                                  })
                                }
                              />
                              <Select
                                value={
                                  step.asyncCompletion?.errorExceptionRef ?? EMPTY_SELECT_VALUE
                                }
                                onValueChange={(value) =>
                                  updateSequence((current) => {
                                    const currentStep = current.steps[index];
                                    if (!currentStep || currentStep.kind !== "call") return current;
                                    return {
                                      ...current,
                                      steps: updateAtIndex(current.steps, index, {
                                        asyncCompletion: mergeAsyncCompletion(
                                          currentStep.asyncCompletion,
                                          {
                                            errorExceptionRef:
                                              value === EMPTY_SELECT_VALUE
                                                ? undefined
                                                : value,
                                          }
                                        ),
                                      }),
                                    };
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="失敗時例外（任意）" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={EMPTY_SELECT_VALUE}>
                                    失敗時例外なし
                                  </SelectItem>
                                  {exceptionOptions.map((option) => (
                                    <SelectItem key={option.code} value={option.code}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {(step.asyncCompletion?.errorLabel ||
                              step.asyncCompletion?.errorSchemaRef) &&
                              !step.asyncCompletion?.errorExceptionRef && (
                              <p className="text-xs text-amber-700">
                                asyncCompletion の errorLabel / errorSchemaRef 設定時は失敗時例外も選択してください。
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {step.kind === "effect_ref" && (
                      <div className="space-y-2">
                        {effectRefOptions.length > 0 ? (
                          <Select
                            value={step.ref}
                            onValueChange={(value) =>
                              updateSequence((current) => ({
                                ...current,
                                steps: updateAtIndex(current.steps, index, {
                                  ref: value,
                                }),
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {effectRefOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="db:operation_id"
                            value={step.ref}
                            onChange={(e) =>
                              updateSequence((current) => ({
                                ...current,
                                steps: updateAtIndex(current.steps, index, {
                                  ref: e.target.value,
                                }),
                              }))
                            }
                          />
                        )}
                      </div>
                    )}

                    {step.kind === "ref" && (
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          placeholder="title"
                          value={step.title}
                          onChange={(e) =>
                            updateSequence((current) => ({
                              ...current,
                              steps: updateAtIndex(current.steps, index, {
                                title: e.target.value,
                              }),
                            }))
                          }
                        />
                        <Input
                          placeholder="target DD ID（任意）"
                          value={step.target.ddId ?? ""}
                          onChange={(e) =>
                            updateSequence((current) => ({
                              ...current,
                              steps: updateAtIndex(current.steps, index, {
                                target: {
                                  ...step.target,
                                  ddId: e.target.value,
                                },
                              }),
                            }))
                          }
                        />
                      </div>
                    )}

                    {step.kind === "note" && (
                      <Input
                        placeholder="note text"
                        value={step.text}
                        onChange={(e) =>
                          updateSequence((current) => ({
                            ...current,
                            steps: updateAtIndex(current.steps, index, {
                              text: e.target.value,
                            }),
                          }))
                        }
                      />
                    )}

                    {step.kind === "fragment" && (
                      <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                        fragment ステップは現在この画面では表示・削除のみ対応です。
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </FoldableStructuredSection>
  );
}
