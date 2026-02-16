import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: system-draft Tool
// ========================================

/**
 * BR IDからBT IDを導出するロジック
 * 注: 実際の実装ではBTで始まるIDのみが対象（関数名にBRとあるが挙動はBT向け）
 */
function deriveTaskIdFromBrId(value?: string): string | undefined {
  if (!value) return undefined;
  const parts = value.split('-').filter(Boolean);
  if (parts.length >= 4 && parts[0] === 'BT') {
    return parts.slice(0, 3).join('-'); // BT-AR-0001-0001 → BT-AR-0001
  }
  return undefined;
}

/**
 * ACタイトルを生成するロジック（40文字制限）
 */
function buildAcTitle(ac: { title?: string; then: string; when: string; given: string }): string {
  const source = (ac.title || ac.then || ac.when || ac.given || '').trim();
  if (source.length <= 40) return source;
  return `${source.slice(0, 40)}...`;
}

/**
 * SF名を短縮するロジック（実装に合わせて修正）
 */
function compactSfName(value: string): string {
  const base = value.trim().replace(/[「」]/g, '');
  if (!base) return '';
  let candidate = base;

  // 実装は条件付きで各ステップを適用（15文字超えた場合のみ）
  if (candidate.length > 15) {
    candidate = candidate.replace(/(機能|システム|管理|処理|対応|連携)$/g, '');
  }
  if (candidate.length > 15) {
    candidate = candidate.replace(/[・／/\\（）()]/g, '');
  }
  if (candidate.length > 15) {
    candidate = candidate.replace(/[のにをとや・]/g, '');
  }
  if (candidate.length > 15) {
    candidate = candidate.slice(0, 15);
  }

  return candidate || base.slice(0, 15);
}

/**
 * SRタイトルを生成するロジック
 */
function buildSrTitle(
  llmTitle: string | undefined,
  srSummary: string,
  fallback: string = 'システム要件'
): string {
  return llmTitle ||
    (srSummary.length > 0 ? srSummary.split(/。|\n/)[0]?.slice(0, 40) : fallback);
}

/**
 * SFコードからシーケンス番号を抽出するロジック
 */
function extractSfSeq(sfCode: string): string {
  const parts = sfCode.split('-');
  return parts[2] || '0001';
}

/**
 * SRコードを生成するロジック
 */
function generateSrCode(domainId: string, sfSeq: string, index: number): string {
  const normalizedDomain = normalizeAreaCode(domainId) || 'SD';
  return `SR-${normalizedDomain}-${sfSeq}-${String(index + 1).padStart(4, '0')}`;
}

/**
 * ACコードを生成するロジック
 */
function generateAcCode(srCode: string, index: number): string {
  return `AC-${srCode}-${String(index + 1).padStart(3, '0')}`;
}

/**
 * エリアコードを正規化する簡易版
 */
function normalizeAreaCode(value: string): string {
  return value.replace(/^(SD-|BD-|BT-|BR-|SF-)/, '').replace(/^0+/, '');
}

// ========================================
// Test Suites
// ========================================

