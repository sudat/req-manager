import { describe, it, expect } from "bun:test";
import {
  getBtPrefix,
  getBrIdSpecForTask,
  getNextBtId,
  getNextSfId,
  inferIdSpecFromExisting,
  inferSequentialIdSpec,
  normalizeBusinessAreaInput,
  normalizeAreaCode,
  parseBtId,
  parseLegacyTaskNumber,
  parseSfId,
  parseTaskIdForAreaSeq,
  getSrIdSpecForSystemFunction,
  getSrIdSpecForTask,
} from "../../../lib/utils/id-rules";

describe("normalizeBusinessAreaInput", () => {
  it("小文字とハイフンを正規化する", () => {
    expect(normalizeBusinessAreaInput("ar-01")).toBe("AR_01");
  });

  it("空白を除去する", () => {
    expect(normalizeBusinessAreaInput(" A r - 0 1 ")).toBe("AR_01");
  });

  it("英数字とアンダースコア以外を除去する", () => {
    expect(normalizeBusinessAreaInput("a.b/c")).toBe("ABC");
  });

  it("既に正規化された値は保持する", () => {
    expect(normalizeBusinessAreaInput("AR_01")).toBe("AR_01");
  });

  it("空文字列は空文字列のまま", () => {
    expect(normalizeBusinessAreaInput("")).toBe("");
  });
});

describe("normalizeAreaCode", () => {
  it("小文字を大文字に変換する", () => {
    expect(normalizeAreaCode("ar")).toBe("AR");
    expect(normalizeAreaCode("Ap")).toBe("AP");
  });

  it("英数字とアンダースコア以外を削除する", () => {
    expect(normalizeAreaCode("A-R")).toBe("AR");
    expect(normalizeAreaCode("A.R")).toBe("AR");
    expect(normalizeAreaCode("A R")).toBe("AR");
    expect(normalizeAreaCode("A/R")).toBe("AR");
  });

  it("アンダースコアは保持される", () => {
    expect(normalizeAreaCode("A_R")).toBe("A_R");
  });

  it("数字は保持される", () => {
    expect(normalizeAreaCode("AR1")).toBe("AR1");
    expect(normalizeAreaCode("A1R2")).toBe("A1R2");
  });

  it("空文字列は空文字列のまま", () => {
    expect(normalizeAreaCode("")).toBe("");
  });
});

describe("parseBtId", () => {
  it("有効なBT IDをパースできる", () => {
    const result = parseBtId("BT-AR-0001");
    expect(result).not.toBeNull();
    expect(result?.area).toBe("AR");
    expect(result?.seq).toBe("0001");
  });

  it("エリアコードにアンダースコアを含むIDをパースできる", () => {
    const result = parseBtId("BT-SALES_TEAM-0001");
    expect(result).not.toBeNull();
    expect(result?.area).toBe("SALES_TEAM");
    expect(result?.seq).toBe("0001");
  });

  it("無効な形式はnullを返す", () => {
    expect(parseBtId("BT-AR-1")).toBeNull(); // 4桁未満
    expect(parseBtId("BT-AR-00001")).toBeNull(); // 5桁
    expect(parseBtId("SF-AR-0001")).toBeNull(); // 接頭辞が違う
    expect(parseBtId("BT-ar-0001")).toBeNull(); // 小文字
    expect(parseBtId("INVALID")).toBeNull();
  });
});

describe("parseTaskIdForAreaSeq", () => {
  it("BT IDからエリアとシーケンスを抽出できる", () => {
    const result = parseTaskIdForAreaSeq("BT-AR-0001");
    expect(result).not.toBeNull();
    expect(result?.area).toBe("AR");
    expect(result?.seq).toBe("0001");
  });

  it("レガシー形式のタスクIDをパースできる（BT以外）", () => {
    const result = parseTaskIdForAreaSeq("AR-0001");
    expect(result).not.toBeNull();
    expect(result?.area).toBe("AR");
    expect(result?.seq).toBe("0001");
  });

  it("BT-XXX-XXXX形式はBTとしてパースされる", () => {
    const result = parseTaskIdForAreaSeq("BT-AR-0001");
    expect(result?.area).toBe("AR");
  });

  it("BTで始まるレガシー形式はnullを返す", () => {
    expect(parseTaskIdForAreaSeq("BT-0001")).toBeNull();
  });

  it("無効な形式はnullを返す", () => {
    expect(parseTaskIdForAreaSeq("INVALID")).toBeNull();
    expect(parseTaskIdForAreaSeq("AR-1")).toBeNull(); // 4桁未満
  });
});

