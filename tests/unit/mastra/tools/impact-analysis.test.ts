import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: impact-analysis Tool
// ========================================

/**
 * 影響範囲からBR IDを抽出するロジック
 */
function extractBrIdsFromImpactScopes(impactScopes: Array<{ targetType: string; targetId: string }>): string[] {
  return (impactScopes ?? [])
    .filter((s) => s.targetType === "business_requirement")
    .map((s) => s.targetId);
}

/**
 * 疑義リンクのフィルタリングロジック
 * targetRequirementIdsに含まれるリンクのみを抽出
 */
function filterSuspectLinks(
  suspectLinks: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    sourceType: string;
    targetType: string;
    linkType: string;
    suspectReason: string | null;
  }>,
  targetRequirementIds: Set<string>
): typeof suspectLinks {
  return suspectLinks.filter(
    (link) =>
      targetRequirementIds.has(link.sourceId) ||
      targetRequirementIds.has(link.targetId)
  );
}

/**
 * エントリポイントの収集ロジック（重複除外なし）
 */
function collectEntryPoints(
  designDocuments: Array<{
    id: string;
    entryPoints: Array<{ path: string }>;
  }>
): Array<{ sfId: string; path: string }> {
  const entryPoints: Array<{ sfId: string; path: string }> = [];

  for (const dd of designDocuments ?? []) {
    const sfId = dd.id;
    for (const ep of dd.entryPoints ?? []) {
      entryPoints.push({ sfId, path: ep.path });
    }
  }

  return entryPoints;
}

// ========================================
// Test Suites
// ========================================

describe("impact-analysis Tool ロジック抽出テスト", () => {
  describe("extractBrIdsFromImpactScopes", () => {
    it("business_requirementのみを抽出", () => {
      const impactScopes = [
        { targetType: "business_requirement", targetId: "BR-001" },
        { targetType: "system_function", targetId: "SF-001" },
        { targetType: "business_requirement", targetId: "BR-002" },
        { targetType: "system_requirement", targetId: "SR-001" },
      ];

      const result = extractBrIdsFromImpactScopes(impactScopes);

      expect(result).toEqual(["BR-001", "BR-002"]);
    });

    it("空配列の場合は空配列を返す", () => {
      const result = extractBrIdsFromImpactScopes([]);
      expect(result).toEqual([]);
    });

    it("undefinedの場合は空配列として扱う", () => {
      const result = extractBrIdsFromImpactScopes(undefined as any);
      expect(result).toEqual([]);
    });

    it("重複するBRは重複して含まれる", () => {
      const impactScopes = [
        { targetType: "business_requirement", targetId: "BR-001" },
        { targetType: "business_requirement", targetId: "BR-001" }, // 重複
      ];

      const result = extractBrIdsFromImpactScopes(impactScopes);

      expect(result).toEqual(["BR-001", "BR-001"]);
    });
  });

  describe("filterSuspectLinks", () => {
    it("ターゲット要件IDに含まれるリンクのみ抽出", () => {
      const suspectLinks = [
        { id: "link-1", sourceId: "BR-001", targetId: "SF-001", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: null },
        { id: "link-2", sourceId: "SR-001", targetId: "AC-001", sourceType: "sr", targetType: "ac", linkType: "derived_from", suspectReason: "test" },
        { id: "link-3", sourceId: "BR-002", targetId: "SF-002", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: null },
        { id: "link-4", sourceId: "SR-002", targetId: "AC-002", sourceType: "sr", targetType: "ac", linkType: "derived_from", suspectReason: null },
      ];

      const targetIds = new Set(["BR-001", "SF-001", "SR-001", "AC-001"]);

      const result = filterSuspectLinks(suspectLinks, targetIds);

      expect(result.length).toBe(2);
      expect(result.map(r => r.id)).toEqual(["link-1", "link-2"]);
    });

    it("sourceIdがターゲットに含まれる場合", () => {
      const suspectLinks = [
        { id: "link-1", sourceId: "BR-001", targetId: "SF-001", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: null },
      ];

      const targetIds = new Set(["BR-001", "SF-001"]);

      const result = filterSuspectLinks(suspectLinks, targetIds);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe("link-1");
    });

    it("targetIdがターゲットに含まれる場合", () => {
      const suspectLinks = [
        { id: "link-1", sourceId: "BR-001", targetId: "SF-001", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: null },
      ];

      const targetIds = new Set(["SF-001"]);

      const result = filterSuspectLinks(suspectLinks, targetIds);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe("link-1");
    });

    it("両方含まれる場合も1件としてカウント", () => {
      const suspectLinks = [
        { id: "link-1", sourceId: "BR-001", targetId: "SF-001", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: null },
      ];

      const targetIds = new Set(["BR-001", "SF-001"]);

      const result = filterSuspectLinks(suspectLinks, targetIds);

      expect(result.length).toBe(1);
    });

    it("ターゲットに含まれないリンクは除外", () => {
      const suspectLinks = [
        { id: "link-1", sourceId: "BR-001", targetId: "SF-001", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: null },
        { id: "link-2", sourceId: "BR-999", targetId: "SF-999", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: null },
      ];

      const targetIds = new Set(["BR-001", "SF-001"]);

      const result = filterSuspectLinks(suspectLinks, targetIds);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe("link-1");
    });

    it("空のターゲットセットの場合は全て除外", () => {
      const suspectLinks = [
        { id: "link-1", sourceId: "BR-001", targetId: "SF-001", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: null },
      ];

      const targetIds = new Set<string>();

      const result = filterSuspectLinks(suspectLinks, targetIds);

      expect(result.length).toBe(0);
    });
  });

  describe("collectEntryPoints", () => {
    it("DDからentryPointsを収集する", () => {
      const designDocuments = [
        {
          id: "DD-001",
          entryPoints: [
            { path: "/app/page1.tsx" },
            { path: "/app/page2.tsx" },
          ],
        },
        {
          id: "DD-002",
          entryPoints: [
            { path: "/api/route.ts" },
          ],
        },
      ];

      const result = collectEntryPoints(designDocuments);

      expect(result.length).toBe(3);
      expect(result).toContainEqual({ sfId: "DD-001", path: "/app/page1.tsx" });
      expect(result).toContainEqual({ sfId: "DD-001", path: "/app/page2.tsx" });
      expect(result).toContainEqual({ sfId: "DD-002", path: "/api/route.ts" });
    });

    it("entryPointsがundefinedの場合は空配列として扱う", () => {
      const designDocuments = [
        { id: "DD-001", entryPoints: undefined as any },
      ];

      const result = collectEntryPoints(designDocuments);

      expect(result).toEqual([]);
    });

    it("空のentryPoints配列の場合は収集しない", () => {
      const designDocuments = [
        { id: "DD-001", entryPoints: [] },
      ];

      const result = collectEntryPoints(designDocuments);

      expect(result).toEqual([]);
    });

    it("designDocumentsがundefinedの場合は空配列として扱う", () => {
      const result = collectEntryPoints(undefined as any);

      expect(result).toEqual([]);
    });
  });
});

