# plan: system-domainsページのTypeError修正（v2）

## 問題概要

`/system-domains`ページで以下のランタイムエラーが発生:
```
(codeRefs ?? []) is not iterable
lib/data/structured.ts (99:33) @ codeRefsToEntryPoints
```

## 根本原因

Supabaseの`jsonb`カラムから返されるデータは、コードではプレーンな配列として扱っていますが、実際には異なる構造で返ってきています。

**データフローの問題点:**
1. DB: `code_refs` jsonbカラム
2. `SystemFunctionRow` 型定義: `code_refs: SystemFunction["codeRefs"] | null` （間違った型）
3. 他のjsonbカラム（`entry_points`, `acceptance_criteria_json`）は `unknown | null` として正しく型定義されている
4. Supabaseから返されるデータは未知の構造 → 正しく型定義されていないため、安全に抽出できない

**他のjsonbカラムとの型定義の不一致:**
```typescript
// 正しい例（entry_points）
entry_points: unknown | null;

// 間違った例（code_refs）
code_refs: SystemFunction["codeRefs"] | null;  // ← これが原因
```

## 修正方法

### 1. ファイル: `lib/data/system-functions.ts`

#### ステップ1: 型定義の修正

`SystemFunctionRow` 型の `code_refs` を `unknown | null` に変更：

```typescript
type SystemFunctionRow = {
  // ...
  entry_points: unknown | null;
  code_refs: unknown | null;  // ← 修正: unknown | null に変更
  // ...
};
```

#### ステップ2: normalizeCodeRefs関数の追加

`lib/data/structured.ts` に正規化関数を追加（または `lib/data/system-functions.ts` 内に定義）：

```typescript
const normalizeCodeRefs = (raw: unknown): SystemFunction["codeRefs"] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const ref = item as Record<string, unknown>;

      const paths = Array.isArray(ref.paths)
        ? ref.paths.filter((p): p is string => typeof p === "string" && p.length > 0)
        : [];

      if (paths.length === 0) return null;

      return {
        githubUrl: typeof ref.githubUrl === "string" ? ref.githubUrl : undefined,
        paths,
        note: typeof ref.note === "string" ? ref.note : undefined,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
};
```

#### ステップ3: toSystemFunction関数の修正

```typescript
const toSystemFunction = (row: SystemFunctionRow): SystemFunction => {
  const normalizedEntryPoints = normalizeEntryPoints(row.entry_points);

  // code_refs を正規化
  const normalizedCodeRefs = normalizeCodeRefs(row.code_refs);

  const entryPoints =
    normalizedEntryPoints.length > 0
      ? normalizedEntryPoints
      : codeRefsToEntryPoints(normalizedCodeRefs);

  const codeRefs =
    normalizedCodeRefs.length > 0
      ? normalizedCodeRefs
      : entryPoints.length > 0
        ? (entryPointsToCodeRefs(entryPoints) as SystemFunction["codeRefs"])
        : [];

  return {
    // ... 残りのフィールド
  };
};
```

### 2. createSystemFunction / updateSystemFunction も修正

`code_refs` の書き込み時も正規化関数を使用するように確認します。

## 影響範囲

- 修正ファイル: 1ファイル（`lib/data/system-functions.ts`）
- 変更箇所:
  - `SystemFunctionRow` 型定義
  - 新規追加: `normalizeCodeRefs` 関数
  - `toSystemFunction` 関数内のロジック修正

## 検証方法

1. 修正後にPlaywrightで`/system-domains`ページにアクセス
2. ページが正常にレンダリングされることを確認
3. SystemFunctionのデータ（code_refs）が正しく表示されていることを確認
