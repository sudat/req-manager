import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';

/**
 * critic_check Tool
 *
 * 要件の曖昧さ・矛盾・漏れを検出する
 */
export const criticCheckTool = createTool({
  id: 'critic_check',
  description: `要件の品質チェックを行い、曖昧さ・矛盾・漏れを検出するツールです。

【使用タイミング】
- ユーザーが「品質チェックして」「チェックして」「レビューして」などと言った場合
- ユーザーが要件IDを指定した場合（例: 「BT-AP-0001-0001を品質チェックして」）

【入力パラメータ】
- targetIds: 要件IDの配列（例: ["BT-AP-0001-0001", "BR-AP-0001-0001", "SR-AP-0001-0001"]）
- checkLevel: チェックレベル（オプション、デフォルト: "standard"）
  - "quick": 高速チェック（主要な問題のみ）
  - "standard": 標準チェック（推奨）
  - "thorough": 徹底チェック（時間がかかる）

【出力】
- issues: 検出された問題リスト
  - severity: 致命度（critical: 致命的、warning: 警告、info: 情報）
  - category: カテゴリ（ambiguity: 曖昧さ、verifiability: 検証可能性、completeness: 完全性など）
  - message: 問題の説明
  - targetId: 対象の要件ID
  - suggestion: 修正案
- suggestions: 全体的な改善提案
- summary: サマリー（critical/warning/infoの件数）

【チェック項目】
- BT: 業務タスク名・説明の曖昧さ
- BR: 業務要件の形式（動詞で終わる）、根拠の有無
- SR: システム要件の曖昧な表現、ACの検証可能性

【重要】
- ユーザーが要件IDをメッセージに含めている場合は、必ずそれを抽出して使う
- 要件IDが不明な場合は、必ずユーザーに要件IDを尋ねる
- BT/BR/SRのどのタイプでも自動判定してチェックする`,
  inputSchema: z.object({
    targetIds: z.array(z.string()),
    checkLevel: z.enum(['quick', 'standard', 'thorough']).optional().default('standard'),
  }),
  outputSchema: z.object({
    issues: z.array(
      z.object({
        severity: z.enum(['critical', 'warning', 'info']),
        category: z.string(),
        message: z.string(),
        targetId: z.string(),
        suggestion: z.string().optional(),
      })
    ),
    suggestions: z.array(z.string()).optional(),
    summary: z.object({
      critical: z.number(),
      warning: z.number(),
      info: z.number(),
    }),
  }),
  execute: async (inputData) => {
    const { targetIds, checkLevel } = inputData;

    try {
      const issues: any[] = [];

      // 1. 要件を取得（タイプ判定のため全テーブルを確認）
      for (const targetId of targetIds) {
        // BT確認
        const { data: bt } = await supabase
          .from('business_tasks')
          .select('*')
          .eq('id', targetId)
          .maybeSingle();

        if (bt) {
          // BTの曖昧性チェック
          if (!bt.description || bt.description.length < 20) {
            issues.push({
              severity: 'warning',
              category: 'ambiguity',
              message: '業務タスクの説明が簡潔すぎます',
              targetId: bt.id,
              suggestion: 'より詳細な業務フローや目的を記述してください',
            });
          }

          if (!bt.name || bt.name.length < 5) {
            issues.push({
              severity: 'critical',
              category: 'ambiguity',
              message: '業務タスク名が不明確です',
              targetId: bt.id,
              suggestion: '業務内容が分かる具体的な名前を付けてください',
            });
          }
          continue;
        }

        // BR確認
        const { data: br } = await supabase
          .from('business_requirements')
          .select('*')
          .eq('id', targetId)
          .maybeSingle();

        if (br) {
          // BRの曖昧性チェック
          if (!br.requirement.includes('できる') && !br.requirement.includes('する')) {
            issues.push({
              severity: 'warning',
              category: 'format',
              message: '業務要件が動詞で終わっていません',
              targetId: br.id,
              suggestion: '「〜できる」「〜する」の形式で記述してください',
            });
          }

          if (!br.rationale) {
            issues.push({
              severity: 'info',
              category: 'completeness',
              message: '根拠（rationale）が未記入です',
              targetId: br.id,
              suggestion: 'なぜこの要件が必要かを記述してください',
            });
          }
          continue;
        }

        // SR確認
        const { data: sr } = await supabase
          .from('system_requirements')
          .select('*, acceptance_criteria(*)')
          .eq('id', targetId)
          .maybeSingle();

        if (sr) {
          // SRの曖昧性チェック
          const ambiguousWords = ['適切に', 'うまく', '良好に', '正常に'];
          const hasAmbiguousWord = ambiguousWords.some((word) =>
            sr.requirement.includes(word)
          );

          if (hasAmbiguousWord) {
            issues.push({
              severity: 'warning',
              category: 'ambiguity',
              message: 'システム要件に曖昧な表現が含まれています',
              targetId: sr.id,
              suggestion: '具体的な条件や数値を記述してください',
            });
          }

          // ACの検証可能性チェック
          const acs = (sr as any).acceptance_criteria || [];
          if (acs.length === 0) {
            issues.push({
              severity: 'critical',
              category: 'verifiability',
              message: '受入基準（AC）が未定義です',
              targetId: sr.id,
              suggestion: 'システム要件を検証できるACを追加してください',
            });
          }

          for (const ac of acs) {
            if (!ac.given || !ac.when || !ac.then) {
              issues.push({
                severity: 'warning',
                category: 'verifiability',
                message: 'AC（Given-When-Then）が不完全です',
                targetId: ac.id,
                suggestion: 'Given/When/Then全てを記述してください',
              });
            }
          }
          continue;
        }
      }

      // 2. 致命度でソート
      const severityOrder: Record<string, number> = { critical: 3, warning: 2, info: 1 };
      issues.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));

      // 3. サマリー生成
      const summary = {
        critical: issues.filter((i) => i.severity === 'critical').length,
        warning: issues.filter((i) => i.severity === 'warning').length,
        info: issues.filter((i) => i.severity === 'info').length,
      };

      // 4. 全体的な改善提案
      const suggestions: string[] = [];
      if (summary.critical > 0) {
        suggestions.push('致命的な問題があります。確定前に修正してください。');
      }
      if (summary.warning > 3) {
        suggestions.push('警告が多数あります。品質向上のため見直しをお勧めします。');
      }

      return {
        issues,
        suggestions,
        summary,
      };
    } catch (error: any) {
      throw new Error(`品質チェックに失敗: ${error.message}`);
    }
  },
});
