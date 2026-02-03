import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createConcept, type ConceptCreateInput } from '@/lib/data/concepts';

/**
 * 概念登録API（POST）
 *
 * AIチャットUIから概念候補の承認時に呼び出され、
 * 概念辞書（concepts テーブル）に新規概念を登録する。
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Concepts API] Request received');
    const body = await request.json();
    const { projectId, term, definition, aliases = [], category = 'common' } = body;

    console.log('[Concepts API] Body:', {
      projectId,
      term,
      definition,
      aliases,
      category,
    });

    // バリデーション
    if (!projectId || typeof projectId !== 'string') {
      console.error('[Concepts API] Missing or invalid projectId');
      return NextResponse.json(
        { error: 'プロジェクトIDが指定されていません' },
        { status: 400 }
      );
    }

    if (!term || typeof term !== 'string') {
      console.error('[Concepts API] Missing or invalid term');
      return NextResponse.json(
        { error: '用語が指定されていません' },
        { status: 400 }
      );
    }

    if (!definition || typeof definition !== 'string') {
      console.error('[Concepts API] Missing or invalid definition');
      return NextResponse.json(
        { error: '定義が指定されていません' },
        { status: 400 }
      );
    }

    // 概念IDを自動生成（C-##### 形式）
    // 既存概念を取得して最大のIDを特定
    const { data: existingConcepts } = await supabase
      .from('concepts')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (existingConcepts && existingConcepts.length > 0) {
      const lastId = existingConcepts[0].id;
      // C-##### 形式または C##### 形式から数字部分を抽出
      const matchWithDash = lastId.match(/^C-(\d+)$/);
      const matchWithoutDash = lastId.match(/^C(\d+)$/);
      if (matchWithDash) {
        nextNumber = parseInt(matchWithDash[1], 10) + 1;
      } else if (matchWithoutDash) {
        nextNumber = parseInt(matchWithoutDash[1], 10) + 1;
      }
    }

    const conceptId = `C-${String(nextNumber).padStart(5, '0')}`;

    // ConceptCreateInput を構築
    const conceptInput: ConceptCreateInput = {
      id: conceptId,
      name: term,
      synonyms: aliases,
      areas: [category],
      definition,
      relatedDocs: [],
      requirementCount: 0,
      sortOrder: 0, // TODO: 既存概念の最大値+1を設定
      projectId,
    };

    console.log('[Concepts API] Creating concept:', conceptInput);

    // DBに登録
    const createdConcept = await createConcept(conceptInput);

    console.log('[Concepts API] Concept created successfully:', createdConcept);

    return NextResponse.json({
      success: true,
      concept: createdConcept,
    });
  } catch (error) {
    console.error('[Concepts API] Error:', error);
    return NextResponse.json(
      {
        error: '概念の登録に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
