import { resolveToolMeta, normalizeToolName } from './chunk-utils';
import {
  formatToolInput,
  formatToolResult,
  formatToolError,
  pickMessage,
} from './format-utils';

type ProgressStep = {
  id: string;
  index: number;
  title: string;
  status: 'running' | 'done' | 'error';
  detail?: string;
};

type ConceptCandidate = {
  term: string;
  context: string;
  isExisting: boolean;
  existingDefinition?: string;
  suggestion?: string;
};

/**
 * チャンクハンドラーが共有するコンテキスト
 */
export type ChunkContext = {
  stepCounter: number;
  stepIndexByToolCallId: Map<string, number>;
  toolCallInputById: Map<string, string>;
  hasStreamedContent: boolean;
  hasSentDraft: boolean;
  finalStepIndex: number | null;
  finalStepSent: boolean;
  finalStepStatus: 'running' | 'done' | 'error' | null;
  finalStepDetail?: string;
  finalStepTitle?: string;
  sendData: (data: unknown) => boolean;
  sendProgress: (step: ProgressStep) => boolean;
  ensureFinalStepRunning: () => void;
};

/**
 * チャンクハンドラーの戻り値
 * - 'continue': 次のチャンクへ進む
 * - 'throw': エラーをスローする
 */
type HandlerResult = { action: 'continue' } | { action: 'throw'; error: unknown };

const CONTINUE: HandlerResult = { action: 'continue' };

function resolveStepIndex(
  ctx: ChunkContext,
  stepId: string
): number {
  let index = ctx.stepIndexByToolCallId.get(stepId);
  if (!index) {
    ctx.stepCounter += 1;
    index = ctx.stepCounter;
    ctx.stepIndexByToolCallId.set(stepId, index);
  }

  if (
    ctx.finalStepSent &&
    ctx.finalStepIndex !== null &&
    index >= ctx.finalStepIndex
  ) {
    const shiftedIndex = index + 1;
    ctx.finalStepIndex = shiftedIndex;
    ctx.sendProgress({
      id: 'final',
      index: shiftedIndex,
      title: ctx.finalStepTitle ?? '回答作成',
      status: ctx.finalStepStatus ?? 'running',
      detail: ctx.finalStepDetail,
    });
  }
  return index;
}

export function handleTextDelta(
  chunk: Record<string, unknown>,
  payload: Record<string, unknown>,
  ctx: ChunkContext
): HandlerResult {
  const delta =
    (payload.text as string | undefined) ??
    (payload.delta as string | undefined) ??
    (chunk.text as string | undefined) ??
    (chunk.delta as string | undefined) ??
    '';
  if (delta) {
    ctx.ensureFinalStepRunning();
    ctx.sendData({ content: delta });
    ctx.hasStreamedContent = true;
  }
  return CONTINUE;
}

export function handleToolCall(
  chunk: Record<string, unknown>,
  payload: Record<string, unknown>,
  ctx: ChunkContext
): HandlerResult {
  const meta = resolveToolMeta(chunk, payload);
  const stepId = meta.toolCallId ?? `tool-${ctx.stepCounter + 1}`;
  const index = resolveStepIndex(ctx, stepId);

  ctx.sendProgress({
    id: stepId,
    index,
    title: `ツール: ${meta.toolName ?? '不明'}`,
    status: 'running',
    detail: formatToolInput(meta.input),
  });
  return CONTINUE;
}

export function handleToolCallDelta(
  chunk: Record<string, unknown>,
  payload: Record<string, unknown>,
  ctx: ChunkContext
): HandlerResult {
  const meta = resolveToolMeta(chunk, payload);
  if (meta.toolCallId) {
    const next = (payload.delta as string | undefined) ?? '';
    if (next) {
      const current = ctx.toolCallInputById.get(meta.toolCallId) ?? '';
      ctx.toolCallInputById.set(meta.toolCallId, current + next);
    }
  }
  return CONTINUE;
}