describe("parseLegacyTaskNumber", () => {
  it("TASK-XXX形式をパースできる", () => {
    expect(parseLegacyTaskNumber("TASK-001")).toBe("0001");
    expect(parseLegacyTaskNumber("TASK-123")).toBe("0123");
    expect(parseLegacyTaskNumber("TASK-9999")).toBe("9999");
  });

  it("3桁の場合は4桁にパディングされる", () => {
    expect(parseLegacyTaskNumber("TASK-001")).toBe("0001");
  });

  it("無効な形式はnullを返す", () => {
    expect(parseLegacyTaskNumber("TASK-12345")).toBeNull(); // 5桁
    expect(parseLegacyTaskNumber("TASK-12")).toBeNull(); // 2桁
    expect(parseLegacyTaskNumber("SRF-001")).toBeNull();
    expect(parseLegacyTaskNumber("INVALID")).toBeNull();
  });
});

describe("parseSfId", () => {
  it("有効なSF IDをパースできる", () => {
    const result = parseSfId("SF-AR-0001");
    expect(result).not.toBeNull();
    expect(result?.area).toBe("AR");
    expect(result?.seq).toBe("0001");
  });

  it("レガシーSRF-XXX形式をパースできる", () => {
    const result = parseSfId("SRF-001");
    expect(result).not.toBeNull();
    expect(result?.area).toBeUndefined();
    expect(result?.seq).toBe("0001");
  });

  it("SRF-XXXX形式（4桁）もパースできる", () => {
    const result = parseSfId("SRF-1234");
    expect(result).not.toBeNull();
    expect(result?.seq).toBe("1234");
  });

  it("無効な形式はnullを返す", () => {
    expect(parseSfId("BT-AR-0001")).toBeNull();
    expect(parseSfId("SF-AR-1")).toBeNull(); // 4桁未満
    expect(parseSfId("INVALID")).toBeNull();
  });
});

describe("inferSequentialIdSpec", () => {
  it("IDからプレフィックスとパディング長を推測できる", () => {
    const result = inferSequentialIdSpec("BR-AR-0001-0001");
    expect(result).toEqual({ prefix: "BR-AR-0001-", padLength: 4 });
  });

  it("3桁パディングも検出できる", () => {
    const result = inferSequentialIdSpec("BR-TASK-001-001");
    expect(result).toEqual({ prefix: "BR-TASK-001-", padLength: 3 });
  });

  it("ダッシュがない場合はnullを返す", () => {
    expect(inferSequentialIdSpec("BR00010001")).toBeNull();
  });

  it("ダッシュで終わる場合はnullを返す", () => {
    expect(inferSequentialIdSpec("BR-AR-0001-")).toBeNull();
  });

  it("サフィックスが数字でない場合はnullを返す", () => {
    expect(inferSequentialIdSpec("BR-AR-0001-ABC")).toBeNull();
  });
});

describe("inferIdSpecFromExisting", () => {
  it("既存IDから仕様を推測できる", () => {
    const existingIds = ["BR-AR-0001-0001", "BR-AR-0001-0002"];
    const result = inferIdSpecFromExisting(existingIds, "BR-");
    expect(result).toEqual({ prefix: "BR-AR-0001-", padLength: 4 });
  });

  it("一致するIDがない場合はnullを返す", () => {
    const existingIds = ["SR-AR-0001-0001"];
    const result = inferIdSpecFromExisting(existingIds, "BR-");
    expect(result).toBeNull();
  });

  it("空配列の場合はnullを返す", () => {
    const result = inferIdSpecFromExisting([], "BR-");
    expect(result).toBeNull();
  });
});

