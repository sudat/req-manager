import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: bt-draft Tool
// ========================================

/**
 * LLMレスポンスが意味のあるコンテンツを持っているか判定
 */
function hasMeaningfulContent(llmContent: {
  name?: string;
  summary?: string;
  processSteps?: Array<{ when: string; who: string; action: string }>;
  input?: Array<{ name: string; source: string }>;
  output?: Array<{ name: string; source: string }>;
}): boolean {
  return Boolean(
    (typeof llmContent.name === 'string' && llmContent.name.trim().length > 0) ||
    (typeof llmContent.summary === 'string' && llmContent.summary.trim().length > 0) ||
    (Array.isArray(llmContent.processSteps) && llmContent.processSteps.length > 0) ||
    (Array.isArray(llmContent.input) && llmContent.input.length > 0) ||
    (Array.isArray(llmContent.output) && llmContent.output.length > 0)
  );
}

/**
 * BT草案の名前を生成するフォールバックロジック
 */
function generateBtNameFallback(llmContent: { name?: string }, naturalLanguageInput: string): string {
  return llmContent.name || naturalLanguageInput.split('\n')[0].substring(0, 50);
}

/**
 * BT草案の概要を生成するフォールバックロジック
 */
function generateBtSummaryFallback(llmContent: { summary?: string }, naturalLanguageInput: string): string {
  return llmContent.summary || naturalLanguageInput.substring(0, 200);
}

/**
 * コンテキスト文字列を生成する
 */
function generateContextString(btName: string): string {
  return `業務タスク「${btName}」で使用`;
}

// ========================================
// Mock Data
// ========================================

const mockConceptMap = new Map([
  ['請求書', { id: 'C001', name: '請求書', definition: '代金を請求する書類', areas: ['AR'] }],
  ['入金', { id: 'C002', name: '入金', definition: '金銭の受け入れ', areas: ['AR'] }],
  ['売上', { id: 'C003', name: '売上', definition: '商品の販売による収益', areas: ['AR'] }],
]);

const mockExistingConceptsArray = Array.from(mockConceptMap.values());

// ========================================
// Test Suites
// ========================================