// ========================================
// 統合シナリオ
// ========================================

describe("impact-analysis 統合シナリオ", () => {
  describe("トップダウン分析のシミュレーション", () => {
    it("BR-001 → SF-001/SF-002 → SR-001/SR-002 のチェーン", () => {
      // 入力: CRにBR-001が含まれる
      const impactScopes = [
        { targetType: "business_requirement", targetId: "BR-001" },
      ];

      // BR-001 → SF-001, SF-002 (realizesリンク)
      const sfIds = ["SF-001", "SF-002"];

      // SF-001 → SR-001 (requirementIds)
      // SF-002 → SR-002 (requirementIds)
      const sfRequirementIdsMap = new Map<string, string[]>([
        ["SF-001", ["SR-001"]],
        ["SF-002", ["SR-002"]],
      ]);

      const affectedSRIds = new Set<string>();
      for (const sfId of sfIds) {
        const reqIds = sfRequirementIdsMap.get(sfId) ?? [];
        reqIds.forEach((id) => affectedSRIds.add(id));
      }

      const brIds = extractBrIdsFromImpactScopes(impactScopes);
      const targetIds = new Set([...brIds, ...sfIds, ...affectedSRIds]);

      expect(brIds).toEqual(["BR-001"]);
      expect(Array.from(affectedSRIds)).toEqual(["SR-001", "SR-002"]);
      expect(targetIds.has("BR-001")).toBe(true);
      expect(targetIds.has("SF-001")).toBe(true);
      expect(targetIds.has("SF-002")).toBe(true);
      expect(targetIds.has("SR-001")).toBe(true);
      expect(targetIds.has("SR-002")).toBe(true);
    });

    it("複数のBRからSFへの影響が重複する場合", () => {
      // BR-001 → SF-001
      // BR-002 → SF-001
      const brIds = ["BR-001", "BR-002"];
      const sfIds = ["SF-001"];

      const targetIds = new Set([...brIds, ...sfIds]);

      expect(targetIds.size).toBe(3); // BR-001, BR-002, SF-001
    });
  });

  describe("疑義リンク検出のシミュレーション", () => {
    it("BR-001の変更により、BR-001とSF-001間のリンクが疑義となる", () => {
      const suspectLinks = [
        { id: "link-1", sourceId: "BR-001", targetId: "SF-001", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: "SFの仕様変更で整合性が取れなくなる可能性" },
        { id: "link-2", sourceId: "SR-001", targetId: "AC-001", sourceType: "sr", targetType: "ac", linkType: "derived_from", suspectReason: "ACの前提条件が変更された" },
      ];

      // BR-001の変更
      const targetIds = new Set(["BR-001", "SF-001", "SR-001", "AC-001"]);

      const result = filterSuspectLinks(suspectLinks, targetIds);

      expect(result.length).toBe(2);
      expect(result.every(r => r.suspectReason)).toBeDefined();
    });

    it("変更対象外のリンクは除外される", () => {
      const suspectLinks = [
        { id: "link-1", sourceId: "BR-001", targetId: "SF-001", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: null },
        { id: "link-2", sourceId: "BR-999", targetId: "SF-999", sourceType: "br", targetType: "sf", linkType: "realizes", suspectReason: null },
        { id: "link-3", sourceId: "SR-999", targetId: "AC-999", sourceType: "sr", targetType: "ac", linkType: "derived_from", suspectReason: null },
      ];

      const targetIds = new Set(["BR-001", "SF-001"]);

      const result = filterSuspectLinks(suspectLinks, targetIds);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe("link-1");
    });
  });
});