describe("getBtPrefix", () => {
  it("エリアコードからBTプレフィックスを生成できる", () => {
    expect(getBtPrefix("AR")).toBe("BT-AR-");
    expect(getBtPrefix("ap")).toBe("BT-AP-"); // 小文字は大文字に
  });

  it("エリアコードに含まれる不正な文字を削除する", () => {
    expect(getBtPrefix("A-R")).toBe("BT-AR-");
    expect(getBtPrefix("A/R")).toBe("BT-AR-");
  });

  it("空文字列の場合はBDを使用する", () => {
    expect(getBtPrefix("")).toBe("BT-BD-");
  });
});

describe("getNextBtId", () => {
  it("既存IDがない場合は0001から始まる", () => {
    const result = getNextBtId("AR", []);
    expect(result).toBe("BT-AR-0001");
  });

  it("既存IDの最大番号+1を返す", () => {
    const existingIds = ["BT-AR-0001", "BT-AR-0003", "BT-AR-0002"];
    const result = getNextBtId("AR", existingIds);
    expect(result).toBe("BT-AR-0004");
  });

  it("別エリアのIDは無視される", () => {
    const existingIds = ["BT-AR-0001", "BT-AP-0005"];
    const result = getNextBtId("AR", existingIds);
    expect(result).toBe("BT-AR-0002");
  });

  it("レガシー形式のタスクIDも考慮される", () => {
    const existingIds = ["AR-0001", "AR-0002"];
    const result = getNextBtId("AR", existingIds);
    expect(result).toBe("BT-AR-0003");
  });

  it("小文字のエリアコードは正規化される", () => {
    const existingIds = ["BT-AR-0001"];
    const result = getNextBtId("ar", existingIds);
    expect(result).toBe("BT-AR-0002");
  });

  it("空文字列の場合はBDエリアとして扱う", () => {
    const result = getNextBtId("", []);
    expect(result).toBe("BT-BD-0001");
  });
});

describe("getNextSfId", () => {
  it("既存IDがない場合は0001から始まる", () => {
    const result = getNextSfId("AR", []);
    expect(result).toBe("SF-AR-0001");
  });

  it("既存IDの最大番号+1を返す", () => {
    const existingIds = ["SF-AR-0001", "SF-AR-0003", "SF-AR-0002"];
    const result = getNextSfId("AR", existingIds);
    expect(result).toBe("SF-AR-0004");
  });

  it("別エリアのIDは無視される", () => {
    const existingIds = ["SF-AR-0001", "SF-AP-0005"];
    const result = getNextSfId("AR", existingIds);
    expect(result).toBe("SF-AR-0002");
  });

  it("レガシーSRF形式は無視される（SFのみ考慮）", () => {
    const existingIds = ["SRF-001"];
    const result = getNextSfId("AR", existingIds);
    expect(result).toBe("SF-AR-0001");
  });

  it("小文字のエリアコードは正規化される", () => {
    const existingIds = ["SF-AR-0001"];
    const result = getNextSfId("ar", existingIds);
    expect(result).toBe("SF-AR-0002");
  });

  it("空文字列の場合はSDエリアとして扱う", () => {
    const result = getNextSfId("", []);
    expect(result).toBe("SF-SD-0001");
  });
});

describe("getBrIdSpecForTask", () => {
  it("既存BRから仕様を推測する", () => {
    const existingIds = ["BR-AR-0001-0001", "BR-AR-0001-0002"];
    const taskId = "BT-AR-0001";
    const result = getBrIdSpecForTask(taskId, existingIds);
    expect(result).toEqual({ prefix: "BR-AR-0001-", padLength: 4 });
  });

  it("既存BRがない場合はタスクIDから推測する", () => {
    const existingIds = [];
    const taskId = "BT-AR-0001";
    const result = getBrIdSpecForTask(taskId, existingIds);
    expect(result).toEqual({ prefix: "BR-AR-0001-", padLength: 4 });
  });

  it("レガシータスクID形式の場合", () => {
    const existingIds = [];
    const taskId = "AR-0001";
    const result = getBrIdSpecForTask(taskId, existingIds);
    expect(result).toEqual({ prefix: "BR-AR-0001-", padLength: 4 });
  });

  it("パースできないタスクIDの場合は3桁パディング", () => {
    const existingIds = [];
    const taskId = "INVALID-ID";
    const result = getBrIdSpecForTask(taskId, existingIds);
    expect(result).toEqual({ prefix: "BR-INVALID-ID-", padLength: 3 });
  });
});

