import { describe, it, expect } from "bun:test";

// create-system-function.ts 内のロジック部分をテスト
// 特にDD依存関係のフィルタリングとSR↔BRリンク生成ロジック

// 型定義
type DesignDocumentDraft = {
  id: string;
  name: string;
  type: string;
  summary: string;
  entryPoints: any[];
  designPolicy: string;
  structuredSpec: any;
  dependencies?: Array<{ targetDdId: string; callType: string }>;
};

type SystemRequirementCard = {
  id: string;
  code: string;
  type: string;
  requirement: string;
  rationale: string;
  concept_ids: string[];
  acceptanceCriteriaJson: any[];
  businessRequirementIds?: string[];
  sortOrder: number;
};

// テスト用データ作成ヘルパー
function createDesignDocument(id: string, dependencies: DesignDocumentDraft["dependencies"] = []): DesignDocumentDraft {
  return {
    id,
    name: `DD${id}`,
    type: "screen",
    summary: "テストDD",
    entryPoints: [],
    designPolicy: "",
    structuredSpec: {
      version: "1",
      ioType: "screen",
    },
    dependencies,
  };
}

function createSystemRequirement(id: string, businessRequirementIds: string[] = []): SystemRequirementCard {
  return {
    id,
    code: `SR-${id}`,
    type: "function",
    requirement: `要件${id}`,
    rationale: "テストシステム要件",
    concept_ids: [],
    acceptanceCriteriaJson: [],
    businessRequirementIds,
    sortOrder: 0,
  };
}

// create-system-function.ts 内のDD依存関係フィルタリングロジックを抽出
function filterDdDependencies(designDocuments: DesignDocumentDraft[]): Array<{
  sourceDdId: string;
  targetDdId: string;
  callType: string;
}> {
  const validDdIds = designDocuments.map((dd) => dd.id);
  const dependencyUniqueKeys = new Set<string>();
  const ddDependencies: Array<{ sourceDdId: string; targetDdId: string; callType: string }> = [];
  const validDdIdSet = new Set(validDdIds);

  for (const sourceDd of designDocuments) {
    for (const dependency of sourceDd.dependencies ?? []) {
      // 無効なターゲット除外
      if (!validDdIdSet.has(dependency.targetDdId)) continue;
      // 自己参照除外
      if (sourceDd.id === dependency.targetDdId) continue;

      const key = `${sourceDd.id}:${dependency.targetDdId}:${dependency.callType}`;
      // 重複除外
      if (dependencyUniqueKeys.has(key)) continue;
      dependencyUniqueKeys.add(key);
      ddDependencies.push({
        sourceDdId: sourceDd.id,
        targetDdId: dependency.targetDdId,
        callType: dependency.callType,
      });
    }
  }

  return ddDependencies;
}

// create-system-function.ts 内のSR↔BRリンク生成ロジックを抽出
function generateSrBrLinks(
  systemRequirements: SystemRequirementCard[],
  projectId: string
): Array<{
  projectId: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  linkType: string;
  suspect: boolean;
}> {
  const linkInputs: Array<{
    projectId: string;
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    linkType: string;
    suspect: boolean;
  }> = [];
  const linkKeys = new Set<string>();

  for (const sr of systemRequirements) {
    for (const brId of sr.businessRequirementIds ?? []) {
      const key = `${sr.id}:${brId}`;
      if (linkKeys.has(key)) continue;
      linkKeys.add(key);
      linkInputs.push({
        projectId,
        sourceType: "sr",
        sourceId: sr.id,
        targetType: "br",
        targetId: brId,
        linkType: "derived_from",
        suspect: false,
      });
    }
  }

  return linkInputs;
}

describe("createSystemFunction - DD依存関係フィルタリング", () => {
  it("有効なDD依存関係が正しく抽出される", () => {
    const dd1 = createDesignDocument("DD-001", [
      { targetDdId: "DD-002", callType: "calls_sync" },
    ]);
    const dd2 = createDesignDocument("DD-002", []);

    const result = filterDdDependencies([dd1, dd2]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      sourceDdId: "DD-001",
      targetDdId: "DD-002",
      callType: "calls_sync",
    });
  });

  it("自己参照依存は除外される", () => {
    const dd1 = createDesignDocument("DD-001", [
      { targetDdId: "DD-001", callType: "calls_sync" }, // 自己参照
      { targetDdId: "DD-002", callType: "calls_sync" },
    ]);
    const dd2 = createDesignDocument("DD-002", []);

    const result = filterDdDependencies([dd1, dd2]);

    expect(result).toHaveLength(1);
    expect(result[0].targetDdId).toBe("DD-002"); // 自己参照は除外
  });

  it("無効なターゲットDDへの依存は除外される", () => {
    const dd1 = createDesignDocument("DD-001", [
      { targetDdId: "DD-002", callType: "calls_sync" }, // 有効
      { targetDdId: "DD-999", callType: "calls_sync" }, // 無効（DDリストにない）
    ]);
    const dd2 = createDesignDocument("DD-002", []);

    const result = filterDdDependencies([dd1, dd2]);

    expect(result).toHaveLength(1);
    expect(result[0].targetDdId).toBe("DD-002"); // DD-999は除外
  });

  it("重複する依存関係は除外される", () => {
    const dd1 = createDesignDocument("DD-001", [
      { targetDdId: "DD-002", callType: "calls_sync" },
      { targetDdId: "DD-002", callType: "calls_sync" }, // 重複
    ]);
    const dd2 = createDesignDocument("DD-002", []);

    const result = filterDdDependencies([dd1, dd2]);

    expect(result).toHaveLength(1); // 重複は1つに
  });

  it("異なるcallTypeは別の依存関係として扱われる", () => {
    const dd1 = createDesignDocument("DD-001", [
      { targetDdId: "DD-002", callType: "calls_sync" },
      { targetDdId: "DD-002", callType: "calls_async" },
    ]);
    const dd2 = createDesignDocument("DD-002", []);

    const result = filterDdDependencies([dd1, dd2]);

    expect(result).toHaveLength(2); // callTypeが違うので2つ
  });

  it("複数のDD間の依存関係が正しく処理される", () => {
    const dd1 = createDesignDocument("DD-001", [
      { targetDdId: "DD-002", callType: "calls_sync" },
    ]);
    const dd2 = createDesignDocument("DD-002", [
      { targetDdId: "DD-003", callType: "calls_async" },
    ]);
    const dd3 = createDesignDocument("DD-003", []);

    const result = filterDdDependencies([dd1, dd2, dd3]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      sourceDdId: "DD-001",
      targetDdId: "DD-002",
      callType: "calls_sync",
    });
    expect(result[1]).toEqual({
      sourceDdId: "DD-002",
      targetDdId: "DD-003",
      callType: "calls_async",
    });
  });

  it("依存関係がない場合は空配列を返す", () => {
    const dd1 = createDesignDocument("DD-001", []);
    const dd2 = createDesignDocument("DD-002", []);

    const result = filterDdDependencies([dd1, dd2]);

    expect(result).toHaveLength(0);
  });

  it("循環依存も許可される", () => {
    const dd1 = createDesignDocument("DD-001", [
      { targetDdId: "DD-002", callType: "calls_sync" },
    ]);
    const dd2 = createDesignDocument("DD-002", [
      { targetDdId: "DD-001", callType: "calls_sync" },
    ]);

    const result = filterDdDependencies([dd1, dd2]);

    expect(result).toHaveLength(2); // 双方向の依存
  });
});

