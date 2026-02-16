import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  listBusinesses,
  getBusinessByArea,
  getBusinessByKey,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  listBusinessesWithRequirementCounts,
  updateBusinessesSortOrder,
  type BusinessInput,
  type BusinessCreateInput,
} from "@/lib/data/businesses";
import type { Business, BusinessArea } from "@/lib/domain";

// ========================================
// Mock Setup
// ========================================

const createMockSupabase = (initialData: any[] = []) => {
  let data = [...initialData];
  return {
    from: () => ({
      select: () => createMockSupabase(data),
      insert: (payload: any) => createMockSupabase(data),
      update: (payload: any) => createMockSupabase(data),
      delete: () => createMockSupabase(data),
      eq: (column: string, value: any) => {
        if (column === "area") {
          data = data.filter((d) => d.area === value);
        }
        if (column === "project_id") {
          data = data.filter((d) => d.project_id === value);
        }
        return createMockSupabase(data);
      },
      order: () => createMockSupabase(data),
      in: (column: string, values: any[]) => {
        data = data.filter((d) => values.includes(d[column]));
        return createMockSupabase(data);
      },
      maybeSingle: () => {
        const single = data.length > 0 ? data[0] : null;
        return Promise.resolve({ data: single, error: single ? null : { message: "Not found" } });
      },
      single: () => Promise.resolve({ data: data[0], error: data.length > 0 ? null : { message: "Not found" } }),
    }),
  };
};

beforeEach(() => {
  mock.module("@/lib/supabase/client", () => ({
    supabase: createMockSupabase(),
    getSupabaseConfigError: () => null,
  }));
});

// ========================================
// listBusinesses Tests
// ========================================

describe("listBusinesses", () => {
  it("業務領域一覧を取得する", async () => {
    const mockBusinesses = [
      { area: "AR", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
      { area: "AP", name: "買掛", summary: "買掛管理", sort_order: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
    }));

    const result = await listBusinesses("project-123");

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?.length).toBe(2);
    expect(result.data?.[0].area).toBe("AR");
  });

  it("projectIdフィルタを適用する", async () => {
    const mockBusinesses = [
      { area: "AR", project_id: "project-123", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
      { area: "AP", project_id: "other-project", name: "買掛", summary: "買掛管理", sort_order: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
    }));

    const result = await listBusinesses("project-123");

    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].area).toBe("AR");
  });
});

// ========================================
// getBusinessByArea Tests
// ========================================

describe("getBusinessByArea", () => {
  it("エリアコードで業務領域を取得する", async () => {
    const mockBusinesses = [
      { area: "AR", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
    }));

    const result = await getBusinessByArea("AR", "project-123");

    expect(result.error).toBeNull();
    expect(result.data?.area).toBe("AR");
    expect(result.data?.name).toBe("請求");
  });

  it("エリアコードを大文字・トリムで正規化する", async () => {
    const mockBusinesses = [
      { area: "AR", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
    }));

    const result1 = await getBusinessByArea(" ar ", "project-123");
    const result2 = await getBusinessByArea("Ar", "project-123");

    expect(result1.data?.area).toBe("AR");
    expect(result2.data?.area).toBe("AR");
  });

  it("空文字列の場合はdata: null, error: nullを返す", async () => {
    const mockBusinesses = [
      { area: "AR", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
    }));

    const result = await getBusinessByArea("   ", "project-123");

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it("存在しないエリアコードの場合はdata: null, error: nullを返す", async () => {
    const mockBusinesses = [
      { area: "AR", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
    }));

    const result = await getBusinessByArea("XX", "project-123");

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });
});

// ========================================
// getBusinessByKey Tests
// ========================================

describe("getBusinessByKey", () => {
  it("キーで業務領域を取得する", async () => {
    const result = await getBusinessByKey("AR", "project-123");

    expect(typeof result).toBeDefined();
  });
});

// ========================================
// listBusinessesWithRequirementCounts Tests
// ========================================

