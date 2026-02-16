import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: critic-check Tool
// ========================================

type Issue = {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  targetId: string;
  suggestion?: string;
};

/**
 * SR要文中に曖昧な表現が含まれるかチェック
 */
function hasAmbiguousWord(requirement: string): boolean {
  const ambiguousWords = ['適切に', 'うまく', '良好に', '正常に'];
  return ambiguousWords.some((word) => requirement.includes(word));
}

/**
 * 要件の動詞形式をチェック（「〜できる」「〜する」）
 */
function hasVerbForm(requirement: string): boolean {
  return requirement.includes('できる') || requirement.includes('する');
}

/**
 * BTの説明文字数チェック
 */
function isBtDescriptionTooShort(description?: string): boolean {
  return !description || description.length < 20;
}

/**
 * BT名のチェック（5文字未満は不明確）
 */
function isBtNameUnclear(name?: string): boolean {
  return !name || name.length < 5;
}

/**
 * 問題リストを致命度でソート（critical > warning > info）
 */
function sortIssuesBySeverity(issues: Issue[]): Issue[] {
  const severityOrder: Record<string, number> = { critical: 3, warning: 2, info: 1 };
  return [...issues].sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));
}

/**
 * サマリーを生成（致命度別の件数）
 */
function generateSummary(issues: Issue[]): { critical: number; warning: number; info: number } {
  return {
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };
}

/**
 * サマリーに基づいて改善提案を生成
 */
function generateSuggestions(summary: { critical: number; warning: number; info: number }): string[] {
  const suggestions: string[] = [];
  if (summary.critical > 0) {
    suggestions.push('致命的な問題があります。確定前に修正してください。');
  }
  if (summary.warning > 3) {
    suggestions.push('警告が多数あります。品質向上のため見直しをお勧めします。');
  }
  return suggestions;
}

// ========================================
// Test Suites
// ========================================

