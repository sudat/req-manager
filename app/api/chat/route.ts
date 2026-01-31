import { NextRequest, NextResponse } from 'next/server';
import { requirementsAgent } from '@/lib/mastra/agents/requirements-agent';
import { ContextProvider } from '@/lib/mastra/context/provider';
import type { UILocation } from '@/lib/mastra/context/types';
import { isReasoningEffort } from '@/lib/mastra/reasoning-effort';

/**
 * チャットAPI（POST）
 *
 * Mastra Agent（requirementsAgent）と接続してメッセージを処理する。
 * ストリーミングレスポンスとテキストレスポンスの両方に対応。
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Chat API] Request received');
    const maxSteps = Number(process.env.CHAT_MAX_STEPS) || 10;
    const body = await request.json();
    const {
      message,
      threadId,
      resourceId,
      projectId,
      location,
      streaming = true,
      reasoningEffort,
    } = body;

    console.log('[Chat API] Body:', {
      message,
      threadId,
      resourceId,
      projectId,
      location,
      streaming,
      reasoningEffort,
    });

    // バリデーション
    if (!message || typeof message !== 'string') {
      console.error('[Chat API] Invalid message');
      return NextResponse.json(
        { error: 'メッセージが指定されていません' },
        { status: 400 }
      );
    }

    if (!resourceId) {
      console.error('[Chat API] Missing resourceId');
      return NextResponse.json(
        { error: 'resourceIdが指定されていません' },
        { status: 400 }
      );
    }

    // コンテキスト構築（location指定時）
    let contextMessage = '';
    if (location) {
      // ChatLocationからUILocationへ変換
      const { screen, bdId, btId, brId, sdId, sfId, srId } = location;

      // screenとIDから適切なtype, id, nameを決定
      let type: UILocation['type'] = 'project';
      let id = location.projectId;
      let name = 'プロジェクト';

      if (srId) {
        type = 'sr';
        id = srId;
        name = `システム要件 ${srId}`;
      } else if (sfId) {
        type = 'sf';
        id = sfId;
        name = `システム機能 ${sfId}`;
      } else if (sdId) {
        type = 'sd';
        id = sdId;
        name = `システム領域 ${sdId}`;
      } else if (brId) {
        type = 'br';
        id = brId;
        name = `業務要件 ${brId}`;
      } else if (btId) {
        type = 'bt';
        id = btId;
        name = `業務タスク ${btId}`;
      } else if (bdId) {
        type = 'bd';
        id = bdId;
        name = `業務領域 ${bdId}`;
      }

      const uiLocation: UILocation = {
        type,
        id,
        name,
        breadcrumb: [name],
        projectId: location.projectId,
      };

      // 初期プロンプトを構築
      contextMessage = ContextProvider.buildInitialPrompt(uiLocation);
    }

    // メッセージ構築
    let fullMessage = contextMessage
      ? `${contextMessage}\n\n---\n\nユーザーからの質問: ${message}`
      : message;

    // projectId をシステムコンテキストとして追加
    if (projectId) {
      fullMessage = `[System Context]\nProjectID: ${projectId}\n\n---\n\n${fullMessage}`;
    }

    const validatedReasoningEffort = isReasoningEffort(reasoningEffort)
      ? reasoningEffort
      : undefined;

    const providerOptions = validatedReasoningEffort
      ? { openai: { reasoningEffort: validatedReasoningEffort } }
      : undefined;

    // ストリーミングレスポンス
    if (streaming) {
      console.log('[Chat API] Calling requirementsAgent.stream()...');
      console.log('[Chat API] Message:', fullMessage);
      console.log('[dbg] threadId:', threadId, 'resourceId:', resourceId);

      const stream = await requirementsAgent.stream(fullMessage, {
        memory: {
          thread: threadId || 'default',
          resource: resourceId,
        },
        maxSteps,
        ...(providerOptions ? { providerOptions } : {}),
      });
      console.log('[Chat API] Stream created successfully');

      // ストリーミング用のReadableStreamを作成
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          const abortSignal = request.signal;
          let aborted = abortSignal?.aborted ?? false;
          const handleAbort = () => {
            aborted = true;
          };
          abortSignal?.addEventListener('abort', handleAbort);

          const safeEnqueue = (payload: string) => {
            if (aborted) return false;
            try {
              controller.enqueue(encoder.encode(payload));
              return true;
            } catch (error) {
              console.warn('[Chat API] Stream closed while enqueueing:', error);
              aborted = true;
              return false;
            }
          };

          const safeClose = () => {
            try {
              controller.close();
            } catch (error) {
              console.warn('[Chat API] Stream already closed:', error);
            }
          };

          const sendData = (data: unknown) =>
            safeEnqueue(`data: ${JSON.stringify(data)}\n\n`);

          const sendProgress = (step: {
            id: string;
            index: number;
            title: string;
            status: 'running' | 'done' | 'error';
            detail?: string;
          }) =>
            // KISS: dataだけでSSEを流してクライアント側の互換性を保つ
            sendData({ event: 'progress', step });

          try {
            console.log('[Chat API] Starting text stream...');
            console.log('[Chat API] ThreadId:', threadId, 'ResourceId:', resourceId);

            const trimText = (text: string, max = 240) =>
              text.length > max ? `${text.slice(0, max)}…` : text;

            const stringifyValue = (value: unknown) => {
              if (value === null || value === undefined) return '';
              if (typeof value === 'string') return value;
              if (typeof value === 'number' || typeof value === 'boolean') {
                return String(value);
              }
              try {
                return JSON.stringify(value);
              } catch {
                return String(value);
              }
            };

            const pickMessage = (value: unknown) => {
              if (!value || typeof value !== 'object') return undefined;
              const record = value as Record<string, unknown>;
              if (typeof record.message === 'string') return record.message;
              if (typeof record.summary === 'string') return record.summary;
              if (typeof record.error === 'string') return record.error;
              return undefined;
            };

            const formatToolInput = (input: unknown) => {
              const text = stringifyValue(input).trim();
              return text ? `入力: ${trimText(text)}` : undefined;
            };

            const formatToolResult = (output: unknown) => {
              const message = pickMessage(output);
              const text = (message ?? stringifyValue(output)).trim();
              return text ? `結果: ${trimText(text)}` : undefined;
            };

            const formatToolError = (error: unknown) => {
              const text =
                typeof error === 'string'
                  ? error
                  : error instanceof Error
                  ? error.message
                  : stringifyValue(error);
              return text ? `エラー: ${trimText(text)}` : 'エラーが発生しました';
            };

            const textPromise = stream.text;
            const finishReasonPromise = stream.finishReason;
            const toolResultsPromise = stream.toolResults;
            let hasStreamedContent = false;
            let stepCounter = 0;
            let finalStepIndex: number | null = null;
            let finalStepSent = false;
            const stepIndexByToolCallId = new Map<string, number>();
            const toolCallInputById = new Map<string, string>();

            const normalizeChunk = (rawChunk: unknown) => {
              if (
                rawChunk &&
                typeof rawChunk === 'object' &&
                'payload' in rawChunk
              ) {
                const payload = (rawChunk as { payload?: unknown }).payload;
                if (
                  payload &&
                  typeof payload === 'object' &&
                  'type' in payload &&
                  'payload' in payload
                ) {
                  return payload as {
                    type: string;
                    payload: Record<string, unknown>;
                  };
                }
              }
              return rawChunk as { type?: string; payload?: Record<string, unknown> };
            };

            const resolvePayload = (rawChunk: unknown) => {
              if (rawChunk && typeof rawChunk === 'object' && 'payload' in rawChunk) {
                return (rawChunk as { payload?: Record<string, unknown> }).payload ?? {};
              }
              return rawChunk as Record<string, unknown>;
            };

            const resolveToolMeta = (
              rawChunk: Record<string, unknown>,
              payload: Record<string, unknown>
            ) => {
              const toolCallId =
                (payload.toolCallId as string | undefined) ??
                (payload.callId as string | undefined) ??
                (rawChunk.toolCallId as string | undefined) ??
                (rawChunk.id as string | undefined);
              const toolName =
                (payload.toolName as string | undefined) ??
                (payload.name as string | undefined) ??
                (rawChunk.toolName as string | undefined) ??
                (rawChunk.name as string | undefined);
              const input =
                payload.input ??
                payload.args ??
                payload.arguments ??
                rawChunk.input ??
                rawChunk.args ??
                rawChunk.arguments;
              const output =
                payload.result ??
                payload.output ??
                rawChunk.result ??
                rawChunk.output ??
                payload;
              return { toolCallId, toolName, input, output };
            };

            const ensureFinalStepRunning = () => {
              if (finalStepSent) return;
              stepCounter += 1;
              finalStepIndex = stepCounter;
              sendProgress({
                id: 'final',
                index: finalStepIndex,
                title: 'FinalAnswer',
                status: 'running',
                detail: '回答を生成中です。',
              });
              finalStepSent = true;
            };

            for await (const rawChunk of stream.fullStream) {
              if (aborted) break;

              const chunk = normalizeChunk(rawChunk);
              const payload = resolvePayload(chunk);
              const chunkType = (chunk as { type?: string }).type;

              if (chunkType === 'text-delta') {
                const delta =
                  (payload.text as string | undefined) ??
                  (payload.delta as string | undefined) ??
                  (chunk as { text?: string; delta?: string }).text ??
                  (chunk as { text?: string; delta?: string }).delta ??
                  '';
                if (delta) {
                  ensureFinalStepRunning();
                  sendData({ content: delta });
                  hasStreamedContent = true;
                }
                continue;
              }

              if (chunkType === 'tool-call' || chunkType === 'tool-call-input-streaming-start') {
                const meta = resolveToolMeta(chunk as Record<string, unknown>, payload);
                const stepId = meta.toolCallId ?? `tool-${stepCounter + 1}`;
                let index = stepIndexByToolCallId.get(stepId);
                if (!index) {
                  stepCounter += 1;
                  index = stepCounter;
                  stepIndexByToolCallId.set(stepId, index);
                }
                sendProgress({
                  id: stepId,
                  index,
                  title: `ツール: ${meta.toolName ?? '不明'}`,
                  status: 'running',
                  detail: formatToolInput(meta.input),
                });
                continue;
              }

              if (chunkType === 'tool-call-delta') {
                const meta = resolveToolMeta(chunk as Record<string, unknown>, payload);
                if (meta.toolCallId) {
                  const next = (payload.delta as string | undefined) ?? '';
                  if (next) {
                    const current = toolCallInputById.get(meta.toolCallId) ?? '';
                    toolCallInputById.set(meta.toolCallId, current + next);
                  }
                }
                continue;
              }

              if (chunkType === 'tool-result') {
                const meta = resolveToolMeta(chunk as Record<string, unknown>, payload);
                const stepId = meta.toolCallId ?? `tool-${stepCounter + 1}`;
                let index = stepIndexByToolCallId.get(stepId);
                if (!index) {
                  stepCounter += 1;
                  index = stepCounter;
                  stepIndexByToolCallId.set(stepId, index);
                }
                const streamedInput = meta.toolCallId
                  ? toolCallInputById.get(meta.toolCallId)
                  : undefined;
                const detailFromStream = streamedInput
                  ? formatToolInput(streamedInput)
                  : undefined;
                sendProgress({
                  id: stepId,
                  index,
                  title: `ツール: ${meta.toolName ?? '不明'}`,
                  status: 'done',
                  detail: detailFromStream ?? formatToolResult(meta.output),
                });

                // bt_draftツールの結果を検出してdraftイベントを送信
                if (meta.toolName === 'bt_draft') {
                  const output = meta.output as { btDraft?: any };
                  if (output?.btDraft) {
                    sendData({ event: 'draft', draft: output.btDraft });
                  }
                }

                continue;
              }

              if (chunkType === 'tool-error') {
                const meta = resolveToolMeta(chunk as Record<string, unknown>, payload);
                const stepId = meta.toolCallId ?? `tool-${stepCounter + 1}`;
                let index = stepIndexByToolCallId.get(stepId);
                if (!index) {
                  stepCounter += 1;
                  index = stepCounter;
                  stepIndexByToolCallId.set(stepId, index);
                }
                sendProgress({
                  id: stepId,
                  index,
                  title: `ツール: ${meta.toolName ?? '不明'}`,
                  status: 'error',
                  detail: formatToolError(payload.error ?? (chunk as { error?: unknown }).error),
                });
                continue;
              }

              if (chunkType === 'error') {
                const errorPayload = payload.error ?? (chunk as { error?: unknown }).error;
                throw errorPayload ?? new Error('ストリーミングエラーが発生しました');
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

            if (!hasStreamedContent) {
              const trimmed = finalText?.trim() ?? '';
              if (trimmed) {
                ensureFinalStepRunning();
                sendData({ content: trimmed });
                hasStreamedContent = true;
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
                  ensureFinalStepRunning();
                  sendData({ content: fallbackMessage });
                  hasStreamedContent = true;
                }
              }
            }

            if (finalStepSent && finalStepIndex !== null) {
              sendProgress({
                id: 'final',
                index: finalStepIndex,
                title: 'FinalAnswer',
                status: 'done',
              });
            }

            // 正常終了を通知
            safeEnqueue('data: [DONE]\n\n');
            safeClose();

          } catch (error: any) {
            console.error('[Chat API] Stream error:', error);
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
            abortSignal?.removeEventListener('abort', handleAbort);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 非ストリーミングレスポンス
    console.log('[dbg] Non-streaming mode, threadId:', threadId, 'resourceId:', resourceId);
    const maxStepsNonStream = Number(process.env.CHAT_MAX_STEPS) || 10;
    const result = await requirementsAgent.generate(fullMessage, {
      memory: {
        thread: threadId || 'default',
        resource: resourceId,
      },
      maxSteps: maxStepsNonStream,
      ...(providerOptions ? { providerOptions } : {}),
    });

    return NextResponse.json({
      content: result.text,
      threadId: threadId || 'default',
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'チャット処理に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * スレッド履歴取得API（GET）
 *
 * 指定されたthreadIdの会話履歴を取得する（将来の拡張用）。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json(
        { error: 'threadIdが指定されていません' },
        { status: 400 }
      );
    }

    // TODO: Mastra Memoryから履歴を取得する実装
    // 現時点では未実装のため空配列を返す
    return NextResponse.json({
      messages: [],
      threadId,
    });

  } catch (error: any) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: error.message || '履歴取得に失敗しました' },
      { status: 500 }
    );
  }
}
