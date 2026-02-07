# 調査レポート: 一瞬の赤いエラーメッセージ問題の横断分析

## 調査対象
今回修正した「一瞬の赤いエラーメッセージ」問題が、テーブル系コンポーネント（`ResourceListPage`）を使っている他のページでも発生しているか？

## 調査サマリー

### 結論
**はい、同じ問題が他のページでも発生しています。**

`useBusinessByKey` Hook において、`businessKey` が `null`/`undefined` の場合にエラーをセットする実装になっており、これが `/business/[id]/[taskId]/page.tsx` で使用されています。このHookは現在の実装では `null` チェック時にエラーをセットしてしまうため、同様の「一瞬の赤いエラーメッセージ」問題が発生します。

---

## 詳細調査結果

### 1. ResourceListPageを使用しているページ

| ページパス | 使用Hook | 問題の有無 |
|-----------|---------|-----------|
| `/business/[id]/page.tsx` | `useBusinessTasks` | **修正済み** |
| `/system/[id]/page.tsx` | `useSystemFunctions` | **問題なし** (直接params.idを渡す) |

**注記:** `/business/[id]/[taskId]/page.tsx` は `ResourceListPage` を使用していませんが、`useBusinessByKey` を使用しており、このHookで問題が発生します。

### 2. 問題のあるHookパターン

#### 2.1 `useBusinessByKey` Hook (未修正)

**ファイル:** `/usr/local/src/dev/wsl/personal-pj/req-manager/hooks/use-business-by-key.ts`

**問題コード (31-36行目):**
```typescript
if (!businessKey) {
  setError("業務領域が指定されていません");
  setBusiness(null);
  setLoading(false);
  return;
}
```

**問題点:**
- `businessKey` が `null`/`undefined` の場合にエラーをセットしている
- ページマウント直後は `use(params)` で値を取得する前に一時的に `undefined` になる可能性がある
- これにより「一瞬の赤いエラーメッセージ」が表示される

**影響ページ:**
- `/business/[id]/page.tsx` (間接的に影響 - `useBusinessByKey` の結果を使って `useBusinessTasks` を呼ぶ)
- `/business/[id]/[taskId]/page.tsx` (直接使用)

#### 2.2 `useBusinessTasks` Hook (修正済み)

**ファイル:** `/usr/local/src/dev/wsl/personal-pj/req-manager/hooks/use-business-tasks.ts`

**修正済みコード (28-34行目):**
```typescript
// null/undefined は「まだ取得中」として扱う（loading状態を維持）
if (businessId === null || businessId === undefined) {
  setLoading(true);
  setError(null);
  setTasks([]);
  return;
}
```

**評価:** 適切に修正されています。`null`/`undefined` の場合はloading状態を維持し、エラーをセットしていません。

#### 2.3 `useSystemFunctions` Hook

**ファイル:** `/usr/local/src/dev/wsl/personal-pj/req-manager/hooks/use-system-functions.ts`

**現状 (17行目):**
```typescript
export const useSystemFunctions = (domainId: string): UseSystemFunctionsReturn => {
```

**評価:**
- 引数型が `string` であり、`null`/`undefined` を許容していない
- `domainId` は `params.id` から直接取得しており、ページ側で `undefined` になることはない
- **問題なし**

### 3. ページごとの実装状況

#### `/business/[id]/page.tsx`
```typescript
const { id: businessKey } = use(params);
const { businessId, businessArea: resolvedArea, loading: businessLoading } = useBusinessByKey(businessKey);
const { tasks, loading, error, deleteTask, clearError } = useBusinessTasks(businessId ?? undefined);
```

- `useBusinessByKey` がエラーをセットする可能性あり
- `useBusinessTasks` は修正済みで `undefined` を適切にハンドリング

#### `/business/[id]/[taskId]/page.tsx`
```typescript
const { id: businessKey, taskId } = use(params);
const { businessId, businessArea } = useBusinessByKey(businessKey);
```

- `useBusinessByKey` がエラーをセットする可能性あり
- `ResourceListPage` は使用していないが、Hook自体のエラー表示が問題になる

#### `/system/[id]/page.tsx`
```typescript
const { id } = use(params);
const { functions, loading, error, deleteFunction, clearError } = useSystemFunctions(id);
```

- `useSystemFunctions` は直接 `params.id` を使用
- `ResourceListPage` に `items` モードでデータを渡す
- **問題なし**

---

## 修正対象ファイル

### 優先度高（即時修正推奨）

| ファイル | 問題 | 影響ページ |
|---------|------|-----------|
| `hooks/use-business-by-key.ts` | `null`/`undefined` でエラーセット | `/business/[id]/page.tsx`<br>`/business/[id]/[taskId]/page.tsx` |

### 優先度低（問題なし）

| ファイル | 状態 |
|---------|------|
| `hooks/use-business-tasks.ts` | 修正済み |
| `hooks/use-system-functions.ts` | 問題なし |

---

## 推奨修正パターン

### `useBusinessByKey` Hook の修正案

**現在の問題ある実装:**
```typescript
if (!businessKey) {
  setError("業務領域が指定されていません");
  setBusiness(null);
  setLoading(false);
  return;
}
```

**推奨される修正:**
```typescript
// null/undefined は「まだ取得中」として扱う（loading状態を維持）
if (businessKey === null || businessKey === undefined) {
  setLoading(true);
  setError(null);
  setBusiness(null);
  setBusinessId(null);
  setBusinessArea(null);
  return;
}
// 空文字列が渡された場合はエラーにする（本来のバリデーション）
if (businessKey === "") {
  setError("業務領域が指定されていません");
  setBusiness(null);
  setLoading(false);
  return;
}
```

**ポイント:**
1. `null`/`undefined` と空文字列を区別する
2. `null`/`undefined` は「取得中」として扱う
3. 空文字列のみをエラーとする

---

## 検証方法

修正後、以下のページで動作確認を行うこと：

1. `/business/[id]/page.tsx`
   - ページ遷移時に一瞬の赤いエラーが表示されないこと
   - データが正しく表示されること

2. `/business/[id]/[taskId]/page.tsx`
   - ページ遷移時に一瞬の赤いエラーが表示されないこと
   - データが正しく表示されること

---

## 注目点

1. **根本原因:** Reactの `use(params)` は非同期に値を解決するため、コンポーネントマウント直後はパラメータが `undefined` になる

2. **一貫性の問題:** `useBusinessTasks` は修正されているが、それを呼び出す元の `useBusinessByKey` が修正されていない

3. **型安全性:** TypeScriptの型定義で `string | null | undefined` を明示的に受け入れるべき

---

## 次のステップへの提案

### 1. 即時対応
- `useBusinessByKey` Hook を上記パターンで修正

### 2. 横断的対応
- 全てのデータ取得Hookで `null`/`undefined` のハンドリングを統一する
- ガイドラインを作成:
  - `null`/`undefined` → loading状態
  - 空文字列 → エラー

### 3. 将来の予防
- ESLintルールを追加: Hook内で `if (!param)` パターンを検知
- 新規Hook作成時のチェックリストに「null/undefinedハンドリング」を追加

### 4. テスト追加
- 各Hookについて、以下のケースのテストを追加:
  - `null` が渡された場合 → loading状態
  - `undefined` が渡された場合 → loading状態
  - 空文字列が渡された場合 → エラー状態
  - 有効な値が渡された場合 → データ取得成功
