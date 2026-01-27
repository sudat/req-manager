# ヘルススコアカードのデザイン修正計画（フェーズ2）

## 概要
ヘルススコアカードのCollapsible実装で発生したデザイン崩れを修正する。フェーズ1ではパディングとプログレスバーの位置を修正したが、フェーズ2ではプログレスバーの幅を調整する。

## 問題点

### フェーズ1（完了済み）
1. ~~**カードのパディングがない**: Collapsibleに`p-4`が指定されていない~~ ✅
2. ~~**CollapsibleTriggerに隙間がない**: `mb-3`がない~~ ✅
3. ~~**プログレスバーの位置が不正**: Trigger内にあるため、右端の点数カードの下に配置されていない~~ ✅

### フェーズ2（新規）
4. **プログレスバーが広すぎる**: `w-32`（128px）で指定されているため、点数表示「59/100」（約81px）より広く、主張しすぎている
5. **点数表示の下線として自然ではない**: 点数表示と同じ幅にする必要がある

## 要件

### フェーズ1（完了済み）
- ~~業務要件カード・システム要件カードと同じパディング構造にする~~ ✅
- ~~プログレスバーを右端の点数カードの下に配置する~~ ✅
- ~~折りたたみ状態でもプログレスバーは表示する~~ ✅

### フェーズ2（新規）
- プログレスバーの幅を点数表示と同じにする（約81px、`w-20`または`w-16`）
- 点数表示の下線として自然に見えるようにする

## 難易度評価

### フェーズ1（完了済み）
**難易度: ★☆☆**
- 根拠: 1ファイル変更、約30行の変更、レイアウト調整のみ
- リスク: 既存ロジック変更なし、CSS調整のみ

### フェーズ2（新規）
**難易度: ★☆☆**
- 根拠: 1ファイル変更、約10行の変更（プログレスバーの位置と幅を調整）
- リスク: なし、レイアウト調整のみ

## 参照パターン（正しい実装）
### 業務要件カード
```tsx
<Collapsible className="... p-4">
  <CollapsibleTrigger className="... mb-3 ...">
    {/* タイトル・バッジ・アイコン */}
  </CollapsibleTrigger>
  <CollapsibleContent className="space-y-3">
    <div className="border-t border-slate-100 pt-3 space-y-2">
      {/* コンテンツ */}
    </div>
  </CollapsibleContent>
</Collapsible>
```

### システム要件カード
```tsx
<Collapsible className="... p-4">
  <CollapsibleTrigger className="... mb-3 ...">
    {/* タイトル・バッジ・アイコン */}
  </CollapsibleTrigger>
  <CollapsibleContent className="space-y-2">
    <div className="border-t border-slate-100 pt-3 space-y-2">
      {/* コンテンツ */}
    </div>
  </CollapsibleContent>
</Collapsible>
```

## 変更対象ファイル
- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/health-score/health-score-card.tsx`

## 実装手順

### フェーズ1（完了済み）

#### 変更前の構造（問題）

### 変更前の構造（問題）
```
Collapsible (p-4なし)
├── CollapsibleTrigger (mb-3なし)
│   ├── タイトル
│   ├── 点数カード・バッジ
│   └── プログレスバー (❌ Trigger内にある)
└── CollapsibleContent
    └── <div className="p-4"> (❌ 二重パディング)
```

### 変更後の構造（修正）
```
Collapsible (p-4を追加)
├── CollapsibleTrigger (mb-3を追加)
│   ├── タイトル
│   └── 点数カード・バッジ
├── プログレスバー (✅ Collapsible直下に移動)
└── CollapsibleContent
    └── コンテンツ (✅ p-4削除、Collapsible本体に集約)
```

### 具体的な変更

#### 1. Collapsibleにp-4を追加
```typescript
// 変更前
<Collapsible
  open={isOpen}
  onOpenChange={setIsOpen}
  className="rounded-md border border-slate-200/60 bg-white shadow-sm hover:border-slate-300/60 transition-colors"
>

// 変更後
<Collapsible
  open={isOpen}
  onOpenChange={setIsOpen}
  className="rounded-md border border-slate-200/60 bg-white shadow-sm hover:border-slate-300/60 transition-colors p-4"
>
```

#### 2. CollapsibleTriggerにmb-3を追加
```typescript
// 変更前
<CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-slate-50/50 rounded px-2 -mx-2 py-1 transition-colors cursor-pointer">

