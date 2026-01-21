# ヘルススコアUI改善設計書

## 概要

ヘルススコアカードの検出ルール表示を改善し、「分子の数字が多いほどまずい」ことが直感的に伝わるUIを設計する。

## 現状の問題分析

### 現在の実装 (lines 143-145)
```tsx
<span className="font-mono text-[12px] text-slate-900">
  {issue.missing}/{issue.total}
</span>
```

### 問題点
1. **認知的負荷**: 「0/4 = 良好」であることが直感的ではない
2. **視覚的弱さ**: 数値のみで、問題の深刻度が一瞬で伝わらない
3. **スキャン性**: 複数のルールを素早く比較しにくい

## デザイン原則の適用

### Precision & Density
- 数値をファーストクラス citizen として扱う
- 情報を前に出し、隠さない
- プロフェッショナルな密度を維持

### Sophistication & Trust
- クールな色調（slate, blue-gray）を基調
- 過度な装飾は避け、洗練されたミニマリズム
- 企業向けSaaSとしての信頼感を維持

## UI改善案の評価

### 案1: 円形プログレスバー + スコア表示
```tsx
<div className="relative w-8 h-8">
  <svg className="transform -rotate-90">
    <circle cx="16" cy="16" r="14" className="stroke-slate-100" />
    <circle cx="16" cy="16" r="14" 
            className="stroke-current"
            style={{ 
              strokeDasharray: `${compliance * 88} 88`,
              color: severityColor 
            }} />
  </svg>
  <span className="absolute inset-0 flex items-center justify-center text-[10px]">
    {issue.missing}
  </span>
</div>
```

**評価:**
- ✅ 割合が直感的に伝わる
- ❌ 実装複雑度が高い（SVG）
- ❌ 情報密度が低い（数値が小さい）
- ❌ 既存の全体スコアプログレスバーとの重複感

### 案2: カラーコード付き数値
```tsx
<span className={cn(
  "font-mono text-[12px] font-semibold",
  issue.missing === 0 ? "text-emerald-600" :
  issue.ratio >= 0.5 ? "text-rose-600" :
  "text-amber-600"
)}>
  {issue.missing}
</span>
<span className="text-slate-400">/</span>
<span className="font-mono text-[12px] text-slate-500">
  {issue.total}
</span>
```

**評価:**
- ✅ 実装がシンプル
- ✅ 色で深刻度が伝わる
- ❌ 色だけでは定量比較がしにくい
- ❌ 既存のseverityバッジと色が重複

### 案3: インジケーター付き表示 ✓/✓形式
```tsx
<div className="flex items-center gap-1">
  <span className={cn(
    "font-mono text-[12px] font-semibold",
    issue.missing === 0 ? "text-emerald-600" : "text-rose-600"
  )}>
    {issue.total - issue.missing}
  </span>
  <span className="text-slate-400">/</span>
  <span className="font-mono text-[12px] text-slate-500">
    {issue.total}
  </span>
  {issue.missing === 0 && (
    <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
  )}
</div>
```

**評価:**
- ✅ 「完了数/全体数」で直感的
- ✅ ✓アイコンで成功が強調される
- ❌ ユーザーの認知モデルを逆転させる（missing → completed）
- ❌ 数値の意味が変わる（データ構造との不一致）

### 案4: ステータスバッジ + 数値
```tsx
<Badge variant="outline" className={badgeColorClassNames[issue.severity]}>
  {issue.missing === 0 ? "すべてOK" : `${issue.missing}件の問題`}
</Badge>
```

**評価:**
- ✅ テキストで意味が明確
- ❌ 全体数が見えなくなる
- ❌ 情報密度が下がる

### 案5: ミニプログレスバー + 数値（推奨）

```tsx
<div className="flex items-center gap-2">
  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
    <div 
      className={cn(
        "h-full rounded-full transition-all duration-300",
        issue.ratio === 0 ? "bg-emerald-500" :
        issue.ratio < 0.5 ? "bg-amber-500" :
        "bg-rose-500"
      )}
      style={{ width: `${issue.ratio * 100}%` }}
    />
  </div>
  <span className="font-mono text-[12px] text-slate-700">
    {issue.missing}<span className="text-slate-400">/{issue.total}</span>
  </span>
</div>
```

**評価:**
- ✅ ビジュアルで「問題の割合」が直感的に伝わる
- ✅ 数値も表示され、正確な値がわかる
- ✅ 既存の全体スコアプログレスバーとパターンが統一されている
- ✅ 情報密度が適切
- ✅ 実装がシンプル（既存のCSSクラスを利用）

## 最終設計案

