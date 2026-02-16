import { describe, it, expect } from "bun:test";

// ========================================
// ロジック抽出: commit-draft Tool
// ========================================

/**
 * オブジェクトチェック
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * project_idエラー時のリトライ判断
 */
function shouldRetryWithoutProjectId(error: any): boolean {
  if (!error) return false;
  const message = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
  return message.includes('project_id') && message.includes('does not exist');
}

/**
 * SRカテゴリの正規化
 */
function normalizeSystemRequirementCategory(value?: string): string {
  if (
    value === 'function' ||
    value === 'data' ||
    value === 'exception' ||
    value === 'non_functional'
  ) {
    return value;
  }
  if (value === 'functional') return 'function';
  if (value === 'auth') return 'non_functional';
  return 'function';
}

/**
 * AC記述の生成
 */
function buildAcceptanceDescription(ac: { given: string; when: string; then: string }): string {
  return `Given ${ac.given} When ${ac.when} Then ${ac.then}`;
}

/**
 * ACタイトルの生成
 */
function buildAcceptanceTitle(ac: { title?: string; given: string; when: string; then: string }): string {
  const candidate = (ac.title || ac.then || ac.when || ac.given || '').trim();
  return candidate || buildAcceptanceDescription(ac);
}

/**
 * SRタイトルの生成
 */
function buildSystemRequirementTitle(text: string): string {
  const trimmed = text.trim();
  const firstSentence = trimmed.split(/。|\n/)[0]?.trim();
  const base = firstSentence || trimmed;
  if (base.length <= 40) return base;
  return `${base.slice(0, 40)}...`;
}

/**
 * 配列の正規化
 */
function toTextArrayOrEmpty(value?: string[] | null): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [String(value)];
}

// ========================================
// Test Suites
// ========================================

