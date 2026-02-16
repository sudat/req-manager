import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  listConcepts,
  getConceptById,
  createConcept,
  updateConcept,
  deleteConcept,
  updateConceptsSortOrder,
  getConceptsLookupMap,
  findSimilarConcepts,
  type ConceptInput,
  type ConceptCreateInput,
} from "@/lib/data/concepts";
import type { Concept, BusinessArea } from "@/lib/domain";

// ========================================
// Mock Setup
// ========================================

// Supabase clientのモック
const createMockSupabase = (initialData: any[] = []) => {
  let data = [...initialData];
  return {
    from: () => ({
      select: () => createMockSupabase(data),
      insert: (payload: any) => {
        data.push(...payload);
        return createMockSupabase(data);
      },
      update: (payload: any) => {
        data = data.map((d) => ({ ...d, ...payload }));
        return createMockSupabase(data);
      },
      delete: () => createMockSupabase(data),
      eq: (column: string, value: any) => {
        if (column === "project_id") {
          data = data.filter((d) => d.project_id === value);
        }
        if (column === "id") {
          data = data.filter((d) => d.id === value);
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

// 各テスト前にモックを設定
beforeEach(() => {
  mock.module("@/lib/supabase/client", () => ({
    supabase: createMockSupabase(),
    getSupabaseConfigError: () => null,
  }));

  // LLM helpersのモック
  mock.module("@/lib/mastra/utils/llm-helpers", () => ({
    callOpenAI: async () => ({
      content: { similarConcepts: [] },
    }),
  }));
});

// ========================================
// getConceptsLookupMap Tests
// ========================================

describe("getConceptsLookupMap", () => {
  it("用語名と同義語を小文字でマップ化する", async () => {
    // モックデータの設定
    const mockConcepts = [
      { id: "C001", name: "請求書", synonyms: ["インボイス", "Invoice"], definition: "定義1" },
      { id: "C002", name: "売掛金", synonyms: ["Accounts Receivable"], definition: "定義2" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              then: (cb: any) => {
                cb({ data: mockConcepts, error: null });
                return { catch: () => ({ then: (cb: any) => cb() }) };
              },
            }),
          }),
        }),
      },
      getSupabaseConfigError: () => null,
    }));

    const result = await getConceptsLookupMap("project-123");

    expect(result.size).toBe(5); // 2用語名 + 3同義語
    expect(result.get("請求書")).toEqual({
      id: "C001",
      name: "請求書",
      definition: "定義1",
    });
    expect(result.get("インボイス")).toEqual({
      id: "C001",
      name: "請求書",
      definition: "定義1",
    });
    expect(result.get("invoice")).toEqual({
      id: "C001",
      name: "請求書",
      definition: "定義1",
    });
  });

  it("空の同義語配列の場合は用語名のみをマップする", async () => {
    const mockConcepts = [
      { id: "C001", name: "請求書", synonyms: [], definition: "定義" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              then: (cb: any) => cb({ data: mockConcepts, error: null }),
            }),
          }),
        }),
      },
      getSupabaseConfigError: () => null,
    }));

    const result = await getConceptsLookupMap("project-123");

    expect(result.size).toBe(1);
    expect(result.get("請求書")).toBeDefined();
  });

  it("同義語がnullの場合はスキップする", async () => {
    const mockConcepts = [
      { id: "C001", name: "請求書", synonyms: null, definition: "定義" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              then: (cb: any) => cb({ data: mockConcepts, error: null }),
            }),
          }),
        }),
      },
      getSupabaseConfigError: () => null,
    }));

    const result = await getConceptsLookupMap("project-123");

    expect(result.size).toBe(1);
    expect(result.get("請求書")).toBeDefined();
  });
});

// ========================================
// findSimilarConcepts Tests
// ========================================

