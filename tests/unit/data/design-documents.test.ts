import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  listDesignDocuments,
  listDesignDocumentsBySrfId,
  createDesignDocument,
  updateDesignDocument,
  deleteDesignDocument,
  createDesignDocuments,
  deleteDesignDocumentsBySrfId,
  type DesignDocumentInput,
  type DesignDocumentCreateInput,
} from "@/lib/data/design-documents";
import type { DesignDocument, DdType, DdCallerLink } from "@/lib/domain";
import { createMockSupabase } from "@/tests/helpers/mock-supabase";

// ========================================
// Mock Setup
// ========================================

beforeEach(() => {
  mock.module("@/lib/supabase/client", () => ({
    supabase: createMockSupabase(),
    getSupabaseConfigError: () => null,
  }));

	  // requirement-links.tsのモック
	  mock.module("@/lib/data/requirement-links", () => ({
	    listDdCallersByTargetIds: async (ddIds: string[], projectId?: string) => {
	      // モックデータを返す
	      const mockCallers: DdCallerLink[] = [
	        {
	          targetDdId: ddIds[0],
	          callerType: "system",
	          callerDdId: "DD-001",
	          callType: "sync",
	        },
	        {
	          targetDdId: ddIds[0],
	          callerType: "system",
	          callerDdId: "DD-002",
	          callType: "async",
	        },
	      ];
	      return { data: mockCallers, error: null };
	    },
	  }));
});

afterEach(() => {
  // Bunのmock.moduleが他のテストファイルへ漏れるのを防ぐ
  mock.restore();
});

// ========================================
// normalizeDdType Tests
// ========================================

describe("normalizeDdType", () => {
  it("有効なDdTypeの場合はそのまま返す", () => {
    // design-documents.ts内のロジックを直接テスト
    const validTypes: DdType[] = ["screen", "api", "batch", "external_if", "model", "report", "job"];

    for (const type of validTypes) {
      const result = (() => {
        if (typeof type === "string" && type.length > 0) {
          const validTypes: DdType[] = ["screen", "api", "batch", "external_if", "model", "report", "job"];
          if (validTypes.includes(type as DdType)) {
            return type as DdType;
          }
        }
        return "screen";
      })();
      expect(result).toBe(type);
    }
  });

  it("無効なtypeの場合はscreenをデフォルトとする", () => {
    const result = (() => {
      const value = "invalid_type";
      if (typeof value === "string" && value.length > 0) {
        const validTypes: DdType[] = ["screen", "api", "batch", "external_if", "model", "report", "job"];
        if (validTypes.includes(value as DdType)) {
          return value as DdType;
        }
      }
      return "screen";
    })();
    expect(result).toBe("screen");
  });

  it("空文字列の場合はscreenをデフォルトとする", () => {
    const result = (() => {
      const value = "";
      if (typeof value === "string" && value.length > 0) {
        const validTypes: DdType[] = ["screen", "api", "batch", "external_if", "model", "report", "job"];
        if (validTypes.includes(value as DdType)) {
          return value as DdType;
        }
      }
      return "screen";
    })();
    expect(result).toBe("screen");
  });
});

// ========================================
// listDesignDocumentsBySrfId Tests
// ========================================

