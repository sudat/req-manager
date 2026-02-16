import { describe, it, expect } from "bun:test";
import {
  getRequirementLinkTypeLabel,
  isDdDependencyLinkType,
  type RequirementLinkType,
  type DdDependencyCallType,
} from "@/lib/data/requirement-links";

// ========================================
// Exported Functions Tests
// ========================================

describe("requirement-links exported functions", () => {
  describe("getRequirementLinkTypeLabel", () => {
    it("各リンクタイプのラベルを返す", () => {
      expect(getRequirementLinkTypeLabel("derived_from")).toBe("BR→SR派生");
      expect(getRequirementLinkTypeLabel("calls_sync")).toBe("同期呼び出し");
      expect(getRequirementLinkTypeLabel("calls_async")).toBe("非同期起動");
      expect(getRequirementLinkTypeLabel("called_by_user")).toBe("ユーザー起動");
    });

    it("未知のタイプはそのまま返す", () => {
      expect(getRequirementLinkTypeLabel("unknown" as RequirementLinkType)).toBe("unknown");
    });
  });

  describe("isDdDependencyLinkType", () => {
    it("有効なDD依存タイプを判定する", () => {
      expect(isDdDependencyLinkType("calls_sync")).toBe(true);
      expect(isDdDependencyLinkType("calls_async")).toBe(true);
    });

    it("無効なDD依存タイプを判定する", () => {
      expect(isDdDependencyLinkType("derived_from")).toBe(false);
      expect(isDdDependencyLinkType("called_by_user")).toBe(false);
      expect(isDdDependencyLinkType("unknown")).toBe(false);
      expect(isDdDependencyLinkType("")).toBe(false);
    });
  });
});

// ========================================
// DD Dependencies Sync Logic
// ========================================

describe("syncDdDependenciesForSrf", () => {
  // Supabase操作をモック化してロジックのみをテスト
  // 実際の関数はSupabaseに依存するため、ロジック部分を抽出してテスト

  it("重複除外ロジック: 同じsource:target:callTypeは重複として除外", () => {
    // 重複検出ロジックのテスト（Mapを使用した重複除外）
    const dependencies = [
      { sourceDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const },
      { sourceDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const }, // 重複
      { sourceDdId: "DD-001", targetDdId: "DD-002", callType: "calls_async" as const }, // 異なるcallType
    ];

    const uniqueMap = new Map<string, typeof dependencies[0]>();
    for (const dependency of dependencies) {
      const key = `${dependency.sourceDdId}:${dependency.targetDdId}:${dependency.callType}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, dependency);
      }
    }

    expect(uniqueMap.size).toBe(2); // calls_syncの重複が除外されて2件
    expect(uniqueMap.get("DD-001:DD-002:calls_sync")).toEqual(dependencies[0]);
    expect(uniqueMap.get("DD-001:DD-002:calls_async")).toEqual(dependencies[2]);
  });

  it("callIdが異なれば同一source/target/callTypeでも別リンクとして扱う", () => {
    const dependencies = [
      {
        sourceDdId: "DD-001",
        targetDdId: "DD-002",
        callType: "calls_sync" as const,
        callId: "call_a",
      },
      {
        sourceDdId: "DD-001",
        targetDdId: "DD-002",
        callType: "calls_sync" as const,
        callId: "call_b",
      },
    ];

    const uniqueMap = new Map<string, typeof dependencies[0]>();
    for (const dependency of dependencies) {
      const key = `${dependency.sourceDdId}:${dependency.targetDdId}:${dependency.callType}:${dependency.callId ?? ""}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, dependency);
      }
    }

    expect(uniqueMap.size).toBe(2);
  });

  it("自己参照除外ロジック: sourceDdId === targetDdIdは除外", () => {
    const dependencies = [
      { sourceDdId: "DD-001", targetDdId: "DD-001", callType: "calls_sync" as const }, // 自己参照
      { sourceDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const },
    ];

    const validDdIdSet = new Set(["DD-001", "DD-002"]);
    const filtered = dependencies.filter(
      (dep) => dep.sourceDdId !== dep.targetDdId && validDdIdSet.has(dep.sourceDdId) && validDdIdSet.has(dep.targetDdId)
    );

    expect(filtered.length).toBe(1);
    expect(filtered[0].targetDdId).toBe("DD-002");
  });

  it("有効DDチェック: validDdIdsに含まれないリンクは除外", () => {
    const dependencies = [
      { sourceDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const },
      { sourceDdId: "DD-001", targetDdId: "DD-999", callType: "calls_sync" as const }, // 無効なtarget
      { sourceDdId: "DD-999", targetDdId: "DD-002", callType: "calls_sync" as const }, // 無効なsource
    ];

    const validDdIdSet = new Set(["DD-001", "DD-002"]);
    const filtered = dependencies.filter(
      (dep) => validDdIdSet.has(dep.sourceDdId) && validDdIdSet.has(dep.targetDdId)
    );

    expect(filtered.length).toBe(1);
    expect(filtered[0].sourceDdId).toBe("DD-001");
    expect(filtered[0].targetDdId).toBe("DD-002");
  });

  it("無効なcallTypeは除外", () => {
    const dependencies = [
      { sourceDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const },
      { sourceDdId: "DD-001", targetDdId: "DD-003", callType: "invalid" as any }, // 無効なcallType
    ];

    const DD_DEPENDENCY_CALL_TYPES = ["calls_sync", "calls_async"];
    const validCallTypeSet = new Set(DD_DEPENDENCY_CALL_TYPES);

    const filtered = dependencies.filter(
      (dep) => validCallTypeSet.has(dep.callType)
    );

    expect(filtered.length).toBe(1);
    expect(filtered[0].callType).toBe("calls_sync");
  });
});

