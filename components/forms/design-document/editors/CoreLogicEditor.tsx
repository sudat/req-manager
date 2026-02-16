import { useState, type ReactNode } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { BusinessRule } from "@/lib/domain/schemas/core-logic";
import { FoldableStructuredSection } from "../FoldableStructuredSection";
import { BUSINESS_RULE_TYPE_LABELS, BUSINESS_RULE_TYPES } from "../constants";
import { removeAtIndex, updateAtIndex } from "@/lib/utils/array-updates";
import type { StructuredSpecEditorProps } from "./types";

interface CoreLogicEditorProps {
  spec: StructuredSpecEditorProps["spec"];
  updateStructuredSpec: StructuredSpecEditorProps["updateStructuredSpec"];
}

const EMPTY_SELECT_VALUE = "__none__";

type RuleSequence = NonNullable<BusinessRule["sequence"]>;
type PreconditionViolation = NonNullable<BusinessRule["preconditionViolations"]>[number];
type RuleSideEffectSummary = {
  kind: "db" | "api" | "event" | "file";
  label: string;
};

function normalizeRuleSequence(
  sequence: Partial<RuleSequence>
): RuleSequence | undefined {
  if (!sequence.fragmentType) return undefined;

  const normalized: Partial<RuleSequence> = {
    fragmentType: sequence.fragmentType,
  };

  if (sequence.fragmentGroup && sequence.fragmentGroup.trim().length > 0) {
    normalized.fragmentGroup = sequence.fragmentGroup.trim();
  }
  if (sequence.fragmentType === "alt" && sequence.branch) {
    normalized.branch = sequence.branch;
  }
  if (sequence.guard && sequence.guard.trim().length > 0) {
    normalized.guard = sequence.guard.trim();
  }
  if (
    sequence.fragmentType === "loop" &&
    sequence.loopLabel &&
    sequence.loopLabel.trim().length > 0
  ) {
    normalized.loopLabel = sequence.loopLabel.trim();
  }

  return normalized as RuleSequence;
}

function patchRuleSequence(
  current: BusinessRule["sequence"],
  patch: Partial<RuleSequence>
): RuleSequence | undefined {
  return normalizeRuleSequence({
    ...(current ?? {}),
    ...patch,
  });
}

function findPreconditionViolation(
  violations: BusinessRule["preconditionViolations"],
  preconditionIndex: number
): PreconditionViolation | undefined {
  return (violations ?? []).find((item) => item.preconditionIndex === preconditionIndex);
}

function setPreconditionViolation(
  violations: BusinessRule["preconditionViolations"],
  preconditionIndex: number,
  exceptionIndex?: number
): BusinessRule["preconditionViolations"] {
  const withoutTarget = (violations ?? []).filter(
    (item) => item.preconditionIndex !== preconditionIndex
  );

  if (exceptionIndex === undefined) {
    return withoutTarget.length > 0 ? withoutTarget : undefined;
  }

  const next = [
    ...withoutTarget,
    {
      preconditionIndex,
      exceptionIndex,
    },
  ].sort((a, b) => a.preconditionIndex - b.preconditionIndex);

  return next;
}

function removePreconditionAndShiftViolations(
  preconditions: BusinessRule["preconditions"],
  violations: BusinessRule["preconditionViolations"],
  removedPreconditionIndex: number
): Pick<BusinessRule, "preconditions" | "preconditionViolations"> {
  const nextPreconditions = removeAtIndex(preconditions, removedPreconditionIndex);
  const nextViolations = (violations ?? [])
    .filter((item) => item.preconditionIndex !== removedPreconditionIndex)
    .map((item) =>
      item.preconditionIndex > removedPreconditionIndex
        ? { ...item, preconditionIndex: item.preconditionIndex - 1 }
        : item
    );

  return {
    preconditions: nextPreconditions,
    preconditionViolations: nextViolations.length > 0 ? nextViolations : undefined,
  };
}