describe("findSimilarConcepts", () => {
  it("類似度70-90%の概念のみを返す", async () => {
    const mockConcepts = [
      { id: "C001", name: "請求書", definition: "定義1" },
      { id: "C002", name: "納品書", definition: "定義2" },
    ];

    // LLMモックの設定
    mock.module("@/lib/mastra/utils/llm-helpers", () => ({
      callOpenAI: async () => ({
        content: {
          similarConcepts: [
            { id: "C001", name: "請求書", similarityScore: 75 },
            { id: "C002", name: "納品書", similarityScore: 95 }, // 90%以上なので除外
          ],
        },
      }),
    }));

    const result = await findSimilarConcepts("invoice", mockConcepts);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("C001");
    expect(result[0].similarityScore).toBe(75);
  });

  it("類似度降順でソートする", async () => {
    const mockConcepts = [
      { id: "C001", name: "概念A", definition: "定義A" },
      { id: "C002", name: "概念B", definition: "定義B" },
      { id: "C003", name: "概念C", definition: "定義C" },
    ];

    mock.module("@/lib/mastra/utils/llm-helpers", () => ({
      callOpenAI: async () => ({
        content: {
          similarConcepts: [
            { id: "C001", similarityScore: 75 },
            { id: "C002", similarityScore: 85 },
            { id: "C003", similarityScore: 80 },
          ],
        },
      }),
    }));

    const result = await findSimilarConcepts("test", mockConcepts);

    expect(result).toHaveLength(3);
    expect(result[0].similarityScore).toBe(85); // 最も類似度が高い
    expect(result[1].similarityScore).toBe(80);
    expect(result[2].similarityScore).toBe(75);
  });

  it("既存概念が空の場合は空配列を返す", async () => {
    const result = await findSimilarConcepts("test", []);

    expect(result).toEqual([]);
  });

  it("minThresholdとmaxThresholdでフィルタリングする", async () => {
    const mockConcepts = [
      { id: "C001", name: "概念A", definition: "定義A" },
    ];

    mock.module("@/lib/mastra/utils/llm-helpers", () => ({
      callOpenAI: async () => ({
        content: {
          similarConcepts: [
            { id: "C001", similarityScore: 60 }, // minThreshold未満
            { id: "C001", similarityScore: 85 }, // 範囲内
            { id: "C001", similarityScore: 95 }, // maxThreshold以上
          ],
        },
      }),
    }));

    const result = await findSimilarConcepts("test", mockConcepts, 0.7, 0.9);

    expect(result).toHaveLength(1);
    expect(result[0].similarityScore).toBe(85);
  });

  it("definitionを結果に含める", async () => {
    const mockConcepts = [
      { id: "C001", name: "請求書", definition: "請求書の定義です" },
    ];

    mock.module("@/lib/mastra/utils/llm-helpers", () => ({
      callOpenAI: async () => ({
        content: {
          similarConcepts: [
            { id: "C001", similarityScore: 75 },
          ],
        },
      }),
    }));

    const result = await findSimilarConcepts("invoice", mockConcepts);

    expect(result[0].definition).toBe("請求書の定義です");
  });
});

// ========================================
// CRUD Operations Tests
// ========================================