export function handleToolResult(
  chunk: Record<string, unknown>,
  payload: Record<string, unknown>,
  ctx: ChunkContext
): HandlerResult {
  const meta = resolveToolMeta(chunk, payload);
  const rawToolName = meta.toolName ?? '';
  const normalizedToolName = normalizeToolName(rawToolName);
  console.log('[Chat API] tool-result received:', { toolName: rawToolName, toolCallId: meta.toolCallId });

  const stepId = meta.toolCallId ?? `tool-${ctx.stepCounter + 1}`;
  const index = resolveStepIndex(ctx, stepId);

  const output = meta.output as Record<string, unknown> | undefined;
  const isFailure = output && typeof output === 'object' && (output as { success?: boolean }).success === false;

  const streamedInput = meta.toolCallId
    ? ctx.toolCallInputById.get(meta.toolCallId)
    : undefined;
  const detailFromStream = streamedInput
    ? formatToolInput(streamedInput)
    : undefined;

  ctx.sendProgress({
    id: stepId,
    index,
    title: `ツール: ${meta.toolName ?? '不明'}`,
    status: isFailure ? 'error' : 'done',
    detail: detailFromStream ??
      (isFailure
        ? formatToolError((output as { error?: unknown })?.error ?? output)
        : formatToolResult(meta.output)),
  });

  const outputMessage = pickMessage(output);
  if (outputMessage && !ctx.hasStreamedContent) {
    ctx.ensureFinalStepRunning();
    ctx.sendData({ content: outputMessage });
    ctx.hasStreamedContent = true;
  }

  // bt_draftツールの結果を検出してdraftイベントを送信
  console.log('[Chat API] Checking tool name:', rawToolName, 'normalized:', normalizedToolName);
  if (normalizedToolName === 'bt_draft') {
    const output = meta.output as {
      btDraft?: unknown;
      brDrafts?: unknown[];
      conceptCandidates?: Array<{
        term: string;
        context: string;
        isExisting: boolean;
        existingDefinition?: string;
        suggestion?: string;
      }>;
    };
    console.log('[Chat API] bt_draft tool completed, output:', JSON.stringify(output, null, 2));
    if (output?.btDraft) {
      console.log('[Chat API] Sending draft event with btDraft:', (output.btDraft as { code?: string }).code);
      ctx.sendData({ event: 'draft', draft: output.btDraft });
      ctx.hasSentDraft = true;
    } else {
      console.log('[Chat API] btDraft not found in output');
    }
    if (Array.isArray(output?.brDrafts) && output.brDrafts.length > 0) {
      for (const brDraft of output.brDrafts) {
        ctx.sendData({ event: 'draft', draftType: 'br', draft: brDraft });
        ctx.hasSentDraft = true;
      }
    }

    // conceptCandidatesをそのまま転送
    if (output?.conceptCandidates && output.conceptCandidates.length > 0) {
      ctx.sendData({ event: 'concept_candidates', candidates: output.conceptCandidates });
    }
  }

  // br_draftツールの結果を検出してdraftイベントを送信
  if (normalizedToolName === 'br_draft') {
    const output = meta.output as {
      btDraft?: unknown;
      brDraft?: unknown;
      conceptCandidates?: Array<{
        term: string;
        context: string;
        isExisting: boolean;
        existingDefinition?: string;
        suggestion?: string;
      }>;
    };
    if (output?.btDraft) {
      ctx.sendData({ event: 'draft', draft: output.btDraft });
      ctx.hasSentDraft = true;
    }
    if (output?.brDraft) {
      ctx.sendData({ event: 'draft', draftType: 'br', draft: output.brDraft });
      ctx.hasSentDraft = true;
    }

    // conceptCandidatesをそのまま転送
    if (output?.conceptCandidates && output.conceptCandidates.length > 0) {
      ctx.sendData({ event: 'concept_candidates', candidates: output.conceptCandidates });
    }
  }

  // system_draftツールの結果を検出してdraftイベントを送信
  if (normalizedToolName === 'system_draft') {
    const output = meta.output as {
      sfDrafts?: Array<{
        code: string;
        name: string;
        description: string;
        system_domain_id: string;
        srs: Array<{
          code: string;
          type: string;
          requirement: string;
          rationale: string;
          acs: Array<{
            code: string;
            given: string;
            when: string;
            then: string;
          }>;
        }>;
      }>;
      realizesLinks?: Array<{
        source_id: string;
        target_id: string;
        link_type: string;
      }>;
      previewAvailable?: boolean;
    };

    console.log('[Chat API] system_draft tool completed, output:', JSON.stringify(output, null, 2));

    if (output?.sfDrafts && output.sfDrafts.length > 0) {
      // SFと内包するSRを個別にイベント送信
      for (let sfIdx = 0; sfIdx < output.sfDrafts.length; sfIdx++) {
        const sfDraft = output.sfDrafts[sfIdx];
        // realizesLinks から、このSFに紐付くBR IDを抽出
        const brIds = (output.realizesLinks ?? [])
          .filter(link => link.target_id === `sf-draft-${sfIdx}`)
          .map(link => link.source_id);
        console.log('[Chat API] Sending draft event with sfDraft:', sfDraft.code, 'brIds:', brIds);
        ctx.sendData({ event: 'draft', draftType: 'sf', draft: { ...sfDraft, brIds } });
        ctx.hasSentDraft = true;

        for (const srDraft of sfDraft.srs) {
          console.log('[Chat API] Sending draft event with srDraft:', srDraft.code);
          ctx.sendData({
            event: 'draft',
            draftType: 'sr',
            draft: srDraft,
            parentSfCode: sfDraft.code
          });
          ctx.hasSentDraft = true;
        }
      }
    } else {
      console.log('[Chat API] sfDrafts not found in output');
    }
  }

  // dd_draft（旧 impl_unit_draft）ツールの結果を検出してdraftイベントを送信
  if (normalizedToolName === 'dd_draft' || normalizedToolName === 'impl_unit_draft') {
    const output = meta.output as {
      ddDrafts?: unknown[];
      implUnitDraft?: unknown;
      implUnitDrafts?: unknown[];
    };

    if (Array.isArray(output?.ddDrafts) && output.ddDrafts.length > 0) {
      for (const ddDraft of output.ddDrafts) {
        ctx.sendData({ event: 'draft', draftType: 'dd', draft: ddDraft });
        ctx.hasSentDraft = true;
      }
    } else if (Array.isArray(output?.implUnitDrafts) && output.implUnitDrafts.length > 0) {
      for (const ddDraft of output.implUnitDrafts) {
        ctx.sendData({ event: 'draft', draftType: 'dd', draft: ddDraft });
        ctx.hasSentDraft = true;
      }
    } else if (output?.implUnitDraft) {
      ctx.sendData({ event: 'draft', draftType: 'dd', draft: output.implUnitDraft });
      ctx.hasSentDraft = true;
    }
  }

  return CONTINUE;
}

