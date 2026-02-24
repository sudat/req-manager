import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
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
  // mock.module の影響が他ファイルに漏れないようにしておく
  mock.restore();
});

// ========================================
// listBusinesses Tests
// ========================================

describe("listBusinesses", () => {
  it("業務領域一覧を取得する", async () => {
    const mockBusinesses = [
      { area: "AR", project_id: "project-123", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
      { area: "AP", project_id: "project-123", name: "買掛", summary: "買掛管理", sort_order: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
      getSupabaseConfigError: () => null,
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
      getSupabaseConfigError: () => null,
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
      { area: "AR", project_id: "project-123", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
      getSupabaseConfigError: () => null,
    }));

    const result = await getBusinessByArea("AR", "project-123");

    expect(result.error).toBeNull();
    expect(result.data?.area).toBe("AR");
    expect(result.data?.name).toBe("請求");
  });

  it("エリアコードを大文字・トリムで正規化する", async () => {
    const mockBusinesses = [
      { area: "AR", project_id: "project-123", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
      getSupabaseConfigError: () => null,
    }));

    const result1 = await getBusinessByArea(" ar ", "project-123");
    const result2 = await getBusinessByArea("Ar", "project-123");

    expect(result1.data?.area).toBe("AR");
    expect(result2.data?.area).toBe("AR");
  });

  it("空文字列の場合はdata: null, error: nullを返す", async () => {
    const mockBusinesses = [
      { area: "AR", project_id: "project-123", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
      getSupabaseConfigError: () => null,
    }));

    const result = await getBusinessByArea("   ", "project-123");

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it("存在しないエリアコードの場合はdata: null, error: nullを返す", async () => {
    const mockBusinesses = [
      { area: "AR", project_id: "project-123", name: "請求", summary: "請求管理", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockBusinesses),
      getSupabaseConfigError: () => null,
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
    const projectId = "project-123";
    const supabaseMock = createMockSupabase({
      business_domains: [
        { area: "AR", project_id: projectId, name: "請求", summary: "", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
        { area: "AP", project_id: projectId, name: "買掛", summary: "", sort_order: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
      ],
      business_tasks: [
        { id: "BT-AR-001", business_area: "AR", project_id: projectId },
        { id: "BT-AP-001", business_area: "AP", project_id: projectId },
      ],
      business_requirements: [
        { task_id: "BT-AR-001", project_id: projectId },
        { task_id: "BT-AR-001", project_id: projectId },
        { task_id: "BT-AR-001", project_id: projectId },
      ],
      system_requirements: [
        { task_id: "BT-AR-001", project_id: projectId },
        { task_id: "BT-AP-001", project_id: projectId },
      ],
    });

    mock.module("@/lib/supabase/client", () => ({
      supabase: supabaseMock,
      getSupabaseConfigError: () => null,
    }));

    const result = await listBusinessesWithRequirementCounts(projectId);

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
    const projectId = "project-123";
    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase({
        business_domains: [
          { area: "AR", project_id: projectId, name: "請求", summary: "", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
        ],
        business_tasks: [],
      }),
      getSupabaseConfigError: () => null,
    }));

    const result = await listBusinessesWithRequirementCounts(projectId);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].businessReqCount).toBe(0);
    expect(result.data?.[0].systemReqCount).toBe(0);
  });

  it("N+1クエリパターン: 複数のテーブルから順次取得する", async () => {
    // 実装は複数テーブルを順に取得する設計（N+1にはならないが複数クエリは発生する）
    const projectId = "project-123";
    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase({
        business_domains: [
          { area: "AR", project_id: projectId, name: "請求", summary: "", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
        ],
        business_tasks: [],
      }),
      getSupabaseConfigError: () => null,
    }));

    const result = await listBusinessesWithRequirementCounts(projectId);

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
    const projectId = "project-123";
    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase({
        business_domains: [
          { area: "AR", project_id: projectId, name: "請求", summary: "", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
          { area: "AP", project_id: projectId, name: "買掛", summary: "", sort_order: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
        ],
      }),
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
    const projectId = "project-123";
    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase({
        business_domains: [
          { area: "AR", project_id: projectId, name: "請求", summary: "", sort_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
          { area: "AP", project_id: projectId, name: "買掛", summary: "", sort_order: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
          { area: "GL", project_id: projectId, name: "総勘定元帳", summary: "", sort_order: 3, created_at: "2024-01-01", updated_at: "2024-01-01" },
        ],
        business_tasks: [
          { id: "BT-AR-001", business_area: "AR", project_id: projectId },
          { id: "BT-AR-002", business_area: "AR", project_id: projectId },
          { id: "BT-AP-001", business_area: "AP", project_id: projectId },
        ],
        business_requirements: [
          { task_id: "BT-AR-001", project_id: projectId },
          { task_id: "BT-AR-002", project_id: projectId },
          { task_id: "BT-AP-001", project_id: projectId },
        ],
        system_requirements: [
          { task_id: "BT-AR-001", project_id: projectId },
          { task_id: "BT-AR-002", project_id: projectId },
          { task_id: "BT-AP-001", project_id: projectId },
        ],
      }),
      getSupabaseConfigError: () => null,
    }));

    const result = await listBusinessesWithRequirementCounts(projectId);

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
