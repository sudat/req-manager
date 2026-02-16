import { describe, it, expect } from "bun:test";
import {
  normalizeAcceptanceCriteriaJson,
  legacyAcceptanceCriteriaToJson,
  acceptanceCriteriaJsonToLegacy,
  mergeAcceptanceCriteriaJsonWithLegacy,
  normalizeEntryPoints,
  codeRefsToEntryPoints,
  entryPointsToCodeRefs,
  normalizeCodeRefs,
  type AcceptanceCriterionJson,
  type EntryPoint,
} from "@/lib/data/structured";

// ========================================
// normalizeAcceptanceCriteriaJson Tests
// ========================================

describe("normalizeAcceptanceCriteriaJson", () => {
  it("正常な構造を持つ配列を正規化する", () => {
    const raw = [
      { id: "AC-001", description: "テスト1", verification_method: "目視確認", givenText: "前提", whenText: "操作", thenText: "期待結果" },
      { id: "AC-002", description: "テスト2", verification_method: null },
    ];

    const result = normalizeAcceptanceCriteriaJson(raw);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("AC-001");
    expect(result[0].description).toBe("テスト1");
    expect(result[0].verification_method).toBe("目視確認");
    expect(result[0].givenText).toBe("前提");
    expect(result[0].whenText).toBe("操作");
    expect(result[0].thenText).toBe("期待結果");
  });

  it("配列でない場合は空配列を返す", () => {
    expect(normalizeAcceptanceCriteriaJson(null)).toEqual([]);
    expect(normalizeAcceptanceCriteriaJson("string")).toEqual([]);
    expect(normalizeAcceptanceCriteriaJson({})).toEqual([]);
    expect(normalizeAcceptanceCriteriaJson(123)).toEqual([]);
  });

  it("オブジェクトでない場合はデフォルト値を設定する", () => {
    const raw = [
      null,
      "string",
      123,
      { id: "AC-001", description: "テスト" },
    ];

    const result = normalizeAcceptanceCriteriaJson(raw);

    expect(result).toHaveLength(4);
    expect(result[0].id).toBe("AC-001"); // インデックスベースのID
    expect(result[1].id).toBe("AC-002");
    expect(result[2].id).toBe("AC-003");
    expect(result[3].id).toBe("AC-001"); // 有効なオブジェクト
  });

  it("空のidはインデックスベースのIDを生成する", () => {
    const raw = [
      { id: "", description: "テスト1" },
      { id: "   ", description: "テスト2" },
    ];

    const result = normalizeAcceptanceCriteriaJson(raw);

    expect(result[0].id).toBe("AC-001");
    expect(result[1].id).toBe("AC-002");
  });

  it("verification_methodがnullの場合はnullのままにする", () => {
    const raw = [
      { id: "AC-001", description: "テスト", verification_method: null },
    ];

    const result = normalizeAcceptanceCriteriaJson(raw);

    expect(result[0].verification_method).toBeNull();
  });

  it("given/when/thenフィールドがlegacy形式から変換される", () => {
    const raw = [
      {
        id: "AC-001",
        description: "テスト",
        given: "legacy_given",
        when: "legacy_when",
        then: "legacy_then",
      },
    ];

    const result = normalizeAcceptanceCriteriaJson(raw);

    expect(result[0].givenText).toBe("legacy_given");
    expect(result[0].whenText).toBe("legacy_when");
    expect(result[0].thenText).toBe("legacy_then");
  });

  it("givenTextが優先されgivenは無視される", () => {
    const raw = [
      {
        id: "AC-001",
        given: "legacy_given",
        givenText: "new_given",
      },
    ];

    const result = normalizeAcceptanceCriteriaJson(raw);

    expect(result[0].givenText).toBe("new_given");
  });
});

// ========================================
// legacyAcceptanceCriteriaToJson Tests
// ========================================