### 採用: 案5（ミニプログレスバー + 数値）の改良版

#### デザイン仕様

```tsx
// 検出ルール1行あたりのレイアウト
<li className="flex items-center justify-between text-[12px] text-slate-600 p-2 rounded bg-slate-50 hover:bg-slate-100 transition-colors">
  {/* 左側: ラベル */}
  <div className="flex items-center gap-2 flex-1 min-w-0">
    <Badge variant="outline" className={severityClassNames[issue.severity]}>
      {severityLabels[issue.severity]}
    </Badge>
    <span className="text-slate-700 truncate">{issue.label}</span>
  </div>
  
  {/* 右側: ステータス表示（改良版） */}
  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
    {/* ミニプログレスバー: 問題の割合を視覚化 */}
    <div className="w-12 h-1.5 bg-slate-100/80 rounded-full overflow-hidden" aria-hidden="true">
      <div 
        className={cn(
          "h-full rounded-full transition-all duration-300",
          // 問題なし: emerald（成功）
          issue.ratio === 0 ? "bg-emerald-500" :
          // 問題半分以上: rose（危険）
          issue.ratio >= 0.5 ? "bg-rose-500" :
          // 問題ありだが過半数ではない: amber（警告）
          "bg-amber-500"
        )}
        style={{ width: `${Math.max(4, issue.ratio * 100)}%` }}
        // 最小幅4pxを確保（0件でも存在感を持たせる）
      />
    </div>
    
    {/* 数値表示: missing/total */}
    <div className="flex items-baseline gap-0.5" aria-label={`${issue.missing}件中${issue.total}件に問題`}>
      <span className={cn(
        "font-mono text-[13px] font-semibold tabular-nums",
        // 問題数に応じて色付け
        issue.missing === 0 ? "text-emerald-700" :
        issue.missing / issue.total >= 0.5 ? "text-rose-700" :
        "text-amber-700"
      )}>
        {issue.missing}
      </span>
      <span className="text-slate-400 text-[11px]">/</span>
      <span className="font-mono text-[13px] text-slate-500 tabular-nums">
        {issue.total}
      </span>
    </div>
    
    {/* 問題なしの場合のみ✓アイコン */}
    {issue.missing === 0 && (
      <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
    )}
  </div>
</li>
```

#### 色のロジック

| 状態 | ratio | プログレスバー | 数値 | アイコン |
|------|-------|----------------|------|---------|
| 問題なし | 0 | bg-emerald-500 | text-emerald-700 | ✓ |
| 軽微 | 0 < ratio < 0.5 | bg-amber-500 | text-amber-700 | - |
| 重大 | ratio >= 0.5 | bg-rose-500 | text-rose-700 | - |

#### 詳細設計判断

1. **プログレスバーの方向性**
   - 問題の割合（ratio）を埋める
   - 0/4 → 空（emerald）: 問題なし
   - 2/4 → 半分（amber/rose）: 問題あり
   - 4/4 → 全満（rose）: 全て問題

2. **数値の強調**
   - `missing` を太字（font-semibold）にして、問題数を強調
   - `total` は薄い色（text-slate-500）で、全体数を控えめに表示
   - タイプライタ幅（tabular-nums）で、数字が揃うように

3. **✓アイコンの条件付き表示**
   - 問題なし（missing === 0）の場合のみ表示
   - 成功を視覚的に強調
   - 過度な装飾を避ける

4. **アクセシビリティ**
   - `aria-label` でスクリーンリーダーに「X件中Y件に問題」と読み上げ
   - `aria-hidden="true"` で装飾的なプログレスバーを announce から除外
   - 色だけに依存しない情報設計

5. **情報密度**
   - プログレスバー: w-12（48px）- コンパクト
   - 数値: 13px - 読みやすい
   - アイコン: 16px - 控えめ

## 実装計画

### Phase 1: コンポーネントの修正

