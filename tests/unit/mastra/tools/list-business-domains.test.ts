import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: list-business-domains Tool
// ========================================

type BusinessDomain = {
  area: string;
  name: string;
};

/**
 * 一覧取得結果からサマリーメッセージを生成
 */
function buildListSummaryMessage(results: BusinessDomain[], projectId: string): string {
  if (!results || results.length === 0) {
    return `業務領域が登録されていません。projectId: ${projectId}`;
  }

  const count = results.length;
  const domainList = results.map((bd) => `${bd.area}: ${bd.name}`).join(', ');
  return `${count}件の業務領域が見つかりました: ${domainList}`;
}

/**
 * 検索結果をマッピング（order句をシミュレート）
 */
function sortBusinessDomains(results: BusinessDomain[]): BusinessDomain[] {
  // area順にソート（辞書順）
  return [...results].sort((a, b) => a.area.localeCompare(b.area));
}

/**
 * 結果数チェック
 */
function hasResults(results: BusinessDomain[]): boolean {
  return Array.isArray(results) && results.length > 0;
}

// ========================================
// Test Suites
// ========================================

describe("list-business-domains Tool ロジック抽出テスト", () => {
  describe("buildListSummaryMessage", () => {
    it("結果がある場合は件数とドメイン一覧を含むメッセージ", () => {
      const results: BusinessDomain[] = [
        { area: 'AR', name: '請求' },
        { area: 'AP', name: '買掛' },
        { area: 'GL', name: '一般会計' },
      ];

      const message = buildListSummaryMessage(results, 'project-123');

      expect(message).toContain('3件');
      expect(message).toContain('AR: 請求');
      expect(message).toContain('AP: 買掛');
      expect(message).toContain('GL: 一般会計');
    });

    it("結果がない場合は未登録メッセージ", () => {
      const results: BusinessDomain[] = [];

      const message = buildListSummaryMessage(results, 'project-123');

      expect(message).toContain('業務領域が登録されていません');
      expect(message).toContain('project-123');
    });

    it("undefinedは空配列として扱う", () => {
      const message = buildListSummaryMessage(undefined as any, 'project-123');

      expect(message).toContain('業務領域が登録されていません');
    });
  });

  describe("sortBusinessDomains", () => {
    it("area順にソート（辞書順）", () => {
      const results: BusinessDomain[] = [
        { area: 'GL', name: '一般会計' },
        { area: 'AR', name: '請求' },
        { area: 'AP', name: '買掛' },
      ];

      const sorted = sortBusinessDomains(results);

      expect(sorted).toHaveLength(3);
      expect(sorted[0].area).toBe('AP');  // 辞書順では AP が最初
      expect(sorted[1].area).toBe('AR');
      expect(sorted[2].area).toBe('GL');
    });

    it("同じareaが含まれる場合、元の順序を維持", () => {
      const results: BusinessDomain[] = [
        { area: 'AR', name: '請求1' },
        { area: 'AR', name: '請求2' },
        { area: 'AR', name: '請求3' },
      ];

      const sorted = sortBusinessDomains(results);

      expect(sorted[0].name).toBe('請求1');
      expect(sorted[1].name).toBe('請求2');
      expect(sorted[2].name).toBe('請求3');
    });

    it("空配列の場合は空配列", () => {
      const sorted = sortBusinessDomains([]);

      expect(sorted).toEqual([]);
    });

    it("元の配列を変更しない", () => {
      const results: BusinessDomain[] = [
        { area: 'GL', name: '一般会計' },
        { area: 'AR', name: '請求' },
      ];

      const sorted = sortBusinessDomains(results);

      expect(sorted).not.toBe(results);
      expect(results[0].area).toBe('GL'); // 元は変更されない
    });
  });

  describe("hasResults", () => {
    it("結果がある場合はtrue", () => {
      const results: BusinessDomain[] = [
        { area: 'AR', name: '請求' },
      ];

      expect(hasResults(results)).toBe(true);
    });

    it("空配列の場合はfalse", () => {
      expect(hasResults([])).toBe(false);
    });

    it("undefinedの場合はfalse", () => {
      expect(hasResults(undefined as any)).toBe(false);
    });

    it("nullの場合はfalse", () => {
      expect(hasResults(null as any)).toBe(false);
    });
  });

  describe("統合シナリオ", () => {
    it("一覧取得成功の完全パス", () => {
      const projectId = 'project-123';
      const dbResults = [
        { area: 'AR', name: '請求' },
        { area: 'GL', name: '一般会計' },
      ];

      const mapped = dbResults as BusinessDomain[];
      const sorted = sortBusinessDomains(mapped);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].area).toBe('AR'); // 辞書順でARが先

      const message = buildListSummaryMessage(sorted, projectId);
      expect(message).toContain('2件');
      expect(message).toContain('AR: 請求');
    });

    it("0件の場合の完全パス", () => {
      const projectId = 'project-123';
      const results: BusinessDomain[] = [];

      expect(hasResults(results)).toBe(false);

      const message = buildListSummaryMessage(results, projectId);
      expect(message).toContain('業務領域が登録されていません');
    });
  });

  describe("エッジケース", () => {
    it("全て同じareaの場合", () => {
      const results: BusinessDomain[] = [
        { area: 'AR', name: '請求1' },
        { area: 'AR', name: '請求2' },
        { area: 'AR', name: '請求3' },
      ];

      const sorted = sortBusinessDomains(results);

      expect(sorted).toHaveLength(3);
      expect(sorted.every((s) => s.area === 'AR')).toBe(true);
    });

    it("数値のみのarea（辞書順）", () => {
      const results: BusinessDomain[] = [
        { area: '10', name: 'Domain10' },
        { area: '2', name: 'Domain2' },
        { area: '1', name: 'Domain1' },
      ];

      const sorted = sortBusinessDomains(results);

      expect(sorted[0].area).toBe('1');
      expect(sorted[1].area).toBe('10');
      expect(sorted[2].area).toBe('2');
    });

    it("大文字小文字のソート", () => {
      const results: BusinessDomain[] = [
        { area: 'ar', name: '請求' },
        { area: 'AR', name: '請求（大文字）' },
        { area: 'Ar', name: '請求（混合）' },
      ];

      const sorted = sortBusinessDomains(results);

      // localeCompareは大文字小文字を区別する
      expect(sorted.length).toBe(3);
    });
  });

  describe("型チェック", () => {
    it("BusinessDomainの型が正しい", () => {
      const bd: BusinessDomain = {
        area: 'AR',
        name: '請求',
      };

      expect(typeof bd.area).toBe('string');
      expect(typeof bd.name).toBe('string');
    });
  });
});
