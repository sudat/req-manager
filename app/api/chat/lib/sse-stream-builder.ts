/**
 * SSEストリーム構築モジュール
 *
 * Mastraエージェントのストリームレスポンスを、
 * Server-Sent Events (SSE) 形式のReadableStreamに変換する。
 */

import { normalizeChunk, resolvePayload, normalizeToolName } from './chunk-utils';
import { chunkHandlers, type ChunkContext } from './chunk-handlers';
import { pickMessage } from './format-utils';

/**
 * プログレスステップ型
 */
type ProgressStep = {
  id: string;
  index: number;
  title: string;
  status: 'running' | 'done' | 'error';
  detail?: string;
};

/**
 * Mastraエージェントのストリーム型（必要な部分のみ）
 */
type MastraStream = {
  fullStream: AsyncIterable<unknown>;
  text: Promise<string | undefined>;
  finishReason: Promise<string | { unified?: string; raw?: string } | undefined>;
  toolResults: Promise<unknown[] | undefined>;
};

/**
 * SSEストリームビルダーのオプション
 */
type SSEStreamOptions = {
  stream: MastraStream;
  abortSignal?: AbortSignal;
};

/**
 * SSEストリームを構築する
 *
 * @param options ストリーム構築オプション
 * @returns ReadableStream<Uint8Array>
 */
