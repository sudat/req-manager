import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: search-requirements Tool
// ========================================

type SearchResult = {
  resultType: string;
  id: string;
  code?: string;
  name?: string;
  title?: string;
};

/**
 * 要件IDを正規表現で抽出
 * 例: "BT-AR-0001" → "BT-AR-0001", "bt-ar-0001" → "BT-AR-0001"
 */
function extractRequirementId(text: string): string | null {
  const match = text.match(/\b(BT|BR|SF|SR)-[A-Z0-9_]+-\d{4}(?:-\d{3,4})?\b/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * IDによる結果フィルタリング
 * - 完全一致
 * - 前方一致
 * - そのまま全結果
 */
function filterResultsForId(
  results: Array<Record<string, unknown>>,
  id: string
): Array<Record<string, unknown>> {
  const prefix = id.split('-')[0]?.toLowerCase();
  const typeMap: Record<string, string> = {
    bt: 'bt',
    br: 'br',
    sf: 'sf',
    sr: 'sr',
  };
  const expectedType = prefix ? typeMap[prefix] : undefined;
  if (!expectedType) return results;

  // 1. 完全一致
  const exact = results.filter((item) => {
    const resultType = item.resultType as string | undefined;
    const itemId = (item.id ?? item.code) as string | undefined;
    return resultType === expectedType && itemId === id;
  });
  if (exact.length > 0) return exact;

  // 2. 前方一致
  const startsWith = results.filter((item) => {
    const resultType = item.resultType as string | undefined;
    const itemId = (item.id ?? item.code) as string | undefined;
    return resultType === expectedType && typeof itemId === 'string' && itemId.startsWith(id);
  });
  if (startsWith.length > 0) return startsWith;

  return results;
}

/**
 * types配列から 'dd' を除外する型ガード
 */
function filterMcpTypes(types?: string[]): ('bt' | 'br' | 'sf' | 'sr')[] {
  if (!types) return [];
  return types.filter((t): t is 'bt' | 'br' | 'sf' | 'sr' => t !== 'dd');
}

// ========================================
// Test Suites
// ========================================

describe("search-requirements Tool ロジック抽出テスト", () => {
  describe("extractRequirementId", () => {
    it("BT IDを抽出", () => {
      expect(extractRequirementId('BT-AR-0001')).toBe('BT-AR-0001');
      expect(extractRequirementId('bt-ar-0001')).toBe('BT-AR-0001');
    });

    it("BR IDを抽出", () => {
      expect(extractRequirementId('BR-AR-0001-0001')).toBe('BR-AR-0001-0001');
    });

    it("SF IDを抽出", () => {
      expect(extractRequirementId('SF-AR-0001')).toBe('SF-AR-0001');
    });

    it("SR IDを抽出", () => {
      expect(extractRequirementId('SR-AR-0001-0001')).toBe('SR-AR-0001-0001');
    });

    it("IDを含まないテキストはnull", () => {
      expect(extractRequirementId('請求書を発行する')).toBeNull();
    });

    it("空文字はnull", () => {
      expect(extractRequirementId('')).toBeNull();
    });

    it("部分的なIDはマッチしない（単語境界）", () => {
      expect(extractRequirementId('BT-AR')).toBeNull();
    });

    it("小文字でも大文字に変換", () => {
      expect(extractRequirementId('bt-gl-9999-0001')).toBe('BT-GL-9999-0001');
    });
  });

  describe("filterResultsForId", () => {
    const mockResults: Array<Record<string, unknown>> = [
      { resultType: 'bt', id: 'BT-AR-0001', name: '請求書発行' },
      { resultType: 'bt', id: 'BT-AR-0002', name: '入金処理' },
      { resultType: 'br', code: 'BR-AR-0001-0001', title: '請求書をPDF出力' },
      { resultType: 'br', code: 'BR-AR-0001-0002', title: 'メール送付' },
      { resultType: 'sf', id: 'SF-AR-0001', name: '請求書発行機能' },
    ];

    it("完全一致でフィルタリング", () => {
      const result = filterResultsForId(mockResults, 'BT-AR-0001');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('BT-AR-0001');
    });

    it("完全一致がない場合は前方一致", () => {
      const result = filterResultsForId(mockResults, 'BT-AR');
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.every((r) => (r.id as string).startsWith('BT-AR'))).toBe(true);
    });

    it("IDプレフィックスが異なる場合はフィルタ", () => {
      const result = filterResultsForId(mockResults, 'BT-AR-0001');
      expect(result).toHaveLength(1);
      expect(result[0].resultType).toBe('bt');
    });

    it("一致するIDがない場合は全結果を返す", () => {
      const result = filterResultsForId(mockResults, 'SF-GL-9999');
      expect(result).toEqual(mockResults);
    });

    it("空配列の場合は空配列", () => {
      const result = filterResultsForId([], 'BT-AR-0001');
      expect(result).toEqual([]);
    });

    it("codeフィールドも考慮する", () => {
      const result = filterResultsForId(mockResults, 'BR-AR-0001-0001');
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('BR-AR-0001-0001');
    });
  });

  describe("filterMcpTypes", () => {
    it("ddを除外する", () => {
      const types = ['bt', 'br', 'sf', 'sr', 'dd'];
      const result = filterMcpTypes(types);
      expect(result).toEqual(['bt', 'br', 'sf', 'sr']);
      expect(result).not.toContain('dd');
    });

    it("ddが含まれない場合はそのまま", () => {
      const types = ['bt', 'br', 'sf', 'sr'];
      const result = filterMcpTypes(types);
      expect(result).toEqual(['bt', 'br', 'sf', 'sr']);
    });

    it("undefinedの場合は空配列", () => {
      const result = filterMcpTypes(undefined);
      expect(result).toEqual([]);
    });

    it("空配列の場合は空配列", () => {
      const result = filterMcpTypes([]);
      expect(result).toEqual([]);
    });

    it("型ガードで除外される型を含む場合、includesチェックで除外", () => {
      const types = ['bt', 'br', 'sf', 'sr', 'dd', 'invalid'];
      // TypeScriptの型ガードはコンパイル時に機能するが、実行時にはfilterの条件で除外される
      // 実際にはddが除外されるのみで、invalidは残る（実装の挙動）
      const result = filterMcpTypes(types);
      expect(result).not.toContain('dd');
      // 'invalid'は'tは...'の型ガードを通過するが、実行時には残る
      expect(result).toContain('invalid');
    });
  });

  describe("統合シナリオ", () => {
    it("ID抽出からフィルタリングまでの完全パス", () => {
      const query = 'BT-AR-0001';
      const idCandidate = extractRequirementId(query);
      expect(idCandidate).toBe('BT-AR-0001');

      const mockResults: Array<Record<string, unknown>> = [
        { resultType: 'bt', id: 'BT-AR-0001', name: '請求書発行' },
        { resultType: 'bt', id: 'BT-AR-0002', name: '入金処理' },
      ];

      const filtered = filterResultsForId(mockResults, idCandidate!);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('BT-AR-0001');
    });

    it("MCP型フィルタの完全パス", () => {
      const types = ['bt', 'br', 'dd'];
      const mcpTypes = filterMcpTypes(types);
      expect(mcpTypes).toEqual(['bt', 'br']);
    });

    it("キーワード検索（ID抽出なし）", () => {
      const query = '請求書';
      const idCandidate = extractRequirementId(query);
      expect(idCandidate).toBeNull();

      // ID抽出がない場合はクエリ文字列をそのまま使用
      const normalizedQuery = idCandidate ?? query;
      expect(normalizedQuery).toBe('請求書');
    });
  });

  describe("エッジケース", () => {
    it("IDの形式が不正な場合はnull", () => {
      expect(extractRequirementId('BT-')).toBeNull();
      expect(extractRequirementId('BT-AR')).toBeNull();
      expect(extractRequirementId('BT-AR-')).toBeNull();
    });

    it("アンダースコアを含むID", () => {
      // 正規表現 \b はアンダースコアを単語境界とみなすのでマッチしない
      // 実装の正規表現では \b(BT|BR|SF|SR)-[A-Z0-9_]+-\d{4}(?:-\d{3,4})?\b/i
      // BT_GLOBAL_0001 の先頭の \b は B の前ろなのでマッチするが、
      // アンダースコアを含む文字列では単語境界の挙動が複雑
      // 実際には BT_GLOBAL_0001 はマッチしない（アンダースコアが \w に含まれるため）
      expect(extractRequirementId('BT_GLOBAL_0001')).toBeNull();
      // 標準的な形式のみマッチする
      expect(extractRequirementId('BT-AR-0001')).toBe('BT-AR-0001');
    });

    it("3桁または4桁のシーケンス番号", () => {
      expect(extractRequirementId('BT-AR-0001-001')).toBe('BT-AR-0001-001');
      expect(extractRequirementId('BT-AR-0001-0001')).toBe('BT-AR-0001-0001');
    });

    it("フィルタ結果がcodeとid混在の場合", () => {
      const mixedResults: Array<Record<string, unknown>> = [
        { resultType: 'bt', id: 'BT-AR-0001' },
        { resultType: 'br', code: 'BR-AR-0001-0001' },
        { resultType: 'sf', id: 'SF-AR-0001' },
      ];

      const result = filterResultsForId(mixedResults, 'BT-AR-0001');
      expect(result).toHaveLength(1);
      expect(result[0].resultType).toBe('bt');
    });

    it("IDプレフィックスが未知の場合は全結果返す", () => {
      const mockResults: Array<Record<string, unknown>> = [
        { resultType: 'bt', id: 'BT-AR-0001' },
        { resultType: 'br', code: 'BR-AR-0001-0001' },
      ];

      const result = filterResultsForId(mockResults, 'XX-AR-0001');
      expect(result).toEqual(mockResults);
    });
  });
});
