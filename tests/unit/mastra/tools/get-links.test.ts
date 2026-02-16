import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: get-links Tool
// ========================================

type Link = {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_type: string;
  suspect: boolean;
  direction?: 'from' | 'to';
};

/**
 * directionによるフィルタリングロジック
 */
function shouldIncludeLink(
  direction: 'from' | 'to' | 'both',
  requirementId: string,
  linkSourceId: string,
  linkTargetId: string
): boolean {
  if (direction === 'from') {
    return linkSourceId === requirementId;
  }
  if (direction === 'to') {
    return linkTargetId === requirementId;
  }
  return true; // both
}

/**
 * リンクリストにdirectionプロパティを付加
 */
function addDirectionToLinks(
  links: Link[],
  direction: 'from' | 'to'
): Link[] {
  return links.map((link) => ({
    ...link,
    direction,
  }));
}

/**
 * リンクタイプごとに集計（reduceによるグループ化）
 */
function groupLinksByType(links: Link[]): Record<string, Link[]> {
  return links.reduce((acc: Record<string, Link[]>, link) => {
    const type = link.link_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(link);
    return acc;
  }, {});
}

/**
 * 集計結果からサマリーを生成
 */
function generateSummary(linksByType: Record<string, Link[]>): {
  types: number;
  total: number;
  typeCounts: Record<string, number>;
} {
  const types = Object.keys(linksByType).length;
  const total = linksByType ? Object.values(linksByType).reduce((sum, arr) => sum + arr.length, 0) : 0;
  const typeCounts: Record<string, number> = {};

  for (const [type, linksOfType] of Object.entries(linksByType)) {
    typeCounts[type] = linksOfType.length;
  }

  return { types, total, typeCounts };
}

// ========================================
// Test Suites
// ========================================