describe("Concept CRUD Operations", () => {
  const mockConcepts: Concept[] = [
    {
      id: "C001",
      name: "請求書",
      synonyms: ["インボイス"],
      areas: ["AR"] as BusinessArea[],
      definition: "定義",
      relatedDocs: [],
      requirementCount: 5,
      sortOrder: 1,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  ];

  beforeEach(() => {
    mock.module("@/lib/supabase/client", () => ({
      supabase: createMockSupabase(mockConcepts),
      getSupabaseConfigError: () => null,
    }));
  });

  describe("listConcepts", () => {
    it("概念一覧を取得する", async () => {
      const result = await listConcepts("project-123");

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeGreaterThan(0);
    });
  });

  describe("getConceptById", () => {
    it("ID指定で概念を取得する", async () => {
      const result = await getConceptById("C001", "project-123");

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe("C001");
    });

    it("存在しないIDの場合はdata: null, error: nullを返す", async () => {
      const result = await getConceptById("C999", "project-123");

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe("createConcept", () => {
    it("新規概念を作成する", async () => {
      const input: ConceptCreateInput = {
        id: "C002",
        name: "売掛金",
        synonyms: [],
        areas: ["AR"],
        definition: "定義",
        relatedDocs: [],
        requirementCount: 0,
        sortOrder: 2,
        projectId: "project-123",
      };

      const result = await createConcept(input);

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe("C002");
    });
  });

  describe("updateConcept", () => {
    it("概念を更新する", async () => {
      const result = await updateConcept("C001", {
        name: "更新済み請求書",
        synonyms: ["インボイス", "Invoice"],
        areas: ["AR"],
        definition: "更新済み定義",
        relatedDocs: [],
        requirementCount: 6,
        sortOrder: 1,
      });

      expect(result.error).toBeNull();
      expect(result.data?.name).toBe("更新済み請求書");
    });
  });

  describe("deleteConcept", () => {
    it("概念を削除する", async () => {
      const result = await deleteConcept("C001", "project-123");

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });
  });
});

// ========================================
// Sort Order Tests
// ========================================

describe("updateConceptsSortOrder", () => {
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
      { id: "C001", sortOrder: 10 },
      { id: "C002", sortOrder: 20 },
      { id: "C003", sortOrder: 30 },
    ];

    const result = await updateConceptsSortOrder(updates, "project-123");

    expect(result.data).toBe(true);
    expect(result.error).toBeNull();
  });

  it("updated_atも同時に更新する", async () => {
    let updated = false;

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: () => ({
          update: (payload: any) => {
            updated = "updated_at" in payload;
            return {
              eq: () => Promise.resolve({ error: null }),
            };
          },
        }),
      },
      getSupabaseConfigError: () => null,
    }));

    await updateConceptsSortOrder([{ id: "C001", sortOrder: 1 }]);

    expect(updated).toBe(true);
  });
});

// ========================================
// Integration Scenarios
// ========================================

describe("Concept統合シナリオ", () => {
  it("概念の正規化ロジック: null値をデフォルト値に変換", () => {
    const mockRow = {
      id: "C001",
      name: "請求書",
      synonyms: null,
      areas: null,
      definition: null,
      related_docs: null,
      requirement_count: null,
      sort_order: null,
    };

    // toEntity関数のテスト
    const concept: Concept = {
      id: mockRow.id,
      name: mockRow.name,
      synonyms: mockRow.synonyms ?? [],
      areas: (mockRow.areas ?? []) as BusinessArea[],
      definition: mockRow.definition ?? "",
      relatedDocs: mockRow.related_docs ?? [],
      requirementCount: mockRow.requirement_count ?? 0,
      sortOrder: mockRow.sort_order ?? 0,
      createdAt: "",
      updatedAt: "",
    };

    expect(concept.synonyms).toEqual([]);
    expect(concept.areas).toEqual([]);
    expect(concept.definition).toBe("");
    expect(concept.relatedDocs).toEqual([]);
    expect(concept.requirementCount).toBe(0);
    expect(concept.sortOrder).toBe(0);
  });

  it("概念の検索で大文字小文字を区別しない", async () => {
    const mockConcepts = [
      { id: "C001", name: "請求書", synonyms: ["invoice"], definition: "定義" },
    ];

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              then: (cb: any) => cb({ data: mockConcepts, error: null }),
            }),
          }),
        }),
      },
      getSupabaseConfigError: () => null,
    }));

    const result = await getConceptsLookupMap("project-123");

    expect(result.get("請求書")).toBeDefined();
    expect(result.get("invoice")).toBeDefined();
    expect(result.get("INVOICE")).toBeDefined();
    expect(result.get("請求書")).toEqual({
      id: "C001",
      name: "請求書",
      definition: "定義",
    });
  });
});