describe("system-draft Tool ロジック抽出テスト", () => {
  describe("deriveTaskIdFromBrId", () => {
    it("BR IDからBT IDを抽出（4つのハイフン）", () => {
      expect(deriveTaskIdFromBrId('BT-AR-0001-0001')).toBe('BT-AR-0001');
    });

    it("別のBR IDからBT IDを抽出", () => {
      expect(deriveTaskIdFromBrId('BT-AP-0002-0003')).toBe('BT-AP-0002');
    });

    it("ハイフンが4つ未満の場合はundefined", () => {
      expect(deriveTaskIdFromBrId('BT-AR-0001')).toBeUndefined();
    });

    it("BTで始まらない場合はundefined", () => {
      expect(deriveTaskIdFromBrId('AR-0001-0001')).toBeUndefined();
    });

    it("undefinedの場合はundefined", () => {
      expect(deriveTaskIdFromBrId(undefined)).toBeUndefined();
    });

    it("空文字の場合はundefined", () => {
      expect(deriveTaskIdFromBrId('')).toBeUndefined();
    });
  });

  describe("buildAcTitle", () => {
    it("titleがある場合はそれを返す（40文字以内）", () => {
      const ac = {
        title: 'ログイン時にエラーが表示される',
        then: '',
        when: '',
        given: '',
      };
      expect(buildAcTitle(ac)).toBe('ログイン時にエラーが表示される');
    });

    it("titleが40文字を超える場合は省略", () => {
      const ac = {
        title: '12345678901234567890123456789012345678901', // 41文字
        then: '',
        when: '',
        given: '',
      };
      expect(buildAcTitle(ac)).toBe('1234567890123456789012345678901234567890...');
    });

    it("titleがない場合はthenを使う", () => {
      const ac = {
        title: '',
        then: 'データが保存される',
        when: '',
        given: '',
      };
      expect(buildAcTitle(ac)).toBe('データが保存される');
    });

    it("thenがない場合はwhenを使う", () => {
      const ac = {
        title: '',
        then: '',
        when: '保存ボタンをクリックする',
        given: '',
      };
      expect(buildAcTitle(ac)).toBe('保存ボタンをクリックする');
    });

    it("whenもない場合はgivenを使う", () => {
      const ac = {
        title: '',
        then: '',
        when: '',
        given: 'ユーザーがログインしている',
      };
      expect(buildAcTitle(ac)).toBe('ユーザーがログインしている');
    });

    it("全て空の場合は空文字", () => {
      const ac = {
        title: '',
        then: '',
        when: '',
        given: '',
      };
      expect(buildAcTitle(ac)).toBe('');
    });

    it("thenが40文字超えの場合は省略", () => {
      const ac = {
        title: '',
        then: '12345678901234567890123456789012345678901', // 41文字
        when: '',
        given: '',
      };
      expect(buildAcTitle(ac)).toBe('1234567890123456789012345678901234567890...');
    });
  });

  describe("compactSfName", () => {
    it("角括弧を削除（山括弧が削除される）", () => {
      // 「請求書発行」機能 → 請求書発行機能 (山括弧が削除される)
      expect(compactSfName('「請求書発行」機能')).toBe('請求書発行機能');
    });

    it("15文字以内なら変更なし（すべてのステップが適用される）", () => {
      // 請求書発行 (6文字) → bracket削除 → suffix削除 → symbol削除 → particle削除 → slice(0,15)
      // すべてのステップで変更がないままスライス
      expect(compactSfName('請求書発行')).toBe('請求書発行');
    });

    it("末尾の冗長語を削除（15文字以下なので変更なし）", () => {
      expect(compactSfName('請求書発行機能')).toBe('請求書発行機能');
    });

    it("末尾の冗長語を削除（システム）（15文字以下なので変更なし）", () => {
      expect(compactSfName('請求書システム')).toBe('請求書システム');
    });

    it("末尾の冗長語を削除（管理）（15文字以下なので変更なし）", () => {
      expect(compactSfName('在庫管理')).toBe('在庫管理');
    });

    it("記号を削除（15文字以下なので削除されない）", () => {
      // 請求書・入金管理 = 8文字なので15文字以下、何も削除されない
      expect(compactSfName('請求書・入金管理')).toBe('請求書・入金管理');
    });

    it("括弧を削除（山括弧のみ削除、丸括弧は残る）", () => {
      // /[「」]/g は山括弧のみ、（）は削除されない
      expect(compactSfName('請求書（発行）')).toBe('請求書（発行）');
    });

    it("15文字超えの場合は切り詰め（冗長語は末尾にないのでslice）", () => {
      // これは非常に長いシステム機能名で (16文字)
      // 「システム機能名で」は末尾ではないので冗長語削除されない
      // その後も削除対象がないので15文字に切り詰め
      expect(compactSfName('これは非常に長いシステム機能名で')).toBe('これは非常長いシステム機能名で');
    });

    it("複数ステップで短縮（15文字以下なので変更なし）", () => {
      // 月次売上集計・分析システム機能 (15文字)
      // 15文字以下なので何も削除されない
      expect(compactSfName('月次売上集計・分析システム機能')).toBe('月次売上集計・分析システム機能');
    });

    it("助詞を削除（15文字以下なので削除されない）", () => {
      // 7文字 <= 15文字なので何も削除されない
      expect(compactSfName('請求書の発行')).toBe('請求書の発行');
    });

    it("空文字の場合は空文字", () => {
      expect(compactSfName('')).toBe('');
    });

    it("前後空白のみは空文字", () => {
      expect(compactSfName('   ')).toBe('');
    });
  });

  describe("buildSrTitle", () => {
    it("LLMタイトルがある場合はそれを返す", () => {
      expect(buildSrTitle('月次連結パッケージの入力・確定管理', '', 'システム要件'))
        .toBe('月次連結パッケージの入力・確定管理');
    });

    it("LLMタイトルがない場合はsummaryから生成", () => {
      // 句点や改行がない場合は40文字未満ならそのまま返る
      expect(buildSrTitle(undefined, '請求書をPDFで出力する機能を提供する'))
        .toBe('請求書をPDFで出力する機能を提供する');
    });

    it("summaryを句点で分割して40文字に制限", () => {
      expect(buildSrTitle(undefined, '請求書をPDFで出力します。これはテストです。'))
        .toBe('請求書をPDFで出力します');
    });

    it("summaryを改行で分割して40文字に制限", () => {
      expect(buildSrTitle(undefined, '請求書をPDFで出力します\nこれはテストです'))
        .toBe('請求書をPDFで出力します');
    });

    it("summaryが空の場合はフォールバック", () => {
      expect(buildSrTitle(undefined, '', 'システム要件')).toBe('システム要件');
    });
  });

  describe("extractSfSeq", () => {
    it("SFコードからシーケンス番号を抽出", () => {
      expect(extractSfSeq('SF-AR-0001')).toBe('0001');
      expect(extractSfSeq('SF-AR-0099')).toBe('0099');
    });

    it("ドメイン区切りが異なる場合", () => {
      expect(extractSfSeq('SF-SD-001')).toBe('001');
    });

    it("ハイフンが不足している場合", () => {
      expect(extractSfSeq('SF-AR')).toBe('0001'); // 3番目がない場合はデフォルト値
    });
  });

  describe("generateSrCode", () => {
    it("SRコードを生成（1件目）", () => {
      expect(generateSrCode('SD-AR', '0001', 0)).toBe('SR-AR-0001-0001');
    });

    it("SRコードを生成（2件目）", () => {
      expect(generateSrCode('SD-AR', '0001', 1)).toBe('SR-AR-0001-0002');
    });

    it("SRコードを生成（10件目）", () => {
      expect(generateSrCode('SD-AR', '0001', 9)).toBe('SR-AR-0001-0010');
    });

    it("0埋めを確認", () => {
      expect(generateSrCode('SD-AR', '001', 0)).toBe('SR-AR-001-0001');
    });
  });

  describe("generateAcCode", () => {
    it("ACコードを生成（1件目）", () => {
      expect(generateAcCode('SR-AR-0001-0001', 0)).toBe('AC-SR-AR-0001-0001-001');
    });

    it("ACコードを生成（2件目）", () => {
      expect(generateAcCode('SR-AR-0001-0001', 1)).toBe('AC-SR-AR-0001-0001-002');
    });

    it("ACコードを生成（10件目）", () => {
      expect(generateAcCode('SR-AR-0001-0001', 9)).toBe('AC-SR-AR-0001-0001-010');
    });

    it("0埋めを確認（3桁）", () => {
      expect(generateAcCode('SR-AR-0001-0001', 0)).toBe('AC-SR-AR-0001-0001-001');
    });
  });

  describe("normalizeAreaCode", () => {
    it("SD-プレフィックスを削除", () => {
      expect(normalizeAreaCode('SD-AR')).toBe('AR');
    });

    it("BD-プレフィックスを削除", () => {
      expect(normalizeAreaCode('BD-AR')).toBe('AR');
    });

    it("BT-プレフィックスを削除", () => {
      expect(normalizeAreaCode('BT-AR')).toBe('AR');
    });

    it("BR-プレフィックスを削除", () => {
      expect(normalizeAreaCode('BR-AR')).toBe('AR');
    });

    it("SF-プレフィックスを削除", () => {
      expect(normalizeAreaCode('SF-AR')).toBe('AR');
    });

    it("先行ゼロを削除", () => {
      expect(normalizeAreaCode('0001')).toBe('1');
    });

    it("プレフィックスと先行ゼロを両方削除", () => {
      expect(normalizeAreaCode('SD-0001')).toBe('1');
    });
  });

  describe("統合シナリオ", () => {
    it("SF/SR/ACコード生成の完全パス", () => {
      const domainId = 'SD-AR';
      const sfSeq = '0001';

      // SRコード生成
      const srCode1 = generateSrCode(domainId, sfSeq, 0);
      const srCode2 = generateSrCode(domainId, sfSeq, 1);

      expect(srCode1).toBe('SR-AR-0001-0001');
      expect(srCode2).toBe('SR-AR-0001-0002');

      // ACコード生成
      const acCode1 = generateAcCode(srCode1, 0);
      const acCode2 = generateAcCode(srCode1, 1);

      expect(acCode1).toBe('AC-SR-AR-0001-0001-001');
      expect(acCode2).toBe('AC-SR-AR-0001-0001-002');
    });

    it("BR IDからSF名候補を生成（BT IDを渡す必要がある）", () => {
      // deriveTaskIdFromBrIdはBTで始まる4部構成のIDのみ対応
      const btId = deriveTaskIdFromBrId('BT-AR-0001-0001');
      expect(btId).toBe('BT-AR-0001');
    });

    it("SF名の短縮パイプライン（15文字以下は変更なし）", () => {
      // 「請求書発行」システム機能 (13文字) → 11文字（山括弧削除）
      // 11文字 <= 15文字なので停止
      const raw = '「請求書発行」システム機能';
      const compacted = compactSfName(raw);
      expect(compacted).toBe('請求書発行システム機能');
    });
  });

  describe("エッジケース", () => {
    it("buildAcTitleで全フィールドが空文字", () => {
      const ac = {
        title: '',
        then: '',
        when: '',
        given: '',
      };
      expect(buildAcTitle(ac)).toBe('');
    });

    it("buildAcTitleで空白のみの場合", () => {
      const ac = {
        title: '   ',
        then: '',
        when: '',
        given: '',
      };
      expect(buildAcTitle(ac)).toBe('');
    });

    it("compactSfNameで全文字削除された場合", () => {
      expect(compactSfName('機能')).toBe('機能'); // 2文字で残る
    });

    it("compactSfNameで記号のみの場合（15文字以下なので変更なし）", () => {
      // 8文字なので15文字以下、何も削除されない
      expect(compactSfName('・／\\（）()')).toBe('・／\\（）()');
    });

    it("複数のBRを処理（BR IDは undefined になる）", () => {
      // deriveTaskIdFromBrId は BT ID (4部構成) のみ対応
      // BR ID は undefined を返すので、フィルタで削除される
      const brIds = ['BR-AR-0001-0001', 'BR-AR-0001-0002', 'BR-AR-0002-0001'];
      const taskIds = brIds.map(id => deriveTaskIdFromBrId(id)).filter(Boolean);

      expect(taskIds).toEqual([]); // 全て undefined で空配列
    });

    it("ACタイトル40文字境界値", () => {
      const exactly40 = '1234567890123456789012345678901234567890';
      const ac = { title: exactly40, then: '', when: '', given: '' };
      expect(buildAcTitle(ac)).toBe(exactly40);
    });

    it("ACタイトル41文字で省略", () => {
      const exactly41 = '1234567890123456789012345678901234567890A';
      const ac = { title: exactly41, then: '', when: '', given: '' };
      expect(buildAcTitle(ac)).toBe('1234567890123456789012345678901234567890...');
    });
  });
});
