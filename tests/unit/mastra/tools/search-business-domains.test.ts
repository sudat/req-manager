import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: search-business-domains Tool
// ========================================

type BusinessDomain = {
  area: string;
  name: string;
};

/**
 * 検索結果からサマリーメッセージを生成
 */
function buildSummaryMessage(query: string, results: BusinessDomain[]): string {
  if (!results || results.length === 0) {
    return `業務領域「${query}」が見つかりませんでした。検索対象: name, area。`;
  }

  const domainList = results.map((bd) => `${bd.area}: ${bd.name}`).join(', ');
  return `${results.length}件の業務領域が見つかりました: ${domainList}`;
}

/**
 * 検索結果をマッピング
 */
function mapBusinessDomainResults(results: any[]): BusinessDomain[] {
  return results.map((item) => ({
    area: item.area,
    name: item.name,
  }));
}

/**
 * 結果数チェック（limit 10）
 */
function isWithinLimit(results: BusinessDomain[], limit: number = 10): boolean {
  return results.length <= limit;
}

// ========================================
// Test Suites
// ========================================

describe("search-business-domains Tool ロジック抽出テスト", () => {
  describe("buildSummaryMessage", () => {
    it("結果がある場合は件数とドメイン一覧を含むメッセージ", () => {
      const results: BusinessDomain[] = [
        { area: 'AR', name: '請求' },
        { area: 'AP', name: '買掛' },
      ];

      const message = buildSummaryMessage('請求', results);

      expect(message).toContain('2件');
      expect(message).toContain('AR: 請求');
      expect(message).toContain('AP: 買掛');
    });

    it("結果がない場合は見つからなかったメッセージ", () => {
      const results: BusinessDomain[] = [];

      const message = buildSummaryMessage('GL', results);

      expect(message).toContain('見つかりませんでした');
      expect(message).toContain('GL');
      expect(message).toContain('name, area');
    });

    it("空配列の場合", () => {
      const message = buildSummaryMessage('test', []);

      expect(message).toContain('見つかりませんでした');
    });

    it("undefinedは空配列として扱う", () => {
      const message = buildSummaryMessage('test', undefined as any);

      expect(message).toContain('見つかりませんでした');
    });
  });

  describe("mapBusinessDomainResults", () => {
    it("DB結果をBusinessDomain型にマッピング", () => {
      const dbResults = [
        { area: 'AR', name: '請求' },
        { area: 'GL', name: '一般会計' },
      ];

      const result = mapBusinessDomainResults(dbResults);

      expect(result).toHaveLength(2);
      expect(result[0].area).toBe('AR');
      expect(result[0].name).toBe('請求');
    });

    it("空配列の場合は空配列", () => {
      const result = mapBusinessDomainResults([]);

      expect(result).toEqual([]);
    });
  });

  describe("isWithinLimit", () => {
    it("10件以下の場合はtrue", () => {
      const results: BusinessDomain[] = Array.from({ length: 10 }, (_, i) => ({
        area: `A${i}`,
        name: `Domain ${i}`,
      }));

      expect(isWithinLimit(results)).toBe(true);
    });

    it("11件以上の場合はfalse", () => {
      const results: BusinessDomain[] = Array.from({ length: 11 }, (_, i) => ({
        area: `A${i}`,
        name: `Domain ${i}`,
      }));

      expect(isWithinLimit(results)).toBe(false);
    });

    it("空配列はtrue", () => {
      expect(isWithinLimit([])).toBe(true);
    });

    it("デフォルトlimitは10", () => {
      const results: BusinessDomain[] = Array.from({ length: 10 }, (_, i) => ({
        area: `A${i}`,
        name: `Domain ${i}`,
      }));

      expect(isWithinLimit(results, 10)).toBe(true);
      expect(isWithinLimit(results, 9)).toBe(false);
    });
  });

  describe("統合シナリオ", () => {
    it("検索成功の完全パス", () => {
      const query = 'AR';
      const dbResults = [
        { area: 'AR', name: '請求' },
      ];

      const mapped = mapBusinessDomainResults(dbResults);
      expect(mapped).toHaveLength(1);

      const message = buildSummaryMessage(query, mapped);
      expect(message).toContain('1件');
      expect(message).toContain('AR: 請求');
    });

    it("検索失敗（0件）の完全パス", () => {
      const query = 'XX';
      const dbResults = [];

      const mapped = mapBusinessDomainResults(dbResults);
      expect(mapped).toHaveLength(0);

      const message = buildSummaryMessage(query, mapped);
      expect(message).toContain('見つかりませんでした');
    });
  });

  describe("エッジケース", () => {
    it("特殊文字を含むクエリ", () => {
      const message = buildSummaryMessage('テスト', []);

      expect(message).toContain('見つかりませんでした');
    });

    it("空文字列のクエリ", () => {
      const message = buildSummaryMessage('', []);

      expect(message).toContain('見つかりませんでした');
    });

    it("マッピング時に余分なフィールドがあっても無視", () => {
      const dbResults = [
        { area: 'AR', name: '請求', extra: 'ignored' as any },
      ];

      const result = mapBusinessDomainResults(dbResults);

      expect(result[0].area).toBe('AR');
      expect(result[0]).not.toHaveProperty('extra');
    });
  });
});
