# ヘルススコア肯定語化・スコア反転計画

## 概要

ヘルススコアの表示を**否定語から肯定語**に変更し、**スコアを反転**させる。
点数が高いほど良い状態になるようにする。

## 現状の問題

### Before（現在）
```
業務要件にシステム要件が紐づいていない    0/2 ✓  ← 問題なしだが否定語
システム要件に業務要件が紐づいていない    2/2    ← 全て問題だが直感的に分かりにくい
```

**課題**:
- 否定語（「〜ていない」）が認知的負荷を高める
- スコアが高いほど悪い状態という反直感的な設計

## After（改善後）

```
業務要件にシステム要件が紐づいている      0/2 ✗  ← 紐づいて0件 = Red
システム要件に業務要件が紐づいている      4/4 ✓  ← 紐づいて4件 = Green
エントリポイントに責務が設定されている    0/2 ✗  ← 設定0件 = Red
```

**ポイント**:
- 肯定語で記述（「〜ている」）
- 正常数/全体数で表示（満たしている数/全体数）
- 2/2（全てOK）= Green、0/2（全てNG）= Red

## 実装内容

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `lib/health-score/index.ts` | 型定義変更（missing→completed）、ラベル変更、ロジック反転 |
| `components/health-score/health-score-card.tsx` | UIのスコア表示・色分けロジック修正 |

### 変更詳細

#### 1. 型定義変更 (`lib/health-score/index.ts`)

**Before:**
```typescript
export type HealthScoreIssue = {
	id: string;
	label: string;
	severity: HealthScoreSeverity;
	missing: number;  // 問題数
	total: number;
	ratio: number;    // missing/total
};
```

**After:**
```typescript
export type HealthScoreIssue = {
	id: string;
	label: string;
	severity: HealthScoreSeverity;
	completed: number;  // 正常数（満たしている数）
	total: number;
	ratio: number;      // completed/total
};
```

#### 2. ラベル変更（否定→肯定）

| Before | After |
|--------|-------|
| 業務要件にシステム要件が紐づいていない | 業務要件にシステム要件が紐づいている |
| システム要件に業務要件が紐づいていない | システム要件に業務要件が紐づいている |
| システム機能にエントリポイントが未設定 | システム機能にエントリポイントが設定されている |
| エントリポイントに責務が未設定 | エントリポイントに責務が設定されている |
| 概念辞書の用語が要件文中に出現するのにリンクがない | 概念辞書の用語にリンクされている |
| 業務要件に concept_ids がない | 業務要件に概念が紐づいている |
| 業務要件に impacts がない | 業務要件に影響範囲が設定されている |
| システム要件に category（観点種別）がない | システム要件に観点種別が設定されている |
| 受入条件が0件 | 受入条件が設定されている |
| 受入条件がlint警告を受けている | 受入条件が適切に記述されている |

#### 3. ロジック反転 (`lib/health-score/index.ts`)

**Before:**
```typescript
const createIssue = (
	id: string,
	label: string,
	severity: HealthScoreSeverity,
	missing: number,  // 問題数
	total: number
): HealthScoreIssue => ({
	id,
	label,
	severity,
	missing,
	total,
	ratio: total === 0 ? 0 : missing / total,
});
```

**After:**
```typescript
const createIssue = (
	id: string,
	label: string,
	severity: HealthScoreSeverity,
	completed: number,  // 正常数
	total: number
): HealthScoreIssue => ({
	id,
	label,
	severity,
	completed,
	total,
	ratio: total === 0 ? 1 : completed / total,
});
```

#### 4. 各ルールの計算ロジック変更

**Before（問題数をカウント）:**
```typescript
issues.push(
	createIssue(
		"business_requirements_without_system_requirements",
		"業務要件にシステム要件が紐づいていない",
		"high",
		businessRequirements.filter((req) => req.relatedSystemRequirementIds.length === 0).length,
		businessRequirements.length
	)
);
```

