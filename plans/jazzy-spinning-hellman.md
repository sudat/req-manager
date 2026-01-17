# TASK-002 システム要件カードのリンク不具合修正

## 概要

TASK-002（売掛計上）のシステム要件カードに「関連システム機能」リンクが表示されていない問題を修正します。

## 原因

TASK-002のシステム要件「売掛金自動計上バッチ処理」の `srfId` が `null` になっています。

**該当箇所:** `/lib/domain/task-knowledge.ts:159`

```typescript
{
  id: "SR-TASK-002-001",
  type: "システム要件",
  title: "売掛金自動計上バッチ処理",
  summary: "売上伝票を定期的に取り込み、売掛金を計上する。",
  conceptIds: ["C004"],
  srfId: null,  // ← ここがnull
  systemDomainIds: [],
  ...
}
```

**リンク表示条件（SystemRequirementCard）:**
```typescript
const srf = requirement.srfId
  ? systemFunctions.find(f => f.id === requirement.srfId)
  : undefined;

{srf && (
  <div className="border-t border-slate-100 pt-2 mt-2">
    <div className="text-[12px] font-medium text-slate-500 mb-1">関連システム機能</div>
    ...
  </div>
)}
```

`srfId` が `null` の場合、`srf` が `undefined` になり、「関連システム機能」セクションが表示されません。

## 現状のシステム機能一覧（AR領域）

| ID | 機能名 | 機能分類 | ステータス |
|----|--------|----------|----------|
| SRF-001 | 請求書発行 | 画面 | 実装済 |
| SRF-002 | 税率別内訳集計機能 | 内部 | 実装済 |
| SRF-003 | 入金データ取り込み機能 | 内部 | 実装中 |
| SRF-004 | 入金消込機能 | 内部 | テスト中 |
| SRF-005 | 債権管理一覧 | 画面 | 未実装 |
| SRF-006 | 与信管理 | 画面 | 実装中 |
| SRF-007 | 電子請求書送信 | IF | 未実装 |
| SRF-008 | 延滞債権アラート機能 | 内部 | テスト中 |

TASK-002の「売掛金自動計上バッチ処理」に該当するシステム機能が存在しません。

---

## 解決策

### Step 1: システム機能を新規作成

**システム機能ID:** SRF-009
**機能名:** 売掛金自動計上バッチ処理
**機能分類:** バッチ
**領域:** AR（債権管理）

**作成手順:**
1. UIで作成: `http://localhost:3000/system-domains/AR/functions/create` にアクセス
2. 以下を入力:
   - ID: SRF-009
   - 機能名: 売掛金自動計上バッチ処理
   - 機能分類: バッチ
   - 説明: 売上伝票を定期的に取り込み、売掛金を計上して債権台帳へ登録するバッチ処理
   - ステータス: 未実装（または実装中）

### Step 2: task-knowledge.ts の修正

**ファイル:** `/lib/domain/task-knowledge.ts:159`

```diff
  srfId: null,
+ srfId: "SRF-009",
```

---

## 検証手順

1. システム機能 SRF-009 を作成する
2. `task-knowledge.ts` を修正する
3. `http://localhost:3000/business/BIZ-001/tasks/TASK-002` にアクセス
4. システム要件カード内に「関連システム機能」セクションが表示されることを確認
5. SRF-009 へのリンクがクリック可能であることを確認

---

## 難易度

```
難易度: ★☆☆
根拠: 1 file, 1 line, システム機能の新規作成
リスク: 低 - データ値の修正のみで機能変更なし
```