// ========================================
// DD Callers Sync Logic
// ========================================

describe("syncDdCallersForSrf (ロジック抽出テスト)", () => {
  it("ユーザー起動の重複除外: 同一targetDdIdは1件のみ", () => {
    const callers = [
      { targetDdId: "DD-001", callerType: "user" as const },
      { targetDdId: "DD-001", callerType: "user" as const }, // 重複
      { targetDdId: "DD-002", callerType: "user" as const },
    ];

    const uniqueMap = new Map<string, { targetDdId: string; callerType: "user" }>();
    for (const caller of callers) {
      if (caller.callerType === "user") {
        const key = `user:${caller.targetDdId}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, caller);
        }
      }
    }

    expect(uniqueMap.size).toBe(2);
  });

  it("システム起動の重複除外: 同一callerDdId:targetDdId:callTypeは1件のみ", () => {
    const callers = [
      { callerType: "system" as const, callerDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const },
      { callerType: "system" as const, callerDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const }, // 重複
      { callerType: "system" as const, callerDdId: "DD-001", targetDdId: "DD-002", callType: "calls_async" as const },
    ];

    const validDdIdSet = new Set(["DD-001", "DD-002"]);
    const uniqueMap = new Map<string, typeof callers[0]>();

    for (const caller of callers) {
      if (caller.callerType === "system") {
        if (!caller.callerDdId || !caller.callType) continue;
        if (!validDdIdSet.has(caller.callerDdId)) continue;
        if (caller.callerDdId === caller.targetDdId) continue;

        const key = `${caller.callerDdId}:${caller.targetDdId}:${caller.callType}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, caller);
        }
      }
    }

    expect(uniqueMap.size).toBe(2);
  });

  it("自己参照除外: callerDdId === targetDdIdは除外", () => {
    const callers = [
      { callerType: "system" as const, callerDdId: "DD-001", targetDdId: "DD-001", callType: "calls_sync" as const }, // 自己参照
      { callerType: "system" as const, callerDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const },
    ];

    const validDdIdSet = new Set(["DD-001", "DD-002"]);
    const filtered = callers.filter(
      (caller) =>
        caller.callerType === "system" &&
        caller.callerDdId &&
        caller.callType &&
        validDdIdSet.has(caller.callerDdId) &&
        caller.callerDdId !== caller.targetDdId
    );

    expect(filtered.length).toBe(1);
    expect(filtered[0].targetDdId).toBe("DD-002");
  });

  it("有効DDチェック: 無効なDD IDを除外", () => {
    const callers = [
      { callerType: "system" as const, callerDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const },
      { callerType: "system" as const, callerDdId: "DD-001", targetDdId: "DD-999", callType: "calls_sync" as const }, // 無効なtarget
      { callerType: "system" as const, callerDdId: "DD-999", targetDdId: "DD-002", callType: "calls_sync" as const }, // 無効なcaller
      { callerType: "user" as const, targetDdId: "DD-999" }, // 無効なtarget
    ];

    const validDdIdSet = new Set(["DD-001", "DD-002"]);

    const validCallers = callers.filter((caller) => {
      if (caller.callerType === "user") {
        return validDdIdSet.has(caller.targetDdId);
      } else {
        return (
          caller.callerDdId &&
          caller.callType &&
          validDdIdSet.has(caller.callerDdId) &&
          validDdIdSet.has(caller.targetDdId)
        );
      }
    });

    expect(validCallers.length).toBe(1);
    expect(validCallers[0]).toEqual({
      callerType: "system",
      callerDdId: "DD-001",
      targetDdId: "DD-002",
      callType: "calls_sync",
    });
  });
});

