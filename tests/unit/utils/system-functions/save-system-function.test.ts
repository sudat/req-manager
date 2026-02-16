import { describe, it, expect } from "bun:test";
import {
  saveBasicInfo,
  saveSystemRequirements,
  saveDesignDocuments,
  saveSystemFunction,
  collectModelRelationIntegrityIssues,
  type DesignDocumentDraft,
} from "@/lib/utils/system-functions/save-system-function";
import type { SystemFunction, SrfCategory, SrfStatus, EntryPoint, CodeRef, DesignDocument } from "@/lib/domain";
import type { Requirement } from "@/lib/domain/forms";
import type { SystemDesignItemV2 } from "@/lib/domain/schemas/system-design";

// ========================================
// ロジック抽出テスト
// ========================================

/**
 * collectDdDependencyLinksのロジックを抽出したテスト用関数
 * 元の関数と同じロジックを実装
 */
function collectDdDependencyLinks(designDocuments: DesignDocumentDraft[]) {
  const validDdIdSet = new Set(designDocuments.map((dd) => dd.id));
  const uniqueKeys = new Set<string>();
  const dependencies: any[] = [];

  for (const sourceDd of designDocuments) {
    for (const dependency of sourceDd.dependencies ?? []) {
      if (!validDdIdSet.has(sourceDd.id)) continue;
      if (!validDdIdSet.has(dependency.targetDdId)) continue;
      if (sourceDd.id === dependency.targetDdId) continue;

      const key = `${sourceDd.id}:${dependency.targetDdId}:${dependency.callType}`;
      if (uniqueKeys.has(key)) continue;
      uniqueKeys.add(key);

      dependencies.push({
        sourceDdId: sourceDd.id,
        targetDdId: dependency.targetDdId,
        callType: dependency.callType,
      });
    }
  }

  return dependencies;
}

/**
 * collectDdCallerLinksのロジックを抽出したテスト用関数
 */
function collectDdCallerLinks(designDocuments: DesignDocumentDraft[]) {
  const validDdIdSet = new Set(designDocuments.map((dd) => dd.id));
  const uniqueKeys = new Set<string>();
  const callers: any[] = [];

  for (const targetDd of designDocuments) {
    for (const caller of targetDd.callers ?? []) {
      if (!validDdIdSet.has(targetDd.id)) continue;

      if (caller.callerType === "user") {
        const key = `user:${targetDd.id}`;
        if (uniqueKeys.has(key)) continue;
        uniqueKeys.add(key);

        callers.push({
          targetDdId: targetDd.id,
          callerType: "user",
        });
      } else if (caller.callerType === "system") {
        if (!caller.callerDdId || !caller.callType) continue;
        if (caller.callerDdId === targetDd.id) continue;

        const key = `${caller.callerDdId}:${targetDd.id}:${caller.callType}`;
        if (uniqueKeys.has(key)) continue;
        uniqueKeys.add(key);

        callers.push({
          targetDdId: targetDd.id,
          callerType: "system",
          callerDdId: caller.callerDdId,
          callType: caller.callType,
        });
      }
    }
  }

  return callers;
}

// ========================================
// Mock Data Helpers
// ========================================

function createMockDD(id: string, overrides?: Partial<DesignDocumentDraft>): DesignDocumentDraft {
  return {
    id,
    name: `DD-${id}`,
    type: "screen",
    summary: "概要",
    entryPoints: [],
    designPolicy: "",
    structuredSpec: undefined,
    dependencies: [],
    callers: [],
    ...overrides,
  };
}

function createModelDraft(
  id: string,
  entityName: string,
  overrides?: Partial<DesignDocumentDraft["structuredSpec"]>
): DesignDocumentDraft {
  return createMockDD(id, {
    type: "model",
    structuredSpec: {
      version: "1",
      ioType: "model",
      typeDetail: {
        ioType: "model",
        entityName,
        attributes: [
          { name: "id", type: "UUID", primaryKey: true },
        ],
        relationships: [],
      },
      coreLogic: { rules: [] },
      sideEffects: { description: "副作用なし" },
      exceptions: [],
      nonFunctional: {},
      ...overrides,
    },
  });
}