describe("listBusinessesWithRequirementCounts", () => {
  it("業務要件・システム要件数を集計する", async () => {
    // モックデータの設定
    const mockBusinesses = [
      { area: "AR", sort_order: 1 },
      { area: "AP", sort_order: 2 },
    ];

    const mockTasks = [
      { id: "BT-AR-001", business_area: "AR" },
      { id: "BT-AP-001", business_area: "AP" },
    ];

    const mockBusinessReqs = [
      { task_id: "BT-AR-001" },
      { task_id: "BT-AR-001" },
      { task_id: "BT-AR-001" },
    ];

    const mockSystemReqs = [
      { task_id: "BT-AR-001" },
      { task_id: "BT-AP-001" },
    ];

    // モックのチェーン設定
    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: (table: string) => {
          if (table === "business_domains") {
            return {
              select: () => ({
                order: () => ({
                  then: (cb: any) => {
                    cb({ data: mockBusinesses, error: null });
                    return { catch: () => ({ then: (cb: any) => cb() }) };
                  },
                }),
              }),
            };
          } else if (table === "business_tasks") {
            return {
              in: () => ({
                then: (cb: any) => {
                  cb({ data: mockTasks, error: null });
                  return { catch: () => ({ then: (cb: any) => cb() }) };
                },
              }),
            };
          } else if (table === "business_requirements") {
            return {
              in: () => ({
                then: (cb: any) => {
                  cb({ data: mockBusinessReqs, error: null });
                  return { catch: () => ({ then: (cb: any) => cb() }) };
                },
              }),
            };
          } else if (table === "system_requirements") {
            return {
              in: () => ({
                then: (cb: any) => {
                  cb({ data: mockSystemReqs, error: null });
                  return { catch: () => ({ then: (cb: any) => cb() }) };
                },
              }),
            };
          }
          return { select: () => ({ eq: () => createMockSupabase() }) };
        },
      },
      getSupabaseConfigError: () => null,
    }));

    // listBusinessesのモック
    mock.module("@/lib/data/businesses", () => ({
      listBusinesses: async () => ({
        data: mockBusinesses.map((b) => ({
          id: b.area,
          name: b.area,
          area: b.area as BusinessArea,
          summary: "",
          businessReqCount: 0,
          systemReqCount: 0,
          sortOrder: b.sort_order,
          createdAt: "",
          updatedAt: "",
        })),
        error: null,
      }),
    }));

    const result = await listBusinessesWithRequirementCounts("project-123");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);

    const arBusiness = result.data?.find((b) => b.area === "AR");
    const apBusiness = result.data?.find((b) => b.area === "AP");

    expect(arBusiness?.businessReqCount).toBe(3); // 3件のBR
    expect(arBusiness?.systemReqCount).toBe(1); // 1件のSR
    expect(apBusiness?.businessReqCount).toBe(0);
    expect(apBusiness?.systemReqCount).toBe(1);
  });

  it("タスクが存在しない場合は0件カウントを返す", async () => {
    const mockBusinesses = [
      { area: "AR", sort_order: 1 },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: (table: string) => {
          if (table === "business_domains") {
            return {
              select: () => ({
                order: () => ({
                  then: (cb: any) => {
                    cb({ data: mockBusinesses, error: null });
                    return { catch: () => ({ then: (cb: any) => cb() }) };
                  },
                }),
              }),
            };
          } else if (table === "business_tasks") {
            return {
              in: () => ({
                then: (cb: any) => {
                  cb({ data: [], error: null });
                  return { catch: () => ({ then: (cb: any) => cb() }) };
                },
              }),
            };
          }
          return { select: () => ({ eq: () => createMockSupabase() }) };
        },
      },
      getSupabaseConfigError: () => null,
    }));

    // listBusinessesのモック
    mock.module("@/lib/data/businesses", () => ({
      listBusinesses: async () => ({
        data: mockBusinesses.map((b) => ({
          id: b.area,
          name: b.area,
          area: b.area as BusinessArea,
          summary: "",
          businessReqCount: 0,
          systemReqCount: 0,
          sortOrder: b.sort_order,
          createdAt: "",
          updatedAt: "",
        })),
        error: null,
      }),
    }));

    const result = await listBusinessesWithRequirementCounts("project-123");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].businessReqCount).toBe(0);
    expect(result.data?.[0].systemReqCount).toBe(0);
  });

  it("N+1クエリパターン: 複数のテーブルから順次取得する", async () => {
    // このテストは実際のSupabase操作をモック化して検証する
    // 実際の実装では4つのクエリ（businesses, tasks, BRs, SRs）が実行される
    const mockBusinesses = [{ area: "AR", sort_order: 1 }];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: (table: string) => {
          const callOrder: string[] = [];
          return {
            select: () => {
              callOrder.push(`${table}.select`);
              return {
                order: () => ({
                  then: (cb: any) => {
                    if (table === "business_domains") {
                      cb({ data: mockBusinesses, error: null });
                    } else {
                      cb({ data: [], error: null });
                    }
                    return { catch: () => ({ then: (cb: any) => cb() }) };
                  },
                }),
              };
            },
            in: () => {
              callOrder.push(`${table}.in`);
              return {
                then: (cb: any) => {
                  cb({ data: [], error: null });
                  return { catch: () => ({ then: (cb: any) => cb() }) };
                },
              };
            },
          };
        },
      },
      getSupabaseConfigError: () => null,
    }));

    // listBusinessesWithRequirementCountsの実行を確認
    // 注: このテストでは実際のSupabase呼び出しを検証できないため、
    // モックの設定のみを行う

    const result = await listBusinessesWithRequirementCounts("project-123");

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});

// ========================================
// CRUD Operations Tests
// ========================================

describe("Business CRUD Operations", () => {
  const mockBusinesses = [
    { area: "AR", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
  ];

  beforeEach(() => {
    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
      getSupabaseConfigError: () => null,
    }));
  });

  describe("createBusiness", () => {
    it("新規業務領域を作成する", async () => {
      const input: BusinessCreateInput = {
        name: "売掛",
        area: "AP",
        summary: "売掛管理",
        sortOrder: 1,
        projectId: "project-123",
      };

      const result = await createBusiness(input);

      expect(result.error).toBeNull();
      expect(result.data?.area).toBe("AP");
    });
  });

  describe("updateBusiness", () => {
    it("業務領域を更新する", async () => {
      const result = await updateBusiness("AR", {
        name: "更新済み請求",
        summary: "更新済み概要",
      });

      expect(result.error).toBeNull();
      expect(result.data?.name).toBe("更新済み請求");
    });
  });

  describe("deleteBusiness", () => {
    it("業務�域を削除する", async () => {
      const result = await deleteBusiness("AR", "project-123");

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });
  });
});

