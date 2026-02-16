import { describe, it, expect } from "bun:test";
import {
  validateSystemFunctionBasic,
  validateSystemFunctionEntryPoints,
  validateDesignDocuments,
} from "../../../../lib/utils/system-functions/validate-system-function";
import { validateEntryPoints } from "../../../../lib/utils/system-functions/entry-points";
import type { EntryPoint } from "../../../../lib/domain";
import type { DesignDocumentDraft } from "../../../../lib/utils/system-functions/validate-system-function";

// テスト用ヘルパー
function createEntryPoint(path: string, type?: string): EntryPoint {
  return {
    path,
    type: type as any,
    responsibility: null,
  };
}

function createDesignDocument(
  id: string,
  overrides?: Partial<DesignDocumentDraft>
): DesignDocumentDraft {
  return {
    id,
    name: `テストDD${id}`,
    summary: "テスト概要",
    type: "screen",
    entryPoints: [createEntryPoint(`/app/test/${id.toLowerCase()}`)],
    designPolicy: "",
    structuredSpec: undefined,
    dependencies: [],
    ...overrides,
  };
}

describe("validateSystemFunctionBasic", () => {
  it("タイトルと概要がある場合はnullを返す", () => {
    const result = validateSystemFunctionBasic({
      title: "テスト機能",
      summary: "テスト概要",
    });
    expect(result).toBeNull();
  });

  it("タイトルが空の場合はエラーを返す", () => {
    const result = validateSystemFunctionBasic({
      title: "",
      summary: "テスト概要",
    });
    expect(result).toBe("タイトルは必須です。");
  });

  it("タイトルが空白のみの場合はエラーを返す", () => {
    const result = validateSystemFunctionBasic({
      title: "   ",
      summary: "テスト概要",
    });
    expect(result).toBe("タイトルは必須です。");
  });

  it("概要が空の場合はエラーを返す", () => {
    const result = validateSystemFunctionBasic({
      title: "テスト機能",
      summary: "",
    });
    expect(result).toBe("概要は必須です。");
  });

  it("概要が空白のみの場合はエラーを返す", () => {
    const result = validateSystemFunctionBasic({
      title: "テスト機能",
      summary: "  \t  ",
    });
    expect(result).toBe("概要は必須です。");
  });

  it("両方空の場合はタイトルのエラーを優先して返す", () => {
    const result = validateSystemFunctionBasic({
      title: "",
      summary: "",
    });
    expect(result).toBe("タイトルは必須です。");
  });

  it("trimされた値で判定される", () => {
    const result = validateSystemFunctionBasic({
      title: "  テスト機能  ",
      summary: "  テスト概要  ",
    });
    expect(result).toBeNull();
  });
});

describe("validateSystemFunctionEntryPoints", () => {
  it("有効なエントリポイントの場合はnullを返す", () => {
    const entryPoints: EntryPoint[] = [
      createEntryPoint("/app/test/page.tsx", "screen"),
    ];
    const result = validateSystemFunctionEntryPoints(entryPoints);
    expect(result).toBeNull();
  });

  it("空のエントリポイント配列はnullを返す", () => {
    const result = validateSystemFunctionEntryPoints([]);
    expect(result).toBeNull();
  });

  it("パスが空の場合はエラーを返す", () => {
    const entryPoints: EntryPoint[] = [
      createEntryPoint("", "screen"),
    ];
    const result = validateSystemFunctionEntryPoints(entryPoints);
    expect(result).toBe("エントリポイントのパスは必須です。");
  });

  it("パスが空白のみの場合はエラーを返す", () => {
    const entryPoints: EntryPoint[] = [
      createEntryPoint("   ", "screen"),
    ];
    const result = validateSystemFunctionEntryPoints(entryPoints);
    expect(result).toBe("エントリポイントのパスは必須です。");
  });

  it("パスが重複している場合はエラーを返す", () => {
    const entryPoints: EntryPoint[] = [
      createEntryPoint("/app/test/page.tsx", "screen"),
      createEntryPoint("/app/test/page.tsx", "screen"),
    ];
    const result = validateSystemFunctionEntryPoints(entryPoints);
    expect(result).toBe("エントリポイントのパスが重複しています。");
  });

  it("前後空白を含むパスはtrimされる", () => {
    const entryPoints: EntryPoint[] = [
      createEntryPoint("  /app/test/page.tsx  ", "screen"),
    ];
    const result = validateSystemFunctionEntryPoints(entryPoints);
    expect(result).toBeNull();
  });
});