describe("legacyAcceptanceCriteriaToJson", () => {
  it("文字列配列を構造化JSONに変換する", () => {
    const legacy = ["受入チェック", "処理実行", "結果確認"];

    const result = legacyAcceptanceCriteriaToJson(legacy);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("AC-001");
    expect(result[0].description).toBe("受入チェック");
    expect(result[0].verification_method).toBeNull();
    expect(result[1].id).toBe("AC-002");
    expect(result[1].description).toBe("処理実行");
    expect(result[2].id).toBe("AC-003");
    expect(result[2].description).toBe("結果確認");
  });

  it("空配列の場合は空配列を返す", () => {
    expect(legacyAcceptanceCriteriaToJson([])).toEqual([]);
  });
});

// ========================================
// acceptanceCriteriaJsonToLegacy Tests
// ========================================

describe("acceptanceCriteriaJsonToLegacy", () => {
  it("構造化JSONから文字列配列に変換する", () => {
    const json: AcceptanceCriterionJson[] = [
      { id: "AC-001", description: "テスト1", verification_method: "目視確認", givenText: "", whenText: "", thenText: "" },
      { id: "AC-002", description: "テスト2", verification_method: null, givenText: "", whenText: "", thenText: "" },
    ];

    const result = acceptanceCriteriaJsonToLegacy(json);

    expect(result).toEqual(["テスト1", "テスト2"]);
  });

  it("空配列の場合は空配列を返す", () => {
    expect(acceptanceCriteriaJsonToLegacy([])).toEqual([]);
  });
});

// ========================================
// mergeAcceptanceCriteriaJsonWithLegacy Tests
// ========================================

describe("mergeAcceptanceCriteriaJsonWithLegacy", () => {
  it("ベースJSONとlegacy配列をマージする", () => {
    const baseJson: unknown = [
      { id: "AC-001", description: "元の説明", givenText: "元の前提" },
      { id: "AC-002", description: "元の説明2", givenText: "元の前提2" },
    ];
    const legacy = ["更新された説明1", "更新された説明2"];

    const result = mergeAcceptanceCriteriaJsonWithLegacy(baseJson, legacy);

    expect(result).toHaveLength(2);
    expect(result[0].description).toBe("更新された説明1");
    expect(result[0].givenText).toBe("元の前提"); // baseJsonの値を保持
    expect(result[1].description).toBe("更新された説明2");
    expect(result[1].givenText).toBe("元の前提2");
  });

  it("legacyがbaseJsonより長い場合は新しいエントリを作成", () => {
    const baseJson: unknown = [
      { id: "AC-001", description: "元の説明" },
    ];
    const legacy = ["更新1", "更新2"];

    const result = mergeAcceptanceCriteriaJsonWithLegacy(baseJson, legacy);

    expect(result).toHaveLength(2);
    expect(result[0].description).toBe("更新1");
    expect(result[1].description).toBe("更新2");
  });

  it("baseJsonが空の場合はlegacyから全て生成する", () => {
    const baseJson: unknown = [];
    const legacy = ["説明1", "説明2"];

    const result = mergeAcceptanceCriteriaJsonWithLegacy(baseJson, legacy);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("AC-001");
    expect(result[1].id).toBe("AC-002");
  });

  it("legacyにundefinedが含まれる場合はデフォルト説明を使用", () => {
    const baseJson: unknown = [];
    const legacy = ["説明1", undefined, "説明2"];

    const result = mergeAcceptanceCriteriaJsonWithLegacy(baseJson, legacy);

    expect(result).toHaveLength(3);
    expect(result[0].description).toBe("説明1");
    expect(result[1].description).toBe("");
    expect(result[2].description).toBe("説明2");
  });
});

// ========================================
// normalizeEntryPoints Tests
// ========================================

