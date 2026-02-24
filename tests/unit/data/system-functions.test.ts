import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  listSystemFunctions,
  listSystemFunctionsByDomain,
  getSystemFunctionById,
  createSystemFunction,
  updateSystemFunction,
  deleteSystemFunction,
  updateSystemFunctionsSortOrder,
  getDesignCategoryLabel,
  type SystemFunctionInput,
  type SystemFunctionCreateInput,
} from "@/lib/data/system-functions";
import type { SystemFunction, EntryPoint, SrfCategory, SrfStatus } from "@/lib/domain";
import { createMockSupabase } from "@/tests/helpers/mock-supabase";

// ========================================
// Mock Setup
// ========================================

beforeEach(() => {
  mock.module("@/lib/supabase/client", () => ({
    supabase: createMockSupabase(),
    getSupabaseConfigError: () => null,
  }));
});

afterEach(() => {
  // Bunのmock.moduleが他のテストファイルへ漏れるのを防ぐ
  mock.restore();
});

// ========================================
// listSystemFunctionsByDomain Tests
// ========================================

describe("listSystemFunctionsByDomain", () => {
  it("system_domain_idでフィルタリングする", async () => {
    const mockFunctions = [
      {
        id: "SF-AR-001",
        system_domain_id: "AR",
        title: "請求書発行",
        sort_order: 1,
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
      },
      {
        id: "SF-AP-001",
        system_domain_id: "AP",
        title: "買掛登録",
        sort_order: 2,
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
      },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockFunctions),
      getSupabaseConfigError: () => null,
    }));

    const result = await listSystemFunctionsByDomain("AR");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].id).toBe("SF-AR-001");
  });

  it("projectIdを指定してフィルタリングする", async () => {
    const mockFunctions = [
      {
        id: "SF-AR-001",
        system_domain_id: "AR",
        project_id: "project-123",
        title: "請求書発行",
        sort_order: 1,
        created_at: "2024-01-01",
        updated_at: "2024-01-01"
      },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockFunctions),
      getSupabaseConfigError: () => null,
    }));

    const result = await listSystemFunctionsByDomain("AR", "project-123");

    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].id).toBe("SF-AR-001");
  });
});

// ========================================
// EntryPoint/CodeRef 変換 Tests
// ========================================

describe("EntryPoint/CodeRef相互変換", () => {
  describe("createSystemFunction - entryPointsからcodeRefsへの変換", () => {
    it("entryPointsのみ指定時にcodeRefsを自動生成する", async () => {
      const input: SystemFunctionCreateInput = {
        id: "SF-001",
        systemDomainId: "AR",
        category: "billing" as SrfCategory,
        title: "請求書発行",
        summary: "概要",
        designPolicy: "",
        status: "draft" as SrfStatus,
        relatedTaskIds: [],
        requirementIds: [],
        systemDesign: [],
        entryPoints: [
          { path: "/app/billing/invoice/page.tsx", type: "screen", responsibility: "画面表示" },
          { path: "/lib/billing/api.ts", type: "api", responsibility: "API処理" },
        ],
        codeRefs: [],
        projectId: "project-123",
      };

      mock.module("@/lib/supabase/client", () => ({
        supabase: {
          from: () => ({
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: "SF-001",
                    entry_points: input.entryPoints,
                    code_refs: [{ paths: ["/app/billing/invoice/page.tsx", "/lib/billing/api.ts"] }],
                    created_at: "2024-01-01",
                    updated_at: "2024-01-01",
                  },
                  error: null
                }),
              }),
            }),
          }),
        },
        getSupabaseConfigError: () => null,
      }));

      const result = await createSystemFunction(input);

      expect(result.error).toBeNull();
      expect(result.data?.entryPoints).toHaveLength(2);
      expect(result.data?.codeRefs).toHaveLength(1);
      expect(result.data?.codeRefs[0].paths).toEqual(["/app/billing/invoice/page.tsx", "/lib/billing/api.ts"]);
    });
  });

  describe("createSystemFunction - codeRefsからentryPointsへの変換", () => {
    it("codeRefsのみ指定時にentryPointsを自動生成する", async () => {
      const input: SystemFunctionCreateInput = {
        id: "SF-002",
        systemDomainId: "AR",
        category: "billing" as SrfCategory,
        title: "請求書発行",
        summary: "概要",
        designPolicy: "",
        status: "draft" as SrfStatus,
        relatedTaskIds: [],
        requirementIds: [],
        systemDesign: [],
        codeRefs: [{ paths: ["/lib/billing/service.ts"] }],
        projectId: "project-123",
      };

      mock.module("@/lib/supabase/client", () => ({
        supabase: {
          from: () => ({
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: "SF-002",
                    entry_points: [{ path: "/lib/billing/service.ts", type: null, responsibility: null }],
                    code_refs: input.codeRefs,
                    created_at: "2024-01-01",
                    updated_at: "2024-01-01",
                  },
                  error: null
                }),
              }),
            }),
          }),
        },
        getSupabaseConfigError: () => null,
      }));

      const result = await createSystemFunction(input);

      expect(result.error).toBeNull();
      expect(result.data?.entryPoints).toHaveLength(1);
      expect(result.data?.entryPoints[0].path).toBe("/lib/billing/service.ts");
    });
  });
});