describe("validateDesignDocuments", () => {
  it("有効なDD配列の場合はnullを返す", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001"),
      createDesignDocument("DD-002"),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBeNull();
  });

  it("空のDD配列はnullを返す", () => {
    const result = validateDesignDocuments([]);
    expect(result).toBeNull();
  });

  it("DDの名称が空の場合はエラーを返す", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", { name: "" }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBe("DD（DD-001）の名称は必須です。");
  });

  it("DDの名称が空白のみの場合はエラーを返す", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", { name: "   " }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBe("DD（DD-001）の名称は必須です。");
  });

  it("DDの概要が空の場合はエラーを返す", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", { summary: "" }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBe("DD（DD-001）の概要は必須です。");
  });

  it("DDのエントリポイントが空の場合はエラーを返す", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", { entryPoints: [] }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBe("DD（DD-001）のエントリポイントは必須です。");
  });

  it("DDのエントリポイントに空パスがある場合はエラーを返す", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", {
        entryPoints: [createEntryPoint("")],
      }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBe("DD（DD-001）: エントリポイントのパスは必須です。");
  });

  it("DDのエントリポイントが重複している場合はエラーを返す", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", {
        entryPoints: [
          createEntryPoint("/app/test/page.tsx"),
          createEntryPoint("/app/test/page.tsx"),
        ],
      }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBe("DD（DD-001）: エントリポイントのパスが重複しています。");
  });

  it("無効な呼び出し先DDがある場合はエラーを返す", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", {
        dependencies: [{ targetDdId: "DD-999", callType: "calls_sync" }],
      }),
      createDesignDocument("DD-002"),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBe("DD（DD-001）: 呼び出し先DD（DD-999）が存在しません。");
  });

  it("自己参照の呼び出し依存がある場合はエラーを返す", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", {
        dependencies: [{ targetDdId: "DD-001", callType: "calls_sync" }],
      }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBe("DD（DD-001）: 自己参照の呼び出し依存は設定できません。");
  });

  it("呼び出し依存が重複している場合はエラーを返す", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", {
        dependencies: [
          { targetDdId: "DD-002", callType: "calls_sync" },
          { targetDdId: "DD-002", callType: "calls_sync" },
        ],
      }),
      createDesignDocument("DD-002"),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBe("DD（DD-001）: 呼び出し依存が重複しています（DD-002/calls_sync）。");
  });

  it("異なるcallTypeは重複として扱われない", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", {
        dependencies: [
          { targetDdId: "DD-002", callType: "calls_sync" },
          { targetDdId: "DD-002", callType: "calls_async" },
        ],
      }),
      createDesignDocument("DD-002"),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBeNull(); // 異なるcallTypeはOK
  });

  it("循環依存は許可される", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", {
        dependencies: [{ targetDdId: "DD-002", callType: "calls_sync" }],
      }),
      createDesignDocument("DD-002", {
        dependencies: [{ targetDdId: "DD-001", callType: "calls_sync" }],
      }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBeNull();
  });

  it("複数のDDで最初のエラーが返される", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", { name: "" }), // 最初のエラー
      createDesignDocument("DD-002", { summary: "" }),
      createDesignDocument("DD-003", { entryPoints: [] }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBe("DD（DD-001）の名称は必須です。"); // 最初のエラー
  });

  it("structuredSpecがundefinedの場合はバリデーションをスキップ", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", {
        structuredSpec: undefined,
      }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBeNull();
  });

  it("structuredSpecが有効な場合はバリデーションを通過", () => {
    const dds: DesignDocumentDraft[] = [
      createDesignDocument("DD-001", {
        structuredSpec: {
          version: "1",
          ioType: "screen",
        },
      }),
    ];
    const result = validateDesignDocuments(dds);
    expect(result).toBeNull();
  });
});

describe("validateEntryPoints (entry-points.ts)", () => {
  it("有効なエントリポイントの場合はnullを返す", () => {
    const entryPoints: EntryPoint[] = [
      createEntryPoint("/app/test/page.tsx"),
    ];
    const result = validateEntryPoints(entryPoints);
    expect(result).toBeNull();
  });

  it("空の配列はnullを返す", () => {
    const result = validateEntryPoints([]);
    expect(result).toBeNull();
  });

  it("パスが空の場合はエラーを返す", () => {
    const entryPoints: EntryPoint[] = [
      createEntryPoint(""),
    ];
    const result = validateEntryPoints(entryPoints);
    expect(result).toBe("エントリポイントのパスは必須です。");
  });

  it("パスが空白のみの場合はエラーを返す", () => {
    const entryPoints: EntryPoint[] = [
      createEntryPoint("   "),
    ];
    const result = validateEntryPoints(entryPoints);
    expect(result).toBe("エントリポイントのパスは必須です。");
  });

  it("パスが重複している場合はエラーを返す", () => {
    const entryPoints: EntryPoint[] = [
      createEntryPoint("/app/test/page.tsx"),
      createEntryPoint("/app/test/page.tsx"),
    ];
    const result = validateEntryPoints(entryPoints);
    expect(result).toBe("エントリポイントのパスが重複しています。");
  });

  it("前後空白を含むパスはtrimされる", () => {
    const entryPoints: EntryPoint[] = [
      createEntryPoint("  /app/test/page.tsx  "),
    ];
    const result = validateEntryPoints(entryPoints);
    expect(result).toBeNull();
  });
});
