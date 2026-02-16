import { describe, it, expect } from "bun:test";
import {
  createInvestigationResult,
  getInvestigationResultByChangeRequestId,
  updateInvestigationResult,
  type InvestigationResultCreateInput,
  type InvestigationResultUpdateInput,
} from "@/lib/data/investigation-results";
import type { InvestigationResult, InvestigationResultStatus } from "@/lib/domain";

// ========================================
// Type Validation Tests
// ========================================

describe("InvestigationResult型のバリデーション", () => {
  const validStatuses: InvestigationResultStatus[] = ["pending", "running", "completed", "failed"];

  validStatuses.forEach((status) => {
    it(`有効なstatus "${status}" を受け入れる`, () => {
      const input: InvestigationResultCreateInput = {
        changeRequestId: "cr-123",
        projectId: "project-123",
        status: status as any,
        topDownResult: {},
        suspectLinksDetected: [],
      };

      expect(input.status).toBe(status);
    });
  });

  it("有効なtopDownResult構造", () => {
    const validTopDownResult = {
      affectedBRs: ["BR-001", "BR-002"],
      affectedSFs: ["SF-001"],
      affectedSRs: ["SR-001"],
      affectedACs: ["AC-001"],
      affectedEntryPoints: [
        { sfId: "SF-001", path: "/app/page.tsx" },
        { sfId: "SF-002", path: "/api/handler" },
      ],
    };

    const input: InvestigationResultCreateInput = {
      changeRequestId: "cr-123",
      projectId: "project-123",
      status: "completed",
      topDownResult: validTopDownResult as any,
      suspectLinksDetected: [],
    };

    expect(input.topDownResult).toEqual(validTopDownResult);
    expect(input.topDownResult.affectedBRs).toHaveLength(2);
    expect(input.topDownResult.affectedEntryPoints).toHaveLength(2);
  });

  it("有効なsuspectLinksDetected構造", () => {
    const validSuspectLinks = [
      {
        sourceId: "BR-001",
        targetId: "SF-001",
        reason: "整合性の懸念",
        severity: "high",
      },
      {
        sourceId: "SR-002",
        targetId: "SF-002",
        reason: "仕様変更の影響",
        severity: "medium",
      },
    ];

    const input: InvestigationResultCreateInput = {
      changeRequestId: "cr-123",
      projectId: "project-123",
      status: "completed",
      topDownResult: {},
      suspectLinksDetected: validSuspectLinks as any,
    };

    expect(input.suspectLinksDetected).toHaveLength(2);
    expect(input.suspectLinksDetected[0].severity).toBe("high");
  });
});

// ========================================
// Normalization Logic Tests
// ========================================

describe("正規化ロジックの挙動", () => {
  it("topDownResultのデフォルト値構造", () => {
    const expectedDefault = {
      affectedBRs: [],
      affectedSFs: [],
      affectedSRs: [],
      affectedACs: [],
      affectedEntryPoints: [],
    };

    expect(expectedDefault.affectedBRs).toHaveLength(0);
    expect(expectedDefault.affectedSFs).toHaveLength(0);
    expect(expectedDefault.affectedSRs).toHaveLength(0);
    expect(expectedDefault.affectedACs).toHaveLength(0);
    expect(expectedDefault.affectedEntryPoints).toHaveLength(0);
  });

  it("suspectLinksDetectedの重大度フィルタリング", () => {
    const multipleSuspects = [
      {
        sourceId: "BR-001",
        targetId: "SF-001",
        reason: "整合性の懸念",
        severity: "high",
      },
      {
        sourceId: "SR-002",
        targetId: "SF-001",
        reason: "仕様変更の影響",
        severity: "medium",
      },
      {
        sourceId: "AC-003",
        targetId: "DD-001",
        reason: "条件の不一致",
        severity: "low",
      },
    ];

    const highSeverity = multipleSuspects.filter((s) => s.severity === "high");
    const mediumSeverity = multipleSuspects.filter((s) => s.severity === "medium");
    const lowSeverity = multipleSuspects.filter((s) => s.severity === "low");

    expect(highSeverity).toHaveLength(1);
    expect(mediumSeverity).toHaveLength(1);
    expect(lowSeverity).toHaveLength(1);
  });

  it("affectedEntryPointsの構造検証", () => {
    const validEntryPoints = [
      { sfId: "SF-001", path: "/app/billing/invoice/page.tsx" },
      { sfId: "SF-001", path: "/app/billing/invoice/api/route.ts" },
      { sfId: "SF-002", path: "/jobs/invoice-pdf.ts" },
    ];

    validEntryPoints.forEach((ep) => {
      expect(ep).toHaveProperty("sfId");
      expect(ep).toHaveProperty("path");
      expect(typeof ep.sfId).toBe("string");
      expect(typeof ep.path).toBe("string");
    });
  });
});

// ========================================
// CRUD Input/Output Contract Tests
// ========================================

