import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: get-context Tool
// ========================================

type UILocation = {
  type: 'bd' | 'bt' | 'br' | 'sd' | 'sf' | 'sr' | 'cr' | 'project';
  id: string;
  name: string;
  projectId: string;
  breadcrumb: string[];
};

/**
 * UILocationオブジェクトを構築
 * breadcrumbは省略された場合に空配列になる
 */
function buildUILocation(input: {
  locationType: UILocation['type'];
  locationId: string;
  locationName: string;
  projectId: string;
  breadcrumb?: string[];
}): UILocation {
  return {
    type: input.locationType,
    id: input.locationId,
    name: input.locationName,
    projectId: input.projectId,
    breadcrumb: input.breadcrumb ?? [],
  };
}

/**
 * breadcrumbが省略された場合のデフォルト値処理
 */
function getBreadcrumbOrDefault(
  breadcrumb?: string[]
): string[] {
  return breadcrumb ?? [];
}

// ========================================
// Test Suites
// ========================================

describe("get-context Tool ロジック抽出テスト", () => {
  describe("buildUILocation", () => {
    it("全てのフィールドが指定されている場合", () => {
      const input = {
        locationType: 'bt' as const,
        locationId: 'BT-AR-0001',
        locationName: '請求書発行',
        projectId: 'project-123',
        breadcrumb: ['BD-AR', 'BT-AR-0001'],
      };

      const result = buildUILocation(input);

      expect(result.type).toBe('bt');
      expect(result.id).toBe('BT-AR-0001');
      expect(result.name).toBe('請求書発行');
      expect(result.projectId).toBe('project-123');
      expect(result.breadcrumb).toEqual(['BD-AR', 'BT-AR-0001']);
    });

    it("breadcrumbが省略された場合は空配列", () => {
      const input = {
        locationType: 'br' as const,
        locationId: 'BR-AR-0001-0001',
        locationName: '請求書PDF出力',
        projectId: 'project-123',
      };

      const result = buildUILocation(input);

      expect(result.breadcrumb).toEqual([]);
    });

    it("異なるlocationTypeで正しく構築", () => {
      const types: UILocation['type'][] = ['bd', 'bt', 'br', 'sd', 'sf', 'sr', 'cr', 'project'];

      types.forEach((type) => {
        const input = {
          locationType: type,
          locationId: 'test-id',
          locationName: 'Test',
          projectId: 'project-123',
        };

        const result = buildUILocation(input);
        expect(result.type).toBe(type);
      });
    });
  });

  describe("getBreadcrumbOrDefault", () => {
    it("breadcrumbが指定されている場合はそのまま返す", () => {
      const breadcrumb = ['BD-AR', 'BT-AR-0001'];
      const result = getBreadcrumbOrDefault(breadcrumb);

      expect(result).toEqual(breadcrumb);
    });

    it("breadcrumbがundefinedの場合は空配列", () => {
      const result = getBreadcrumbOrDefault(undefined);

      expect(result).toEqual([]);
    });

    it("breadcrumbが空配列の場合は空配列", () => {
      const result = getBreadcrumbOrDefault([]);

      expect(result).toEqual([]);
    });
  });

  describe("統合シナリオ", () => {
    it("BD階層のUILocation構築", () => {
      const input = {
        locationType: 'bd' as const,
        locationId: 'BD-AR',
        locationName: '請求',
        projectId: 'project-123',
        breadcrumb: undefined,
      };

      const result = buildUILocation(input);

      expect(result.type).toBe('bd');
      expect(result.breadcrumb).toEqual([]);
      expect(result.id).toBe('BD-AR');
    });

    it("BT階層のUILocation構築（パンくずあり）", () => {
      const input = {
        locationType: 'bt' as const,
        locationId: 'BT-AR-0001',
        locationName: '請求書発行',
        projectId: 'project-123',
        breadcrumb: ['BD-AR'],
      };

      const result = buildUILocation(input);

      expect(result.type).toBe('bt');
      expect(result.breadcrumb).toEqual(['BD-AR']);
    });

    it("SF階層のUILocation構築（深いパンくず）", () => {
      const input = {
        locationType: 'sf' as const,
        locationId: 'SF-AR-0001',
        locationName: '請求書発行機能',
        projectId: 'project-123',
        breadcrumb: ['BD-AR', 'BT-AR-0001'],
      };

      const result = buildUILocation(input);

      expect(result.type).toBe('sf');
      expect(result.breadcrumb).toEqual(['BD-AR', 'BT-AR-0001']);
    });
  });

  describe("エッジケース", () => {
    it("空文字列の各フィールド", () => {
      const input = {
        locationType: 'project' as const,
        locationId: '',
        locationName: '',
        projectId: '',
        breadcrumb: [],
      };

      const result = buildUILocation(input);

      expect(result.id).toBe('');
      expect(result.name).toBe('');
      expect(result.projectId).toBe('');
    });

    it("breadcrumbに空文字列が含まれる場合", () => {
      const breadcrumb = ['BD-AR', '', 'BT-AR-0001'];
      const result = getBreadcrumbOrDefault(breadcrumb);

      expect(result).toEqual(breadcrumb);
    });

    it("全てのlocationTypeが有効", () => {
      const validTypes: UILocation['type'][] = ['bd', 'bt', 'br', 'sd', 'sf', 'sr', 'cr', 'project'];

      validTypes.forEach((type) => {
        const input = {
          locationType: type,
          locationId: 'test',
          locationName: 'Test',
          projectId: 'proj',
        };

        const result = buildUILocation(input);
        expect(result.type).toBe(type);
      });
    });
  });

  describe("型チェック", () => {
    it("UILocationの型が正しい", () => {
      const location: UILocation = {
        type: 'bt',
        id: 'BT-AR-0001',
        name: '請求書発行',
        projectId: 'project-123',
        breadcrumb: [],
      };

      expect(location.type).toBe('bt');
      expect(Array.isArray(location.breadcrumb)).toBe(true);
    });

    it("breadcrumbは文字列の配列", () => {
      const breadcrumb: string[] = ['BD-AR', 'BT-AR-0001'];

      expect(Array.isArray(breadcrumb)).toBe(true);
      expect(breadcrumb.every((item) => typeof item === 'string')).toBe(true);
    });
  });
});