**対象ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/components/health-score/health-score-card.tsx`

**変更範囲**: lines 128-147（検出ルールのli要素）

**変更内容**:
1. Lucide Reactから `Check` アイコンをインポート
2. 検出ルールのli要素内の数値表示部分を置き換え
3. 必要なユーティリティ関数（cn）は既にインポート済み

### Phase 2: 型定義の確認

**確認事項**: `HealthScoreIssue` 型（lib/health-score/index.ts）には以下が含まれている:
- `missing: number`
- `total: number`
- `ratio: number`（既に計算済み）
- `severity: "high" | "medium"`

**結論**: 型定義の変更は不要。既存のプロパティで十分。

## 難易度評価

```
難易度: ★☆☆
根拠: 1 file, ~30 lines, 既存コンポーネントの修正のみ
リスク: 低 - データ構造は変更せず、UIのみの改善
```

## 視覚的効果の予測

### Before（現在）
```
業務要件にシステム要件が紐づいていない    2/2
システム要件に業務要件が紐づいていない    0/4
```

### After（改善後）
```
業務要件にシステム要件が紐づいていない    [████████] 2/2  ← rose色、全満
システム要件に業務要件が紐づいていない    [        ] 0/4 ✓ ← emerald色、空、✓
```

### ユーザー体験の向上
1. **一瞬で理解**: プログレスバーの長さと色で、問題の深刻度が直感的に伝わる
2. **正確な値**: 数値も表示され、正確な件数がわかる
3. **成功の強調**: 問題なしの場合に✓が表示され、安心感を与える
4. **統一感**: 全体スコアのプログレスバーと同じパターンで、一貫性がある

## 既存パターンとの整合性

### 全体スコアのプログレスバー（lines 74-85）
```tsx
<div className="w-32 progress-bar-track">
  <div
    className={`progress-bar-fill ${
      summary.score >= 80 ? "bg-emerald-500" :
      summary.score >= 50 ? "bg-amber-500" :
      "bg-rose-500"
    }`}
    style={{ width: `${summary.score}%` }}
  />
</div>
```

### 検出ルールのミニプログレスバー（新規）
```tsx
<div className="w-12 h-1.5 bg-slate-100/80 rounded-full overflow-hidden">
  <div
    className={cn(
      "h-full rounded-full transition-all duration-300",
      issue.ratio === 0 ? "bg-emerald-500" :
      issue.ratio < 0.5 ? "bg-amber-500" :
      "bg-rose-500"
    )}
    style={{ width: `${Math.max(4, issue.ratio * 100)}%` }}
  />
</div>
```

**共通点**:
- 同じ色のロジック（emerald/amber/rose）
- 同じ `rounded-full` スタイル
- 同じ `transition-all duration-300` アニメーション

**差異点**:
- 幅: 全体は w-32（128px）、検出ルールは w-12（48px）
- 高さ: 全体は既定（1.5rem）、検出ルールは h-1.5（6px）
- 最小幅: 検出ルールのみ `Math.max(4, ...)` で最小4pxを確保

## 検証方法

### E2Eテスト（Playwright MCP）

1. **正常系**: 問題なし（0/4）のルールを確認
   - プログレスバーが emerald 色
   - ✓ アイコンが表示
   - 数値が emerald-700

2. **警告系**: 軽微な問題（1/4 = 25%）のルールを確認
   - プログレスバーが amber 色
   - 長さが 25%
   - ✓ アイコンが非表示
   - 数値が amber-700

3. **危険系**: 重大な問題（2/2 = 100%）のルールを確認
   - プログレスバーが rose 色
   - 長さが 100%
   - ✓ アイコンが非表示
   - 数値が rose-700

4. **レスポンシブ**: 異なる画面幅で表示崩れがないことを確認

### アクセシビリティテスト

1. **スクリーンリーダー**: aria-label が正しく読み上げられる
2. **キーボード**: Tabキーでフォーカスが適切に移動
3. **コントラスト**: 色のコントラスト比が WCAG AA 以上

## Critical Files for Implementation

- **修正対象**: `/usr/local/src/dev/wsl/personal-pj/req-manager/components/health-score/health-score-card.tsx`
  - lines 128-147: 検出ルールのli要素
  - line 3付近: `Check` アイコンのインポート追加

- **型定義参照**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/health-score/index.ts`
  - HealthScoreIssue型の確認（変更は不要）

- **スタイル参照**: `/usr/local/src/dev/wsl/personal-pj/req-manager/app/globals.css`
  - progress-bar-track クラスの確認（新規CSSは不要）

## まとめ

### 採用案のメリット
1. **直感性**: プログレスバーで問題の割合が一瞬で伝わる
2. **正確性**: 数値も表示され、詳細な値がわかる
3. **一貫性**: 全体スコアと同じデザインパターン
4. **シンプルさ**: 実装が簡単、既存のCSSを活用
5. **アクセシビリティ**: aria-label でスクリーンリーダー対応

### 設計の原則適用
- **YAGNI**: 円形プログレスバーなどの過度な機能は実装しない
- **DRY**: 既存のプログレスバーパターンを再利用
- **KISS**: シンプルな横棒プログレスバーを採用

### 次のステップ
1. この設計書の承認を得る
2. コード実装
3. E2Eテストで動作確認
4. アクセシビリティテスト
5. デプロイ
