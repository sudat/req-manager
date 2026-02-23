import { useMemo, useState, type ReactNode } from "react";
import { CircleHelp, Trash2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DesignDocumentSelectionDialog } from "@/components/forms/DesignDocumentSelectionDialog";
import type { DdType } from "@/lib/domain";
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
  selectableTargetDds?: { id: string; name: string; type: DdType; summary: string }[];
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
  selectableTargetDds = [],
}: SequenceEditorProps): ReactNode {
  const sequence = spec.sequence ?? { mode: "auto" as const, steps: [] };
  const mode = sequence.mode ?? "auto";
  const [newStepKind, setNewStepKind] = useState<SupportedStepKind>("call");
  const [targetDdDialogOpen, setTargetDdDialogOpen] = useState(false);
  const [editingCallStepIndex, setEditingCallStepIndex] = useState<number | null>(null);

  const targetDdLabelMap = useMemo(() => {
    return new Map(
      selectableTargetDds.map((dd) => [dd.id, `${dd.id} ${dd.name || "（名称未設定）"}`])
    );
  }, [selectableTargetDds]);

  const selectedTargetDdId =
    editingCallStepIndex !== null &&
    sequence.steps[editingCallStepIndex] &&
    sequence.steps[editingCallStepIndex].kind === "call"
      ? sequence.steps[editingCallStepIndex].targetDdId || null
      : null;

  if (spec.ioType === "model") {
    return null;
  }

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

  const openTargetDdDialog = (stepIndex: number) => {
    setEditingCallStepIndex(stepIndex);
    setTargetDdDialogOpen(true);
  };

  const closeTargetDdDialog = () => {
    setTargetDdDialogOpen(false);
    setEditingCallStepIndex(null);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="grid gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">シーケンス制御</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center text-slate-500"
                    aria-label="シーケンス制御の説明"
                  >
                    <CircleHelp className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[min(90vw,36rem)] whitespace-normal leading-relaxed">
                  迷う場合は自動モードのままで問題ありません。複雑な順序制御が必要な時だけ手動モードを使ってください。
                </TooltipContent>
              </Tooltip>
            </div>
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
                <SelectItem value="auto">自動（推奨）</SelectItem>
                <SelectItem value="guided">手動（順序指定）</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {mode === "guided" && (
          <div className="space-y-2 rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700">手動ステップ</div>
                <p className="text-xs text-muted-foreground">
                  呼び出し / 副作用参照 / 参照 / 注記 の順で処理を並べます
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={newStepKind}
                  onValueChange={(value) =>
                    setNewStepKind(value as SupportedStepKind)
                  }
                >
                  <SelectTrigger className="h-8 w-[108px] gap-1 px-2">
                    <SelectValue placeholder="種別" />
                  </SelectTrigger>
                  <SelectContent className="w-[108px] min-w-[108px]">
                    <SelectItem value="call">呼び出し</SelectItem>
                    <SelectItem value="effect_ref">副作用参照</SelectItem>
                    <SelectItem value="ref">参照</SelectItem>
                    <SelectItem value="note">注記</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-8 px-3 text-[12px]"
                  onClick={() =>
                    updateSequence((current) =>
                      appendSequenceStep(current, createDefaultStep(newStepKind))
                    )
                  }
                >
                  追加
                </Button>
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
                        <div className="grid gap-2 md:grid-cols-[minmax(120px,1fr)_minmax(150px,1.2fr)_52px_minmax(150px,1.1fr)_minmax(150px,1.1fr)_minmax(170px,1.2fr)] md:items-center">
                          <Input
                            placeholder="call id"
                            value={step.id}
                            onChange={(e) =>
                              patchStep(index, { id: e.target.value })
                            }
                          />
                          {selectableTargetDds.length > 0 ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => openTargetDdDialog(index)}
                              className="justify-start text-left h-9 px-3 text-sm w-full"
                            >
                              <span className="truncate">
                                {step.targetDdId
                                  ? targetDdLabelMap.get(step.targetDdId) ?? step.targetDdId
                                  : "target DD ID"}
                              </span>
                            </Button>
                          ) : (
                            <Input
                              placeholder="target DD ID"
                              value={step.targetDdId}
                              onChange={(e) =>
                                patchStep(index, { targetDdId: e.target.value })
                              }
                            />
                          )}
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
                            <SelectTrigger className="w-[52px] gap-1 px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="min-w-[52px]">
                              <SelectItem value="sync">同期</SelectItem>
                              <SelectItem value="async">非同</SelectItem>
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

      <DesignDocumentSelectionDialog
        isOpen={targetDdDialogOpen}
        onClose={closeTargetDdDialog}
        title="呼び出し先DDを選択"
        designDocuments={selectableTargetDds}
        selectedId={selectedTargetDdId}
        onSelect={(ddId) => {
          if (editingCallStepIndex === null) return;
          updateSequence((current) => {
            const targetStep = current.steps[editingCallStepIndex];
            if (!targetStep || targetStep.kind !== "call") return current;
            return {
              ...current,
              steps: updateAtIndex(current.steps, editingCallStepIndex, {
                targetDdId: ddId,
              }),
            };
          });
        }}
        emptyMessage="選択可能なDDがありません。"
      />
    </>
  );
}