function collectSideEffectsByRuleName(
  spec: StructuredSpecEditorProps["spec"]
): Map<string, RuleSideEffectSummary[]> {
  const map = new Map<string, RuleSideEffectSummary[]>();

  const push = (
    ruleRef: string | undefined,
    item: RuleSideEffectSummary
  ) => {
    const normalizedRuleRef = ruleRef?.trim();
    if (!normalizedRuleRef) return;
    const current = map.get(normalizedRuleRef) ?? [];
    map.set(normalizedRuleRef, [...current, item]);
  };

  for (const operation of spec.sideEffects.dbOperations ?? []) {
    push(operation.ruleRef, {
      kind: "db",
      label: `${operation.operation.toUpperCase()} ${operation.table || "(table未設定)"}`,
    });
  }

  for (const apiCall of spec.sideEffects.externalApiCalls ?? []) {
    push(apiCall.ruleRef, {
      kind: "api",
      label: `${apiCall.method} ${apiCall.endpoint || "(endpoint未設定)"}`,
    });
  }

  for (const event of spec.sideEffects.events ?? []) {
    push(event.ruleRef, {
      kind: "event",
      label: `EVENT ${event.eventType || "(eventType未設定)"}`,
    });
  }

  for (const fileOutput of spec.sideEffects.fileOutputs ?? []) {
    push(fileOutput.ruleRef, {
      kind: "file",
      label: `FILE ${fileOutput.format} ${fileOutput.path || "(path未設定)"}`,
    });
  }

  return map;
}

function countSideEffects(spec: StructuredSpecEditorProps["spec"]): number {
  return (
    (spec.sideEffects.dbOperations?.length ?? 0) +
    (spec.sideEffects.externalApiCalls?.length ?? 0) +
    (spec.sideEffects.events?.length ?? 0) +
    (spec.sideEffects.fileOutputs?.length ?? 0)
  );
}

function getSideEffectKindLabel(kind: RuleSideEffectSummary["kind"]): string {
  const labels: Record<RuleSideEffectSummary["kind"], string> = {
    db: "DB",
    api: "API",
    event: "Event",
    file: "File",
  };
  return labels[kind];
}