function createStoredModelDd(
  id: string,
  entityName: string,
  attributes: string[]
): DesignDocument {
  return {
    id,
    srfId: "SF-TEST-0001",
    projectId: "00000000-0000-0000-0000-000000000001",
    name: `${entityName}モデル`,
    type: "model",
    summary: "",
    entryPoints: [],
    designPolicy: "",
    details: {
      typeDetail: {
        ioType: "model",
        entityName,
        attributes: attributes.map((name) => ({ name, type: "UUID" })),
        relationships: [],
      },
    },
    createdAt: "2026-02-16T00:00:00.000Z",
    updatedAt: "2026-02-16T00:00:00.000Z",
  };
}

// ========================================
// collectDdDependencyLinks Tests
// ========================================

describe("save-system-function ロジック抽出テスト", () => {
  describe("collectDdDependencyLinks（ロジック抽出）", () => {
    it("空配列の場合は空の依存関係を返す", () => {
      const result = collectDdDependencyLinks([]);
      expect(result).toEqual([]);
    });

    it("有効な依存関係を収集する", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          dependencies: [
            { targetDdId: "DD-002", callType: "calls_sync" as const },
            { targetDdId: "DD-003", callType: "calls_async" as const },
          ],
        }),
        createMockDD("DD-002"),
        createMockDD("DD-003"),
      ];

      const result = collectDdDependencyLinks(designDocuments);

      expect(result.length).toBe(2);
      expect(result).toContainEqual({
        sourceDdId: "DD-001",
        targetDdId: "DD-002",
        callType: "calls_sync",
      });
      expect(result).toContainEqual({
        sourceDdId: "DD-001",
        targetDdId: "DD-003",
        callType: "calls_async",
      });
    });

    it("重複する依存関係を除外する", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          dependencies: [
            { targetDdId: "DD-002", callType: "calls_sync" as const },
            { targetDdId: "DD-002", callType: "calls_sync" as const },
          ],
        }),
        createMockDD("DD-002"),
      ];

      const result = collectDdDependencyLinks(designDocuments);

      expect(result.length).toBe(1);
    });

    it("異なるcallTypeは重複として扱わない", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          dependencies: [
            { targetDdId: "DD-002", callType: "calls_sync" as const },
            { targetDdId: "DD-002", callType: "calls_async" as const },
          ],
        }),
        createMockDD("DD-002"),
      ];

      const result = collectDdDependencyLinks(designDocuments);

      expect(result.length).toBe(2);
    });

    it("自己参照を除外する", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          dependencies: [
            { targetDdId: "DD-001", callType: "calls_sync" as const },
            { targetDdId: "DD-002", callType: "calls_sync" as const },
          ],
        }),
        createMockDD("DD-002"),
      ];

      const result = collectDdDependencyLinks(designDocuments);

      expect(result.length).toBe(1);
      expect(result[0].targetDdId).toBe("DD-002");
    });

    it("無効なtargetDdIdを除外する", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          dependencies: [
            { targetDdId: "DD-002", callType: "calls_sync" as const },
            { targetDdId: "DD-999", callType: "calls_sync" as const },
          ],
        }),
        createMockDD("DD-002"),
      ];

      const result = collectDdDependencyLinks(designDocuments);

      expect(result.length).toBe(1);
      expect(result[0].targetDdId).toBe("DD-002");
    });
  });

  // ========================================
  // collectDdCallerLinks Tests
  // ========================================

  describe("collectDdCallerLinks（ロジック抽出）", () => {
    it("空配列の場合は空の呼び出し元を返す", () => {
      const result = collectDdCallerLinks([]);
      expect(result).toEqual([]);
    });

    it("ユーザー起動の呼び出し元を収集する", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          callers: [
            { callerType: "user" as const },
            { callerType: "user" as const },
          ],
        }),
      ];

      const result = collectDdCallerLinks(designDocuments);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        targetDdId: "DD-001",
        callerType: "user",
      });
    });

    it("システム起動の呼び出し元を収集する", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          callers: [
            { callerType: "system" as const, callerDdId: "DD-002", callType: "calls_sync" as const },
          ],
        }),
        createMockDD("DD-002"),
      ];

      const result = collectDdCallerLinks(designDocuments);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        targetDdId: "DD-001",
        callerType: "system",
        callerDdId: "DD-002",
        callType: "calls_sync",
      });
    });

    it("システム起動の自己参照を除外する", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          callers: [
            { callerType: "system" as const, callerDdId: "DD-001", callType: "calls_sync" as const },
          ],
        }),
      ];

      const result = collectDdCallerLinks(designDocuments);

      expect(result.length).toBe(0);
    });

    it("システム起動でcallerDdId/callTypeがない場合は除外", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          callers: [
            { callerType: "system" as const, callerDdId: undefined as any, callType: "calls_sync" as const },
            { callerType: "system" as const, callerDdId: "DD-002", callType: undefined as any },
          ],
        }),
        createMockDD("DD-002"),
      ];

      const result = collectDdCallerLinks(designDocuments);

      expect(result.length).toBe(0);
    });

    it("ユーザー起動とシステム起動を混在させた場合", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          callers: [
            { callerType: "user" as const },
            { callerType: "system" as const, callerDdId: "DD-002", callType: "calls_sync" as const },
          ],
        }),
        createMockDD("DD-002"),
      ];

      const result = collectDdCallerLinks(designDocuments);

      expect(result.length).toBe(2);
      expect(result.some(r => r.callerType === "user")).toBe(true);
      expect(result.some(r => r.callerType === "system")).toBe(true);
    });
  });

  describe("collectModelRelationIntegrityIssues", () => {
    it("参照先エンティティが存在しない場合にエラーを返す", () => {
      const invoice = createModelDraft("DD-INVOICE", "Invoice", {
        typeDetail: {
          ioType: "model",
          entityName: "Invoice",
          attributes: [
            { name: "id", type: "UUID", primaryKey: true },
            { name: "customerId", type: "UUID" },
          ],
          relationships: [
            {
              type: "N:1",
              target: "Customer",
              columnMappings: [{ source: "customerId", target: "id" }],
            },
          ],
        },
      });

      const issues = collectModelRelationIntegrityIssues([invoice], []);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((issue) =>
        issue.path === "typeDetail.relationships.0.target" &&
        issue.message.includes("対応する model が存在しません")
      )).toBe(true);
    });

    it("参照先カラムが存在しない場合にエラーを返す", () => {
      const invoice = createModelDraft("DD-INVOICE", "Invoice", {
        typeDetail: {
          ioType: "model",
          entityName: "Invoice",
          attributes: [
            { name: "id", type: "UUID", primaryKey: true },
            { name: "customerId", type: "UUID" },
          ],
          relationships: [
            {
              type: "N:1",
              target: "Customer",
              columnMappings: [{ source: "customerId", target: "missingId" }],
            },
          ],
        },
      });

      const customer = createStoredModelDd("DD-CUSTOMER", "Customer", ["id"]);
      const issues = collectModelRelationIntegrityIssues([invoice], [customer]);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((issue) =>
        issue.path === "typeDetail.relationships.0.columnMappings.0.target" &&
        issue.message.includes("attributes に存在しません")
      )).toBe(true);
    });

    it("正しいマッピングの場合はエラーなし", () => {
      const invoice = createModelDraft("DD-INVOICE", "Invoice", {
        typeDetail: {
          ioType: "model",
          entityName: "Invoice",
          attributes: [
            { name: "id", type: "UUID", primaryKey: true },
            { name: "customerId", type: "UUID" },
          ],
          relationships: [
            {
              type: "N:1",
              target: "Customer",
              columnMappings: [{ source: "customerId", target: "id" }],
            },
          ],
        },
      });

      const customer = createStoredModelDd("DD-CUSTOMER", "Customer", ["id"]);
      const issues = collectModelRelationIntegrityIssues([invoice], [customer]);

      expect(issues).toEqual([]);
    });
  });

  // ========================================
  // Integration Scenarios
  // ========================================

  describe("統合シナリオ", () => {
    describe("DD呼び出しチェーンの収集", () => {
      it("画面→API→バッチの呼び出しチェーン", () => {
        const designDocuments = [
          createMockDD("DD-001", {
            dependencies: [
              { targetDdId: "DD-002", callType: "calls_sync" as const },
            ],
          }),
          createMockDD("DD-002", {
            dependencies: [
              { targetDdId: "DD-003", callType: "calls_async" as const },
            ],
            callers: [
              { callerType: "system" as const, callerDdId: "DD-001", callType: "calls_sync" as const },
            ],
          }),
          createMockDD("DD-003", {
            callers: [
              { callerType: "system" as const, callerDdId: "DD-002", callType: "calls_async" as const },
            ],
          }),
        ];

        const dependencies = collectDdDependencyLinks(designDocuments);
        const callers = collectDdCallerLinks(designDocuments);

        expect(dependencies.length).toBe(2);
        expect(callers.length).toBe(2);

        // DD-001 → DD-002 → DD-003 のチェーン
        expect(dependencies.some(d => d.sourceDdId === "DD-001" && d.targetDdId === "DD-002")).toBe(true);
        expect(dependencies.some(d => d.sourceDdId === "DD-002" && d.targetDdId === "DD-003")).toBe(true);

        expect(callers.some(c => c.targetDdId === "DD-002" && c.callerDdId === "DD-001")).toBe(true);
        expect(callers.some(c => c.targetDdId === "DD-003" && c.callerDdId === "DD-002")).toBe(true);
      });
    });

    describe("循環参照の検証", () => {
      it("DD-001 ↔ DD-002 の双方向参照", () => {
        const designDocuments = [
          createMockDD("DD-001", {
            dependencies: [
              { targetDdId: "DD-002", callType: "calls_sync" as const },
            ],
            callers: [
              { callerType: "system" as const, callerDdId: "DD-002", callType: "calls_sync" as const },
            ],
          }),
          createMockDD("DD-002", {
            dependencies: [
              { targetDdId: "DD-001", callType: "calls_sync" as const },
            ],
            callers: [
              { callerType: "system" as const, callerDdId: "DD-001", callType: "calls_sync" as const },
            ],
          }),
        ];

        const dependencies = collectDdDependencyLinks(designDocuments);
        const callers = collectDdCallerLinks(designDocuments);

        expect(dependencies.length).toBe(2);
        expect(callers.length).toBe(2);
      });
    });
  });

  // ========================================
  // Edge Cases
  // ========================================

  describe("エッジケース", () => {
    it("dependencies/callersがundefinedの場合は空配列として扱う", () => {
      const designDocuments = [
        createMockDD("DD-001", {
          dependencies: undefined as any,
          callers: undefined as any,
        }),
      ];

      const dependencies = collectDdDependencyLinks(designDocuments);
      const callers = collectDdCallerLinks(designDocuments);

      expect(dependencies).toEqual([]);
      expect(callers).toEqual([]);
    });

    it("大量のDDを処理するパフォーマンス検証", () => {
      const designDocuments: DesignDocumentDraft[] = [];

      for (let i = 1; i <= 50; i++) {
        const deps: any[] = [];
        for (let j = 1; j <= 5; j++) {
          const targetId = `DD-${String(i * 100 + j).padStart(3, "0")}`;
          deps.push({ targetDdId: targetId, callType: "calls_sync" as const });
        }
        designDocuments.push(createMockDD(`DD-${String(i).padStart(3, "0")}`, { dependencies: deps }));
      }

      // 最初の50件のみを追加して循環参照を作らないようにする
      for (let i = 1; i <= 50; i++) {
        designDocuments.push(createMockDD(`DD-${String(i + 100).padStart(3, "0")}`));
      }

      const startTime = Date.now();
      const dependencies = collectDdDependencyLinks(designDocuments);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50);

      // 重複除外が正しく動作
      const uniqueKeys = new Set<string>();
      for (const dep of dependencies) {
        const key = `${dep.sourceDdId}:${dep.targetDdId}:${dep.callType}`;
        uniqueKeys.add(key);
      }
      expect(uniqueKeys.size).toBe(dependencies.length);
    });
  });
});
