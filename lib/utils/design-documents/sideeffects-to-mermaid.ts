import type { DesignDocument, SystemFunction } from "@/lib/domain/entities";
import {
  DD_DEPENDENCY_CALL_TYPE_LABELS,
  type DdDependencyLink,
} from "@/lib/domain/dd-dependency";
import type {
  BusinessRule,
  SequenceFragmentType,
} from "@/lib/domain/schemas/core-logic";
import type { StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";
import type {
  SequenceActivationPolicy,
  SideEffect,
} from "@/lib/domain/schemas/side-effects";
import type {
  SequenceSpec,
  SequenceStep,
} from "@/lib/domain/schemas/sequence";

type ParsedDesignDocument = {
  dd: DesignDocument;
  alias: string;
  spec: StructuredDesignDocumentSpec | null;
};

type SideEffectParticipants = {
  dbTableAliasMap: Map<string, string>;
  needsDbFallback: boolean;
  hasEventBus: boolean;
  hasFileSystem: boolean;
  hostAliasMap: Map<string, string>;
  needsExternalFallback: boolean;
};

type SideEffectAction = {
  ruleRef?: string;
  activation?: SequenceActivationPolicy;
  render: (lines: string[]) => void;
};

type ErrorResponseMeta = {
  errorLabel?: string;
  errorSchemaRef?: string;
  errorExceptionRef?: string;
};

type ResponseMeta = ErrorResponseMeta & {
  successLabel?: string;
  successSchemaRef?: string;
};

type ExceptionSummaryMap = Map<string, string>;

type FragmentContext = {
  key: string;
  type: SequenceFragmentType;
  branch?: "if" | "else";
  guardText: string;
};

type OpenFragmentState = {
  key: string;
  type: SequenceFragmentType;
  activeBranch: "if" | "else";
};

type ProcessSideEffectsOptions = {
  manageActivation?: boolean;
};

type ProcessGuidedSequenceOptions = {
  manageActivation?: boolean;
};

type GuidedSequenceRenderContext = {
  sourceDdId: string;
  sourceAlias: string;
  sequence: SequenceSpec;
  sideEffects: SideEffect;
  exceptionMap: ExceptionSummaryMap;
  participants: SideEffectParticipants;
  lines: string[];
  aliasByDdId: Map<string, string>;
  renderedBodyDdIds: Set<string>;
  renderDdFlow: (ddId: string, options: { alreadyActivated: boolean }) => boolean;
};

function isModelDesignDocument(item: ParsedDesignDocument | undefined): boolean {
  if (!item) return false;
  return (item.spec?.ioType ?? item.dd.type) === "model";
}

/**
 * SFと設計書（DD）の依存関係 + sideEffects から Mermaid シーケンス図 DSL を生成する
 */
export function sideEffectsToMermaidSequence(
  sf: SystemFunction,
  dds: DesignDocument[],
  dependencies: DdDependencyLink[] = []
): { mermaidCode: string; ddMapping: Record<string, string> } {
  const lines: string[] = ["sequenceDiagram", `    title: ${sf.title} - 処理フロー`, ""];

  if (dds.length === 0) {
    lines.push("    participant INFO as 情報");
    lines.push("    Note over INFO: 対象のDDが登録されていません");
    return { mermaidCode: lines.join("\n"), ddMapping: {} };
  }

  const allParsed = dds.map<ParsedDesignDocument>((dd) => ({
    dd,
    alias: "",
    spec: getStructuredSpec(dd),
  }));
  const parsed = allParsed
    .filter((item) => !isModelDesignDocument(item))
    .map((item, index) => ({
      ...item,
      alias: `DD${index + 1}`,
    }));

  if (parsed.length === 0) {
    lines.push("    participant INFO as 情報");
    lines.push("    Note over INFO: シーケンス図対象のDD（model以外）がありません");
    return { mermaidCode: lines.join("\n"), ddMapping: {} };
  }

  const parsedByDdId = new Map(parsed.map((item) => [item.dd.id, item] as const));
  const aliasByDdId = new Map(parsed.map((item) => [item.dd.id, item.alias] as const));

  const sideEffectParticipants = collectSideEffectParticipants(parsed);

  for (const item of parsed) {
    lines.push(`    participant ${item.alias} as ${toSingleLine(getDdParticipantLabel(item))}`);
  }

  if (sideEffectParticipants.needsDbFallback) {
    lines.push("    participant DB as [db] Database");
  }
  for (const [tableName, alias] of sideEffectParticipants.dbTableAliasMap) {
    lines.push(`    participant ${alias} as ${formatDbParticipantLabel(tableName)}`);
  }
  if (sideEffectParticipants.hasEventBus) {
    lines.push("    participant EventBus as EventBus");
  }
  if (sideEffectParticipants.hasFileSystem) {
    lines.push("    participant FileSystem as FileSystem");
  }
  if (sideEffectParticipants.needsExternalFallback) {
    lines.push("    participant ExternalSystem as ExternalSystem");
  }
  for (const [host, alias] of sideEffectParticipants.hostAliasMap) {
    lines.push(`    participant ${alias} as ${toSingleLine(host)}`);
  }
  lines.push("");

  const validDependencies = dependencies
    .filter(
      (dependency) =>
        aliasByDdId.has(dependency.sourceDdId) &&
        aliasByDdId.has(dependency.targetDdId) &&
        dependency.sourceDdId !== dependency.targetDdId
    )
    .sort((a, b) => {
      const sourceA = dds.findIndex((dd) => dd.id === a.sourceDdId);
      const sourceB = dds.findIndex((dd) => dd.id === b.sourceDdId);
      if (sourceA !== sourceB) return sourceA - sourceB;
      const targetA = dds.findIndex((dd) => dd.id === a.targetDdId);
      const targetB = dds.findIndex((dd) => dd.id === b.targetDdId);
      if (targetA !== targetB) return targetA - targetB;
      return a.callType.localeCompare(b.callType);
    });

  const dependencyCountMap = new Map<string, number>();
  const incomingDependencyCountMap = new Map<string, number>();
  const outgoingDependencyMap = new Map<string, DdDependencyLink[]>();
  for (const dd of dds) {
    dependencyCountMap.set(dd.id, 0);
    incomingDependencyCountMap.set(dd.id, 0);
    outgoingDependencyMap.set(dd.id, []);
  }
  for (const dependency of validDependencies) {
    outgoingDependencyMap.get(dependency.sourceDdId)?.push(dependency);
    incomingDependencyCountMap.set(
      dependency.targetDdId,
      (incomingDependencyCountMap.get(dependency.targetDdId) ?? 0) + 1
    );
    dependencyCountMap.set(
      dependency.sourceDdId,
      (dependencyCountMap.get(dependency.sourceDdId) ?? 0) + 1
    );
    dependencyCountMap.set(
      dependency.targetDdId,
      (dependencyCountMap.get(dependency.targetDdId) ?? 0) + 1
    );
  }

  const renderedHeaderDdIds = new Set<string>();
  const renderedBodyDdIds = new Set<string>();

  const renderDdHeader = (ddId: string) => {
    if (renderedHeaderDdIds.has(ddId)) return;
    const item = parsedByDdId.get(ddId);
    const alias = aliasByDdId.get(ddId);
    if (!item || !alias) return;

    const ddType = item.spec?.ioType ?? item.dd.type;
    lines.push(`    Note over ${alias}: 【${toSingleLine(item.dd.name || item.dd.id)}】(${ddType})`);
    if ((dependencyCountMap.get(ddId) ?? 0) === 0) {
      lines.push(`    Note over ${alias}: 呼び出し依存が未定義です`);
    }
    renderedHeaderDdIds.add(ddId);
  };

  const renderDdFlow = (ddId: string, options: { alreadyActivated: boolean }): boolean => {
    const item = parsedByDdId.get(ddId);
    const sourceAlias = aliasByDdId.get(ddId);
    if (!item || !sourceAlias) return false;

    renderDdHeader(ddId);
    if (renderedBodyDdIds.has(ddId)) return false;
    renderedBodyDdIds.add(ddId);

    let hasFlow = false;
    const exceptionMap = toExceptionSummaryMap(item.spec?.exceptions ?? []);
    const sequence = item.spec?.sequence;
    if (sequence?.mode === "guided" && (sequence.steps?.length ?? 0) > 0) {
      const sideEffects = item.spec?.sideEffects;
      if (!sideEffects) {
        lines.push(`    Note over ${sourceAlias}: 構造化副作用が未定義です`);
        return hasFlow;
      }
      const hasGuidedFlow = processGuidedSequence(
        {
          sourceDdId: ddId,
          sourceAlias,
          sequence,
          sideEffects,
          exceptionMap,
          participants: sideEffectParticipants,
          lines,
          aliasByDdId,
          renderedBodyDdIds,
          renderDdFlow,
        },
        { manageActivation: !options.alreadyActivated }
      );
      hasFlow = hasFlow || hasGuidedFlow;
      return hasFlow;
    }

    for (const dependency of outgoingDependencyMap.get(ddId) ?? []) {
      const targetAlias = aliasByDdId.get(dependency.targetDdId);
      if (!targetAlias) continue;
      const isAsync = dependency.callType === "calls_async";
      const arrow = isAsync ? "-->>" : "->>";
      const message = toSingleLine(
        dependency.message || DD_DEPENDENCY_CALL_TYPE_LABELS[dependency.callType]
      );

      lines.push(`    ${sourceAlias}${arrow}${targetAlias}: ${message}`);
      hasFlow = true;

      if (!renderedBodyDdIds.has(dependency.targetDdId)) {
        lines.push(`    activate ${targetAlias}`);
        const nestedHasFlow = renderDdFlow(dependency.targetDdId, {
          alreadyActivated: true,
        });
        hasFlow = hasFlow || nestedHasFlow;
        if (!isAsync) {
          lines.push(
            `    ${targetAlias}-->>${sourceAlias}: ${formatReturnLabel(
              dependency.returnsLabel,
              dependency.returnSchemaRef
            )}`
          );
          hasFlow =
            renderErrorResponseLines(lines, {
              fromAlias: targetAlias,
              toAlias: sourceAlias,
              errorLabel: dependency.errorLabel,
              errorSchemaRef: dependency.errorSchemaRef,
              errorExceptionRef: dependency.errorExceptionRef,
              exceptionMap,
            }) || hasFlow;
        } else {
          hasFlow =
            renderAsyncCompletionLines(lines, {
              sourceAlias,
              targetAlias,
              aliasByDdId,
              asyncCompletion: dependency.asyncCompletion,
              exceptionMap,
            }) || hasFlow;
        }
        lines.push(`    deactivate ${targetAlias}`);
      } else if (!isAsync) {
        lines.push(
          `    ${targetAlias}-->>${sourceAlias}: ${formatReturnLabel(
            dependency.returnsLabel,
            dependency.returnSchemaRef
          )}`
        );
        hasFlow =
          renderErrorResponseLines(lines, {
            fromAlias: targetAlias,
            toAlias: sourceAlias,
            errorLabel: dependency.errorLabel,
            errorSchemaRef: dependency.errorSchemaRef,
            errorExceptionRef: dependency.errorExceptionRef,
            exceptionMap,
          }) || hasFlow;
      } else {
        hasFlow =
          renderAsyncCompletionLines(lines, {
            sourceAlias,
            targetAlias,
            aliasByDdId,
            asyncCompletion: dependency.asyncCompletion,
            exceptionMap,
          }) || hasFlow;
      }
    }

    const sideEffects = item.spec?.sideEffects;
    if (sideEffects) {
      const hasSideEffectFlow = processSideEffects(
        sourceAlias,
        sideEffects,
        item.spec?.coreLogic?.rules ?? [],
        exceptionMap,
        sideEffectParticipants,
        lines,
        { manageActivation: !options.alreadyActivated }
      );
      hasFlow = hasFlow || hasSideEffectFlow;
    } else {
      lines.push(`    Note over ${sourceAlias}: 構造化副作用が未定義です`);
    }

    return hasFlow;
  };

  const rootDdIds = parsed
    .map((item) => item.dd.id)
    .filter((ddId) => (incomingDependencyCountMap.get(ddId) ?? 0) === 0);
  const traversalStartDdIds =
    rootDdIds.length > 0 ? rootDdIds : parsed.map((item) => item.dd.id);

  let hasAnyFlow = false;
  for (const ddId of traversalStartDdIds) {
    if (renderedBodyDdIds.has(ddId)) continue;
    const hasFlow = renderDdFlow(ddId, { alreadyActivated: false });
    hasAnyFlow = hasAnyFlow || hasFlow;
    lines.push("");
  }

  for (const item of parsed) {
    if (renderedBodyDdIds.has(item.dd.id)) continue;
    const hasFlow = renderDdFlow(item.dd.id, { alreadyActivated: false });
    hasAnyFlow = hasAnyFlow || hasFlow;
    lines.push("");
  }

  if (!hasAnyFlow) {
    lines.push("    Note over DD1: 依存関係・副作用の定義が不足しています");
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  // エイリアス→DD-IDのマッピングを生成
  const ddMapping = Object.fromEntries(
    parsed.flatMap((item) => {
      const label = toSingleLine(getDdParticipantLabel(item));
      return [
        [item.alias, item.dd.id] as const,
        [label, item.dd.id] as const,
      ];
    })
  );

  return {
    mermaidCode: lines.join("\n"),
    ddMapping,
  };
}

function collectSideEffectParticipants(
  parsed: ParsedDesignDocument[]
): SideEffectParticipants {
  const dbTableAliasMap = new Map<string, string>();
  const hostAliasMap = new Map<string, string>();
  const usedAliases = new Set<string>(["DB", "EventBus", "FileSystem", "ExternalSystem"]);
  let needsDbFallback = false;
  let hasEventBus = false;
  let hasFileSystem = false;
  let needsExternalFallback = false;

  for (const item of parsed) {
    const sideEffects = item.spec?.sideEffects;
    if (!sideEffects) continue;

    for (const operation of sideEffects.dbOperations ?? []) {
      const tableName = normalizeTableName(operation.table);
      if (!tableName) {
        needsDbFallback = true;
        continue;
      }
      if (dbTableAliasMap.has(tableName)) continue;
      const alias = uniqueAlias(`DB_${sanitizeIdentifier(tableName)}`, usedAliases);
      usedAliases.add(alias);
      dbTableAliasMap.set(tableName, alias);
    }
    if ((sideEffects.events ?? []).length > 0) {
      hasEventBus = true;
    }
    if ((sideEffects.fileOutputs ?? []).length > 0) {
      hasFileSystem = true;
    }

    for (const apiCall of sideEffects.externalApiCalls ?? []) {
      const host = extractHost(apiCall.endpoint);
      if (!host) {
        needsExternalFallback = true;
        continue;
      }

      if (!hostAliasMap.has(host)) {
        const alias = uniqueAlias(sanitizeIdentifier(host), usedAliases);
        usedAliases.add(alias);
        hostAliasMap.set(host, alias);
      }
    }
  }

  return {
    dbTableAliasMap,
    needsDbFallback,
    hasEventBus,
    hasFileSystem,
    hostAliasMap,
    needsExternalFallback,
  };
}

function processSideEffects(
  sourceAlias: string,
  sideEffects: SideEffect,
  rules: BusinessRule[],
  exceptionMap: ExceptionSummaryMap,
  participants: SideEffectParticipants,
  lines: string[],
  options?: ProcessSideEffectsOptions
): boolean {
  const manageActivation = options?.manageActivation ?? true;
  const actions = collectSideEffectActions(
    sourceAlias,
    sideEffects,
    participants,
    exceptionMap
  );
  const ruleMap = toRuleMap(rules);

  let hasFlow = false;
  let sourceActivated = false;
  let openFragment: OpenFragmentState | null = null;

  const renderAction = (action: SideEffectAction) => {
    if (manageActivation && !sourceActivated && shouldActivate(action.activation)) {
      lines.push(`    activate ${sourceAlias}`);
      sourceActivated = true;
    }
    action.render(lines);
    hasFlow = true;
  };

  for (const action of actions) {
    const fragment = resolveFragmentContext(action.ruleRef, ruleMap);
    if (!fragment) {
      if (openFragment) {
        lines.push("    end");
        openFragment = null;
      }
      renderAction(action);
      continue;
    }

    if (!openFragment || openFragment.key !== fragment.key) {
      if (openFragment) {
        lines.push("    end");
      }
      openFragment = openFragmentBlock(fragment, lines);
    } else if (
      fragment.type === "alt" &&
      fragment.branch === "else" &&
      openFragment.activeBranch === "if"
    ) {
      lines.push(`    else [${fragment.guardText}]`);
      openFragment.activeBranch = "else";
    } else if (
      fragment.type === "alt" &&
      fragment.branch === "if" &&
      openFragment.activeBranch === "else"
    ) {
      lines.push("    end");
      openFragment = openFragmentBlock(fragment, lines);
    }

    renderAction(action);
  }

  if (openFragment) {
    lines.push("    end");
  }
  if (manageActivation && sourceActivated) {
    lines.push(`    deactivate ${sourceAlias}`);
  }
  if (sideEffects.description && sideEffects.description !== "副作用なし") {
    lines.push(`    Note over ${sourceAlias}: ${toSingleLine(sideEffects.description)}`);
  }

  return hasFlow;
}

function processGuidedSequence(
  context: GuidedSequenceRenderContext,
  options?: ProcessGuidedSequenceOptions
): boolean {
  const manageActivation = options?.manageActivation ?? true;
  let hasFlow = false;
  let sourceActivated = false;

  const ensureSourceActivation = (policy: SequenceActivationPolicy | undefined) => {
    if (!manageActivation) return;
    if (sourceActivated) return;
    if (!shouldActivate(policy)) return;
    context.lines.push(`    activate ${context.sourceAlias}`);
    sourceActivated = true;
  };

  const resolveEffectRefAction = (
    ref: string
  ): { activation?: SequenceActivationPolicy; render: () => void } | null => {
    const [scope, id] = ref.split(":");
    if (!scope || !id) return null;

    if (scope === "db") {
      const operation = (context.sideEffects.dbOperations ?? []).find(
        (item) => item.id === id
      );
      if (!operation) return null;
      return {
        activation: operation.activation,
        render: () => {
          const tableName = normalizeTableName(operation.table);
          const targetAlias = resolveDbParticipantAlias(tableName, context.participants);
          context.lines.push(
            `    ${context.sourceAlias}->>${targetAlias}: ${dbOperationLabel(operation.operation)}${tableName ? ` ${tableName}` : ""}${operation.condition ? ` (${toSingleLine(operation.condition)})` : ""}`
          );
          renderResponseLines(context.lines, {
            fromAlias: targetAlias,
            toAlias: context.sourceAlias,
            response: operation.response,
            defaultSuccessLabel: "処理結果",
            alwaysRenderSuccess: false,
            exceptionMap: context.exceptionMap,
          });
        },
      };
    }

    if (scope === "api") {
      const apiCall = (context.sideEffects.externalApiCalls ?? []).find(
        (item) => item.id === id
      );
      if (!apiCall) return null;
      return {
        activation: apiCall.activation,
        render: () => {
          const host = extractHost(apiCall.endpoint);
          const targetAlias =
            host && context.participants.hostAliasMap.has(host)
              ? (context.participants.hostAliasMap.get(host) ?? "ExternalSystem")
              : "ExternalSystem";
          context.lines.push(
            `    ${context.sourceAlias}->>${targetAlias}: ${apiCall.method} ${toSingleLine(apiCall.endpoint)}`
          );
          renderResponseLines(context.lines, {
            fromAlias: targetAlias,
            toAlias: context.sourceAlias,
            response: apiCall.response,
            defaultSuccessLabel: "レスポンス",
            alwaysRenderSuccess: true,
            exceptionMap: context.exceptionMap,
          });
        },
      };
    }

    if (scope === "event") {
      const event = (context.sideEffects.events ?? []).find((item) => item.id === id);
      if (!event) return null;
      return {
        activation: event.activation,
        render: () => {
          context.lines.push(
            `    ${context.sourceAlias}->>EventBus: イベント発行 (${toSingleLine(event.eventType)})`
          );
          if (event.delayMs !== undefined && event.delayMs > 0) {
            context.lines.push(`    Note over EventBus: 遅延 ${event.delayMs}ms`);
          }
          renderResponseLines(context.lines, {
            fromAlias: "EventBus",
            toAlias: context.sourceAlias,
            response: event.response,
            defaultSuccessLabel: "イベント受付",
            alwaysRenderSuccess: false,
            exceptionMap: context.exceptionMap,
          });
        },
      };
    }

    if (scope === "file") {
      const fileOutput = (context.sideEffects.fileOutputs ?? []).find(
        (item) => item.id === id
      );
      if (!fileOutput) return null;
      return {
        activation: fileOutput.activation,
        render: () => {
          context.lines.push(
            `    ${context.sourceAlias}->>FileSystem: ファイル出力 (${fileOutput.format})`
          );
          context.lines.push(`    Note over FileSystem: ${toSingleLine(fileOutput.path)}`);
          renderResponseLines(context.lines, {
            fromAlias: "FileSystem",
            toAlias: context.sourceAlias,
            response: fileOutput.response,
            defaultSuccessLabel: "出力完了",
            alwaysRenderSuccess: false,
            exceptionMap: context.exceptionMap,
          });
        },
      };
    }

    return null;
  };

  const renderStepList = (steps: SequenceStep[]) => {
    for (const step of steps) {
      if (step.kind === "call") {
        const targetAlias = context.aliasByDdId.get(step.targetDdId);
        if (!targetAlias) {
          context.lines.push(
            `    Note over ${context.sourceAlias}: 呼び出し先DDが未解決です (${toSingleLine(step.targetDdId)})`
          );
          continue;
        }

        ensureSourceActivation(step.activation);
        const isAsync = step.callType === "async";
        const arrow = isAsync ? "-->>" : "->>";
        const message = toSingleLine(
          step.message || (isAsync ? "非同期起動" : "同期呼び出し")
        );
        context.lines.push(`    ${context.sourceAlias}${arrow}${targetAlias}: ${message}`);
        hasFlow = true;

        if (!context.renderedBodyDdIds.has(step.targetDdId)) {
          context.lines.push(`    activate ${targetAlias}`);
          const nestedHasFlow = context.renderDdFlow(step.targetDdId, {
            alreadyActivated: true,
          });
          hasFlow = hasFlow || nestedHasFlow;
          if (!isAsync) {
            context.lines.push(
              `    ${targetAlias}-->>${context.sourceAlias}: ${formatReturnLabel(
                step.returnLabel,
                step.returnSchemaRef
              )}`
            );
            hasFlow =
              renderErrorResponseLines(context.lines, {
                fromAlias: targetAlias,
                toAlias: context.sourceAlias,
                errorLabel: step.errorLabel,
                errorSchemaRef: step.errorSchemaRef,
                errorExceptionRef: step.errorExceptionRef,
                exceptionMap: context.exceptionMap,
              }) || hasFlow;
          } else {
            hasFlow =
              renderAsyncCompletionLines(context.lines, {
                sourceAlias: context.sourceAlias,
                targetAlias,
                aliasByDdId: context.aliasByDdId,
                asyncCompletion: step.asyncCompletion,
                exceptionMap: context.exceptionMap,
              }) || hasFlow;
          }
          context.lines.push(`    deactivate ${targetAlias}`);
        } else if (!isAsync) {
          context.lines.push(
            `    ${targetAlias}-->>${context.sourceAlias}: ${formatReturnLabel(
              step.returnLabel,
              step.returnSchemaRef
            )}`
          );
          hasFlow =
            renderErrorResponseLines(context.lines, {
              fromAlias: targetAlias,
              toAlias: context.sourceAlias,
              errorLabel: step.errorLabel,
              errorSchemaRef: step.errorSchemaRef,
              errorExceptionRef: step.errorExceptionRef,
              exceptionMap: context.exceptionMap,
            }) || hasFlow;
        } else {
          hasFlow =
            renderAsyncCompletionLines(context.lines, {
              sourceAlias: context.sourceAlias,
              targetAlias,
              aliasByDdId: context.aliasByDdId,
              asyncCompletion: step.asyncCompletion,
              exceptionMap: context.exceptionMap,
            }) || hasFlow;
        }
        continue;
      }

      if (step.kind === "effect_ref") {
        const action = resolveEffectRefAction(step.ref);
        if (!action) {
          context.lines.push(
            `    Note over ${context.sourceAlias}: effect_ref未解決 (${toSingleLine(step.ref)})`
          );
          continue;
        }
        ensureSourceActivation(step.activation ?? action.activation);
        action.render();
        hasFlow = true;
        continue;
      }

      if (step.kind === "note") {
        context.lines.push(`    Note over ${context.sourceAlias}: ${toSingleLine(step.text)}`);
        hasFlow = true;
        continue;
      }

      if (step.kind === "ref") {
        const targetAlias =
          step.target.ddId && context.aliasByDdId.get(step.target.ddId)
            ? context.aliasByDdId.get(step.target.ddId)
            : undefined;
        if (targetAlias) {
          context.lines.push(
            `    ref over ${context.sourceAlias},${targetAlias}: ${toSingleLine(step.title)}`
          );
        } else {
          context.lines.push(
            `    ref over ${context.sourceAlias}: ${toSingleLine(step.title)}`
          );
        }
        hasFlow = true;
        continue;
      }

      if (step.kind === "fragment") {
        if (step.branches.length === 0) continue;
        const labelOf = (branchIndex: number) => {
          const branch = step.branches[branchIndex];
          const raw = branch.guard || branch.name || step.label || "条件";
          return toSingleLine(raw);
        };

        if (step.fragment === "alt") {
          context.lines.push(`    alt [${labelOf(0)}]`);
          renderStepList(step.branches[0]?.steps ?? []);
          for (let index = 1; index < step.branches.length; index += 1) {
            context.lines.push(`    else [${labelOf(index)}]`);
            renderStepList(step.branches[index]?.steps ?? []);
          }
          context.lines.push("    end");
          continue;
        }

        if (step.fragment === "par") {
          context.lines.push(`    par [${labelOf(0)}]`);
          renderStepList(step.branches[0]?.steps ?? []);
          for (let index = 1; index < step.branches.length; index += 1) {
            context.lines.push(`    and [${labelOf(index)}]`);
            renderStepList(step.branches[index]?.steps ?? []);
          }
          context.lines.push("    end");
          continue;
        }

        if (step.fragment === "opt") {
          context.lines.push(`    opt [${labelOf(0)}]`);
          renderStepList(step.branches[0]?.steps ?? []);
          context.lines.push("    end");
          continue;
        }

        if (step.fragment === "loop") {
          context.lines.push(`    loop [${labelOf(0)}]`);
          renderStepList(step.branches[0]?.steps ?? []);
          context.lines.push("    end");
        }
      }
    }
  };

  renderStepList(context.sequence.steps ?? []);

  if (manageActivation && sourceActivated) {
    context.lines.push(`    deactivate ${context.sourceAlias}`);
  }
  if (
    context.sideEffects.description &&
    context.sideEffects.description !== "副作用なし"
  ) {
    context.lines.push(
      `    Note over ${context.sourceAlias}: ${toSingleLine(context.sideEffects.description)}`
    );
  }

  return hasFlow;
}

function collectSideEffectActions(
  sourceAlias: string,
  sideEffects: SideEffect,
  participants: SideEffectParticipants,
  exceptionMap: ExceptionSummaryMap
): SideEffectAction[] {
  const actions: SideEffectAction[] = [];

  for (const operation of sideEffects.dbOperations ?? []) {
    actions.push({
      ruleRef: operation.ruleRef,
      activation: operation.activation,
      render: (lines) => {
        const tableName = normalizeTableName(operation.table);
        const targetAlias = resolveDbParticipantAlias(tableName, participants);
        lines.push(
          `    ${sourceAlias}->>${targetAlias}: ${dbOperationLabel(operation.operation)}${tableName ? ` ${tableName}` : ""}${operation.condition ? ` (${toSingleLine(operation.condition)})` : ""}`
        );
        renderResponseLines(lines, {
          fromAlias: targetAlias,
          toAlias: sourceAlias,
          response: operation.response,
          defaultSuccessLabel: "処理結果",
          alwaysRenderSuccess: false,
          exceptionMap,
        });
      },
    });
  }

  for (const apiCall of sideEffects.externalApiCalls ?? []) {
    actions.push({
      ruleRef: apiCall.ruleRef,
      activation: apiCall.activation,
      render: (lines) => {
        const host = extractHost(apiCall.endpoint);
        const targetAlias =
          host && participants.hostAliasMap.has(host)
            ? (participants.hostAliasMap.get(host) ?? "ExternalSystem")
            : "ExternalSystem";
        lines.push(
          `    ${sourceAlias}->>${targetAlias}: ${apiCall.method} ${toSingleLine(apiCall.endpoint)}`
        );
        renderResponseLines(lines, {
          fromAlias: targetAlias,
          toAlias: sourceAlias,
          response: apiCall.response,
          defaultSuccessLabel: "レスポンス",
          alwaysRenderSuccess: true,
          exceptionMap,
        });
      },
    });
  }

  for (const event of sideEffects.events ?? []) {
    actions.push({
      ruleRef: event.ruleRef,
      activation: event.activation,
      render: (lines) => {
        lines.push(
          `    ${sourceAlias}->>EventBus: イベント発行 (${toSingleLine(event.eventType)})`
        );
        if (event.delayMs !== undefined && event.delayMs > 0) {
          lines.push(`    Note over EventBus: 遅延 ${event.delayMs}ms`);
        }
        renderResponseLines(lines, {
          fromAlias: "EventBus",
          toAlias: sourceAlias,
          response: event.response,
          defaultSuccessLabel: "イベント受付",
          alwaysRenderSuccess: false,
          exceptionMap,
        });
      },
    });
  }

  for (const fileOutput of sideEffects.fileOutputs ?? []) {
    actions.push({
      ruleRef: fileOutput.ruleRef,
      activation: fileOutput.activation,
      render: (lines) => {
        lines.push(
          `    ${sourceAlias}->>FileSystem: ファイル出力 (${fileOutput.format})`
        );
        lines.push(`    Note over FileSystem: ${toSingleLine(fileOutput.path)}`);
        renderResponseLines(lines, {
          fromAlias: "FileSystem",
          toAlias: sourceAlias,
          response: fileOutput.response,
          defaultSuccessLabel: "出力完了",
          alwaysRenderSuccess: false,
          exceptionMap,
        });
      },
    });
  }

  return actions;
}

function toRuleMap(rules: BusinessRule[]): Map<string, BusinessRule> {
  const map = new Map<string, BusinessRule>();
  for (const rule of rules) {
    if (!rule.name) continue;
    map.set(rule.name, rule);
  }
  return map;
}

function resolveFragmentContext(
  ruleRef: string | undefined,
  ruleMap: Map<string, BusinessRule>
): FragmentContext | null {
  if (!ruleRef) return null;
  const rule = ruleMap.get(ruleRef);
  if (!rule?.sequence?.fragmentType) return null;

  const fragmentType = rule.sequence.fragmentType;
  const fragmentGroup = rule.sequence.fragmentGroup || rule.name;
  const key = `${fragmentType}:${fragmentGroup}`;
  const guardFallback =
    rule.sequence.guard || rule.preconditions?.[0] || rule.description;
  const guardText =
    fragmentType === "loop"
      ? rule.sequence.loopLabel || guardFallback
      : guardFallback;

  return {
    key,
    type: fragmentType,
    branch:
      fragmentType === "alt" ? (rule.sequence.branch ?? "if") : undefined,
    guardText: toSingleLine(guardText),
  };
}

function openFragmentBlock(
  fragment: FragmentContext,
  lines: string[]
): OpenFragmentState {
  lines.push(`    ${fragment.type} [${fragment.guardText}]`);
  return {
    key: fragment.key,
    type: fragment.type,
    activeBranch: fragment.branch ?? "if",
  };
}

function shouldActivate(policy: SequenceActivationPolicy | undefined): boolean {
  return policy !== "none";
}

function normalizeTableName(tableName: string | undefined): string {
  if (!tableName) return "";
  return toSingleLine(tableName);
}

function resolveDbParticipantAlias(
  tableName: string,
  participants: SideEffectParticipants
): string {
  if (!tableName) return "DB";
  return participants.dbTableAliasMap.get(tableName) ?? "DB";
}

function getStructuredSpec(dd: DesignDocument): StructuredDesignDocumentSpec | null {
  if (!dd.details) return null;

  if (typeof dd.details === "string") {
    try {
      return JSON.parse(dd.details) as StructuredDesignDocumentSpec;
    } catch {
      return null;
    }
  }

  return dd.details as StructuredDesignDocumentSpec;
}

function extractHost(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

function sanitizeIdentifier(value: string): string {
  const sanitized = value.replace(/[^A-Za-z0-9_]/g, "_");
  if (!sanitized) return "ExternalService";
  if (/^[0-9]/.test(sanitized)) return `S_${sanitized}`;
  return sanitized;
}

function uniqueAlias(baseAlias: string, usedAliases: Set<string>): string {
  let alias = baseAlias;
  let index = 1;
  while (usedAliases.has(alias)) {
    index += 1;
    alias = `${baseAlias}_${index}`;
  }
  return alias;
}

function dbOperationLabel(operation: string): string {
  const labels: Record<string, string> = {
    insert: "INSERT",
    update: "UPDATE",
    delete: "DELETE",
    upsert: "UPSERT",
  };
  return labels[operation] ?? operation.toUpperCase();
}

function toExceptionSummaryMap(
  exceptions: StructuredDesignDocumentSpec["exceptions"] | undefined
): ExceptionSummaryMap {
  const map: ExceptionSummaryMap = new Map();
  for (const exception of exceptions ?? []) {
    const code = exception.errorCode?.trim();
    if (!code) continue;
    const detail = toSingleLine(
      exception.condition || exception.message || exception.type || ""
    );
    map.set(code, detail);
  }
  return map;
}

function hasErrorResponse(response: ErrorResponseMeta | undefined): boolean {
  if (!response) return false;
  return Boolean(response.errorLabel || response.errorSchemaRef || response.errorExceptionRef);
}

function renderErrorResponseLines(
  lines: string[],
  params: {
    fromAlias: string;
    toAlias: string;
    errorLabel?: string;
    errorSchemaRef?: string;
    errorExceptionRef?: string;
    exceptionMap: ExceptionSummaryMap;
  }
): boolean {
  const { fromAlias, toAlias, errorLabel, errorSchemaRef, errorExceptionRef, exceptionMap } =
    params;
  if (!errorLabel && !errorSchemaRef && !errorExceptionRef) return false;

  lines.push(
    `    ${fromAlias}-->>${toAlias}: ${formatReturnLabel(errorLabel, errorSchemaRef, "エラー")}`
  );

  if (errorExceptionRef) {
    const detail = exceptionMap.get(errorExceptionRef);
    if (detail) {
      lines.push(
        `    Note over ${toAlias}: 例外 ${toSingleLine(errorExceptionRef)} (${detail})`
      );
    } else {
      lines.push(
        `    Note over ${toAlias}: 例外 ${toSingleLine(errorExceptionRef)} (exceptions未定義)`
      );
    }
  }

  return true;
}

function renderResponseLines(
  lines: string[],
  params: {
    fromAlias: string;
    toAlias: string;
    response: ResponseMeta | undefined;
    defaultSuccessLabel: string;
    alwaysRenderSuccess: boolean;
    exceptionMap: ExceptionSummaryMap;
  }
): boolean {
  const { fromAlias, toAlias, response, defaultSuccessLabel, alwaysRenderSuccess, exceptionMap } =
    params;
  const shouldRenderSuccess =
    alwaysRenderSuccess || Boolean(response?.successLabel || response?.successSchemaRef);
  let hasFlow = false;

  if (shouldRenderSuccess) {
    lines.push(
      `    ${fromAlias}-->>${toAlias}: ${formatReturnLabel(
        response?.successLabel,
        response?.successSchemaRef,
        defaultSuccessLabel
      )}`
    );
    hasFlow = true;
  }

  if (hasErrorResponse(response)) {
    hasFlow =
      renderErrorResponseLines(lines, {
        fromAlias,
        toAlias,
        errorLabel: response?.errorLabel,
        errorSchemaRef: response?.errorSchemaRef,
        errorExceptionRef: response?.errorExceptionRef,
        exceptionMap,
      }) || hasFlow;
  }

  return hasFlow;
}

function renderAsyncCompletionLines(
  lines: string[],
  params: {
    sourceAlias: string;
    targetAlias: string;
    aliasByDdId: Map<string, string>;
    asyncCompletion:
      | {
          callbackToDdId?: string;
          message?: string;
          timeoutMs?: number;
          successLabel?: string;
          successSchemaRef?: string;
          errorLabel?: string;
          errorSchemaRef?: string;
          errorExceptionRef?: string;
        }
      | undefined;
    exceptionMap: ExceptionSummaryMap;
  }
): boolean {
  const { sourceAlias, targetAlias, aliasByDdId, asyncCompletion, exceptionMap } = params;
  if (!asyncCompletion) return false;

  let hasFlow = false;
  if (asyncCompletion.timeoutMs !== undefined) {
    lines.push(`    Note over ${targetAlias}: タイムアウト ${asyncCompletion.timeoutMs}ms`);
    hasFlow = true;
  }

  let completionTargetAlias = sourceAlias;
  if (asyncCompletion.callbackToDdId) {
    const callbackAlias = aliasByDdId.get(asyncCompletion.callbackToDdId);
    if (callbackAlias) {
      completionTargetAlias = callbackAlias;
    } else {
      lines.push(
        `    Note over ${targetAlias}: callback先DDが未解決です (${toSingleLine(asyncCompletion.callbackToDdId)})`
      );
      hasFlow = true;
    }
  }

  const response: ResponseMeta = {
    successLabel: asyncCompletion.successLabel ?? asyncCompletion.message,
    successSchemaRef: asyncCompletion.successSchemaRef,
    errorLabel: asyncCompletion.errorLabel,
    errorSchemaRef: asyncCompletion.errorSchemaRef,
    errorExceptionRef: asyncCompletion.errorExceptionRef,
  };
  const hasCompletionResponse =
    Boolean(asyncCompletion.callbackToDdId) ||
    Boolean(response.successLabel || response.successSchemaRef) ||
    hasErrorResponse(response);

  if (hasCompletionResponse) {
    hasFlow =
      renderResponseLines(lines, {
        fromAlias: targetAlias,
        toAlias: completionTargetAlias,
        response,
        defaultSuccessLabel: asyncCompletion.message || "非同期完了",
        alwaysRenderSuccess: Boolean(asyncCompletion.callbackToDdId),
        exceptionMap,
      }) || hasFlow;
  }

  return hasFlow;
}

function formatReturnLabel(
  returnsLabel: string | undefined,
  returnSchemaRef: string | undefined,
  defaultLabel = "レスポンス"
): string {
  const base = toSingleLine(returnsLabel || defaultLabel);
  if (!returnSchemaRef) return base;
  return `${base} (${toSingleLine(returnSchemaRef)})`;
}

function getDdParticipantLabel(item: ParsedDesignDocument): string {
  return `${item.alias} ${toSingleLine(item.dd.name || item.dd.id)}`;
}

function formatDbParticipantLabel(tableName: string): string {
  const normalized = toSingleLine(tableName);
  const prefix = isLogLikeTableName(normalized) ? "[log]" : "[db]";
  return `${prefix} ${normalized}`;
}

function isLogLikeTableName(tableName: string): boolean {
  const lower = tableName.toLowerCase();
  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.some((token) => token === "log" || token === "logs" || token === "logging")) {
    return true;
  }
  return lower.endsWith("_log") || lower.endsWith("_logs");
}

function toSingleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