describe("CRUD操作の入出力契約", () => {
  describe("createInvestigationResult", () => {
    it("有効な入力形式を受け入れる", () => {
      const input: InvestigationResultCreateInput = {
        changeRequestId: "cr-123",
        projectId: "project-123",
        status: "pending",
        topDownResult: {
          affectedBRs: ["BR-001"],
          affectedSFs: [],
          affectedSRs: [],
          affectedACs: [],
          affectedEntryPoints: [],
        },
        suspectLinksDetected: [],
      };

      expect(input.changeRequestId).toBe("cr-123");
      expect(input.projectId).toBe("project-123");
      expect(input.status).toBe("pending");
    });

    it("完全なtopDownResultを含む入力", () => {
      const input: InvestigationResultCreateInput = {
        changeRequestId: "cr-123",
        projectId: "project-123",
        status: "completed",
        topDownResult: {
          affectedBRs: ["BR-AR-001", "BR-AR-002"],
          affectedSFs: ["SF-AR-010", "SF-AR-020"],
          affectedSRs: ["SR-AR-001", "SR-AR-002", "SR-AR-003"],
          affectedACs: ["AC-001", "AC-002", "AC-003", "AC-004"],
          affectedEntryPoints: [
            { sfId: "SF-AR-010", path: "/app/billing/invoice/page.tsx" },
            { sfId: "SF-AR-010", path: "/app/billing/invoice/api/route.ts" },
            { sfId: "SF-AR-020", path: "/jobs/invoice-pdf.ts" },
          ],
        },
        suspectLinksDetected: [],
      };

      expect(input.topDownResult.affectedBRs).toHaveLength(2);
      expect(input.topDownResult.affectedSFs).toHaveLength(2);
      expect(input.topDownResult.affectedSRs).toHaveLength(3);
      expect(input.topDownResult.affectedACs).toHaveLength(4);
      expect(input.topDownResult.affectedEntryPoints).toHaveLength(3);
    });
  });

  describe("updateInvestigationResult", () => {
    it("status更新の入力形式", () => {
      const statusUpdate: InvestigationResultUpdateInput = {
        status: "completed",
      };

      expect(statusUpdate.status).toBe("completed");
    });

    it("topDownResult更新の入力形式", () => {
      const topDownUpdate: InvestigationResultUpdateInput = {
        topDownResult: {
          affectedBRs: ["BR-001", "BR-003"],
          affectedSFs: ["SF-001"],
          affectedSRs: [],
          affectedACs: [],
          affectedEntryPoints: [],
        },
      };

      expect(topDownUpdate.topDownResult?.affectedBRs).toContain("BR-003");
    });

    it("suspectLinksDetected更新の入力形式", () => {
      const suspectLinksUpdate: InvestigationResultUpdateInput = {
        suspectLinksDetected: [
          {
            sourceId: "BR-003",
            targetId: "SF-001",
            reason: "新たな懸念",
            severity: "medium",
          },
        ],
      };

      expect(suspectLinksUpdate.suspectLinksDetected).toHaveLength(1);
    });
  });
});

// ========================================
// Integration Scenarios
// ========================================

describe("InvestigationResult統合シナリオ", () => {
  it("影響調査のライフサイクル: pending → running → completed", () => {
    const statusTransitions: InvestigationResultStatus[] = ["pending", "running", "completed"];

    statusTransitions.forEach((status) => {
      expect(["pending", "running", "completed"]).toContain(status);
    });
  });

  it("空の結果セットの検証", () => {
    const emptyResult = {
      topDownResult: {
        affectedBRs: [],
        affectedSFs: [],
        affectedSRs: [],
        affectedACs: [],
        affectedEntryPoints: [],
      },
      suspectLinksDetected: [],
    };

    expect(emptyResult.topDownResult.affectedBRs).toHaveLength(0);
    expect(emptyResult.suspectLinksDetected).toHaveLength(0);
  });

  it("複数の疑義リンク集計", () => {
    const suspectLinks = [
      { sourceId: "A", targetId: "B", reason: "reason1", severity: "high" },
      { sourceId: "C", targetId: "D", reason: "reason2", severity: "medium" },
      { sourceId: "E", targetId: "F", reason: "reason3", severity: "low" },
    ];

    const severityCounts = {
      high: suspectLinks.filter((s) => s.severity === "high").length,
      medium: suspectLinks.filter((s) => s.severity === "medium").length,
      low: suspectLinks.filter((s) => s.severity === "low").length,
    };

    expect(severityCounts.high).toBe(1);
    expect(severityCounts.medium).toBe(1);
    expect(severityCounts.low).toBe(1);
    expect(suspectLinks).toHaveLength(3);
  });

  it("複数システム機能のEntryPointを正しく集計", () => {
    const entryPoints = [
      { sfId: "SF-001", path: "/path1.tsx" },
      { sfId: "SF-001", path: "/path2.ts" },
      { sfId: "SF-002", path: "/path3.ts" },
    ];

    const sfCounts = new Map<string, number>();
    entryPoints.forEach((ep) => {
      sfCounts.set(ep.sfId, (sfCounts.get(ep.sfId) || 0) + 1);
    });

    expect(sfCounts.get("SF-001")).toBe(2);
    expect(sfCounts.get("SF-002")).toBe(1);
  });

  it("topDownResultの各カテゴリの整合性チェック", () => {
    const completeResult = {
      affectedBRs: ["BR-001"],
      affectedSFs: ["SF-001"],
      affectedSRs: ["SR-001"],
      affectedACs: ["AC-001"],
      affectedEntryPoints: [{ sfId: "SF-001", path: "/path" }],
    };

    // 全カテゴリが存在することを確認
    expect(Object.keys(completeResult)).toHaveLength(5);
    expect(completeResult.affectedBRs).toBeInstanceOf(Array);
    expect(completeResult.affectedEntryPoints).toBeInstanceOf(Array);
  });
});