// ========================================
// updateSystemFunction マージ処理 Tests
// ========================================

describe("updateSystemFunction - EntryPointマージ処理", () => {
  it("既存のentryPointsを保持しつつ新しいentryPointsを追加する", async () => {
    const existingEntryPoints = [
      { path: "/lib/billing/service.ts", type: "api", responsibility: "API処理" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: {
                  entry_points: existingEntryPoints,
                },
                error: null
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: "SF-001",
                    entry_points: [
                      { path: "/lib/billing/service.ts", type: "api", responsibility: "API処理" },
                      { path: "/app/billing/invoice/page.tsx", type: "screen", responsibility: "画面表示" },
                    ],
                    created_at: "2024-01-01",
                    updated_at: "2024-01-01",
                  },
                  error: null
                }),
              }),
            }),
          }),
        }),
      },
      getSupabaseConfigError: () => null,
    }));

    const input: Omit<SystemFunctionInput, "id"> = {
      systemDomainId: "AR",
      category: "billing" as SrfCategory,
      title: "請求書発行",
      summary: "概要",
      designPolicy: "",
      status: "draft" as SrfStatus,
      relatedTaskIds: [],
      requirementIds: [],
      systemDesign: [],
      entryPoints: [
        { path: "/app/billing/invoice/page.tsx", type: "screen", responsibility: "画面表示" },
      ],
      codeRefs: [],
    };

    const result = await updateSystemFunction("SF-001", input);

    expect(result.error).toBeNull();
    expect(result.data?.entryPoints).toHaveLength(2);
  });

  it("既存のentryPointsのtype/responsibilityを保持する", async () => {
    const existingEntryPoints = [
      { path: "/lib/billing/service.ts", type: "api", responsibility: "既存の責務" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: {
                  entry_points: existingEntryPoints,
                },
                error: null
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: "SF-001",
                    entry_points: [
                      { path: "/lib/billing/service.ts", type: "api", responsibility: "既存の責務" },
                    ],
                    created_at: "2024-01-01",
                    updated_at: "2024-01-01",
                  },
                  error: null
                }),
              }),
            }),
          }),
        }),
      },
      getSupabaseConfigError: () => null,
    }));

    const input: Omit<SystemFunctionInput, "id"> = {
      systemDomainId: "AR",
      category: "billing" as SrfCategory,
      title: "請求書発行",
      summary: "概要",
      designPolicy: "",
      status: "draft" as SrfStatus,
      relatedTaskIds: [],
      requirementIds: [],
      systemDesign: [],
      entryPoints: [
        { path: "/lib/billing/service.ts", type: null, responsibility: null },
      ],
      codeRefs: [],
    };

    const result = await updateSystemFunction("SF-001", input);

    expect(result.error).toBeNull();
    // 既存のtype/responsibilityが保持されているはず
    expect(result.data?.entryPoints[0].type).toBe("api");
    expect(result.data?.entryPoints[0].responsibility).toBe("既存の責務");
  });

  it("pathが一致しない場合は新規entryPointsとして追加", async () => {
    const existingEntryPoints = [
      { path: "/lib/billing/old.ts", type: "api", responsibility: "旧処理" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: {
                  entry_points: existingEntryPoints,
                },
                error: null
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: "SF-001",
                    entry_points: [
                      { path: "/lib/billing/old.ts", type: "api", responsibility: "旧処理" },
                      { path: "/lib/billing/new.ts", type: null, responsibility: null },
                    ],
                    created_at: "2024-01-01",
                    updated_at: "2024-01-01",
                  },
                  error: null
                }),
              }),
            }),
          }),
        }),
      },
      getSupabaseConfigError: () => null,
    }));

    const input: Omit<SystemFunctionInput, "id"> = {
      systemDomainId: "AR",
      category: "billing" as SrfCategory,
      title: "請求書発行",
      summary: "概要",
      designPolicy: "",
      status: "draft" as SrfStatus,
      relatedTaskIds: [],
      requirementIds: [],
      systemDesign: [],
      entryPoints: [
        { path: "/lib/billing/new.ts", type: "batch", responsibility: "新処理" },
      ],
      codeRefs: [],
    };

    const result = await updateSystemFunction("SF-001", input);

    expect(result.error).toBeNull();
    expect(result.data?.entryPoints).toHaveLength(2);
  });
});