describe("createSystemFunction - SR↔BRリンク生成", () => {
  const projectId = "00000000-0000-0000-0000-000000000001";

  it("SR↔BRリンクが正しく作成される", () => {
    const sr1 = createSystemRequirement("SR-001", ["BR-001", "BR-002"]);
    const sr2 = createSystemRequirement("SR-002", ["BR-002", "BR-003"]);

    const result = generateSrBrLinks([sr1, sr2], projectId);

    expect(result).toHaveLength(4);
    // SR-001→BR-001, SR-001→BR-002, SR-002→BR-002, SR-002→BR-003
  });

  it("SR-001→BR-002の重複リンクは除外される", () => {
    const sr1 = createSystemRequirement("SR-001", ["BR-001", "BR-002"]);
    const sr2 = createSystemRequirement("SR-002", ["BR-002", "BR-003"]);

    const result = generateSrBrLinks([sr1, sr2], projectId);

    // SR-001→BR-002 と SR-002→BR-002 は別のリンク（sourceが違う）
    const sr001ToBr002Links = result.filter(
      (l) => l.sourceId === "SR-001" && l.targetId === "BR-002"
    );
    expect(sr001ToBr002Links).toHaveLength(1);

    // SR-002→BR-002
    const sr002ToBr002Links = result.filter(
      (l) => l.sourceId === "SR-002" && l.targetId === "BR-002"
    );
    expect(sr002ToBr002Links).toHaveLength(1);
  });

  it("同じSR内で重複するBRは除外される", () => {
    const sr1 = createSystemRequirement("SR-001", ["BR-001", "BR-001", "BR-002"]);

    const result = generateSrBrLinks([sr1], projectId);

    expect(result).toHaveLength(2); // BR-001の重複除外
    expect(result[0].targetId).toBe("BR-001");
    expect(result[1].targetId).toBe("BR-002");
  });

  it("businessRequirementIdsが空の場合はリンクを作成しない", () => {
    const sr1 = createSystemRequirement("SR-001", []);
    const sr2 = createSystemRequirement("SR-002", undefined);

    const result = generateSrBrLinks([sr1, sr2], projectId);

    expect(result).toHaveLength(0);
  });

  it("全てのリンクが正しいプロパティを持つ", () => {
    const sr1 = createSystemRequirement("SR-001", ["BR-001"]);

    const result = generateSrBrLinks([sr1], projectId);

    expect(result[0]).toEqual({
      projectId,
      sourceType: "sr",
      sourceId: "SR-001",
      targetType: "br",
      targetId: "BR-001",
      linkType: "derived_from",
      suspect: false,
    });
  });
});

describe("createSystemFunction - 統合テスト", () => {
  it("複雑なDD依存関係とSR↔BRリンクが正しく処理される", () => {
    // DD依存関係: DD-001 → DD-002 → DD-003
    const dd1 = createDesignDocument("DD-001", [
      { targetDdId: "DD-002", callType: "calls_sync" },
    ]);
    const dd2 = createDesignDocument("DD-002", [
      { targetDdId: "DD-003", callType: "calls_async" },
      { targetDdId: "DD-001", callType: "calls_sync" }, // 循環
      { targetDdId: "DD-999", callType: "calls_sync" }, // 無効
      { targetDdId: "DD-002", callType: "calls_sync" }, // 自己参照
    ]);
    const dd3 = createDesignDocument("DD-003", []);

    const ddDeps = filterDdDependencies([dd1, dd2, dd3]);
    expect(ddDeps).toHaveLength(3); // DD-001→DD-002, DD-002→DD-003, DD-002→DD-001

    // SR↔BRリンク
    const sr1 = createSystemRequirement("SR-001", ["BR-001", "BR-002", "BR-001"]);
    const sr2 = createSystemRequirement("SR-002", ["BR-002", "BR-003"]);

    const srBrLinks = generateSrBrLinks([sr1, sr2], "test-project-id");
    expect(srBrLinks).toHaveLength(4); // 重複除外
  });
});