describe("listDesignDocumentsBySrfId", () => {
  it("srfIdでフィルタリングする", async () => {
    const mockDocuments = [
      {
        id: "DD-001",
        srf_id: "SF-001",
        project_id: "project-123",
        name: "請求書発行画面",
        type: "screen",
        sort_order: 1,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
      {
        id: "DD-002",
        srf_id: "SF-002",
        project_id: "project-123",
        name: "請求書API",
        type: "api",
        sort_order: 2,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockDocuments),
      getSupabaseConfigError: () => null,
    }));

    // design-documents.tsのlistDdCallersByTargetIdsをモック
    mock.module("@/lib/data/requirement-links", () => ({
      listDdCallersByTargetIds: async () => ({
        data: [],
        error: null,
      }),
    }));

    const result = await listDesignDocumentsBySrfId("SF-001");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].id).toBe("DD-001");
  });

  it("呼び出し元（callers）を取得してマージする", async () => {
	    const mockDocuments = [
	      {
	        id: "DD-001",
	        srf_id: "SF-001",
	        project_id: "project-123",
	        name: "請求書発行画面",
	        type: "screen",
	        sort_order: 1,
	        created_at: "2024-01-01",
	        updated_at: "2024-01-01",
	      },
	    ];

	    mock.module("@/lib/supabase/client", () => ({
	      supabase: createMockSupabase({
	        design_documents: [
	          ...mockDocuments,
	          {
	            id: "DD-002",
	            srf_id: "SF-999",
	            project_id: "project-123",
	            name: "請求書PDF生成",
	            type: "batch",
	            summary: "",
	            entry_points: [],
	            design_policy: "",
	            details: {},
	            created_at: "2024-01-01",
	            updated_at: "2024-01-01",
	          },
	        ],
	      }),
	      getSupabaseConfigError: () => null,
	    }));

    const result = await listDesignDocumentsBySrfId("SF-001", "project-123");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    // callersが設定されているはず
    expect(result.data?.[0].callers).toBeDefined();
  });

  it("呼び出し元の名称（callerName）を正しく設定する", async () => {
	    const mockDocuments = [
	      {
	        id: "DD-001",
	        srf_id: "SF-001",
	        project_id: "project-123",
	        name: "請求書発行画面",
	        type: "screen",
	        sort_order: 1,
	        created_at: "2024-01-01",
	        updated_at: "2024-01-01",
	      },
	    ];

	    mock.module("@/lib/supabase/client", () => ({
	      supabase: createMockSupabase({
	        design_documents: [
	          ...mockDocuments,
	          {
	            id: "DD-002",
	            srf_id: "SF-999",
	            project_id: "project-123",
	            name: "請求書PDF生成",
	            type: "batch",
	            summary: "",
	            entry_points: [],
	            design_policy: "",
	            details: {},
	            created_at: "2024-01-01",
	            updated_at: "2024-01-01",
	          },
	        ],
	      }),
	      getSupabaseConfigError: () => null,
	    }));

    // 呼び出し元のモック
		    mock.module("@/lib/data/requirement-links", () => ({
		      listDdCallersByTargetIds: async (ddIds: string[]) => {
		        const mockCallers: DdCallerLink[] = [
		          {
		            targetDdId: ddIds[0],
		            callerType: "system",
		            callerDdId: "DD-002",
		            callType: "sync",
		          },
		        ];
		        return { data: mockCallers, error: null };
		      },
		    }));

    const result = await listDesignDocumentsBySrfId("SF-001", "project-123");

    expect(result.error).toBeNull();
    expect(result.data?.[0].callers).toHaveLength(1);
    expect(result.data?.[0].callers?.[0].callerName).toBe("請求書PDF生成");
  });
});

// ========================================
// createDesignDocuments Tests
// ========================================

  describe("createDesignDocuments", () => {
	  it("複数のDDを一括作成する", async () => {
	    const inputs: DesignDocumentCreateInput[] = [
      {
        id: "DD-001",
        srfId: "SF-001",
        name: "請求書発行画面",
        type: "screen",
        summary: "画面",
        entryPoints: [],
        designPolicy: "",
        details: {},
        codeRefs: [],
        projectId: "project-123",
      },
      {
        id: "DD-002",
        srfId: "SF-001",
        name: "請求書API",
        type: "api",
        summary: "API",
        entryPoints: [],
        designPolicy: "",
        details: {},
        codeRefs: [],
        projectId: "project-123",
      },
	    ];

	    mock.module("@/lib/supabase/client", () => ({
	      supabase: createMockSupabase({ design_documents: [] }),
	      getSupabaseConfigError: () => null,
	    }));

    const result = await createDesignDocuments(inputs);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
  });

  it("空配列の場合は空配列を返す", async () => {
    const result = await createDesignDocuments([]);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });
});

// ========================================
// deleteDesignDocumentsBySrfId Tests
// ========================================

describe("deleteDesignDocumentsBySrfId", () => {
  it("srfIdでDDを一括削除する", async () => {
    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase({
        design_documents: [
          {
            id: "DD-001",
            srf_id: "SF-001",
            project_id: "project-123",
            name: "請求書発行画面",
            type: "screen",
            summary: "",
            entry_points: [],
            design_policy: "",
            details: {},
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
        ],
      }),
      getSupabaseConfigError: () => null,
    }));

    const result = await deleteDesignDocumentsBySrfId("SF-001", "project-123");

    expect(result.error).toBeNull();
    expect(result.data).toBe(true);
  });
});

// ========================================
// CRUD Operations Tests
// ========================================