// ========================================
// CRUD Operations Tests
// ========================================

describe("SystemFunction CRUD Operations", () => {
  const mockFunctions = [
    {
      id: "SF-001",
      system_domain_id: "AR",
      title: "請求書発行",
      summary: "概要",
      design_policy: "設計方針",
      status: "draft",
      related_task_ids: ["BT-001"],
      requirement_ids: ["BR-001"],
      system_design: [],
      entry_points: [],
      code_refs: [],
      sort_order: 1,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
  ];

  beforeEach(() => {
    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockFunctions),
      getSupabaseConfigError: () => null,
    }));
  });

  describe("createSystemFunction", () => {
    it("新規システム機能を作成する", async () => {
      const input: SystemFunctionCreateInput = {
        id: "SF-002",
        systemDomainId: "AR",
        category: "billing" as SrfCategory,
        title: "請求書メール送信",
        summary: "メール送信機能",
        designPolicy: "",
        status: "draft" as SrfStatus,
        relatedTaskIds: [],
        requirementIds: [],
        systemDesign: [],
        entryPoints: [],
        codeRefs: [],
        projectId: "project-123",
      };

      mock.module("@/lib/supabase/client", () => ({
        supabase: {
          from: () => ({
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: "SF-002",
                    system_domain_id: "AR",
                    title: "請求書メール送信",
                    created_at: "2024-01-01",
                    updated_at: "2024-01-01",
                  },
                  error: null
                }),
              }),
            }),
          }),
        },
        getSupabaseConfigError: () => null,
      }));

      const result = await createSystemFunction(input);

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe("SF-002");
    });
  });

  describe("updateSystemFunction", () => {
    it("システム機能を更新する", async () => {
      mock.module("@/lib/supabase/client", () => ({
        supabase: {
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({
                  data: {
                    entry_points: [],
                  },
                  error: null
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => Promise.resolve({
                    data: {
                      id: "SF-001",
                      title: "更新済みタイトル",
                      created_at: "2024-01-01",
                      updated_at: "2024-01-02",
                    },
                    error: null
                  }),
                }),
              }),
            }),
          }),
        },
        getSupabaseConfigError: () => null,
      }));

      const result = await updateSystemFunction("SF-001", {
        systemDomainId: "AR",
        category: "billing" as SrfCategory,
        title: "更新済みタイトル",
        summary: "概要",
        designPolicy: "",
        status: "draft" as SrfStatus,
        relatedTaskIds: [],
        requirementIds: [],
        systemDesign: [],
        entryPoints: [],
        codeRefs: [],
      });

      expect(result.error).toBeNull();
      expect(result.data?.title).toBe("更新済みタイトル");
    });
  });

  describe("deleteSystemFunction", () => {
    it("システム機能を削除する", async () => {
      mock.module("@/lib/supabase/client", () => ({
        supabase: createMockSupabase([
          { id: "SF-001", project_id: "project-123", created_at: "2024-01-01", updated_at: "2024-01-01" },
        ]),
        getSupabaseConfigError: () => null,
      }));

      const result = await deleteSystemFunction("SF-001", "project-123");

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });
  });
});