describe("getSrIdSpecForSystemFunction", () => {
  it("既存SRから仕様を推測する", () => {
    const existingIds = ["SR-AR-0001-0001", "SR-AR-0001-0002"];
    const result = getSrIdSpecForSystemFunction("AR", "SF-AR-0001", existingIds);
    expect(result).toEqual({ prefix: "SR-AR-0001-", padLength: 4 });
  });

  it("既存SRがない場合はSF IDから推測する", () => {
    const existingIds = [];
    const result = getSrIdSpecForSystemFunction("AR", "SF-AR-0005", existingIds);
    expect(result).toEqual({ prefix: "SR-AR-0005-", padLength: 4 });
  });

  it("SF IDがパースできない場合はシステムドメインから推測する", () => {
    const existingIds = [];
    const result = getSrIdSpecForSystemFunction("AP", "INVALID", existingIds);
    expect(result).toEqual({ prefix: "SR-AP-0001-", padLength: 4 });
  });

  it("レガシーSRF形式の場合", () => {
    const existingIds = [];
    const result = getSrIdSpecForSystemFunction("AR", "SRF-001", existingIds);
    expect(result).toEqual({ prefix: "SR-AR-0001-", padLength: 4 });
  });

  it("空文字列のシステムドメインの場合はSDを使用", () => {
    const existingIds = [];
    const result = getSrIdSpecForSystemFunction("", "INVALID", existingIds);
    expect(result).toEqual({ prefix: "SR-SD-0001-", padLength: 4 });
  });
});

describe("getSrIdSpecForTask", () => {
  it("既存SRから仕様を推測する", () => {
    const existingIds = ["SR-TASK-001-001", "SR-TASK-001-002"];
    const taskId = "TASK-001";
    const result = getSrIdSpecForTask(taskId, existingIds);
    expect(result).toEqual({ prefix: "SR-TASK-001-", padLength: 3 });
  });

  it("既存SRがない場合はタスクIDの形式", () => {
    const existingIds = [];
    const taskId = "TASK-123";
    const result = getSrIdSpecForTask(taskId, existingIds);
    expect(result).toEqual({ prefix: "SR-TASK-123-", padLength: 3 });
  });
});

// 重複IDが発生しないことを確認する結合テスト
describe("ID重複チェック", () => {
  it("BT IDの重複が発生しない", () => {
    const existingIds: string[] = [];
    const generatedIds = new Set<string>();

    // 10個のIDを生成
    for (let i = 0; i < 10; i++) {
      const id = getNextBtId("AR", existingIds);
      expect(generatedIds.has(id)).toBe(false); // 重複チェック
      generatedIds.add(id);
      existingIds.push(id);
    }

    // 最後のIDがBT-AR-0010であることを確認
    expect(existingIds[9]).toBe("BT-AR-0010");
  });

  it("SF IDの重複が発生しない", () => {
    const existingIds: string[] = [];
    const generatedIds = new Set<string>();

    for (let i = 0; i < 10; i++) {
      const id = getNextSfId("AP", existingIds);
      expect(generatedIds.has(id)).toBe(false);
      generatedIds.add(id);
      existingIds.push(id);
    }

    expect(existingIds[9]).toBe("SF-AP-0010");
  });

  it("異なるエリアのIDは混在しても重複しない", () => {
    const existingIds: string[] = [];

    // ARエリアのIDを追加
    for (let i = 0; i < 5; i++) {
      existingIds.push(getNextBtId("AR", existingIds));
    }

    // APエリアのIDを追加
    for (let i = 0; i < 5; i++) {
      existingIds.push(getNextBtId("AP", existingIds));
    }

    // 全てのIDが一意であることを確認
    const uniqueIds = new Set(existingIds);
    expect(uniqueIds.size).toBe(10);
  });
});
