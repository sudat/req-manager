# 修正プラン: `useBusinessByKey` Hook の null/undefined ハンドリング

## 背景と目的

### 問題概要
`/business/[id]` および `/business/[id]/[taskId]` ページで、ページロード時に一瞬「業務領域が指定されていません」という赤いエラーメッセージが表示される問題。

### 根本原因
`useBusinessByKey` Hook が `businessKey` が `null`/`undefined` の場合にエラーをセットしている。React の `use(params)` は非同期に値を解決するため、コンポーネントマウント直後はパラメータが `undefined` になる。

### 修正済みの関連ファイル
- `hooks/use-business-tasks.ts`: ✅ 既に同様の問題が修正されている

---

## 修正内容

### 対象ファイル
`/usr/local/src/dev/wsl/personal-pj/req-manager/hooks/use-business-by-key.ts`

### 修正範囲
L31-36 の `!businessKey` チェックを、以下のパターンに修正：

```typescript
// 現在（問題あり）
if (!businessKey) {
  setError("業務領域が指定されていません");
  setBusiness(null);
  setLoading(false);
  return;
}

// 修正後
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

### 型定義の変更
Hook の引数型を `string` から `string | null | undefined` に拡張：

```typescript
// 現在
export const useBusinessByKey = (businessKey: string): UseBusinessByKeyReturn => {

// 修正後
export const useBusinessByKey = (businessKey: string | null | undefined): UseBusinessByKeyReturn => {
```

---

## 検証方法

### 1. `/business/[id]/page.tsx` の確認
- ページ遷移時に一瞬の赤いエラーが表示されないこと
- データが正しく表示されること

### 2. `/business/[id]/[taskId]/page.tsx` の確認
- ページ遷移時に一瞬の赤いエラーが表示されないこと
- データが正しく表示されること

### 3. Playwright MCP での E2E テスト
```bash
# 以下のURLで動作確認
http://localhost:3000/business/AR
http://localhost:3000/business/AR/{taskId}
```

---

## 難易度評価

**難易度: ★☆☆**

根拠:
- 修正ファイル数: 1ファイル
- 変更行数: 約15行
- 影響コンポーネント数: 0個（Hook 内の完結する変更）

リスク: なし（既存の `useBusinessTasks` 修正と同じパターン）

---

## 次のステップへの提案（将来的な改善）

### 1. 横断的対応
全てのデータ取得Hookで `null`/`undefined` のハンドリングを統一する：
- `null`/`undefined` → loading状態
- 空文字列 → エラー

### 2. ガイドライン作成
新規Hook作成時のチェックリストに「null/undefinedハンドリング」を追加

### 3. ESLintルール追加
Hook内で `if (!param)` パターンを検知するルールを追加