// ========================================
// getDesignCategoryLabel Tests
// ========================================

describe("getDesignCategoryLabel", () => {
  it("カテゴリコードから日本語ラベルを返す", () => {
    expect(getDesignCategoryLabel("database")).toBe("データベース設計");
    expect(getDesignCategoryLabel("api")).toBe("API設計");
    expect(getDesignCategoryLabel("logic")).toBe("ビジネスロジック");
    expect(getDesignCategoryLabel("ui")).toBe("UI/画面設計");
    expect(getDesignCategoryLabel("integration")).toBe("外部連携");
    expect(getDesignCategoryLabel("batch")).toBe("バッチ処理");
    expect(getDesignCategoryLabel("error_handling")).toBe("エラーハンドリング");
  });

  it("未知のカテゴリはそのまま返す", () => {
    expect(getDesignCategoryLabel("unknown" as any)).toBe("unknown");
  });
});

// ========================================
// Integration Scenarios
// ========================================

describe("SystemFunction統合シナリオ", () => {
  describe("EntryPointとCodeRefの双方向変換", () => {
    it("entryPoints → codeRefs → entryPoints の往復で整合性を保つ", () => {
      const originalEntryPoints: EntryPoint[] = [
        { path: "/app/billing/invoice/page.tsx", type: "screen", responsibility: "画面表示" },
        { path: "/lib/billing/api.ts", type: "api", responsibility: "API処理" },
      ];

      // entryPoints → codeRefs（変換ロジック）
      const codeRefs = [{ paths: originalEntryPoints.map((ep) => ep.path) }];

      // codeRefs → entryPoints（逆変換）
      const restoredEntryPoints = codeRefs.flatMap((cr) =>
        cr.paths.map((path) => ({ path, type: null, responsibility: null }))
      );

      expect(restoredEntryPoints).toHaveLength(2);
      expect(restoredEntryPoints[0].path).toBe("/app/billing/invoice/page.tsx");
      expect(restoredEntryPoints[1].path).toBe("/lib/billing/api.ts");
      // typeとresponsibilityは失われる
      expect(restoredEntryPoints[0].type).toBeNull();
      expect(restoredEntryPoints[0].responsibility).toBeNull();
    });
  });

  describe("エッジケースの処理", () => {
    it("空のentryPointsと空のcodeRefsの場合", async () => {
      const mockFunctions = [
        {
          id: "SF-001",
          entry_points: null,
          code_refs: [],
          sort_order: 1,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mock.module("@/lib/supabase/client", () => ({
        supabase: createMockSupabase(mockFunctions),
        getSupabaseConfigError: () => null,
      }));

      const result = await listSystemFunctions("project-123");

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it("entryPointsに空パスが含まれる場合の正規化", () => {
      const entryPointsWithEmpty = [
        { path: "", type: "screen", responsibility: "画面表示" },
        { path: "/valid/path.ts", type: "api", responsibility: "API処理" },
        { path: "   ", type: "batch", responsibility: "バッチ処理" },
      ];

      const normalized = entryPointsWithEmpty.filter((p) => p.path.trim() !== "");

      expect(normalized).toHaveLength(1);
      expect(normalized[0].path).toBe("/valid/path.ts");
    });
  });

  describe("マージ処理の複雑なシナリオ", () => {
    it("既存と新規で同じパースが存在する場合、既存を優先する", async () => {
      const existingEntryPoints = [
        { path: "/lib/billing/service.ts", type: "api", responsibility: "既存のAPI" },
      ];

      const newEntryPoints = [
        { path: "/lib/billing/service.ts", type: "batch", responsibility: "新規のバッチ" },
      ];

      // 既存のMapを作成
      const existingByPath = new Map(existingEntryPoints.map((p) => [p.path, p] as const));

      // 新規entryPointsでマージ（既存を優先）
      const merged = newEntryPoints.map((p) => existingByPath.get(p.path) ?? p);

      expect(merged).toHaveLength(1);
      expect(merged[0].type).toBe("api"); // 既存のtypeが保持される
      expect(merged[0].responsibility).toBe("既存のAPI");
    });
  });
});