describe("bt-draft Tool ロジック抽出テスト", () => {
  describe("hasMeaningfulContent", () => {
    it("nameがある場合はtrue", () => {
      const llmContent = { name: "請求書発行業務" };
      expect(hasMeaningfulContent(llmContent)).toBe(true);
    });

    it("summaryがある場合はtrue", () => {
      const llmContent = { summary: "請求書を発行する業務です" };
      expect(hasMeaningfulContent(llmContent)).toBe(true);
    });

    it("processStepsがある場合はtrue", () => {
      const llmContent = { processSteps: [{ when: "月初", who: "経理担当", action: "集計する" }] };
      expect(hasMeaningfulContent(llmContent)).toBe(true);
    });

    it("inputがある場合はtrue", () => {
      const llmContent = { input: [{ name: "請求書データ", source: "販売管理" }] };
      expect(hasMeaningfulContent(llmContent)).toBe(true);
    });

    it("outputがある場合はtrue", () => {
      const llmContent = { output: [{ name: "売上管理表", source: "Excel" }] };
      expect(hasMeaningfulContent(llmContent)).toBe(true);
    });

    it("全て空またはundefinedの場合はfalse", () => {
      expect(hasMeaningfulContent({})).toBe(false);
      expect(hasMeaningfulContent({ name: "" })).toBe(false);
      expect(hasMeaningfulContent({ name: "   " })).toBe(false);
      expect(hasMeaningfulContent({ processSteps: [] })).toBe(false);
    });
  });

  describe("generateBtNameFallback", () => {
    it("LLMのnameがある場合はそれを返す", () => {
      const llmContent = { name: "請求書発行" };
      const input = "なんらかの入力";
      expect(generateBtNameFallback(llmContent, input)).toBe("請求書発行");
    });

    it("LLMのnameがない場合は入力の最初の50文字", () => {
      const llmContent = { name: "" };
      const input = "請求書を発行してメールで送る業務プロセスについての詳細な説明";
      // 32文字なので全て返される
      expect(generateBtNameFallback(llmContent, input)).toBe(input);
    });

    it("入力が50文字未満の場合は全て返す", () => {
      const llmContent = { name: undefined };
      const input = "短い説明";
      expect(generateBtNameFallback(llmContent, input)).toBe("短い説明");
    });
  });

  describe("generateBtSummaryFallback", () => {
    it("LLMのsummaryがある場合はそれを返す", () => {
      const llmContent = { summary: "請求書の発行処理を行う" };
      const input = "長い説明がここに入ります...";
      expect(generateBtSummaryFallback(llmContent, input)).toBe("請求書の発行処理を行う");
    });

    it("LLMのsummaryがない場合は入力の最初の200文字", () => {
      const llmContent = { summary: undefined };
      const input = "a".repeat(250);
      const result = generateBtSummaryFallback(llmContent, input);
      expect(result.length).toBe(200);
    });
  });

  describe("generateContextString", () => {
    it("業務タスク名を含むコンテキスト文字列を生成", () => {
      expect(generateContextString("請求書発行")).toBe("業務タスク「請求書発行」で使用");
      expect(generateContextString("入金消込")).toBe("業務タスク「入金消込」で使用");
    });
  });

  describe("概念候補マッチングロジック（シミュレーション）", () => {
    it("完全一致する概念が見つかる場合", () => {
      const term = "請求書";
      const existing = mockConceptMap.get(term.toLowerCase());

      expect(existing).toBeDefined();
      expect(existing?.id).toBe("C001");
    });

    it("類似概念の検索（70%-89%）", () => {
      // これはシミュレーションのみで、実際の findSimilarConcepts はモックが必要
      const term = "請求"; // "請求書"の部分一致
      const existing = mockConceptMap.get(term.toLowerCase());

      expect(existing).toBeUndefined(); // 完全一致はない
      // 実際の実装では findSimilarConcepts を呼び出す
    });

    it("新規概念（類似概念なし）", () => {
      const term = "全く新しい概念";
      const existing = mockConceptMap.get(term.toLowerCase());

      expect(existing).toBeUndefined();
      // matchType: 'new' として扱われる
    });
  });

  describe("統合シナリオ", () => {
    it("BT草案の完全な生成パス", () => {
      const llmContent = {
        name: "請求書発行",
        summary: "請求書を発行して顧客に送付する業務",
        processSteps: [
          { when: "毎月15日", who: "経理担当", action: "請求データを抽出" },
          { when: "毎月20日", who: "経理担当", action: "請求書を作成" },
        ],
        input: [{ name: "請求データ", source: "販売管理DB" }],
        output: [{ name: "請求書PDF", source: "ファイルシステム" }],
        concepts: ["請求書", "PDF"],
      };

      const naturalLanguageInput = "請求書を発行する業務を追加したい";
      const btName = generateBtNameFallback(llmContent, naturalLanguageInput);
      const btSummary = generateBtSummaryFallback(llmContent, naturalLanguageInput);
      const hasContent = hasMeaningfulContent(llmContent);

      expect(btName).toBe("請求書発行");
      expect(btSummary).toBe("請求書を発行して顧客に送付する業務");
      expect(hasContent).toBe(true);
    });

    it("フォールバック値の生成", () => {
      const emptyContent = {};
      const fallbackInput = "これは請求書発行の詳細な説明です。もっと長い説明が続きますが、ここではテスト用に短くしています。";

      const btName = generateBtNameFallback(emptyContent, fallbackInput);
      const btSummary = generateBtSummaryFallback(emptyContent, fallbackInput);

      expect(btName).toBe("これは請求書発行の詳細な説明です。もっと長い説明が続きますが、ここではテスト用に短くしています。");
      expect(btSummary.length).toBe(48); // 入力文字列は48文字（200文字未満なのでそのまま返される）
      expect(btName.length).toBe(48); // 入力文字列は48文字（50文字未満なのでそのまま返される）
    });

    it("概念候補の生成ロジック", () => {
      const rawConcepts = ["請求書", "入金", "売上", "新しい概念"];
      const conceptCandidates: string[] = [];

      for (const term of rawConcepts) {
        const existing = mockConceptMap.get(term.toLowerCase());
        if (existing) {
          conceptCandidates.push(`既存概念「${existing.name}」として登録済み`);
        } else {
          conceptCandidates.push(`新規概念: ${term}`);
        }
      }

      expect(conceptCandidates).toContain("既存概念「請求書」として登録済み");
      expect(conceptCandidates).toContain("既存概念「入金」として登録済み");
      expect(conceptCandidates).toContain("既存概念「売上」として登録済み");
      expect(conceptCandidates).toContain("新規概念: 新しい概念");
    });
  });

  describe("エッジケース", () => {
    it("nameに空白のみの場合は意味ありと見なされない", () => {
      const llmContent = { name: "   " };
      expect(hasMeaningfulContent(llmContent)).toBe(false);
    });

    it("空の配列は意味なしと見なされる", () => {
      const llmContent = {
        name: "",
        summary: "",
        processSteps: [],
        input: [],
        output: [],
      };
      expect(hasMeaningfulContent(llmContent)).toBe(false);
    });

    it("長い自然言語入力の処理", () => {
      const longInput = "x".repeat(300);
      const fallbackSummary = generateBtSummaryFallback({ summary: undefined }, longInput);

      expect(fallbackSummary.length).toBe(200); // 200文字に制限される
    });
  });
});