describe("normalizeEntryPoints", () => {
  it("正常なEntryPoint配列を正規化する", () => {
    const raw = [
      { path: "/app/page.tsx", type: "screen", responsibility: "画面表示" },
      { path: "/api/handler", type: "api", responsibility: "API処理" },
    ];

    const result = normalizeEntryPoints(raw);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ path: "/app/page.tsx", type: "screen", responsibility: "画面表示" });
  });

  it("配列でない場合は空配列を返す", () => {
    expect(normalizeEntryPoints(null)).toEqual([]);
    expect(normalizeEntryPoints("string")).toEqual([]);
    expect(normalizeEntryPoints({})).toEqual([]);
    expect(normalizeEntryPoints(123)).toEqual([]);
  });

  it("パスが空文字列の場合は除外する", () => {
    const raw = [
      { path: "", type: "screen" },
      { path: "/valid/path", type: "api" },
    ];

    const result = normalizeEntryPoints(raw);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("/valid/path");
  });

  it("重複するパスは除外する", () => {
    const raw = [
      { path: "/app/page.tsx", type: "screen" },
      { path: "/app/page.tsx", type: "api" },
      { path: "/app/page.tsx", type: "screen" },
    ];

    const result = normalizeEntryPoints(raw);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("/app/page.tsx");
  });

  it("型が文字列でない場合はnullに変換する", () => {
    const raw = [
      { path: "/path", type: 123, responsibility: true },
      { path: "/path2", type: null, responsibility: undefined },
    ];

    const result = normalizeEntryPoints(raw);

    expect(result[0].type).toBeNull();
    expect(result[0].responsibility).toBeNull();
    expect(result[1].type).toBeNull();
    expect(result[1].responsibility).toBeNull();
  });
});

// ========================================
// codeRefsToEntryPoints Tests
// ========================================

describe("codeRefsToEntryPoints", () => {
  it("CodeRef配列をEntryPoint配列に変換する", () => {
    const codeRefs = [
      { paths: ["/path1.ts", "/path2.ts"] },
      { paths: ["/path3.ts"] },
      { paths: [] },
      null,
    ];

    const result = codeRefsToEntryPoints(codeRefs);

    expect(result).toHaveLength(3);
    expect(result).toContainEqual({ path: "/path1.ts", type: null, responsibility: null });
    expect(result).toContainEqual({ path: "/path2.ts", type: null, responsibility: null });
    expect(result).toContainEqual({ path: "/path3.ts", type: null, responsibility: null });
  });

  it("空のpaths配列は除外する", () => {
    const codeRefs = [
      { paths: [] },
      { paths: null },
      null,
    ];

    const result = codeRefsToEntryPoints(codeRefs);

    expect(result).toEqual([]);
  });

  it("空文字列のパスは除外する", () => {
    const codeRefs = [
      { paths: ["", "/valid"] },
      { paths: ["valid2", ""] },
    ];

    const result = codeRefsToEntryPoints(codeRefs);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ path: "/valid", type: null, responsibility: null });
    expect(result).toContainEqual({ path: "valid2", type: null, responsibility: null });
  });
});

// ========================================
// entryPointsToCodeRefs Tests
// ========================================

describe("entryPointsToCodeRefs", () => {
  it("EntryPoint配列をCodeRef配列に変換する", () => {
    const entryPoints: EntryPoint[] = [
      { path: "/path1.ts", type: "screen", responsibility: "画面" },
      { path: "/path2.ts", type: "api", responsibility: "API" },
    ];

    const result = entryPointsToCodeRefs(entryPoints);

    expect(result).toEqual([
      { paths: ["/path1.ts", "/path2.ts"] },
    ]);
  });

  it("空配列の場合は空のpathsを持つCodeRefを返す", () => {
    const result = entryPointsToCodeRefs([]);

    expect(result).toEqual([{ paths: [] }]);
  });
});

// ========================================
// normalizeCodeRefs Tests
// ========================================

