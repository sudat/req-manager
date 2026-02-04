import { NextRequest, NextResponse } from 'next/server';
import { commitDraftTool } from '@/lib/mastra/tools/commit-draft';

const VALID_TYPES = new Set(['bt', 'br', 'sf', 'sr', 'ac', 'impl_unit']);

export async function POST(request: NextRequest) {
  try {
    console.log('[Draft Commit API] Request received');
    const body = await request.json();
    const { draftId, type, content } = body;

    console.log('[Draft Commit API] Body:', {
      draftId,
      type,
      hasContent: typeof content === 'object' && content !== null,
    });

    if (!type || typeof type !== 'string' || !VALID_TYPES.has(type)) {
      return NextResponse.json(
        { error: 'draft typeが正しく指定されていません' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'object') {
      return NextResponse.json(
        { error: '草案データが正しく指定されていません' },
        { status: 400 }
      );
    }

    const resolvedDraftId =
      typeof draftId === 'string' && draftId.trim().length > 0
        ? draftId
        : `draft-${type}-${Date.now()}`;

    const result = await commitDraftTool.execute({
      draftId: resolvedDraftId,
      type,
      content,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Draft Commit API] Error:', error);
    return NextResponse.json(
      {
        error: '草案の登録に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