describe("get-links Tool ロジック抽出テスト", () => {
  const mockLinks: Link[] = [
    {
      id: 'link-1',
      source_type: 'br',
      source_id: 'BR-AR-0001-0001',
      target_type: 'sf',
      target_id: 'SF-AR-0001',
      link_type: 'realizes',
      suspect: false,
    },
    {
      id: 'link-2',
      source_type: 'sf',
      source_id: 'SF-AR-0001',
      target_type: 'sr',
      target_id: 'SR-AR-0001-0001',
      link_type: 'realizes',
      suspect: false,
    },
    {
      id: 'link-3',
      source_type: 'br',
      source_id: 'BR-AR-0001-0002',
      target_type: 'sf',
      target_id: 'SF-AR-0002',
      link_type: 'realizes',
      suspect: false,
    },
  ];

  describe("shouldIncludeLink", () => {
    it("direction='from'の場合、source_idが一致するリンクのみ", () => {
      expect(shouldIncludeLink('from', 'BR-AR-0001-0001', 'BR-AR-0001-0001', 'SF-AR-0001')).toBe(true);
      expect(shouldIncludeLink('from', 'BR-AR-0001-0001', 'SF-AR-0001', 'SR-AR-0001-0001')).toBe(false);
    });

    it("direction='to'の場合、target_idが一致するリンクのみ", () => {
      expect(shouldIncludeLink('to', 'SF-AR-0001', 'BR-AR-0001-0001', 'SF-AR-0001')).toBe(true);
      expect(shouldIncludeLink('to', 'SF-AR-0001', 'BR-AR-0001-0001', 'SR-AR-0001-0001')).toBe(false);
    });

    it("direction='both'の場合、全てのリンクを含む", () => {
      expect(shouldIncludeLink('both', 'BR-AR-0001-0001', 'BR-AR-0001-0001', 'SF-AR-0001')).toBe(true);
      expect(shouldIncludeLink('both', 'SF-AR-0001', 'BR-AR-0001-0001', 'SF-AR-0001')).toBe(true);
    });
  });

  describe("addDirectionToLinks", () => {
    it("fromリンクにdirectionプロパティを追加", () => {
      const links: Link[] = [
        { id: '1', source_type: 'br', source_id: 'BR-001', target_type: 'sf', target_id: 'SF-001', link_type: 'realizes', suspect: false },
      ];
      const result = addDirectionToLinks(links, 'from');
      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('from');
    });

    it("toリンクにdirectionプロパティを追加", () => {
      const links: Link[] = [
        { id: '1', source_type: 'br', source_id: 'BR-001', target_type: 'sf', target_id: 'SF-001', link_type: 'realizes', suspect: false },
      ];
      const result = addDirectionToLinks(links, 'to');
      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('to');
    });

    it("元のオブジェクトクトを変更せず新しいプロパティを追加", () => {
      const original: Link = { id: '1', source_type: 'br', source_id: 'BR-001', target_type: 'sf', target_id: 'SF-001', link_type: 'realizes', suspect: false };
      const result = addDirectionToLinks([original], 'from');

      expect(result[0]).not.toBe(original);
      expect(result[0].direction).toBe('from');
      expect(original.direction).toBeUndefined();
    });
  });

  describe("groupLinksByType", () => {
    it("link_typeごとにグループ化", () => {
      const links: Link[] = [
        { ...mockLinks[0], link_type: 'realizes' },
        { ...mockLinks[1], link_type: 'realizes' },
        { ...mockLinks[2], link_type: 'depends_on' },
      ];

      const result = groupLinksByType(links);

      expect(result.realizes).toHaveLength(2);
      expect(result.depends_on).toHaveLength(1);
    });

    it("空配列の場合は空オブジェクト", () => {
      const result = groupLinksByType([]);
      expect(result).toEqual({});
    });

    it("同一link_typeのリンクを全て含む", () => {
      const links: Link[] = [
        { ...mockLinks[0], link_type: 'realizes' },
        { ...mockLinks[1], link_type: 'realizes' },
      ];

      const result = groupLinksByType(links);

      expect(result.realizes).toHaveLength(2);
    });

    it("link_typeが重複しない", () => {
      const links: Link[] = [
        { ...mockLinks[0], link_type: 'realizes' },
        { ...mockLinks[0], link_type: 'realizes' },
      ];

      const result = groupLinksByType(links);

      expect(result.realizes).toHaveLength(2);
    });
  });

  describe("generateSummary", () => {
    it("タイプ数と総数をカウント", () => {
      const linksByType: Record<string, Link[]> = {
        realizes: [mockLinks[0], mockLinks[1]],
        depends_on: [mockLinks[2]],
      };

      const summary = generateSummary(linksByType);

      expect(summary.types).toBe(2);
      expect(summary.total).toBe(3);
      expect(summary.typeCounts).toEqual({ realizes: 2, depends_on: 1 });
    });

    it("空オブジェクトの場合は全て0", () => {
      const summary = generateSummary({});

      expect(summary.types).toBe(0);
      expect(summary.total).toBe(0);
      expect(summary.typeCounts).toEqual({});
    });

    it("単一タイプの場合", () => {
      const linksByType: Record<string, Link[]> = {
        realizes: [mockLinks[0]],
      };

      const summary = generateSummary(linksByType);

      expect(summary.types).toBe(1);
      expect(summary.total).toBe(1);
    });
  });

  describe("統合シナリオ", () => {
    it("direction='from'の完全パス", () => {
      const requirementId = 'BR-AR-0001-0001';
      const filteredLinks = mockLinks.filter((link) =>
        shouldIncludeLink('from', requirementId, link.source_id, link.target_id)
      );

      expect(filteredLinks).toHaveLength(1);
      expect(filteredLinks[0].source_id).toBe('BR-AR-0001-0001');

      const withDirection = addDirectionToLinks(filteredLinks, 'from');
      expect(withDirection[0].direction).toBe('from');
    });

    it("direction='to'の完全パス", () => {
      const requirementId = 'SF-AR-0001';
      const filteredLinks = mockLinks.filter((link) =>
        shouldIncludeLink('to', requirementId, link.source_id, link.target_id)
      );

      expect(filteredLinks).toHaveLength(1);
      expect(filteredLinks[0].target_id).toBe('SF-AR-0001');

      const withDirection = addDirectionToLinks(filteredLinks, 'to');
      expect(withDirection[0].direction).toBe('to');
    });

    it("direction='both'の完全パス", () => {
      const requirementId = 'BR-AR-0001-0001';
      // shouldIncludeLink('both', ...) は常にtrueを返すので全てのリンクが含まれる
      const filteredLinks = mockLinks.filter((link) =>
        shouldIncludeLink('both', requirementId, link.source_id, link.target_id)
      );

      expect(filteredLinks).toHaveLength(3);

      const grouped = groupLinksByType(filteredLinks);
      expect(grouped.realizes).toBeDefined();

      const summary = generateSummary(grouped);
      expect(summary.total).toBe(3);
    });
  });

  describe("エッジケース", () => {
    it("リンクが全くない場合", () => {
      const result = groupLinksByType([]);
      const summary = generateSummary(result);

      expect(summary.types).toBe(0);
      expect(summary.total).toBe(0);
    });

    it("同じsource_idを持つ複数のリンク", () => {
      const sameSourceLinks: Link[] = [
        { ...mockLinks[0] },
        { ...mockLinks[0], id: 'link-1-copy' },
      ];

      const filtered = sameSourceLinks.filter((link) =>
        shouldIncludeLink('from', 'BR-AR-0001-0001', link.source_id, link.target_id)
      );

      expect(filtered).toHaveLength(2);
    });

    it("リンクタイプが1種類のみ", () => {
      const singleTypeLinks: Link[] = [
        { ...mockLinks[0], link_type: 'realizes' },
      ];

      const grouped = groupLinksByType(singleTypeLinks);
      const summary = generateSummary(grouped);

      expect(summary.types).toBe(1);
      expect(summary.total).toBe(1);
      expect(Object.keys(grouped)).toHaveLength(1);
    });
  });
});