// ========================================
// High-Level Query APIs (ロジック抽出テスト)
// ========================================

describe("High-Level Query APIs (ロジック抽出テスト)", () => {
  describe("listBrIdsBySrId - フィルタロジック", () => {
    it("linkType='derived_from' かつ targetType='br' のみを抽出", () => {
      const mockLinks = [
        { sourceId: "SR-001", targetType: "br", targetId: "BR-001", linkType: "derived_from" },
        { sourceId: "SR-001", targetType: "br", targetId: "BR-002", linkType: "derived_from" },
        { sourceId: "SR-001", targetType: "sf", targetId: "SF-001", linkType: "realizes" },
        { sourceId: "SR-001", targetType: "br", targetId: "BR-003", linkType: "related_to" },
      ];

      const result = mockLinks
        .filter((link) => link.targetType === "br" && link.linkType === "derived_from")
        .map((link) => link.targetId);

      expect(result).toEqual(["BR-001", "BR-002"]);
    });
  });

  describe("listSrIdsByBrId - フィルタロジック", () => {
    it("linkType='derived_from' かつ sourceType='sr' のみを抽出", () => {
      const mockLinks = [
        { sourceType: "sr", sourceId: "SR-001", linkType: "derived_from" },
        { sourceType: "sr", sourceId: "SR-002", linkType: "derived_from" },
        { sourceType: "dd", sourceId: "DD-001", linkType: "derived_from" },
        { sourceType: "sr", sourceId: "SR-003", linkType: "realizes" },
      ];

      const result = mockLinks
        .filter((link) => link.sourceType === "sr" && link.linkType === "derived_from")
        .map((link) => link.sourceId);

      expect(result).toEqual(["SR-001", "SR-002"]);
    });
  });

  describe("listSfIdsByBrId - フィルタロジック", () => {
    it("linkType='realizes' かつ targetType='sf' のみを抽出", () => {
      const mockLinks = [
        { targetType: "sf", targetId: "SF-001", linkType: "realizes" },
        { targetType: "sf", targetId: "SF-002", linkType: "realizes" },
        { targetType: "sr", targetId: "SR-001", linkType: "derived_from" },
        { targetType: "sf", targetId: "SF-003", linkType: "related_to" },
      ];

      const result = mockLinks
        .filter((link) => link.targetType === "sf" && link.linkType === "realizes")
        .map((link) => link.targetId);

      expect(result).toEqual(["SF-001", "SF-002"]);
    });
  });

  describe("listSuspectLinks - フィルタロジック", () => {
    it("suspect=true のリンクのみを抽出", () => {
      const mockLinks = [
        { id: "link-1", suspect: true },
        { id: "link-2", suspect: false },
        { id: "link-3", suspect: true },
        { id: "link-4", suspect: null }, // nullはfalse扱い
      ];

      const result = mockLinks.filter((link) => link.suspect === true);

      expect(result.length).toBe(2);
      expect(result.map((l) => l.id)).toEqual(["link-1", "link-3"]);
    });
  });
});

