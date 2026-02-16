import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: br-draft Tool
// ========================================

/**
 * BT IDから業務領域コードを導出するロジック
 */
function deriveBusinessArea(value?: string): string {
  if (!value) return '';
  const parts = value.split('-').filter(Boolean);
  if (parts.length >= 3 && parts[0] === 'BT') return parts[1];
  return '';
}

/**
 * BRコードの新しい採番を生成するロジック
 */
function generateNewBrCode(lastCode: string, btId: string): string {
  const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
  return `${btId}-${String(lastNumber + 1).padStart(3, '0')}`;
}

/**
 * processSteps の正規化ロジック
 */
function normalizeProcessSteps(value: unknown): { when: string; who: string; action: string }[] {
  return Array.isArray(value) ? (value as { when: string; who: string; action: string }[]) : [];
}

/**
 * input/output の正規化ロジック
 */
function normalizeInputOutput(value: unknown): { name: string; source: string }[] {
  return Array.isArray(value) ? (value as { name: string; source: string }[]) : [];
}

/**
 * 重複チェックロジック（シミュレーション）
 */
function checkDuplicate(
  requirement: string,
  existingBRs: Array<{ id: string; title?: string; goal?: string }>
): boolean {
  return existingBRs.some((br) => {
    const title = (br.title ?? br.goal ?? '').toLowerCase();
    const candidate = requirement.toLowerCase();
    return title.includes(candidate) || candidate.includes(title);
  });
}

/**
 * 不確定事項検出ロジック
 */
function detectUncertainties(
  requirement: string,
  resolvedBt: boolean,
  allowDraft: boolean
): string[] {
  const uncertainties: string[] = [];

  if (!resolvedBt && allowDraft) {
    uncertainties.push('業務タスクが未確定のため、内容は草案として扱われます');
  }
  if (requirement.length < 10) {
    uncertainties.push('要件が簡潔すぎる可能性があります');
  }
  if (!requirement.includes('できる') && !requirement.includes('する')) {
    uncertainties.push('要件が動詞で終わっていません');
  }

  return uncertainties;
}

// ========================================
// Mock Data
// ========================================

const mockExistingBRs = [
  { id: 'BR-AR-0001-001', title: '請求書をPDFで出力できる', goal: '請求書をPDFで出力できる' },
  { id: 'BR-AR-0001-002', title: '入金データを取り込める', goal: '入金データを取り込める' },
];

const mockConceptMap = new Map([
  ['請求書', { id: 'C001', name: '請求書', definition: '代金を請求する書類' }],
  ['入金', { id: 'C002', name: '入金', definition: '金銭の受け入れ' }],
]);

// ========================================
// Test Suites
// ========================================