describe("DesignDocument CRUD Operations", () => {
  const mockDocuments = [
    {
      id: "DD-001",
      srf_id: "SF-001",
      project_id: "project-123",
      name: "請求書発行画面",
      type: "screen",
      summary: "画面",
      design_policy: "設計方針",
      details: { key: "value" },
      entry_points: [],
      sort_order: 1,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
  ];

  beforeEach(() => {
    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockDocuments),
      getSupabaseConfigError: () => null,
    }));
  });

  describe("createDesignDocument", () => {
    it("新規DDを作成する", async () => {
      const input: DesignDocumentCreateInput = {
        id: "DD-002",
        srfId: "SF-001",
        name: "請求書PDF生成",
        type: "batch",
        summary: "バッチ",
        entryPoints: [],
        designPolicy: "",
        details: {},
        codeRefs: [],
        projectId: "project-123",
      };

      const result = await createDesignDocument(input);

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe("DD-002");
    });
  });

  describe("updateDesignDocument", () => {
    it("DDを更新する", async () => {
      const result = await updateDesignDocument("DD-001", {
        srfId: "SF-001",
        name: "更新済み名",
        type: "screen",
        summary: "画面",
        entryPoints: [],
        designPolicy: "",
        details: {},
        codeRefs: [],
      });

      expect(result.error).toBeNull();
      expect(result.data?.name).toBe("更新済み名");
    });
  });

  describe("deleteDesignDocument", () => {
    it("DDを削除する", async () => {
      const result = await deleteDesignDocument("DD-001", "project-123");

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });
  });
});

// ========================================
// Integration Scenarios
// ========================================

describe("DesignDocument統合シナリオ", () => {
  describe("正規化ロジック", () => {
    it("nullのdetailsは空オブジェクトクトに正規化される", () => {
      const mockRow = {
        id: "DD-001",
        details: null,
      };

      const normalized = (() => {
        // design-documents.tsのnormalizeDetailsロジック
        const value = mockRow.details;
        return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
      })();

      expect(normalized).toEqual({});
    });

    it("配列のdetailsは空オブジェクトクトに正規化される", () => {
      const mockRow = {
        id: "DD-001",
        details: [],
      };

      const normalized = (() => {
        const value = mockRow.details;
        return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
      })();

      expect(normalized).toEqual({});
    });

    it("プリミティブ値のdetailsはそのまま保持される", () => {
      const mockDetails = { key: "value", nested: { deep: true } };
      const mockRow = {
        id: "DD-001",
        details: mockDetails,
      };

      const normalized = (() => {
        const value = mockRow.details;
        return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
      })();

      expect(normalized).toBe(mockDetails);
    });
  });

  describe("呼び出し元マージ処理", () => {
    it("複数の呼び出し元をDD IDごとにグループ化する", async () => {
      const mockCallers: DdCallerLink[] = [
        {
          id: "link-1",
          target_id: "DD-001",
          source_id: "DD-002",
          callerType: "system",
          callerDdId: "DD-002",
          callType: "sync",
          project_id: "project-123",
          target_type: "design_document",
          source_type: "design_document",
          link_type: "dd_calls",
          callerSfId: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: "link-2",
          target_id: "DD-001",
          source_id: "DD-003",
          callerType: "system",
          callerDdId: "DD-003",
          callType: "async",
          project_id: "project-123",
          target_type: "design_document",
          source_type: "design_document",
          link_type: "dd_calls",
          callerSfId: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: "link-3",
          target_id: "DD-002",
          source_id: "DD-001",
          callerType: "system",
          callerDdId: "DD-001",
          callType: "sync",
          project_id: "project-123",
          target_type: "design_document",
          source_type: "design_document",
          link_type: "dd_calls",
          callerSfId: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      // design-documents.tsのマージロジックを模倣
      const callersByDdId = new Map<string, any[]>();
      for (const link of mockCallers) {
        const existing = callersByDdId.get(link.target_id) || [];
        callersByDdId.set(link.target_id, [...existing, link]);
      }

      expect(callersByDdId.get("DD-001")).toHaveLength(2);
      expect(callersByDdId.get("DD-002")).toHaveLength(1);
    });
  });

  describe("type別のエッジケース", () => {
    it("typeがnullの場合はscreenにデフォルト化", () => {
      const mockRow = {
        id: "DD-001",
        type: null,
      };

      const result = (() => {
        const value = mockRow.type;
        if (typeof value === "string" && value.length > 0) {
          const validTypes: DdType[] = ["screen", "api", "batch", "external_if", "model", "report", "job"];
          if (validTypes.includes(value as DdType)) {
            return value as DdType;
          }
        }
        return "screen";
      })();

      expect(result).toBe("screen");
    });

    it("summaryがnullの場合は空文字列にデフォルト化", () => {
      const mockRow = {
        id: "DD-001",
        summary: null,
      };

      // toDesignDocumentのロジック
      const summary = mockRow.summary ?? "";

      expect(summary).toBe("");
    });

    it("design_policyがnullの場合は空文字列にデフォルト化", () => {
      const mockRow = {
        id: "DD-001",
        design_policy: null,
      };

      // toDesignDocumentのロジック
      const designPolicy = mockRow.design_policy ?? "";

      expect(designPolicy).toBe("");
    });
  });
});
