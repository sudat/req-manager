import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';

/**
 * concept_extract Tool
 *
 * テキストから概念候補を抽出する
 */
export const conceptExtractTool = createTool({
  id: 'concept_extract',
  description: 'テキストから概念候補を抽出する',
  inputSchema: z.object({
    text: z.string(),
    projectId: z.string(),
  }),
  outputSchema: z.object({
    candidates: z.array(
      z.object({
        term: z.string(),
        context: z.string(),
        isExisting: z.boolean(),
        existingDefinition: z.string().optional(),
        suggestion: z.string().optional(),
      })
    ),
    summary: z.object({
      total: z.number(),
      existing: z.number(),
      new: z.number(),
    }),
  }),
  execute: async (inputData) => {
    const { text, projectId } = inputData;

    try {
      // 1. 既存の概念辞書を取得
      const { data: existingConcepts } = await supabase
        .from('concepts')
        .select('term, definition, aliases')
        .eq('project_id', projectId);

      const conceptMap = new Map(
        existingConcepts?.map((c) => [c.term.toLowerCase(), c]) || []
      );

      // エイリアスもマップに追加
      existingConcepts?.forEach((c) => {
        c.aliases?.forEach((alias: string) => {
          conceptMap.set(alias.toLowerCase(), c);
        });
      });

      // 2. テキストから概念候補を抽出（簡易版）
      // TODO: 実際にはLLMで抽出
      const candidates: any[] = [];

      // 名詞を抽出（簡易版：カタカナ2文字以上、漢字2文字以上）
      const katakanaPattern = /[ァ-ヴー]{2,}/g;
      const kanjiPattern = /[一-龠々]{2,}/g;

      const katakanaTerms = text.match(katakanaPattern) || [];
      const kanjiTerms = text.match(kanjiPattern) || [];
      const allTerms = [...new Set([...katakanaTerms, ...kanjiTerms])];

      for (const term of allTerms) {
        const termLower = term.toLowerCase();
        const existing = conceptMap.get(termLower);

        // 文脈を抽出（用語の前後20文字）
        const termIndex = text.indexOf(term);
        const contextStart = Math.max(0, termIndex - 20);
        const contextEnd = Math.min(text.length, termIndex + term.length + 20);
        const context = text.substring(contextStart, contextEnd);

        if (existing) {
          // 既存概念
          candidates.push({
            term,
            context,
            isExisting: true,
            existingDefinition: existing.definition,
            suggestion: `既存概念「${existing.term}」として登録済みです`,
          });
        } else {
          // 新規概念候補
          candidates.push({
            term,
            context,
            isExisting: false,
            suggestion: `新しい概念として登録することを検討してください`,
          });
        }
      }

      // 3. サマリー生成
      const summary = {
        total: candidates.length,
        existing: candidates.filter((c) => c.isExisting).length,
        new: candidates.filter((c) => !c.isExisting).length,
      };

      return {
        candidates,
        summary,
      };
    } catch (error: any) {
      throw new Error(`概念抽出に失敗: ${error.message}`);
    }
  },
});