// 変更後
<CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-slate-50/50 rounded px-2 -mx-2 py-1 transition-colors cursor-pointer mb-3">
```

#### 3. プログレスバーをTrigger外に移動
```typescript
// 変更前: Trigger内にプログレスバーがある
<CollapsibleTrigger>
  <div className="flex-1">
    <h2>{title}</h2>
    {summary && (
      <div className="flex flex-col items-end gap-2">
        <Badge>{level}</Badge>
        <span>{score}</span>
        <div className="w-32 progress-bar-track"> {/* ❌ Trigger内 */}
          <div className="progress-bar-fill" />
        </div>
      </div>
    )}
  </div>
  <ChevronDown />
</CollapsibleTrigger>

// 変更後: プログレスバーをCollapsible直下に移動
<CollapsibleTrigger>
  <div className="flex-1">
    <h2>{title}</h2>
  </div>
  <div className="flex items-center gap-2">
    {summary && (
      <>
        <Badge>{level}</Badge>
        <span>{score}</span>
        <span>/100</span>
      </>
    )}
  </div>
  <ChevronDown />
</CollapsibleTrigger>

{/* ✅ プログレスバーをCollapsible直下に配置 */}
{summary && (
  <div className="mb-4">
    <div className="w-32 progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${summary.score}%` }} />
    </div>
  </div>
)}
```

#### 4. CollapsibleContent内のp-4を削除
```typescript
// 変更前
<CollapsibleContent className="space-y-4">
  <div className="p-4 space-y-4"> {/* ❌ 二重パディング */}
    {/* コンテンツ */}
  </div>
</CollapsibleContent>

// 変更後
<CollapsibleContent className="space-y-4"> {/* ✅ p-4削除 */}
  {/* コンテンツ */}
</CollapsibleContent>
```

### フェーズ2の実装（新規）

#### 問題の分析

**現状の実装**:
```tsx
{summary && (
  <div className="mb-4 flex justify-end">
    <div className="w-32 progress-bar-track">
      <div className="progress-bar-fill" ... />
    </div>
  </div>
)}
```

**点数表示の幅計算**:
- 点数表示「59/100」の構成:
  - 数字5桁 × 14px = 70px（`text-[24px]`モノスペース）
  - スラッシュ1個 × 11px = 11px（`text-[11px]`）
  - 合計: 81px

**問題**: `w-32`（128px）は81pxより約1.6倍も広く、点数表示の下線として不自然

#### 修正方針（ユーザー指摘により変更）

プログレスバーをCollapsibleTrigger内の点数表示グループに配置し、点数表示と同じ幅いっぱいに広げる。

**CollapsibleTriggerの構造**:
- `justify-between`: 左側にタイトル、右側に点数表示・バッジ
- 右側グループ内に点数表示とプログレスバーを縦に配置
- プログレスバーは`w-full`で親要素（点数表示グループ）の幅いっぱいに広げる

**推奨構造**:
```tsx
<div className="flex items-center gap-2">
  {summary && (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Badge>{level}</Badge>
        <span>{score}</span>
        <span>/100</span>
      </div>
      <div className="w-full progress-bar-track">
        <div className="progress-bar-fill" ... />
      </div>
    </div>
  )}
</div>
```

#### 具体的な変更

**変更前**:
```tsx
<CollapsibleTrigger className="flex items-center justify-between w-full ...">
  <div className="flex-1">
    <h2>{title}</h2>
  </div>
  <div className="flex items-center gap-2">
    {summary && (
      <>
        <Badge>{level}</Badge>
        <span>{score}</span>
        <span>/100</span>
      </>
    )}
  </div>
  <ChevronDown />
</CollapsibleTrigger>

{summary && (
  <div className="mb-4 flex justify-end">
    <div className="w-32 progress-bar-track">
      <div
        className={`progress-bar-fill ${
          summary.score >= 80
            ? "bg-emerald-500"
            : summary.score >= 50
              ? "bg-amber-500"
              : "bg-rose-500"
        }`}
        style={{ width: `${summary.score}%` }}
      />
    </div>
  </div>
)}
```

**変更後**:
```tsx
<CollapsibleTrigger className="flex items-center justify-between w-full ...">
  <div className="flex-1">
    <h2>{title}</h2>
  </div>
  <div className="flex items-center gap-2">
    {summary && (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <Badge>{level}</Badge>
          <span>{score}</span>
          <span>/100</span>
        </div>
        <div className="w-full progress-bar-track">
          <div
            className={`progress-bar-fill ${
              summary.score >= 80
                ? "bg-emerald-500"
                : summary.score >= 50
                  ? "bg-amber-500"
                  : "bg-rose-500"
            }`}
            style={{ width: `${summary.score}%` }}
          />
        </div>
      </div>
    )}
  </div>
  <ChevronDown />
