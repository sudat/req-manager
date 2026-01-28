import { NextRequest, NextResponse } from 'next/server';
import { requirementsAgent } from '@/lib/mastra/agents/requirements-agent';
import { ContextProvider } from '@/lib/mastra/context/provider';
import type { UILocation } from '@/lib/mastra/context/types';

/**
 * チャットAPI（POST）
 *
 * Mastra Agent（requirementsAgent）と接続してメッセージを処理する。
 * ストリーミングレスポンスとテキストレスポンスの両方に対応。
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Chat API] Request received');
    const body = await request.json();
    const {
      message,
      threadId,
      resourceId,
      location,
      streaming = true
    } = body;

    console.log('[Chat API] Body:', { message, threadId, resourceId, location, streaming });

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

      const context = await ContextProvider.buildContext(uiLocation);
      contextMessage = ContextProvider.buildInitialPrompt(uiLocation);
    }

    // メッセージ構築
    const fullMessage = contextMessage
      ? `${contextMessage}\n\n---\n\nユーザーからの質問: ${message}`
      : message;

    // ストリーミングレスポンス
    if (streaming) {
      console.log('[Chat API] Calling requirementsAgent.stream()...');
      console.log('[Chat API] Message:', fullMessage);

      const stream = await requirementsAgent.stream(fullMessage);
      console.log('[Chat API] Stream created successfully');

      // ストリーミング用のReadableStreamを作成
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            console.log('[Chat API] Starting text stream...');
            for await (const chunk of stream.textStream) {
              console.log('[Chat API] Chunk received:', chunk);
              const data = encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`);
              controller.enqueue(data);
            }
            console.log('[Chat API] Stream completed');
            controller.close();
          } catch (error: any) {
            console.error('[Chat API] Stream error:', error);
            controller.error(error);
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
    const result = await requirementsAgent.generate(fullMessage);

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