describe("br-draft Tool ロジック抽出テスト", () => {
  describe("deriveBusinessArea", () => {
    it("BT-IDから業務領域コードを抽出（BT-AR-001 → AR）", () => {
      expect(deriveBusinessArea('BT-AR-001')).toBe('AR');
    });

    it("BT-IDから業務領域コードを抽出（BT-AP-001 → AP）", () => {
      expect(deriveBusinessArea('BT-AP-001')).toBe('AP');
    });

    it("ハイフンが3つ未満の場合は空文字", () => {
      expect(deriveBusinessArea('BT-001')).toBe('');
    });

    it("BTで始まらない場合は空文字", () => {
      expect(deriveBusinessArea('AR-001')).toBe('');
    });

    it("undefinedの場合は空文字", () => {
      expect(deriveBusinessArea(undefined)).toBe('');
    });

    it("空文字の場合は空文字", () => {
      expect(deriveBusinessArea('')).toBe('');
    });
  });

  describe("generateNewBrCode", () => {
    it("既存BRがない場合の採番（btId-BR-000 → btId-001）", () => {
      const lastCode = 'BR-AR-0001-000';
      const btId = 'BR-AR-0001';
      expect(generateNewBrCode(lastCode, btId)).toBe('BR-AR-0001-001');
    });

    it("既存BRがある場合の採番（btId-001 → btId-002）", () => {
      const lastCode = 'BR-AR-0001-001';
      const btId = 'BR-AR-0001';
      expect(generateNewBrCode(lastCode, btId)).toBe('BR-AR-0001-002');
    });

    it("2桁の番号から採番（btId-099 → btId-100）", () => {
      const lastCode = 'BR-AR-0001-099';
      const btId = 'BR-AR-0001';
      expect(generateNewBrCode(lastCode, btId)).toBe('BR-AR-0001-100');
    });

    it("lastCodeが不正な形式の場合はbtId-NaN", () => {
      const lastCode = 'invalid';
      const btId = 'BR-AR-0001';
      // parseInt('invalid', 10) → NaN, String(NaN + 1) → 'NaN'
      expect(generateNewBrCode(lastCode, btId)).toBe('BR-AR-0001-NaN');
    });

    it("lastCodeが空の場合はbtId-001", () => {
      const lastCode = '';
      const btId = 'BR-AR-0001';
      expect(generateNewBrCode(lastCode, btId)).toBe('BR-AR-0001-001');
    });
  });

  describe("normalizeProcessSteps", () => {
    it("配列の場合はそのまま返す", () => {
      const steps = [
        { when: '毎月', who: '経理', action: '集計する' },
      ];
      expect(normalizeProcessSteps(steps)).toEqual(steps);
    });

    it("undefinedの場合は空配列", () => {
      expect(normalizeProcessSteps(undefined)).toEqual([]);
    });

    it("nullの場合は空配列", () => {
      expect(normalizeProcessSteps(null)).toEqual([]);
    });

    it("オブジェクトの場合は空配列", () => {
      expect(normalizeProcessSteps({ when: 'test' })).toEqual([]);
    });

    it("文字列の場合は空配列", () => {
      expect(normalizeProcessSteps('test')).toEqual([]);
    });

    it("空配列の場合は空配列", () => {
      expect(normalizeProcessSteps([])).toEqual([]);
    });
  });

  describe("normalizeInputOutput", () => {
    it("配列の場合はそのまま返す", () => {
      const io = [
        { name: '請求データ', source: '販売管理' },
      ];
      expect(normalizeInputOutput(io)).toEqual(io);
    });

    it("undefinedの場合は空配列", () => {
      expect(normalizeInputOutput(undefined)).toEqual([]);
    });

    it("nullの場合は空配列", () => {
      expect(normalizeInputOutput(null)).toEqual([]);
    });

    it("オブジェクトの場合は空配列", () => {
      expect(normalizeInputOutput({ name: 'test' })).toEqual([]);
    });

    it("文字列の場合は空配列", () => {
      expect(normalizeInputOutput('test')).toEqual([]);
    });
  });

  describe("checkDuplicate", () => {
    it("完全一致するタイトルがある場合はtrue", () => {
      const requirement = '請求書をPDFで出力できる';
      expect(checkDuplicate(requirement, mockExistingBRs)).toBe(true);
    });

    it("部分一致する場合はtrue（候補がタイトルを含む）", () => {
      const requirement = 'PDFで出力できる'; // 既存の '請求書をPDFで出力できる' に含まれる
      expect(checkDuplicate(requirement, mockExistingBRs)).toBe(true);
    });

    it("一致しない場合はfalse", () => {
      const requirement = '売上を計上できる';
      expect(checkDuplicate(requirement, mockExistingBRs)).toBe(false);
    });

    it("既存BRが空の場合はfalse", () => {
      const requirement = '請求書をPDFで出力できる';
      expect(checkDuplicate(requirement, [])).toBe(false);
    });

    it("大文字小文字を区別しない", () => {
      const requirement = '請求書をpdfで出力できる';
      expect(checkDuplicate(requirement, mockExistingBRs)).toBe(true);
    });

    it("goalフィールでのマッチも考慮する", () => {
      const existingBRs = [
        { id: 'BR-001', goal: '入金を消し込める' },
      ];
      const requirement = '入金を消し込める';
      expect(checkDuplicate(requirement, existingBRs)).toBe(true);
    });
  });

  describe("detectUncertainties", () => {
    it("BT未確定でallowDraft=trueの場合は不確定事項を検出", () => {
      const requirement = '請求書を発行できる';
      expect(detectUncertainties(requirement, false, true)).toContain('業務タスクが未確定のため、内容は草案として扱われます');
    });

    it("BT未確定でallowDraft=falseの場合は不確定事項を検出しない", () => {
      const requirement = '請求書を発行できる';
      expect(detectUncertainties(requirement, false, false)).not.toContain('業務タスクが未確定のため、内容は草案として扱われます');
    });

    it("BTが確定済みの場合は不確定事項を検出しない", () => {
      const requirement = '請求書を発行できる';
      expect(detectUncertainties(requirement, true, true)).not.toContain('業務タスクが未確定のため');
    });

    it("要件が10文字未満の場合は不確定事項を検出", () => {
      const requirement = '請求書発行';
      expect(detectUncertainties(requirement, true, false)).toContain('要件が簡潔すぎる可能性があります');
    });

    it("要件が動詞で終わらない場合は不確定事項を検出", () => {
      const requirement = '請求書の発行';
      expect(detectUncertainties(requirement, true, false)).toContain('要件が動詞で終わっていません');
    });

    it("全ての条件が正常な場合は空配列", () => {
      const requirement = '請求書を発行できる機能を提供する';
      expect(detectUncertainties(requirement, true, false)).toEqual([]);
    });

    it("複数の不確定事項を検出", () => {
      const requirement = '発行'; // 10文字未満で動詞で終わらない
      const result = detectUncertainties(requirement, false, true);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("統合シナリオ", () => {
    it("BR草案生成の完全パス", () => {
      const btId = 'BT-AR-0001';
      const lastCode = 'BT-AR-0001-000';
      const requirement = '請求書をメールで送付できる';

      const newCode = generateNewBrCode(lastCode, btId);
      const businessArea = deriveBusinessArea(btId);
      const isDuplicate = checkDuplicate(requirement, mockExistingBRs);
      const uncertainties = detectUncertainties(requirement, true, false);

      expect(newCode).toBe('BT-AR-0001-001');
      expect(businessArea).toBe('AR');
      expect(isDuplicate).toBe(false);
      expect(uncertainties).toEqual([]);
    });

    it("重複検出時のエラーパターン", () => {
      const requirement = '請求書をPDFで出力できる';
      const isDuplicate = checkDuplicate(requirement, mockExistingBRs);

      expect(isDuplicate).toBe(true);
      // 実際の実装ではここでErrorがthrowされる
    });

    it("不確定事項がある場合のBR生成", () => {
      const btId = 'BT-AR-0001';
      const shortRequirement = '発行';
      const resolvedBt = false;
      const allowDraft = true;

      const businessArea = deriveBusinessArea(btId);
      const uncertainties = detectUncertainties(shortRequirement, resolvedBt, allowDraft);

      expect(businessArea).toBe('AR');
      expect(uncertainties.length).toBeGreaterThan(0);
      expect(uncertainties).toContain('業務タスクが未確定のため、内容は草案として扱われます');
      expect(uncertainties).toContain('要件が簡潔すぎる可能性があります');
    });
  });

  describe("エッジケース", () => {
    it("BT IDに余分なハイフンがある場合", () => {
      expect(deriveBusinessArea('BT-AR--001')).toBe('AR');
    });

    it("lastCodeの数字部分が大きい場合", () => {
      const lastCode = 'BR-AR-0001-998';
      const btId = 'BR-AR-0001';
      expect(generateNewBrCode(lastCode, btId)).toBe('BR-AR-0001-999');
    });

    it("999の次は1000（3桁ではなく4桁になる）", () => {
      const lastCode = 'BR-AR-0001-999';
      const btId = 'BR-AR-0001';
      expect(generateNewBrCode(lastCode, btId)).toBe('BR-AR-0001-1000');
    });

    it("空のrequirementでの不確定事項検出", () => {
      const requirement = '';
      const result = detectUncertainties(requirement, true, false);
      expect(result.length).toBeGreaterThan(0);
    });

    it("processStepsの不正データを正規化", () => {
      expect(normalizeProcessSteps('invalid')).toEqual([]);
      expect(normalizeProcessSteps(123)).toEqual([]);
      expect(normalizeProcessSteps({})).toEqual([]);
    });

    it("inputOutputの不正データを正規化", () => {
      expect(normalizeInputOutput('invalid')).toEqual([]);
      expect(normalizeInputOutput(123)).toEqual([]);
      expect(normalizeInputOutput({})).toEqual([]);
    });
  });

  describe("概念候補マッチング（シミュレーション）", () => {
    it("完全一致する概念が見つかる場合", () => {
      const term = '請求書';
      const existing = mockConceptMap.get(term.toLowerCase());

      expect(existing).toBeDefined();
      expect(existing?.id).toBe('C001');
    });

    it("完全一致しない概念", () => {
      const term = '全く新しい概念';
      const existing = mockConceptMap.get(term.toLowerCase());

      expect(existing).toBeUndefined();
      // 実際の実装では findSimilarConcepts が呼ばれる
    });

    it("概念候補のマッチタイプ判定", () => {
      // 完全一致
      const exactTerm = '請求書';
      const exactExisting = mockConceptMap.get(exactTerm.toLowerCase());

      // 新規概念
      const newTerm = '全く新しい概念';
      const newExisting = mockConceptMap.get(newTerm.toLowerCase());

      expect(exactExisting).toBeDefined();
      expect(newExisting).toBeUndefined();
    });
  });
});