</CollapsibleTrigger>
```

**変更点**:
1. プログレスバーをCollapsibleTrigger外から内の点数表示グループに移動
2. 点数表示とプログレスバーを縦に配置（`flex flex-col items-end gap-1`）
3. プログレスバーの幅を`w-full`に変更（親要素の幅いっぱいに広げる）

#### レイアウトの最終イメージ

```
┌─────────────────────────────────────────────┐
│ システム機能ヘルススコア          (要改善) 59/100 │  ← CollapsibleTrigger
│                                        ──────  │  ← プログレスバー（w-full: 点数表示と同じ幅）
│  業務要件: 3 システム要件: 3 ...                  │  ← CollapsibleContent
└─────────────────────────────────────────────┘
```

プログレスバーが点数表示と同じ幅になり、下線として自然に見える。

### 変更後の完全構造イメージ（フェーズ1完了後）
```typescript
<Collapsible className="... p-4">
  <CollapsibleTrigger className="... mb-3 ...">
    <div className="flex items-center gap-3">
      <h2>{title}</h2>
      {summary && (
        <>
          <Badge>{level}</Badge>
          <span>{score}</span>
          <span>/100</span>
        </>
      )}
    </div>
    <ChevronDown />
  </CollapsibleTrigger>

  {summary && (
    <div className="mb-4">
      <div className="w-32 progress-bar-track">
        <div className="progress-bar-fill" ... />
      </div>
    </div>
  )}

  <CollapsibleContent className="space-y-4">
    {/* warnings, showStats, 検出ルール */}
  </CollapsibleContent>
</Collapsible>
```

## 検証方法

### 1. 業務詳細画面の確認
```
URL: http://localhost:3002/business/BIZ-003/TASK-015
確認項目:
- [ ] パディングが適切に設定されている（業務要件カードと同じ）
- [ ] プログレスバーが右端の点数カードの下に配置されている
- [ ] 折りたたみ状態でもプログレスバーが表示される
- [ ] CollapsibleTriggerとContentの間に適切な隙間がある（mb-3）
```

### 2. システム詳細画面の確認
```
URL: http://localhost:3002/system-domains/GL/SRF-017
確認項目:
- [ ] パディングが適切に設定されている（システム要件カードと同じ）
- [ ] プログレスバーが右端の点数カードの下に配置されている
- [ ] 折りたたみ状態でもプログレスバーが表示される
- [ ] **[フェーズ2]** プログレスバーがCollapsibleTrigger内に配置されている
- [ ] **[フェーズ2]** プログレスバーが点数表示の幅いっぱいに広がっている（w-full）
- [ ] **[フェーズ2]** プログレスバーが点数表示の下線として自然に見える
```

### 3. E2Eテスト（Playwright MCP）
```
URL: http://localhost:3002/system-domains/GL/SRF-017
確認項目:
- [ ] パディングが適切に設定されている（システム要件カードと同じ）
- [ ] プログレスバーが右端の点数カードの下に配置されている
- [ ] 折りたたみ状態でもプログレスバーが表示される
```

### 3. E2Eテスト（Playwright MCP）
```bash
# 既存サーバーを再利用
# 1. 業務詳細画面でスクリーンショット撮影
# 2. システム詳細画面でスクリーンショット撮影
# 3. レイアウトが他のカードと一致していることを視覚確認
```

## 依存関係
なし。単一コンポーネントのCSS調整のみ。

## リスク評価

### フェーズ1（完了済み）
- 既存ロジック変更なし
- レイアウト調整のみ
- 低リスクで安全に修正可能

### フェーズ2（新規）
- プログレスバーの位置調整（CollapsibleTrigger外→内）
- 幅の調整（`w-32` → `w-full`）
- 既存ロジック変更なし
- 低リスクで安全に修正可能

## まとめ

フェーズ1ではパディングとプログレスバーの位置を修正し、フェーズ2ではプログレスバーを点数表示グループ内に配置して、点数表示と同じ幅いっぱいに広げる。これにより、ヘルススコアカードが他のカードと一貫性のあるレイアウトになり、プログレスバーが点数表示の下線として自然に見えるようになる。