export const createSSEStream = ({
  stream,
  abortSignal,
}: SSEStreamOptions): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let aborted = abortSignal?.aborted ?? false;
      let closed = false;
      const handleAbort = () => {
        aborted = true;
      };
      abortSignal?.addEventListener('abort', handleAbort);

      const safeEnqueue = (payload: string): boolean => {
        if (aborted || closed) return false;
        try {
          controller.enqueue(encoder.encode(payload));
          return true;
        } catch (error) {
          console.warn('[Chat API] Stream closed while enqueueing:', error);
          aborted = true;
          closed = true;
          return false;
        }
      };

      const safeClose = () => {
        if (closed) return;
        try {
          controller.close();
          closed = true;
        } catch (error) {
          console.warn('[Chat API] Stream already closed:', error);
          closed = true;
        }
      };

      const sendData = (data: unknown) =>
        safeEnqueue(`data: ${JSON.stringify(data)}\n\n`);

      const sendProgress = (step: ProgressStep) =>
        // KISS: dataだけでSSEを流してクライアント側の互換性を保つ
        sendData({ event: 'progress', step });

      const heartbeatIntervalMs = 10000;
      let heartbeatId: ReturnType<typeof setInterval> | null = null;
      const startHeartbeat = () => {
        if (heartbeatId) return;
        heartbeatId = setInterval(() => {
          if (aborted || closed) return;
          sendData({ event: 'heartbeat' });
        }, heartbeatIntervalMs);
      };

      const ctx: ChunkContext = {
        stepCounter: 0,
        stepIndexByToolCallId: new Map<string, number>(),
        toolCallInputById: new Map<string, string>(),
        hasStreamedContent: false,
        hasSentDraft: false,
        finalStepIndex: null,
        finalStepSent: false,
        finalStepStatus: null,
        finalStepDetail: undefined,
        finalStepTitle: '回答作成',
        sendData,
        sendProgress,
        ensureFinalStepRunning: () => {
          if (ctx.finalStepSent) return;
          const maxIndex = Math.max(
            ctx.stepCounter,
            ctx.finalStepIndex ?? 0,
            ...Array.from(ctx.stepIndexByToolCallId.values()),
          );
          ctx.finalStepIndex = maxIndex + 1;
          ctx.finalStepStatus = 'running';
          ctx.finalStepDetail = '応答を準備しています...';
          sendProgress({
            id: 'final',
            index: ctx.finalStepIndex,
            title: ctx.finalStepTitle ?? '回答作成',
            status: 'running',
            detail: ctx.finalStepDetail,
          });
          ctx.finalStepSent = true;
        },
      };

      try {
        console.log('[Chat API] Starting text stream...');
        startHeartbeat();

        const textPromise = stream.text;
        const finishReasonPromise = stream.finishReason;
        const toolResultsPromise = stream.toolResults;

        const sendDraftFromToolResult = (toolName: string | undefined, output: unknown) => {
          if (!toolName || ctx.hasSentDraft || !output || typeof output !== 'object') return;
          const normalized = normalizeToolName(toolName);
          const data = output as Record<string, unknown>;
          let didSendDraft = false;

          if (normalized === 'bt_draft' && data.btDraft) {
            ctx.sendData({ event: 'draft', draft: data.btDraft });
            didSendDraft = true;
            if (Array.isArray(data.brDrafts)) {
              for (const brDraft of data.brDrafts) {
                ctx.sendData({ event: 'draft', draftType: 'br', draft: brDraft });
                didSendDraft = true;
              }
            }
            if (didSendDraft) ctx.hasSentDraft = true;
            return;
          }
          if (normalized === 'br_draft' && data.brDraft) {
            if (data.btDraft) {
              ctx.sendData({ event: 'draft', draft: data.btDraft });
              didSendDraft = true;
            }
            ctx.sendData({ event: 'draft', draftType: 'br', draft: data.brDraft });
            didSendDraft = true;
            if (didSendDraft) ctx.hasSentDraft = true;
            return;
          }
          if (normalized === 'system_draft' && Array.isArray(data.sfDrafts)) {
            for (const sfDraft of data.sfDrafts) {
              ctx.sendData({ event: 'draft', draftType: 'sf', draft: sfDraft });
              didSendDraft = true;
              if (sfDraft?.srs && Array.isArray(sfDraft.srs)) {
                for (const srDraft of sfDraft.srs) {
                  ctx.sendData({ event: 'draft', draftType: 'sr', draft: srDraft, parentSfCode: sfDraft.code });
                  didSendDraft = true;
                }
              }
            }
            if (didSendDraft) ctx.hasSentDraft = true;
          }
          if ((normalized === 'dd_draft' || normalized === 'impl_unit_draft') && Array.isArray(data.ddDrafts)) {
            for (const ddDraft of data.ddDrafts) {
              ctx.sendData({ event: 'draft', draftType: 'dd', draft: ddDraft });
              didSendDraft = true;
            }
            if (didSendDraft) ctx.hasSentDraft = true;
            return;
          }
          if (normalized === 'impl_unit_draft' && data.implUnitDraft) {
            ctx.sendData({ event: 'draft', draftType: 'dd', draft: data.implUnitDraft });
            ctx.hasSentDraft = true;
          }
        };

        toolResultsPromise.then((toolResults) => {
          if (aborted || closed || ctx.hasSentDraft) return;
          if (!Array.isArray(toolResults)) return;

          for (const result of toolResults) {
            const record = result as Record<string, unknown> | undefined;
            if (!record || typeof record !== 'object') continue;

            const toolName = (record.toolName as string | undefined) ?? (record.name as string | undefined);
            const output =
              record.result ??
              record.output ??
              record.data ??
              record.value ??
              record;

            const message = pickMessage(output);
            if (message && !ctx.hasStreamedContent) {
              ctx.ensureFinalStepRunning();
              ctx.sendData({ content: message });
              ctx.hasStreamedContent = true;
            }

            sendDraftFromToolResult(toolName, output);
            if (ctx.hasSentDraft) break;
          }
        }).catch((error) => {
          console.warn('[Chat API] toolResults fallback failed:', error);
        });

        for await (const rawChunk of stream.fullStream) {
          if (aborted) break;

          const chunk = normalizeChunk(rawChunk);
          const payload = resolvePayload(chunk);
          const chunkType = (chunk as { type?: string }).type;

          const handler = chunkType ? chunkHandlers[chunkType] : undefined;
          if (handler) {
            const result = handler(chunk as Record<string, unknown>, payload, ctx);
            if (result.action === 'throw') throw result.error;
            continue;
          }
        }

        const [finalText, finishReason, toolResults] = await Promise.all([
          textPromise,
          finishReasonPromise,
          toolResultsPromise,
        ]);
        console.log('[Chat API] Stream text completed');

        // finishReasonをチェックして異常終了を検出
        console.log('[Chat API] Stream finishReason:', finishReason);
        const normalizedFinishReason =
          typeof finishReason === 'string'
            ? finishReason
            : typeof finishReason === 'object' && finishReason
            ? ((finishReason as { unified?: string }).unified ??
                (finishReason as { raw?: string }).raw)
            : undefined;

        if (
          normalizedFinishReason === 'error' ||
          normalizedFinishReason === 'length' ||
          normalizedFinishReason === 'content-filter'
        ) {
          throw new Error(`Stream ended abnormally: ${normalizedFinishReason}`);
        }

        if (!ctx.hasStreamedContent) {
          const trimmed = finalText?.trim() ?? '';
          if (trimmed) {
            ctx.ensureFinalStepRunning();
            sendData({ content: trimmed });
            ctx.hasStreamedContent = true;
          } else if (
            normalizedFinishReason === 'tool-calls' &&
            toolResults?.length
          ) {
            const fallbackMessage = toolResults
              .map((result) => {
                const value = (result as { result?: { message?: string } }).result;
                return value?.message ?? '';
              })
              .filter(Boolean)
              .join('\n');

            if (fallbackMessage) {
              ctx.ensureFinalStepRunning();
              sendData({ content: fallbackMessage });
              ctx.hasStreamedContent = true;
            }
          }
        }

        if (ctx.finalStepSent && ctx.finalStepIndex !== null) {
          ctx.finalStepStatus = 'done';
          ctx.finalStepDetail = '完了';
          sendProgress({
            id: 'final',
            index: ctx.finalStepIndex,
            title: ctx.finalStepTitle ?? '回答作成',
            status: 'done',
            detail: ctx.finalStepDetail,
          });
        }

        // 正常終了を通知
        safeEnqueue('data: [DONE]\n\n');
        safeClose();

      } catch (error: any) {
        console.error('[Chat API] Stream error:', error);
        if (ctx.finalStepSent && ctx.finalStepIndex !== null) {
          ctx.finalStepStatus = 'error';
          ctx.finalStepDetail = 'エラーが発生しました';
          sendProgress({
            id: 'final',
            index: ctx.finalStepIndex,
            title: ctx.finalStepTitle ?? '回答作成',
            status: 'error',
            detail: ctx.finalStepDetail,
          });
        }
        // エラー情報をSSE形式で送信
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
            ? error
            : 'ストリーミングエラーが発生しました';
        const errorData = {
          error: true,
          message: errorMessage,
        };
        safeEnqueue(`data: ${JSON.stringify(errorData)}\n\n`);
        safeClose();
      } finally {
        if (heartbeatId) clearInterval(heartbeatId);
        abortSignal?.removeEventListener('abort', handleAbort);
      }
    },
  });
};