describe("normalizeCodeRefs", () => {
  it("正常なCodeRef配列を正規化する", () => {
    const raw = [
      { githubUrl: "https://github.com/repo", paths: ["/path1.ts", "/path2.ts"], note: "メモ" },
      { paths: ["/path3.ts"] },
    ];

    const result = normalizeCodeRefs(raw);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      githubUrl: "https://github.com/repo",
      paths: ["/path1.ts", "/path2.ts"],
      note: "メモ",
    });
  });

  it("配列でない場合は空配列を返す", () => {
    expect(normalizeCodeRefs(null)).toEqual([]);
    expect(normalizeCodeRefs("string")).toEqual([]);
    expect(normalizeCodeRefs({})).toEqual([]);
  });

  it("pathsが空配列の場合は除外する", () => {
    const raw = [
      { paths: [] },
      { paths: null },
    ];

    const result = normalizeCodeRefs(raw);

    expect(result).toEqual([]);
  });

  it("pathsに非文字列が含まれる場合は除外する", () => {
    const raw = [
      { paths: ["/valid", 123, null, ""] },
    ];

    const result = normalizeCodeRefs(raw);

    expect(result).toHaveLength(1);
    expect(result[0].paths).toEqual(["/valid"]);
  });

  it("githubUrlとnoteが文字列でない場合は除外する", () => {
    const raw = [
      { githubUrl: 123, paths: ["/path"] },
      { paths: ["/path2"], note: null },
      { paths: ["/path3"], note: 456 },
    ];

    const result = normalizeCodeRefs(raw);

    expect(result).toHaveLength(3);
    expect(result[0].githubUrl).toBeUndefined();
    expect(result[1].note).toBeUndefined();
    expect(result[2].note).toBeUndefined();
  });
});

// ========================================
// Integration Scenarios
// ========================================

describe("EntryPoint/CodeRef統合シナリオ", () => {
  describe("EntryPointとCodeRefの相互変換", () => {
    it("EntryPoint → CodeRef → EntryPoint の往復で整合性を保つ", () => {
      const originalEntryPoints: EntryPoint[] = [
        { path: "/path1.ts", type: "screen", responsibility: "画面" },
        { path: "/path2.ts", type: "api", responsibility: "API" },
      ];

      const codeRefs = entryPointsToCodeRefs(originalEntryPoints);
      const restoredEntryPoints = codeRefsToEntryPoints(codeRefs);

      expect(restoredEntryPoints).toHaveLength(2);
      expect(restoredEntryPoints[0].path).toBe("/path1.ts");
      expect(restoredEntryPoints[1].path).toBe("/path2.ts");
      // typeとresponsibilityは元のEntryPointの情報が失われる
      expect(restoredEntryPoints[0].type).toBeNull();
      expect(restoredEntryPoints[0].responsibility).toBeNull();
    });
  });

  describe("受入条件フォーマットの変換", () => {
    it("legacy → JSON → legacy の往復で整合性を保つ", () => {
      const legacy = ["AC1", "AC2", "AC3"];

      const json = legacyAcceptanceCriteriaToJson(legacy);
      const restored = acceptanceCriteriaJsonToLegacy(json);

      expect(restored).toEqual(legacy);
    });

    it("JSON形式のマージでlegacy説明を優先する", () => {
      const baseJson: unknown = [
        { id: "AC-001", description: "古い説明", givenText: "前提" },
        { id: "AC-002", description: "保持される説明", givenText: "前提2" },
      ];
      const legacy = ["新しい説明", "保持される説明2"];

      const result = mergeAcceptanceCriteriaJsonWithLegacy(baseJson, legacy);

      expect(result[0].description).toBe("新しい説明");
      expect(result[0].givenText).toBe("前提"); // baseJsonの他のフィールドは保持
      expect(result[1].description).toBe("保持される説明2");
      expect(result[1].givenText).toBe("前提2");
    });
  });

  describe("エッジケースの処理", () => {
    it("オブジェクトの配列にnullが混在する場合", () => {
      const raw = [
        null,
        { path: "/valid", type: "screen" },
        undefined,
        { path: "", type: "api" },
      ];

      const result = normalizeEntryPoints(raw);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe("/valid");
    });

    it("CodeRefのpathsに空文字列とnullが混在する場合", () => {
      const codeRefs = [
        { paths: ["valid", "", null] },
        { paths: null },
      ];

      const result = codeRefsToEntryPoints(codeRefs);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe("valid");
    });

    it("acceptance_criteriaにgiven/when/thenがない場合は空文字列", () => {
      const raw = [
        { id: "AC-001", description: "テスト" },
      ];

      const result = normalizeAcceptanceCriteriaJson(raw);

      expect(result[0].givenText).toBe("");
      expect(result[0].whenText).toBe("");
      expect(result[0].thenText).toBe("");
    });
  });
});