**After（正常数をカウント）:**
```typescript
issues.push(
	createIssue(
		"business_requirements_with_system_requirements",
		"業務要件にシステム要件が紐づいている",
		"high",
		businessRequirements.filter((req) => req.relatedSystemRequirementIds.length > 0).length,
		businessRequirements.length
	)
);
```

#### 5. スコア計算ロジック修正

**Before:**
```typescript
const rawScore =
	totalWeight === 0
		? 100
		: (scoredIssues.reduce((sum, issue) => {
				const compliance = 1 - issue.ratio;  // ratioは問題割合
				return sum + compliance * severityWeight[issue.severity];
		  }, 0) /
				totalWeight) *
		  100;
```

**After:**
```typescript
const rawScore =
	totalWeight === 0
		? 100
		: (scoredIssues.reduce((sum, issue) => {
				const compliance = issue.ratio;  // ratioは正常割合
				return sum + compliance * severityWeight[issue.severity];
		  }, 0) /
				totalWeight) *
		  100;
```

#### 6. UIの色分けロジック修正 (`components/health-score/health-score-card.tsx`)

**Before:**
```tsx
<div className={`h-full rounded-full transition-all ${
  issue.missing === 0
    ? "bg-emerald-500"  // 問題なし = Green
    : issue.ratio >= 0.5
      ? "bg-rose-500"
      : "bg-amber-500"
}`} style={{ width: `${issue.ratio * 100}%` }} />
```

**After:**
```tsx
<div className={`h-full rounded-full transition-all ${
  issue.completed === issue.total
    ? "bg-emerald-500"  // 全てOK = Green
    : issue.completed === 0
      ? "bg-rose-500"   // 全てNG = Red
      : "bg-amber-500"  // 一部OK = Amber
}`} style={{ width: `${issue.ratio * 100}%` }} />
```

**数値表示:**
```tsx
<span className={`font-semibold ${
  issue.completed === issue.total
    ? "text-emerald-700"
    : issue.completed === 0
      ? "text-rose-700"
      : "text-amber-700"
}`}>
  {issue.completed}
</span>
<span className="text-slate-400">/</span>
<span className="text-slate-500">{issue.total}</span>
```

**チェックマーク:**
```tsx
<Check
  weight="bold"
  className={`w-4 h-4 ${
    issue.completed === issue.total ? "text-emerald-500" : "invisible"
  }`}
/>
```

## 難易度評価

```
難易度: ★★☆
根拠: 2 files, ~200 lines, ロジック全体的に変更
リスク: 中 - データ構造変更、ロジック反転による影響範囲広い
```

## 検証方法

### E2Eテスト（Playwright MCP）

1. システム機能詳細ページにアクセス:
   `http://localhost:3000/system-domains/AR/SRF-001`

2. ヘルススコアの検出ルールを確認:
   - **「業務要件にシステム要件が紐づいている」**
     - 期待: 0/2、rose色、✗ アイコン（invisible）
   - **「システム要件に業務要件が紐づいている」**
     - 期待: 4/4、emerald色、✓ アイコン

3. プログレスバーの色分け確認:
   - 全てOK（N/N）: emerald-500
   - 一部OK（1〜N-1/N）: amber-500
   - 全てNG（0/N）: rose-500

## Critical Files

- **修正対象**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/health-score/index.ts`
- **修正対象**: `/usr/local/src/dev/wsl/personal-pj/req-manager/components/health-score/health-score-card.tsx`

## 表示イメージ例

**改善後の見え方（例）:**

| ルール | 状態 | 表示 |
|------|------|------|
| 業務要件にシステム要件が紐づいている | 全てNG(0/2) | `[----]` `0/2` (rose色) |
| システム要件に業務要件が紐づいている | 全てOK(4/4) | `[████]` `4/4` ✓ (emerald色) |
| システム機能にエントリポイントが設定されている | 全てOK(1/1) | `[████]` `1/1` ✓ (emerald色) |
| エントリポイントに責務が設定されている | 全てNG(0/2) | `[----]` `0/2` (rose色) |
| 概念辞書の用語にリンクされている | 一部OK(1/6) | `[##--]` `1/6` (amber色) |