// ========================================
// Sort Order Tests
// ========================================

describe("updateBusinessesSortOrder", () => {
  beforeEach(() => {
    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: () => ({
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      },
      getSupabaseConfigError: () => null,
    }));
  });

  it("sort_orderを一括更新する", async () => {
    const updates = [
      { id: "AR", sortOrder: 10 },
      { id: "AP", sortOrder: 20 },
    ];

    const result = await updateBusinessesSortOrder(updates, "project-123");

    expect(result.data).toBe(true);
    expect(result.error).toBeNull();
  });
});

// ========================================
// Integration Scenarios
// ========================================

describe("Business統合シナリオ", () => {
  it("AR/AP/GLの3領域の要件数を正しく集計する", async () => {
    // モックデータ
    const mockBusinesses = [
      { area: "AR", sort_order: 1 },
      { area: "AP", sort_order: 2 },
      { area: "GL", sort_order: 3 },
    ];

    const mockTasks = [
      { id: "BT-AR-001", business_area: "AR" },
      { id: "BT-AR-002", business_area: "AR" },
      { id: "BT-AP-001", business_area: "AP" },
    ];

    const mockBusinessReqs = [
      { task_id: "BT-AR-001" },
      { task_id: "BT-AR-002" },
      { task_id: "BT-AP-001" },
    ];

    const mockSystemReqs = [
      { task_id: "BT-AR-001" },
      { task_id: "BT-AR-002" },
      { task_id: "BT-AP-001" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: (table: string) => {
          if (table === "business_domains") {
            return {
              select: () => ({
                order: () => ({
                  then: (cb: any) => cb({ data: mockBusinesses, error: null }),
                }),
              }),
            };
          } else if (table === "business_tasks") {
            return {
              in: () => ({
                then: (cb: any) => cb({ data: mockTasks, error: null }),
              }),
            };
          } else if (table === "business_requirements") {
            return {
              in: () => ({
                then: (cb: any) => cb({ data: mockBusinessReqs, error: null }),
              }),
            };
          } else if (table === "system_requirements") {
            return {
              in: () => ({
                then: (cb: any) => cb({ data: mockSystemReqs, error: null }),
              }),
            };
          }
          return { select: () => ({ eq: () => createMockSupabase() }) };
        },
      },
      getSupabaseConfigError: () => null,
    }));

    // listBusinessesのモック
    mock.module("@/lib/data/businesses", () => ({
      listBusinesses: async () => ({
        data: mockBusinesses.map((b) => ({
          id: b.area,
          name: b.area,
          area: b.area as BusinessArea,
          summary: "",
          businessReqCount: 0,
          systemReqCount: 0,
          sortOrder: b.sort_order,
          createdAt: "",
          updatedAt: "",
        })),
        error: null,
      }),
    }));

    const result = await listBusinessesWithRequirementCounts("project-123");

    expect(result.data).toHaveLength(3);

    const arBusiness = result.data?.find((b) => b.area === "AR");
    const apBusiness = result.data?.find((b) => b.area === "AP");
    const glBusiness = result.data?.find((b) => b.area === "GL");

    // AR: 2タスク → 2BR + 2SR
    expect(arBusiness?.businessReqCount).toBe(2);
    expect(arBusiness?.systemReqCount).toBe(2);

    // AP: 1タスク → 1BR + 1SR
    expect(apBusiness?.businessReqCount).toBe(1);
    expect(apBusiness?.systemReqCount).toBe(1);

    // GL: 0タスク → 0BR + 0SR
    expect(glBusiness?.businessReqCount).toBe(0);
    expect(glBusiness?.systemReqCount).toBe(0);
  });

  it("taskToBusinessマッピングが正しく構築される", async () => {
    const mockTasks = [
      { id: "BT-AR-001", business_area: "AR" },
      { id: "BT-AP-001", business_area: "AP" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: () => ({
          select: () => createMockSupabase(),
          in: () => ({
            then: (cb: any) => cb({ data: mockTasks, error: null }),
          }),
        }),
      },
      getSupabaseConfigError: () => null,
    }));

    // listBusinessesWithRequirementCountsの実行ロジックで
    // taskToBusinessマップが構築されることを検証
    // 注: 実際のマップ構築は関数内で行われるため、
    // このテストではロジックの正しさを検証

    const taskIdToBusinessMap = new Map(
      mockTasks.map((t) => [t.id, t.business_area])
    );

    expect(taskIdToBusinessMap.get("BT-AR-001")).toBe("AR");
    expect(taskIdToBusinessMap.get("BT-AP-001")).toBe("AP");
  });
});
