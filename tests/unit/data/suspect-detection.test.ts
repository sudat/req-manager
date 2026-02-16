import { describe, it, expect } from "bun:test";
import {
  markRelatedLinksSuspect,
  getSuspectReason,
  shouldMarkSuspect,
  extractSuspectFields,
  markChangedFieldsSuspect,
  detectChangedFields,
} from "@/lib/data/suspect-detection";

// ========================================
// getSuspectReason Tests
// ========================================

describe("getSuspectReason", () => {
  it("BRのフィールド変更に対する理由を生成する", () => {
    expect(getSuspectReason("br", "summary")).toBe("業務要件の概要が変更されました");
    expect(getSuspectReason("br", "goal")).toBe("業務要件の目標が変更されました");
    expect(getSuspectReason("br", "constraints")).toBe("業務要件の制約条件が変更されました");
  });

  it("SRのフィールド変更に対する理由を生成する", () => {
    expect(getSuspectReason("sr", "summary")).toBe("システム要件の概要が変更されました");
    expect(getSuspectReason("sr", "acceptanceCriteria")).toBe("システム要件の受入基準が変更されました");
  });

  it("未知のフィールド名はそのまま使用する", () => {
    expect(getSuspectReason("br", "unknown_field")).toBe("業務要件のunknown_fieldが変更されました");
    expect(getSuspectReason("sr", "custom_field")).toBe("システム要件のcustom_fieldが変更されました");
  });

  it("acceptance_criteriaとacceptanceCriteriaの両方に対応する", () => {
    expect(getSuspectReason("br", "acceptanceCriteria")).toBe("業務要件の受入基準が変更されました");
    expect(getSuspectReason("sr", "acceptance_criteria")).toBe("システム要件の受入基準が変更されました");
  });
});

// ========================================
// shouldMarkSuspect Tests
// ========================================

describe("shouldMarkSuspect", () => {
  it("疑義フラグを立てる必要があるフィールドはtrueを返す", () => {
    expect(shouldMarkSuspect("summary")).toBe(true);
    expect(shouldMarkSuspect("goal")).toBe(true);
    expect(shouldMarkSuspect("constraints")).toBe(true);
    expect(shouldMarkSuspect("acceptanceCriteria")).toBe(true);
    expect(shouldMarkSuspect("acceptance_criteria")).toBe(true);
  });

  it("疑義フラグを立てる必要がないフィールドはfalseを返す", () => {
    expect(shouldMarkSuspect("id")).toBe(false);
    expect(shouldMarkSuspect("title")).toBe(false);
    expect(shouldMarkSuspect("name")).toBe(false);
    expect(shouldMarkSuspect("status")).toBe(false);
    expect(shouldMarkSuspect("unknown_field")).toBe(false);
  });
});

// ========================================
// extractSuspectFields Tests
// ========================================

describe("extractSuspectFields", () => {
  it("疑義フィールドのみを抽出する", () => {
    const changedFields = ["title", "summary", "goal", "status", "acceptanceCriteria"];
    const result = extractSuspectFields(changedFields);

    expect(result).toEqual(["summary", "goal", "acceptanceCriteria"]);
  });

  it("空配列の場合は空配列を返す", () => {
    expect(extractSuspectFields([])).toEqual([]);
  });

  it("全て疑義対象外の場合は空配列を返す", () => {
    expect(extractSuspectFields(["id", "title", "status"])).toEqual([]);
  });

  it("acceptanceCriteriaとacceptance_criteriaの両方を抽出する", () => {
    const changedFields = ["acceptanceCriteria", "acceptance_criteria"];
    const result = extractSuspectFields(changedFields);

    expect(result).toEqual(["acceptanceCriteria", "acceptance_criteria"]);
  });
});

// ========================================
// detectChangedFields Tests
// ========================================

describe("detectChangedFields", () => {
  it("プリミティブ値の変更を検出する", () => {
    const edited = { title: "New Title", summary: "Same Summary", status: "active" };
    const existing = { title: "Old Title", summary: "Same Summary", status: "pending" };

    const result = detectChangedFields(edited, existing);

    expect(result).toEqual(["title", "status"]);
  });

  it("配列値の変更をJSON文字列で比較して検出する", () => {
    const edited = { constraints: ["A", "B", "C"] };
    const existing = { constraints: ["A", "B", "D"] };

    const result = detectChangedFields(edited, existing);

    expect(result).toEqual(["constraints"]);
  });

  it("オブジェクト値の変更をJSON文字列で比較して検出する", () => {
    const edited = { metadata: { key1: "value1", key2: "value2" } };
    const existing = { metadata: { key1: "value1", key2: "changed" } };

    const result = detectChangedFields(edited, existing);

    expect(result).toEqual(["metadata"]);
  });

  it("同じ配列順序が異なっていても変更として検出する", () => {
    const edited = { items: ["A", "B", "C"] };
    const existing = { items: ["C", "B", "A"] };

    const result = detectChangedFields(edited, existing);

    expect(result).toEqual(["items"]);
  });

  it("フィールドが片方にしか存在しない場合はスキップする", () => {
    const edited = { title: "Title", extra: "extra_field" };
    const existing = { title: "Title", different: "different_field" };

    const result = detectChangedFields(edited, existing);

    // extraとdifferentは比較対象外
    expect(result).toEqual([]);
  });

  it("すべての値が同じ場合は空配列を返す", () => {
    const edited = { title: "Same", summary: "Same", status: "active" };
    const existing = { title: "Same", summary: "Same", status: "active" };

    expect(detectChangedFields(edited, existing)).toEqual([]);
  });

  it("acceptanceCriteria配列の変更を検出する", () => {
    const edited = { acceptanceCriteria: ["Criteria 1", "Criteria 2"] };
    const existing = { acceptanceCriteria: ["Criteria 1", "Criteria 3"] };

    const result = detectChangedFields(edited, existing);

    expect(result).toEqual(["acceptanceCriteria"]);
  });

  it("acceptance_criteria（アンダースコア）の変更を検出する", () => {
    const edited = { acceptance_criteria: ["Criteria 1"] };
    const existing = { acceptance_criteria: ["Criteria 2"] };

    const result = detectChangedFields(edited, existing);

    expect(result).toEqual(["acceptance_criteria"]);
  });
});