// ========================================
// エッジケース
// ========================================

describe("エッジケース", () => {
  it("大量のimpactScopesを処理するパフォーマンス", () => {
    // 1000件のimpactScopesを生成
    const impactScopes: Array<{ targetType: string; targetId: string }> = [];
    for (let i = 0; i < 1000; i++) {
      if (i % 3 === 0) {
        impactScopes.push({ targetType: "business_requirement", targetId: `BR-${String(i).padStart(4, "0")}` });
      } else if (i % 3 === 1) {
        impactScopes.push({ targetType: "system_function", targetId: `SF-${String(i).padStart(4, "0")}` });
      } else {
        impactScopes.push({ targetType: "system_requirement", targetId: `SR-${String(i).padStart(4, "0")}` });
      }
    }

    const startTime = Date.now();
    const result = extractBrIdsFromImpactScopes(impactScopes);
    const endTime = Date.now();

    // パフォーマンスチェック: 50ms以内で完了（CI環境の影響を考慮）
    expect(endTime - startTime).toBeLessThan(50);

    // business_requirementのみ抽出
    expect(result.length).toBe(Math.ceil(1000 / 3)); // 約333件
  });

  it("大量のsuspectLinksを処理するパフォーマンス", () => {
    // 1000件のsuspectLinksを生成
    const suspectLinks: Array<{
      id: string;
      sourceId: string;
      targetId: string;
      sourceType: string;
      targetType: string;
      linkType: string;
      suspectReason: string | null;
    }> = [];

    for (let i = 0; i < 1000; i++) {
      suspectLinks.push({
        id: `link-${String(i).padStart(4, "0")}`,
        sourceId: `BR-${String(i).padStart(4, "0")}`,
        targetId: `SF-${String(i).padStart(4, "0")}`,
        sourceType: "br",
        targetType: "sf",
        linkType: "realizes",
        suspectReason: i % 2 === 0 ? `reason-${i}` : null,
      });
    }

    const targetIds = new Set(suspectLinks.slice(0, 500).map((l) => l.sourceId));

    const startTime = Date.now();
    const result = filterSuspectLinks(suspectLinks, targetIds);
    const endTime = Date.now();

    // パフォーマンスチェック: 50ms以内で完了（CI環境の影響を考慮）
    expect(endTime - startTime).toBeLessThan(50);

    // 最初の500件のsourceIdがターゲットに含まれる
    expect(result.length).toBe(500);
  });
});