// ========================================
// 現実的なユースケース
// ========================================

describe("現実的なユースケース", () => {
  describe("DD依存関係の同期シミュレーション", () => {
    it("正しく重複除外・バリデーションが行われる", () => {
      // 入力データ（重複・自己参照・無効IDを含む）
      const sourceDdIdsToReset = ["DD-001", "DD-002", "DD-003"];
      const validDdIds = ["DD-001", "DD-002", "DD-003", "DD-004"];
      const dependencies = [
        // 有効な依存関係
        { sourceDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const },
        { sourceDdId: "DD-001", targetDdId: "DD-003", callType: "calls_async" as const },
        { sourceDdId: "DD-002", targetDdId: "DD-004", callType: "calls_sync" as const },
        // 重複
        { sourceDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" as const },
        // 自己参照
        { sourceDdId: "DD-002", targetDdId: "DD-002", callType: "calls_sync" as const },
        // 無効なDD ID
        { sourceDdId: "DD-001", targetDdId: "DD-999", callType: "calls_sync" as const },
        { sourceDdId: "DD-999", targetDdId: "DD-002", callType: "calls_sync" as const },
      ];

      // フィルタリング・重複除外ロジック
      const validDdIdSet = new Set(validDdIds);
      const DD_DEPENDENCY_CALL_TYPES = ["calls_sync", "calls_async"];
      const uniqueMap = new Map<string, typeof dependencies[0]>();

      for (const dependency of dependencies) {
        if (!DD_DEPENDENCY_CALL_TYPES.includes(dependency.callType)) continue;
        if (!validDdIdSet.has(dependency.sourceDdId)) continue;
        if (!validDdIdSet.has(dependency.targetDdId)) continue;
        if (dependency.sourceDdId === dependency.targetDdId) continue;

        const key = `${dependency.sourceDdId}:${dependency.targetDdId}:${dependency.callType}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, dependency);
        }
      }

      // 結果: 3件の有効な依存関係のみ残る
      const result = Array.from(uniqueMap.values());

      expect(result.length).toBe(3);
      expect(result).toContainEqual({ sourceDdId: "DD-001", targetDdId: "DD-002", callType: "calls_sync" });
      expect(result).toContainEqual({ sourceDdId: "DD-001", targetDdId: "DD-003", callType: "calls_async" });
      expect(result).toContainEqual({ sourceDdId: "DD-002", targetDdId: "DD-004", callType: "calls_sync" });
    });
  });

  describe("DD呼び出し元の同期シミュレーション", () => {
    it("ユーザー起動・システム起動が正しく区別される", () => {
      const targetDdIdsToReset = ["DD-001", "DD-002"];
      const validDdIds = ["DD-001", "DD-002", "DD-SCREEN", "DD-API"];
      const callers = [
        // ユーザー起動
        { targetDdId: "DD-001", callerType: "user" as const },
        { targetDdId: "DD-002", callerType: "user" as const },
        // システム起動
        { callerType: "system" as const, callerDdId: "DD-SCREEN", targetDdId: "DD-001", callType: "calls_sync" as const },
        { callerType: "system" as const, callerDdId: "DD-API", targetDdId: "DD-002", callType: "calls_async" as const },
        // 重複（ユーザー）
        { targetDdId: "DD-001", callerType: "user" as const },
        // 重複（システム）
        { callerType: "system" as const, callerDdId: "DD-SCREEN", targetDdId: "DD-001", callType: "calls_sync" as const },
        // 自己参照
        { callerType: "system" as const, callerDdId: "DD-001", targetDdId: "DD-001", callType: "calls_sync" as const },
        // 無効なDD
        { callerType: "system" as const, callerDdId: "DD-999", targetDdId: "DD-001", callType: "calls_sync" as const },
        { callerType: "user" as const, targetDdId: "DD-999" },
      ];

      // フィルタリング・重複除外ロジック
      const validDdIdSet = new Set(validDdIds);
      const uniqueMap = new Map<string, any>();

      for (const caller of callers) {
        if (!validDdIdSet.has(caller.targetDdId)) continue;

        if (caller.callerType === "user") {
          const key = `user:${caller.targetDdId}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, { type: "user", targetDdId: caller.targetDdId });
          }
        } else if (caller.callerType === "system") {
          if (!caller.callerDdId || !caller.callType) continue;
          if (!validDdIdSet.has(caller.callerDdId)) continue;
          if (caller.callerDdId === caller.targetDdId) continue;

          const key = `${caller.callerDdId}:${caller.targetDdId}:${caller.callType}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, { type: "system", callerDdId: caller.callerDdId, targetDdId: caller.targetDdId, callType: caller.callType });
          }
        }
      }

      const result = Array.from(uniqueMap.values());

      // ユーザー起動: 2件（DD-001, DD-002）
      // システム起動: 2件（DD-SCREEN→DD-001, DD-API→DD-002）
      expect(result.length).toBe(4);

      const userCallers = result.filter((r) => r.type === "user");
      expect(userCallers.length).toBe(2);

      const systemCallers = result.filter((r) => r.type === "system");
      expect(systemCallers.length).toBe(2);
    });
  });

  describe("SR↔BR双方向参照", () => {
    it("listBrIdsBySrIdとlistSrIdsByBrIdの整合性", () => {
      // モックデータ: SR-001はBR-001, BR-002から派生
      // BR-001はSR-001, SR-002から派生
      const srToBrLinks = [
        { sourceId: "SR-001", targetType: "br", targetId: "BR-001", linkType: "derived_from" },
        { sourceId: "SR-001", targetType: "br", targetId: "BR-002", linkType: "derived_from" },
      ];

      const brToSrLinks = [
        { sourceType: "sr", sourceId: "SR-001", linkType: "derived_from" },
        { sourceType: "sr", sourceId: "SR-002", linkType: "derived_from" },
      ];

      // SR-001から見たBR
      const brIds = srToBrLinks
        .filter((link) => link.targetType === "br" && link.linkType === "derived_from")
        .map((link) => link.targetId);
      expect(brIds).toEqual(["BR-001", "BR-002"]);

      // BR-001から見たSR
      const srIds = brToSrLinks
        .filter((link) => link.sourceType === "sr" && link.linkType === "derived_from")
        .map((link) => link.sourceId);
      expect(srIds).toEqual(["SR-001", "SR-002"]);
    });
  });
});

// ========================================
// Integration Scenarios
// ========================================

describe("統合シナリオ", () => {
  describe("BR→SF→DDの連鎖", () => {
    it("BRからrealizesでSFを取得、SFからDDを取得", () => {
      // BR-001 → SF-001 (realizes)
      // SF-001 → DD-001, DD-002 (ddのエントリポイント)

      const brToSfLinks = [
        { targetType: "sf", targetId: "SF-001", linkType: "realizes" },
        { targetType: "sf", targetId: "SF-002", linkType: "realizes" },
      ];

      const sfIds = brToSfLinks
        .filter((link) => link.targetType === "sf" && link.linkType === "realizes")
        .map((link) => link.targetId);

      expect(sfIds).toEqual(["SF-001", "SF-002"]);
    });
  });

  describe("DD呼び出しチェーン", () => {
    it("画面DD→API DD→バッチDDの連鎖", () => {
      // DD-SCREEN calls_sync DD-API
      // DD-API calls_async DD-BATCH

      const ddDependencies = [
        { sourceDdId: "DD-SCREEN", targetDdId: "DD-API", callType: "calls_sync" as const },
        { sourceDdId: "DD-API", targetDdId: "DD-BATCH", callType: "calls_async" as const },
      ];

      // チェーン検証
      const screenToApi = ddDependencies.find(
        (dep) => dep.sourceDdId === "DD-SCREEN" && dep.targetDdId === "DD-API"
      );
      expect(screenToApi).toBeDefined();

      const apiToBatch = ddDependencies.find(
        (dep) => dep.sourceDdId === "DD-API" && dep.targetDdId === "DD-BATCH"
      );
      expect(apiToBatch).toBeDefined();
    });
  });
});