describe("critic-check Tool ロジック抽出テスト", () => {
  describe("hasAmbiguousWord", () => {
    it("「適切に」を含む場合はtrue", () => {
      expect(hasAmbiguousWord('データを適切に処理する')).toBe(true);
    });

    it("「うまく」を含む場合はtrue", () => {
      expect(hasAmbiguousWord('うまく動作する')).toBe(true);
    });

    it("「良好に」を含む場合はtrue", () => {
      expect(hasAmbiguousWord('良好にパフォーマンスを発揮する')).toBe(true);
    });

    it("「正常に」を含む場合はtrue", () => {
      expect(hasAmbiguousWord('正常に終了する')).toBe(true);
    });

    it("曖昧な表現がない場合はfalse", () => {
      expect(hasAmbiguousWord('データを処理する')).toBe(false);
    });

    it("空文字の場合はfalse", () => {
      expect(hasAmbiguousWord('')).toBe(false);
    });
  });

  describe("hasVerbForm", () => {
    it("「〜できる」を含む場合はtrue", () => {
      expect(hasVerbForm('請求書をPDFで出力できる')).toBe(true);
    });

    it("「〜する」を含む場合はtrue", () => {
      expect(hasVerbForm('データを保存する')).toBe(true);
    });

    it("両方含む場合もtrue", () => {
      expect(hasVerbForm('できるようにする')).toBe(true);
    });

    it("動詞形式がない場合はfalse", () => {
      expect(hasVerbForm('データ処理')).toBe(false);
    });

    it("空文字の場合はfalse", () => {
      expect(hasVerbForm('')).toBe(false);
    });
  });

  describe("isBtDescriptionTooShort", () => {
    it("20文字以上はfalse", () => {
      expect(isBtDescriptionTooShort('12345678901234567890')).toBe(false);
    });

    it("20文字未満はtrue", () => {
      expect(isBtDescriptionTooShort('1234567890123456789')).toBe(true);
    });

    it("undefinedはtrue", () => {
      expect(isBtDescriptionTooShort(undefined)).toBe(true);
    });

    it("空文字はtrue", () => {
      expect(isBtDescriptionTooShort('')).toBe(true);
    });
  });

  describe("isBtNameUnclear", () => {
    it("5文字以上はfalse", () => {
      expect(isBtNameUnclear('12345')).toBe(false);
    });

    it("5文字未満はtrue", () => {
      expect(isBtNameUnclear('1234')).toBe(true);
    });

    it("undefinedはtrue", () => {
      expect(isBtNameUnclear(undefined)).toBe(true);
    });

    it("空文字はtrue", () => {
      expect(isBtNameUnclear('')).toBe(true);
    });
  });

  describe("sortIssuesBySeverity", () => {
    it("critical > warning > infoの順にソート", () => {
      const issues: Issue[] = [
        { severity: 'info', category: 'test', message: 'info', targetId: '1' },
        { severity: 'critical', category: 'test', message: 'critical', targetId: '2' },
        { severity: 'warning', category: 'test', message: 'warning', targetId: '3' },
      ];
      const sorted = sortIssuesBySeverity(issues);
      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('warning');
      expect(sorted[2].severity).toBe('info');
    });

    it("同じ致命度内では元の順序を維持（安定ソートではない）", () => {
      const issues: Issue[] = [
        { severity: 'warning', category: 'test', message: 'first', targetId: '1' },
        { severity: 'warning', category: 'test', message: 'second', targetId: '2' },
      ];
      const sorted = sortIssuesBySeverity(issues);
      expect(sorted.length).toBe(2);
      expect(sorted.every((i) => i.severity === 'warning')).toBe(true);
    });

    it("空配列は空配列", () => {
      expect(sortIssuesBySeverity([])).toEqual([]);
    });
  });

  describe("generateSummary", () => {
    it("各致命度の件数をカウント", () => {
      const issues: Issue[] = [
        { severity: 'critical', category: 'test', message: '', targetId: '1' },
        { severity: 'critical', category: 'test', message: '', targetId: '2' },
        { severity: 'warning', category: 'test', message: '', targetId: '3' },
        { severity: 'info', category: 'test', message: '', targetId: '4' },
      ];
      const summary = generateSummary(issues);
      expect(summary.critical).toBe(2);
      expect(summary.warning).toBe(1);
      expect(summary.info).toBe(1);
    });

    it("空配列は全て0", () => {
      const summary = generateSummary([]);
      expect(summary.critical).toBe(0);
      expect(summary.warning).toBe(0);
      expect(summary.info).toBe(0);
    });
  });

  describe("generateSuggestions", () => {
    it("criticalがある場合は修正を提案", () => {
      const summary = { critical: 1, warning: 0, info: 0 };
      const suggestions = generateSuggestions(summary);
      expect(suggestions).toContain('致命的な問題があります。確定前に修正してください。');
    });

    it("warningが3を超える場合は見直しを提案", () => {
      const summary = { critical: 0, warning: 4, info: 0 };
      const suggestions = generateSuggestions(summary);
      expect(suggestions).toContain('警告が多数あります。品質向上のため見直しをお勧めします。');
    });

    it("warningが3以下の場合は提案なし", () => {
      const summary = { critical: 0, warning: 3, info: 0 };
      const suggestions = generateSuggestions(summary);
      expect(suggestions).not.toContain('警告が多数あります');
    });

    it("問題がない場合は空配列", () => {
      const summary = { critical: 0, warning: 0, info: 0 };
      const suggestions = generateSuggestions(summary);
      expect(suggestions).toEqual([]);
    });

    it("両方の条件を満たす場合は両方の提案", () => {
      const summary = { critical: 1, warning: 4, info: 0 };
      const suggestions = generateSuggestions(summary);
      expect(suggestions.length).toBe(2);
    });
  });

  describe("統合シナリオ", () => {
    it("BRチェックの完全パス", () => {
      // 動詞形式チェック
      const validBr = '請求書をPDFで出力できる';
      expect(hasVerbForm(validBr)).toBe(true);

      const invalidBr = '請求書PDF出力';
      expect(hasVerbForm(invalidBr)).toBe(false);
    });

    it("SRチェックの完全パス", () => {
      // 曖昧表現チェック
      const ambiguousSr = 'データを適切に処理する';
      expect(hasAmbiguousWord(ambiguousSr)).toBe(true);

      const clearSr = 'データを処理する';
      expect(hasAmbiguousWord(clearSr)).toBe(false);
    });

    it("BTチェックの完全パス", () => {
      // 名前チェック
      expect(isBtNameUnclear('請求書発行')).toBe(false);
      expect(isBtNameUnclear('発行')).toBe(true);

      // 説明チェック
      expect(isBtDescriptionTooShort('請求書データを集計してPDFを生成し、メールで送付する業務プロセス')).toBe(false);
      expect(isBtDescriptionTooShort('請求書作成')).toBe(true);
    });

    it("問題検出からソート・サマリー生成まで", () => {
      const issues: Issue[] = [
        { severity: 'info', category: 'test', message: 'info issue', targetId: '1' },
        { severity: 'critical', category: 'test', message: 'critical issue', targetId: '2' },
        { severity: 'warning', category: 'test', message: 'warning issue', targetId: '3' },
        { severity: 'warning', category: 'test', message: 'warning issue 2', targetId: '4' },
      ];

      const sorted = sortIssuesBySeverity(issues);
      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('warning');

      const summary = generateSummary(sorted);
      expect(summary.critical).toBe(1);
      expect(summary.warning).toBe(2);
      expect(summary.info).toBe(1);

      const suggestions = generateSuggestions(summary);
      expect(suggestions).toContain('致命的な問題があります。確定前に修正してください。');
    });
  });

  describe("エッジケース", () => {
    it("要約文中の部分一致でも検出", () => {
      expect(hasAmbiguousWord('データを正常に適切に処理')).toBe(true);
    });

    it("動詞チェックの部分一致", () => {
      expect(hasVerbForm('保存できるようにする')).toBe(true);
    });

    it("BT説明が境界値（20文字）", () => {
      const exactly20 = '12345678901234567890';
      expect(isBtDescriptionTooShort(exactly20)).toBe(false);

      const exactly19 = '1234567890123456789';
      expect(isBtDescriptionTooShort(exactly19)).toBe(true);
    });

    it("BT名が境界値（5文字）", () => {
      const exactly5 = '12345';
      expect(isBtNameUnclear(exactly5)).toBe(false);

      const exactly4 = '1234';
      expect(isBtNameUnclear(exactly4)).toBe(true);
    });

    it("複数の曖昧表現を含む場合", () => {
      expect(hasAmbiguousWord('適切にうまく処理する')).toBe(true);
    });

    it("全て小文字で曖昧語チェック", () => {
      expect(hasAmbiguousWord('データを正常に処理する')).toBe(true);
    });
  });
});
