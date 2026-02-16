import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: dd-draft Tool
// ========================================

type DdType = 'screen' | 'api' | 'batch' | 'external_if' | 'model' | 'report' | 'job';

type SrItem = {
  id: string;
  title?: string | null;
  summary?: string | null;
  requirement?: string | null;
  category?: string | null;
};

/**
 * スラグ化（URL-friendlyな文字列に変換）
 */
function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
  return normalized;
}

/**
 * ユニークなスラグを生成（重複回避）
 */
function ensureUniqueSlug(slug: string, used: Set<string>): string {
  let candidate = slug;
  let index = 2;
  while (!candidate || used.has(candidate)) {
    candidate = `${slug || 'dd'}-${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
}

/**
 * DDタイプからエントリポイントパスを生成
 */
function buildEntryPointPath(type: DdType, slug: string): string {
  switch (type) {
    case 'screen':
      return `app/(with-sidebar)/${slug}/page.tsx`;
    case 'api':
      return `app/api/${slug}/route.ts`;
    case 'batch':
      return `scripts/batch/${slug}.ts`;
    case 'external_if':
      return `app/api/integrations/${slug}/route.ts`;
    case 'model':
      return `lib/models/${slug}.ts`;
    case 'report':
      return `app/reports/${slug}/page.tsx`;
    case 'job':
      return `scripts/jobs/${slug}.ts`;
    default:
      return `app/${slug}`;
  }
}

/**
 * SRリストと入力テキストからDDタイプを導出
 */
function deriveFallbackTypes(srs: SrItem[], inputText?: string): DdType[] {
  const sourceText = [
    ...srs.map((sr) => `${sr.title ?? ''} ${sr.summary ?? sr.requirement ?? ''}`),
    inputText ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const has = (keywords: string[]) => keywords.some((kw) => sourceText.includes(kw));

  const types: DdType[] = [];
  if (has(['画面', 'ui', '入力', '一覧', '検索', '照会', '画'])) types.push('screen');
  if (has(['api', 'エンドポイント', '連携', '送信', '受信'])) types.push('api');
  if (has(['バッチ', '集計', '一括', '夜間', '締め'])) types.push('batch');
  if (has(['外部', 'i/f', 'if', 'インターフェース', '連携'])) types.push('external_if');
  if (has(['モデル', 'db', 'テーブル', 'マスタ', 'データ構造'])) types.push('model');
  if (has(['帳票', 'レポート', 'report', 'pdf', '出力'])) types.push('report');
  if (has(['ジョブ', 'job', 'キュー', '非同期', 'バックグラウンド'])) types.push('job');

  const unique = Array.from(new Set(types));
  if (unique.length === 0) return ['screen', 'api'];
  if (unique.length === 1) return [...unique, 'api'];
  return unique.slice(0, 5);
}

// ========================================
// Test Suites
// ========================================

describe("dd-draft Tool ロジック抽出テスト", () => {
  describe("slugify", () => {
    it("英数字のみの場合は小文字に変換", () => {
      expect(slugify('HelloWorld')).toBe('helloworld');
      expect(slugify('TEST123')).toBe('test123');
    });

    it("日本語のみはNFKD正規化で空文字に", () => {
      // 日本語文字はNFKD正規化で分解され、a-z0-9以外は削除される
      expect(slugify('請求書発行')).toBe('');
    });

    it("スペースとハイフンは正規化", () => {
      expect(slugify('hello world test')).toBe('hello-world-test');
      expect(slugify('hello---world')).toBe('hello-world');
    });

    it("先頭と末尾のハイフンを削除", () => {
      expect(slugify('--hello--')).toBe('hello');
    });

    it("複数の連続ハイフンを1つに", () => {
      expect(slugify('hello-----world')).toBe('hello-world');
    });

    it("英数字と日本語の混合", () => {
      // 日本語はNFKD正規化で削除され、残った文字でスラグ化
      expect(slugify('invoice-請求書-API')).toBe('invoice-api');
    });

    it("空文字の場合は空文字", () => {
      expect(slugify('')).toBe('');
    });
  });

  describe("ensureUniqueSlug", () => {
    it("未使用のスラグはそのまま返す", () => {
      const used = new Set<string>(['existing-slug']);
      expect(ensureUniqueSlug('new-slug', used)).toBe('new-slug');
      expect(used.has('new-slug')).toBe(true);
    });

    it("重複する場合はサフィックスを付加", () => {
      const used = new Set<string>(['test-slug']);
      expect(ensureUniqueSlug('test-slug', used)).toBe('test-slug-2');
      expect(used.has('test-slug-2')).toBe(true);
    });

    it("連続して重複を回避", () => {
      const used = new Set<string>(['test-slug', 'test-slug-2']);
      expect(ensureUniqueSlug('test-slug', used)).toBe('test-slug-3');
      expect(ensureUniqueSlug('test-slug', used)).toBe('test-slug-4');
    });

    it("空文字の場合はデフォルト名を生成", () => {
      const used = new Set<string>();
      expect(ensureUniqueSlug('', used)).toBe('dd-2');
    });

    it("既存のデフォルト名とも重複回避", () => {
      const used = new Set<string>(['dd-2']);
      expect(ensureUniqueSlug('', used)).toBe('dd-3');
    });
  });

  describe("buildEntryPointPath", () => {
    it("screenタイプのパス", () => {
      expect(buildEntryPointPath('screen', 'invoice-list'))
        .toBe('app/(with-sidebar)/invoice-list/page.tsx');
    });

    it("apiタイプのパス", () => {
      expect(buildEntryPointPath('api', 'users'))
        .toBe('app/api/users/route.ts');
    });

    it("batchタイプのパス", () => {
      expect(buildEntryPointPath('batch', 'daily-aggregation'))
        .toBe('scripts/batch/daily-aggregation.ts');
    });

    it("external_ifタイプのパス", () => {
      expect(buildEntryPointPath('external_if', 'external-system'))
        .toBe('app/api/integrations/external-system/route.ts');
    });

    it("modelタイプのパス", () => {
      expect(buildEntryPointPath('model', 'user'))
        .toBe('lib/models/user.ts');
    });

    it("reportタイプのパス", () => {
      expect(buildEntryPointPath('report', 'sales-report'))
        .toBe('app/reports/sales-report/page.tsx');
    });

    it("jobタイプのパス", () => {
      expect(buildEntryPointPath('job', 'email-notification'))
        .toBe('scripts/jobs/email-notification.ts');
    });
  });

  describe("deriveFallbackTypes", () => {
    const emptySrs: SrItem[] = [];

    it("画面関連キーワードでscreenを検出", () => {
      const srs: SrItem[] = [{ id: 'SR-001', title: 'ユーザー一覧画面を表示する' }];
      expect(deriveFallbackTypes(srs)).toContain('screen');
    });

    it("API関連キーワードでapiを検出", () => {
      const srs: SrItem[] = [{ id: 'SR-001', title: 'データ取得APIエンドポイント' }];
      expect(deriveFallbackTypes(srs)).toContain('api');
    });

    it("バッチ関連キーワードでbatchを検出", () => {
      const srs: SrItem[] = [{ id: 'SR-001', title: '夜間バッチで集計処理' }];
      expect(deriveFallbackTypes(srs)).toContain('batch');
    });

    it("外部I/F関連キーワードでexternal_ifを検出", () => {
      const srs: SrItem[] = [{ id: 'SR-001', title: '外部システムとの連携I/F' }];
      expect(deriveFallbackTypes(srs)).toContain('external_if');
    });

    it("モデル関連キーワードでmodelを検出", () => {
      const srs: SrItem[] = [{ id: 'SR-001', title: 'ユーザーマスタテーブル' }];
      expect(deriveFallbackTypes(srs)).toContain('model');
    });

    it("帳票関連キーワードでreportを検出", () => {
      const srs: SrItem[] = [{ id: 'SR-001', title: 'PDF出力帳票を生成' }];
      expect(deriveFallbackTypes(srs)).toContain('report');
    });

    it("ジョブ関連キーワードでjobを検出", () => {
      const srs: SrItem[] = [{ id: 'SR-001', title: '非同期ジョブで処理' }];
      expect(deriveFallbackTypes(srs)).toContain('job');
    });

    it("複数のタイプを検出", () => {
      const srs: SrItem[] = [
        { id: 'SR-001', title: '画面から入力してAPIで送信' }
      ];
      const result = deriveFallbackTypes(srs);
      expect(result).toContain('screen');
      expect(result).toContain('api');
    });

    it("追加の入力テキストも考慮", () => {
      const srs: SrItem[] = [];
      const result = deriveFallbackTypes(srs, 'バッチ処理でレポートを出力');
      expect(result).toContain('batch');
      expect(result).toContain('report');
    });

    it("何も検出できない場合はscreenとapiを返す", () => {
      const srs: SrItem[] = [{ id: 'SR-001', title: 'なんらかの機能' }];
      const result = deriveFallbackTypes(srs);
      expect(result).toEqual(['screen', 'api']);
    });

    it("1つだけ検出の場合はapiも追加", () => {
      const srs: SrItem[] = [{ id: 'SR-001', title: 'ユーザー一覧を表示' }];
      const result = deriveFallbackTypes(srs);
      expect(result).toContain('screen');
      expect(result).toContain('api');
    });

    it("最大5つに制限", () => {
      const srs: SrItem[] = [
        { id: 'SR-001', title: '画面とAPIとバッチと外部I/Fとモデル' }
      ];
      const result = deriveFallbackTypes(srs);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("大文字小文字を区別しない", () => {
      const srs: SrItem[] = [{ id: 'SR-001', title: 'API Endpoint for PDF REPORT' }];
      const result = deriveFallbackTypes(srs);
      expect(result).toContain('api');
      expect(result).toContain('report');
    });
  });

  describe("統合シナリオ", () => {
    it("スラグ生成からエントリポイントパス生成まで", () => {
      const slug = slugify('Invoice List API');
      expect(slug).toBe('invoice-list-api');

      const path = buildEntryPointPath('api', slug);
      expect(path).toBe('app/api/invoice-list-api/route.ts');
    });

    it("重複回避付きスラグ生成", () => {
      const used = new Set<string>();
      const slug1 = ensureUniqueSlug('test-api', used);
      const slug2 = ensureUniqueSlug('test-api', used);
      const slug3 = ensureUniqueSlug('test-api', used);

      expect(slug1).toBe('test-api');
      expect(slug2).toBe('test-api-2');
      expect(slug3).toBe('test-api-3');
      expect(used.size).toBe(3);
    });

    it("日本語を含むDD名のスラグ化", () => {
      const slug = slugify('DD-AR-0001-screen');
      expect(slug).toBe('dd-ar-0001-screen');
    });
  });

  describe("エッジケース", () => {
    it("全て特殊文字のスラグ化", () => {
      // a-z0-9以外の文字は全て削除され、空文字になる
      expect(slugify('!!!@@@###')).toBe('');
    });

    it("空文字セットでの重複回避", () => {
      const used = new Set<string>();
      const result = ensureUniqueSlug('test', used);
      expect(result).toBe('test');
      expect(used.has('test')).toBe(true);
    });

    it("SRにtitle/summary/requirementが全て空", () => {
      const srs: SrItem[] = [
        { id: 'SR-001', title: null, summary: null, requirement: null }
      ];
      const result = deriveFallbackTypes(srs, '');
      expect(result).toEqual(['screen', 'api']);
    });

    it("タイプの重複排除", () => {
      const srs: SrItem[] = [
        { id: 'SR-001', title: '画面API' },
        { id: 'SR-002', summary: '画面とAPI' }
      ];
      const result = deriveFallbackTypes(srs);
      const unique = Array.from(new Set(result));
      expect(unique.length).toBe(result.length);
    });
  });
});