export function CoreLogicEditor({ spec, updateStructuredSpec }: CoreLogicEditorProps): ReactNode {
  const [openedViolationEditors, setOpenedViolationEditors] = useState<Record<string, boolean>>({});

  if (spec.ioType === "model") {
    return null;
  }

  const exceptionOptions = spec.exceptions.map((exception, index) => {
    const errorCode = exception.errorCode?.trim();
    const condition = exception.condition?.trim();
    const message = exception.message?.trim();
    const label = errorCode && errorCode.length > 0 ? errorCode : `例外${index + 1}`;
    const detail = condition && condition.length > 0
      ? condition
      : message && message.length > 0
        ? message
        : exception.type;
    return {
      index,
      label,
      detail,
    };
  });
  const sideEffectsByRuleName = collectSideEffectsByRuleName(spec);
  const sideEffectCount = countSideEffects(spec);

  return (
    <FoldableStructuredSection
      title="コアロジック"
      description="入力から出力への処理ルールを定義します"
      titleTooltip="入力データを出力データに変換する際に適用されるビジネスルール（検証、抽出、算出、判定、永続化）を記述します。"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">全体概要</Label>
          <Textarea
            value={spec.coreLogic.summary || ""}
            onChange={(e) =>
              updateStructuredSpec((current) => ({
                ...current,
                coreLogic: { ...current.coreLogic, summary: e.target.value },
              }))
            }
            rows={2}
            placeholder="コアロジック全体の概要説明"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">ビジネスルール</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newRule: BusinessRule = {
                  name: "",
                  type: "validate",
                  description: "",
                };
                updateStructuredSpec((current) => ({
                  ...current,
                  coreLogic: {
                    ...current.coreLogic,
                    rules: [...(current.coreLogic.rules || []), newRule],
                  },
                }));
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              ルール追加
            </Button>
          </div>

          {spec.coreLogic.rules && spec.coreLogic.rules.length > 0 ? (
            <div className="space-y-3">
              {spec.coreLogic.rules.map((rule, ruleIndex) => {
                const normalizedRuleName = rule.name?.trim();
                const mappedSideEffects = normalizedRuleName
                  ? (sideEffectsByRuleName.get(normalizedRuleName) ?? [])
                  : [];

                return (
                  <div
                    key={ruleIndex}
                    className="rounded-md border border-slate-200 p-3 space-y-3"
                  >
                  <div className="flex items-center justify-between">
                    <Badge variant={rule.type}>ルール {ruleIndex + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        updateStructuredSpec((current) => ({
                          ...current,
                          coreLogic: {
                            ...current.coreLogic,
                            rules: removeAtIndex(current.coreLogic.rules, ruleIndex),
                          },
                        }));
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">ルール名</Label>
                      <Input
                        value={rule.name}
                        onChange={(e) => {
                          updateStructuredSpec((current) => ({
                            ...current,
                            coreLogic: {
                              ...current.coreLogic,
                              rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                name: e.target.value,
                              }),
                            },
                          }));
                        }}
                        placeholder="例: tax_calculation"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">種別</Label>
                      <Select
                        value={rule.type}
                        onValueChange={(value) => {
                          updateStructuredSpec((current) => ({
                            ...current,
                            coreLogic: {
                              ...current.coreLogic,
                              rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                type: value as BusinessRule["type"],
                              }),
                            },
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_RULE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {BUSINESS_RULE_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">説明</Label>
                    <Textarea
                      value={rule.description}
                      onChange={(e) => {
                        updateStructuredSpec((current) => ({
                          ...current,
                          coreLogic: {
                            ...current.coreLogic,
                            rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                              description: e.target.value,
                            }),
                          },
                        }));
                      }}
                      rows={2}
                      placeholder="ルールの説明"
                    />
                  </div>

                  <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <Label className="text-xs">このルールで呼び出す副作用</Label>
                    {!normalizedRuleName ? (
                      <p className="text-xs text-muted-foreground">
                        ルール名を入力すると、紐付いた副作用がここに表示されます。
                      </p>
                    ) : mappedSideEffects.length > 0 ? (
                      <div className="space-y-1">
                        {mappedSideEffects.map((item, itemIndex) => (
                          <div key={`${item.kind}-${itemIndex}`} className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="h-5 px-2">
                              {getSideEffectKindLabel(item.kind)}
                            </Badge>
                            <span className="font-mono text-slate-700">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : sideEffectCount > 0 ? (
                      <p className="text-xs text-amber-700">
                        このルールに紐付いた副作用は未設定です。副作用セクションで呼び出しルールを選択してください。
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">副作用は定義されていません。</p>
                    )}
                  </div>

                  <div className="space-y-2 rounded-md border border-slate-200 p-3">
                    <Label className="text-xs">シーケンス制御（任意）</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">フラグメント</Label>
                        <Select
                          value={rule.sequence?.fragmentType ?? EMPTY_SELECT_VALUE}
                          onValueChange={(value) => {
                            updateStructuredSpec((current) => {
                              const currentRule = (current.coreLogic.rules?.[ruleIndex] as BusinessRule) ?? rule;
                              const fragmentType = value === EMPTY_SELECT_VALUE
                                ? undefined
                                : (value as RuleSequence["fragmentType"]);
                              return {
                                ...current,
                                coreLogic: {
                                  ...current.coreLogic,
                                  rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                    sequence: patchRuleSequence(currentRule.sequence, {
                                      fragmentType,
                                      branch: undefined,
                                      loopLabel: undefined,
                                    }),
                                  }),
                                },
                              };
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EMPTY_SELECT_VALUE}>未指定</SelectItem>
                            <SelectItem value="alt">alt（条件分岐）</SelectItem>
                            <SelectItem value="opt">opt（任意分岐）</SelectItem>
                            <SelectItem value="loop">loop（繰り返し）</SelectItem>
                            <SelectItem value="par">par（並列）</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">グループID（任意）</Label>
                        <Input
                          value={rule.sequence?.fragmentGroup ?? ""}
                          onChange={(e) => {
                            updateStructuredSpec((current) => {
                              const currentRule = (current.coreLogic.rules?.[ruleIndex] as BusinessRule) ?? rule;
                              return {
                                ...current,
                                coreLogic: {
                                  ...current.coreLogic,
                                  rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                    sequence: patchRuleSequence(currentRule.sequence, {
                                      fragmentGroup: e.target.value,
                                    }),
                                  }),
                                },
                              };
                            });
                          }}
                          placeholder="例: auth_check"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">分岐（alt専用）</Label>
                        <Select
                          value={rule.sequence?.branch ?? EMPTY_SELECT_VALUE}
                          onValueChange={(value) => {
                            updateStructuredSpec((current) => {
                              const currentRule = (current.coreLogic.rules?.[ruleIndex] as BusinessRule) ?? rule;
                              return {
                                ...current,
                                coreLogic: {
                                  ...current.coreLogic,
                                  rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                    sequence: patchRuleSequence(currentRule.sequence, {
                                      branch: value === EMPTY_SELECT_VALUE
                                        ? undefined
                                        : (value as RuleSequence["branch"]),
                                    }),
                                  }),
                                },
                              };
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EMPTY_SELECT_VALUE}>未指定</SelectItem>
                            <SelectItem value="if">if</SelectItem>
                            <SelectItem value="else">else</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">ガード条件（任意）</Label>
                        <Input
                          value={rule.sequence?.guard ?? ""}
                          onChange={(e) => {
                            updateStructuredSpec((current) => {
                              const currentRule = (current.coreLogic.rules?.[ruleIndex] as BusinessRule) ?? rule;
                              return {
                                ...current,
                                coreLogic: {
                                  ...current.coreLogic,
                                  rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                    sequence: patchRuleSequence(currentRule.sequence, {
                                      guard: e.target.value,
                                    }),
                                  }),
                                },
                              };
                            });
                          }}
                          placeholder="例: 金額 > 与信枠"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">loopラベル（loop専用）</Label>
                      <Input
                        value={rule.sequence?.loopLabel ?? ""}
                        onChange={(e) => {
                          updateStructuredSpec((current) => {
                            const currentRule = (current.coreLogic.rules?.[ruleIndex] as BusinessRule) ?? rule;
                            return {
                              ...current,
                              coreLogic: {
                                ...current.coreLogic,
                                rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                  sequence: patchRuleSequence(currentRule.sequence, {
                                    loopLabel: e.target.value,
                                  }),
                                }),
                              },
                            };
                          });
                        }}
                        placeholder="例: 明細行ごと"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">計算式・判定式（オプション）</Label>
                    {(rule.formulas || []).map((formula, formulaIndex) => (
                      <div key={formulaIndex} className="flex items-center gap-2">
                        <Input
                          value={formula}
                          onChange={(e) => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              coreLogic: {
                                ...current.coreLogic,
                                rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                  formulas: updateAtIndex(
                                    (current.coreLogic.rules?.[ruleIndex] as BusinessRule)?.formulas,
                                    formulaIndex,
                                    e.target.value
                                  ),
                                }),
                              },
                            }));
                          }}
                          placeholder="例: 税額 = 税抜金額 × 税率"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              coreLogic: {
                                ...current.coreLogic,
                                rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                  formulas: removeAtIndex(
                                    (current.coreLogic.rules?.[ruleIndex] as BusinessRule)?.formulas,
                                    formulaIndex
                                  ),
                                }),
                              },
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateStructuredSpec((current) => {
                          const currentFormulas = (current.coreLogic.rules?.[ruleIndex] as BusinessRule)?.formulas ?? [];
                          return {
                            ...current,
                            coreLogic: {
                              ...current.coreLogic,
                              rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                formulas: [...currentFormulas, ""],
                              }),
                            },
                          };
                        });
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      式を追加
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">前提条件（オプション）</Label>
                    {(rule.preconditions || []).map((precondition, preconditionIndex) => (
                      <div key={preconditionIndex} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={precondition}
                            onChange={(e) => {
                              updateStructuredSpec((current) => ({
                                ...current,
                                coreLogic: {
                                  ...current.coreLogic,
                                  rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                    preconditions: updateAtIndex(
                                      (current.coreLogic.rules?.[ruleIndex] as BusinessRule)?.preconditions,
                                      preconditionIndex,
                                      e.target.value
                                    ),
                                  }),
                                },
                              }));
                            }}
                            placeholder="例: 税抜金額 > 0"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => {
                              const key = `${ruleIndex}:${preconditionIndex}`;
                              setOpenedViolationEditors((current) => ({
                                ...current,
                                [key]: !current[key],
                              }));
                            }}
                          >
                            違反時の挙動
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              updateStructuredSpec((current) => {
                                const currentRule = (current.coreLogic.rules?.[ruleIndex] as BusinessRule) ?? rule;
                                const next = removePreconditionAndShiftViolations(
                                  currentRule.preconditions,
                                  currentRule.preconditionViolations,
                                  preconditionIndex
                                );
                                return {
                                  ...current,
                                  coreLogic: {
                                    ...current.coreLogic,
                                    rules: updateAtIndex(current.coreLogic.rules, ruleIndex, next),
                                  },
                                };
                              });
                              setOpenedViolationEditors((current) => {
                                const key = `${ruleIndex}:${preconditionIndex}`;
                                if (!current[key]) return current;
                                const next = { ...current };
                                delete next[key];
                                return next;
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {(() => {
                          const violation = findPreconditionViolation(
                            rule.preconditionViolations,
                            preconditionIndex
                          );
                          const editorKey = `${ruleIndex}:${preconditionIndex}`;
                          const opened = openedViolationEditors[editorKey] || Boolean(violation);
                          if (!opened) return null;

                          return (
                            <div className="ml-1 rounded-md border border-slate-200 bg-slate-50 p-2 space-y-2">
                              {exceptionOptions.length > 0 ? (
                                <>
                                  <Label className="text-[11px]">前提条件違反時に返す例外</Label>
                                  <Select
                                    value={
                                      violation
                                        ? String(violation.exceptionIndex)
                                        : EMPTY_SELECT_VALUE
                                    }
                                    onValueChange={(value) => {
                                      updateStructuredSpec((current) => {
                                        const currentRule = (current.coreLogic.rules?.[ruleIndex] as BusinessRule) ?? rule;
                                        const nextViolations = setPreconditionViolation(
                                          currentRule.preconditionViolations,
                                          preconditionIndex,
                                          value === EMPTY_SELECT_VALUE ? undefined : Number(value)
                                        );
                                        return {
                                          ...current,
                                          coreLogic: {
                                            ...current.coreLogic,
                                            rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                              preconditionViolations: nextViolations,
                                            }),
                                          },
                                        };
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="例外を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={EMPTY_SELECT_VALUE}>未設定</SelectItem>
                                      {exceptionOptions.map((option) => (
                                        <SelectItem key={option.index} value={String(option.index)}>
                                          {`${option.label}: ${option.detail}`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  例外セクションで先に例外を追加してください
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateStructuredSpec((current) => {
                          const currentPreconditions = (current.coreLogic.rules?.[ruleIndex] as BusinessRule)?.preconditions ?? [];
                          return {
                            ...current,
                            coreLogic: {
                              ...current.coreLogic,
                              rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                preconditions: [...currentPreconditions, ""],
                              }),
                            },
                          };
                        });
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      条件を追加
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">補足事項（オプション）</Label>
                    {(rule.notes || []).map((note, noteIndex) => (
                      <div key={noteIndex} className="flex items-center gap-2">
                        <Input
                          value={note}
                          onChange={(e) => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              coreLogic: {
                                ...current.coreLogic,
                                rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                  notes: updateAtIndex(
                                    (current.coreLogic.rules?.[ruleIndex] as BusinessRule)?.notes,
                                    noteIndex,
                                    e.target.value
                                  ),
                                }),
                              },
                            }));
                          }}
                          placeholder="補足情報・備考"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              coreLogic: {
                                ...current.coreLogic,
                                rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                  notes: removeAtIndex(
                                    (current.coreLogic.rules?.[ruleIndex] as BusinessRule)?.notes,
                                    noteIndex
                                  ),
                                }),
                              },
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateStructuredSpec((current) => {
                          const currentNotes = (current.coreLogic.rules?.[ruleIndex] as BusinessRule)?.notes ?? [];
                          return {
                            ...current,
                            coreLogic: {
                              ...current.coreLogic,
                              rules: updateAtIndex(current.coreLogic.rules, ruleIndex, {
                                notes: [...currentNotes, ""],
                              }),
                            },
                          };
                        });
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      備考を追加
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic py-2">
              ビジネスルールが定義されていません
            </div>
          )}
        </div>
      </div>
    </FoldableStructuredSection>
  );
}