// ========================================
// Integration Scenarios
// ========================================

describe("疑義検出統合シナリオ", () => {
  describe("BR更新時の変更検出フロー", () => {
    it("BRの概要変更を検出し、疑義フィールドを抽出する", () => {
      const editedBr = { id: "BR-001", goal: "Updated Goal", constraints: ["A", "B"] };
      const existingBr = { id: "BR-001", goal: "Original Goal", constraints: ["A", "B"] };

      const changedFields = detectChangedFields(editedBr, existingBr);
      const suspectFields = extractSuspectFields(changedFields);

      expect(changedFields).toEqual(["goal"]);
      expect(suspectFields).toEqual(["goal"]);
    });

    it("BRの制約と受入基準の同時変更を検出する", () => {
      const editedBr = {
        id: "BR-001",
        constraints: ["A", "B", "C"],
        acceptanceCriteria: ["Criteria 1"],
      };
      const existingBr = {
        id: "BR-001",
        constraints: ["A", "B"],
        acceptanceCriteria: ["Criteria 2"],
      };

      const changedFields = detectChangedFields(editedBr, existingBr);
      const suspectFields = extractSuspectFields(changedFields);

      expect(changedFields).toEqual(["constraints", "acceptanceCriteria"]);
      expect(suspectFields).toEqual(["constraints", "acceptanceCriteria"]);
    });
  });

  describe("SR更新時の変更検出フロー", () => {
    it("SRの概要変更を検出する", () => {
      const editedSr = { id: "SR-001", summary: "Updated Summary" };
      const existingSr = { id: "SR-001", summary: "Original Summary" };

      const changedFields = detectChangedFields(editedSr, existingSr);

      expect(changedFields).toEqual(["summary"]);
    });

    it("SRの受入基準変更を検出する", () => {
      const editedSr = { id: "SR-001", acceptance_criteria: ["AC1", "AC2"] };
      const existingSr = { id: "SR-001", acceptance_criteria: ["AC1"] };

      const changedFields = detectChangedFields(editedSr, existingSr);

      expect(changedFields).toEqual(["acceptance_criteria"]);
    });
  });

  describe("複雑なオブジェクトクト配列の比較", () => {
    it("ネストされたオブジェクトの変更を検出する", () => {
      const edited = {
        metadata: {
          level1: { level2: "value" },
        },
      };
      const existing = {
        metadata: {
          level1: { level2: "different" },
        },
      };

      const result = detectChangedFields(edited, existing);

      expect(result).toEqual(["metadata"]);
    });

    it("オブジェクトの配列の変更を検出する", () => {
      const edited = { items: [{ id: 1, name: "A" }, { id: 2, name: "B" }] };
      const existing = { items: [{ id: 1, name: "A" }, { id: 2, name: "C" }] };

      const result = detectChangedFields(edited, existing);

      expect(result).toEqual(["items"]);
    });
  });

  describe("境界値テスト", () => {
    it("空文字列から非空文字列への変更を検出する", () => {
      const edited = { summary: "Not Empty" };
      const existing = { summary: "" };

      expect(detectChangedFields(edited, existing)).toEqual(["summary"]);
    });

    it("非空文字列から空文字列への変更を検出する", () => {
      const edited = { summary: "" };
      const existing = { summary: "Not Empty" };

      expect(detectChangedFields(edited, existing)).toEqual(["summary"]);
    });

    it("nullから値への変更を検出する", () => {
      const edited = { summary: "Has Value" };
      const existing = { summary: null };

      expect(detectChangedFields(edited, existing)).toEqual(["summary"]);
    });

    it("値からnullへの変更を検出する", () => {
      const edited = { summary: null };
      const existing = { summary: "Had Value" };

      expect(detectChangedFields(edited, existing)).toEqual(["summary"]);
    });

    it("undefinedは比較対象外として扱う", () => {
      const edited = { summary: undefined, title: "Title" };
      const existing = { summary: "Summary", title: "Title" };

      // summaryはundefinedのためスキップされる
      expect(detectChangedFields(edited, existing)).toEqual([]);
    });
  });

  describe("マークすべきでない変更", () => {
    it("titleの変更は疑義フラグを立てない", () => {
      const changedFields = ["title", "id", "status"];
      const result = extractSuspectFields(changedFields);

      expect(result).toEqual([]);
    });

    it("nameやcreatedAtの変更は疑義フラグを立てない", () => {
      const changedFields = ["name", "createdAt", "updatedAt"];
      const result = extractSuspectFields(changedFields);

      expect(result).toEqual([]);
    });
  });
});
