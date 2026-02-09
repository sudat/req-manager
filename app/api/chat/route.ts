import { NextRequest, NextResponse } from 'next/server';
import { requirementsAgent } from '@/lib/mastra/agents/requirements-agent';
import { ContextProvider } from '@/lib/mastra/context/provider';
import type { UILocation } from '@/lib/mastra/context/types';
import { isReasoningEffort } from '@/lib/mastra/reasoning-effort';
import { createSSEStream } from './lib/sse-stream-builder';
import { RequestContext } from '@mastra/core/request-context';
import { memory } from '@/lib/mastra/memory';

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

    const extractBusinessDomainCandidates = (text: string): string[] => {
      const candidates = new Set<string>();
      const parenMatches = text.matchAll(/（([^）]+)）/g);
      for (const match of parenMatches) {
        const value = match[1]?.trim();
        if (value) candidates.add(value);
      }
      const explicitAfterLabel = text.match(/(?:業務)?領域\s*[:：]?\s*([^\s、。]+)/);
      if (explicitAfterLabel?.[1]) candidates.add(explicitAfterLabel[1].trim());
      const beforeLabel = text.match(/([^\s、。]+?)領域/);
      if (beforeLabel?.[1]) candidates.add(beforeLabel[1].trim());
      return Array.from(candidates);
    };

    const businessDomainCandidates = extractBusinessDomainCandidates(message);
    const hasBusinessTaskKeywords = /(業務タスク|タスク|業務).*(追加|作成|登録|作りたい|入れたい)/.test(message);
    const hasRequirementKeywords = /(業務要件|要件|BR|SR|SF|システム要件|システム機能)/.test(message);
    const isBusinessTaskIntent = hasBusinessTaskKeywords && !hasRequirementKeywords;

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

    // 明示された業務領域があればSystem Hintとして付与
    if (businessDomainCandidates.length > 0) {
      fullMessage = `[System Hint]\nUser mentioned business domain candidates: ${businessDomainCandidates.join(', ')}\n\n---\n\n${fullMessage}`;
    }
    if (isBusinessTaskIntent) {
      fullMessage = `[System Hint]\nUser requested business task registration. Call listBusinessDomainsTool first.\n\n---\n\n${fullMessage}`;
    }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestContext: any = projectId
      ? new RequestContext([['projectId', projectId]])
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
        requestContext,
        ...(providerOptions ? { providerOptions } : {}),
      });
      console.log('[Chat API] Stream created successfully');
      console.log('[Chat API] ThreadId:', threadId, 'ResourceId:', resourceId);

      // SSEストリームを構築
      const readableStream = createSSEStream({
        stream,
        abortSignal: request.signal,
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
      requestContext,
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
 * Mastra Memoryから指定されたthreadIdの会話履歴を取得する。
 * 直近50件のメッセージを返す。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const resourceId = searchParams.get('resourceId');

    if (!threadId) {
      return NextResponse.json(
        { error: 'threadIdが指定されていません' },
        { status: 400 }
      );
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: 'resourceIdが指定されていません' },
        { status: 400 }
      );
    }

    console.log('[Chat API] Getting history for thread:', threadId, 'resource:', resourceId);

    // Mastra Memoryから履歴取得（直近50件）
    const result = await memory.recall({
      threadId,
      resourceId,
      perPage: 50,
    });

    // MastraDBMessage型からフロントエンド用の型に変換
    const messages = result.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      createdAt: msg.createdAt,
    }));

    console.log('[Chat API] Retrieved', messages.length, 'messages');

    return NextResponse.json({
      messages,
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