describe("commit-draft Tool ロジック抽出テスト", () => {
  describe("isPlainObject", () => {
    it("プレーンオブジェクトはtrue", () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ key: "value" })).toBe(true);
    });

    it("配列はfalse", () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject([1, 2, 3])).toBe(false);
    });

    it("nullはfalse", () => {
      expect(isPlainObject(null)).toBe(false);
    });

    it("プリミティブ型はfalse", () => {
      expect(isPlainObject("string")).toBe(false);
      expect(isPlainObject(123)).toBe(false);
      expect(isPlainObject(true)).toBe(false);
    });

    it("undefinedはfalse", () => {
      expect(isPlainObject(undefined)).toBe(false);
    });
  });

  describe("shouldRetryWithoutProjectId", () => {
    it("project_idエラーとdoes not existを含む場合はtrue", () => {
      const error = {
        message: "null character in where clause",
        details: "project_id does not exist",
      };
      expect(shouldRetryWithoutProjectId(error)).toBe(true);
    });

    it("project_idのみではfalse", () => {
      const error = {
        message: "project_id error",
        details: "some other error",
      };
      expect(shouldRetryWithoutProjectId(error)).toBe(false);
    });

    it("does not existのみではfalse", () => {
      const error = {
        message: "table does not exist",
        details: "some details",
      };
      expect(shouldRetryWithoutProjectId(error)).toBe(false);
    });

    it("nullやundefinedの場合はfalse", () => {
      expect(shouldRetryWithoutProjectId(null)).toBe(false);
      expect(shouldRetryWithoutProjectId(undefined)).toBe(false);
    });

    it("大文字小文字を区別しない", () => {
      const error = {
        message: "PROJECT_ID DOES NOT EXIST",
        details: "",
      };
      expect(shouldRetryWithoutProjectId(error)).toBe(true);
    });
  });

  describe("normalizeSystemRequirementCategory", () => {
    it("有効なカテゴリはそのまま返す", () => {
      expect(normalizeSystemRequirementCategory('function')).toBe('function');
      expect(normalizeSystemRequirementCategory('data')).toBe('data');
      expect(normalizeSystemRequirementCategory('exception')).toBe('exception');
      expect(normalizeSystemRequirementCategory('non_functional')).toBe('non_functional');
    });

    it("functionalはfunctionに正規化", () => {
      expect(normalizeSystemRequirementCategory('functional')).toBe('function');
    });

    it("authはnon_functionalに正規化", () => {
      expect(normalizeSystemRequirementCategory('auth')).toBe('non_functional');
    });

    it("未定義の値はfunctionにフォールバック", () => {
      expect(normalizeSystemRequirementCategory(undefined)).toBe('function');
      expect(normalizeSystemRequirementCategory('unknown')).toBe('function');
      expect(normalizeSystemRequirementCategory('')).toBe('function');
    });
  });

  describe("buildAcceptanceDescription", () => {
    it("GWT形式の記述を生成", () => {
      const ac = {
        given: "ユーザーがログインしている",
        when: "保存ボタンをクリックする",
        then: "データが保存される",
      };
      expect(buildAcceptanceDescription(ac)).toBe(
        "Given ユーザーがログインしている When 保存ボタンをクリックする Then データが保存される"
      );
    });

    it("空文字列でも動作", () => {
      const ac = { given: "", when: "", then: "" };
      expect(buildAcceptanceDescription(ac)).toBe("Given  When  Then ");
    });
  });

  describe("buildAcceptanceTitle", () => {
    it("titleがあればそれを返す", () => {
      const ac = {
        title: "ログイン時にエラーが表示される",
        given: "ユーザーがログインする",
        when: "認証に失敗する",
        then: "エラーメッセージが表示される",
      };
      expect(buildAcceptanceTitle(ac)).toBe("ログイン時にエラーが表示される");
    });

    it("titleがない場合はthenを使う", () => {
      const ac = {
        given: "ユーザーがログインする",
        when: "認証に失敗する",
        then: "エラーメッセージが表示される",
      };
      expect(buildAcceptanceTitle(ac)).toBe("エラーメッセージが表示される");
    });

    it("thenがない場合はwhenを使う", () => {
      const ac = {
        given: "ユーザーがログインする",
        when: "認証に失敗する",
        then: "",
      };
      expect(buildAcceptanceTitle(ac)).toBe("認証に失敗する");
    });

    it("whenもない場合はgivenを使う", () => {
      const ac = {
        given: "ユーザーがログインする",
        when: "",
        then: "",
      };
      expect(buildAcceptanceTitle(ac)).toBe("ユーザーがログインする");
    });

    it("全て空文字列の場合はGWT形式を使う", () => {
      const ac = {
        given: "",
        when: "",
        then: "",
      };
      expect(buildAcceptanceTitle(ac)).toBe("Given  When  Then ");
    });
  });

  describe("buildSystemRequirementTitle", () => {
    it("40文字以内ならそのまま", () => {
      expect(buildSystemRequirementTitle("短いテキスト")).toBe("短いテキスト");
      expect(buildSystemRequirementTitle("ちょうど40文字aaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toBe("ちょうど40文字aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    });

    it("41文字以上なら省略", () => {
      const text = "これは41文字以上の長いテキストです。省略されます。";
      // 最初の句号までが20文字なので省略されない（句号が含まれない）
      expect(buildSystemRequirementTitle(text)).toBe("これは41文字以上の長いテキストです");
    });

    it("40文字を超える最初の文を省略", () => {
      // 句点なしで40文字超えのテキスト（41文字の英数字）
      const text = "12345678901234567890123456789012345678901ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      expect(buildSystemRequirementTitle(text)).toBe("1234567890123456789012345678901234567890...");
      expect(buildSystemRequirementTitle(text).length).toBe(43); // 40 + "..."
    });

    it("最初の句号までを抽出", () => {
      const text = "これは最初の文です。これは二番目の文です。";
      expect(buildSystemRequirementTitle(text)).toBe("これは最初の文です");
    });

    it("最初の改行までを抽出", () => {
      const text = "最初の行\n二番目の行";
      expect(buildSystemRequirementTitle(text)).toBe("最初の行");
    });

    it("空文字や空白のみの場合", () => {
      expect(buildSystemRequirementTitle("")).toBe("");
      expect(buildSystemRequirementTitle("   ")).toBe(""); // trimで空文字になる
    });
  });

  describe("toTextArrayOrEmpty", () => {
    it("配列をそのまま返す", () => {
      expect(toTextArrayOrEmpty(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it("nullは空配列", () => {
      expect(toTextArrayOrEmpty(null)).toEqual([]);
    });

    it("undefinedは空配列", () => {
      expect(toTextArrayOrEmpty(undefined)).toEqual([]);
    });

    it("文字列は配列に変換", () => {
      expect(toTextArrayOrEmpty('single-string')).toEqual(['single-string']);
    });

    it("空配列はそのまま", () => {
      expect(toTextArrayOrEmpty([])).toEqual([]);
    });
  });

  describe("統合シナリオ", () => {
    it("ACタイトル生成の完全パス", () => {
      const ac = {
        title: "ユーザー登録",
        given: "新規ユーザーが登録情報を入力する",
        when: "登録ボタンをクリックする",
        then: "ユーザーが作成される",
      };
      expect(buildAcceptanceTitle(ac)).toBe("ユーザー登録");
    });

    it("SRタイトル省略の境界値", () => {
      const exactly40 = "1234567890123456789012345678901234567890";
      expect(buildSystemRequirementTitle(exactly40).length).toBe(40);

      const exactly41 = "12345678901234567890123456789012345678901";
      expect(buildSystemRequirementTitle(exactly41).length).toBe(43); // 40 + "..."
    });

    it("カテゴリ正規化のマッピング", () => {
      // 互換性のある値
      expect(normalizeSystemRequirementCategory('functional')).toBe('function');
      expect(normalizeSystemRequirementCategory('auth')).toBe('non_functional');

      // 有効な値はそのまま
      const validCategories = ['function', 'data', 'exception', 'non_functional'];
      validCategories.forEach(cat => {
        expect(normalizeSystemRequirementCategory(cat)).toBe(cat);
      });
    });
  });
});