export function handleToolError(
  chunk: Record<string, unknown>,
  payload: Record<string, unknown>,
  ctx: ChunkContext
): HandlerResult {
  const meta = resolveToolMeta(chunk, payload);
  const stepId = meta.toolCallId ?? `tool-${ctx.stepCounter + 1}`;
  const index = resolveStepIndex(ctx, stepId);

  ctx.sendProgress({
    id: stepId,
    index,
    title: `ツール: ${meta.toolName ?? '不明'}`,
    status: 'error',
    detail: formatToolError(payload.error ?? chunk.error),
  });
  return CONTINUE;
}

export function handleError(
  chunk: Record<string, unknown>,
  payload: Record<string, unknown>,
): HandlerResult {
  const errorPayload = payload.error ?? chunk.error;
  return { action: 'throw', error: errorPayload ?? new Error('ストリーミングエラーが発生しました') };
}

/**
 * チャンクタイプ別のハンドラーマップ
 */
export const chunkHandlers: Record<string, (
  chunk: Record<string, unknown>,
  payload: Record<string, unknown>,
  ctx: ChunkContext
) => HandlerResult> = {
  'text-delta': handleTextDelta,
  'tool-call': handleToolCall,
  'tool-call-input-streaming-start': handleToolCall,
  'tool-call-delta': handleToolCallDelta,
  'tool-result': handleToolResult,
  'tool-error': handleToolError,
  'error': handleError,
};
