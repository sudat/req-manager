# チケット作成ページの余白問題修正計画（改訂版）

## Context（背景）

### 問題の発生状況
- チケット作成ページ（`/tickets/create`）で、**システム要件タブでシステム機能をクリックすると、ページ下部に約714pxの余白**が表示される
- ユーザー環境での測定値：
  - MainContent の clientHeight: 476px
  - MainContent の scrollHeight: 2048px
  - フォームの高さ: 1868.16px
  - 差分: 約940pxの余分な高さが存在
- 視覚的には、一番下までスクロールすると画面全体が空白になる

### 根本原因の特定（詳細調査済み）

**2つの複合的な原因が判明：**

#### 原因1: TabsContent の `flex-1` クラス（軽微）
`components/ui/tabs.tsx` の TabsContent に `flex-1` が無条件で適用されていた（すでに削除済み）。

#### 原因2: TabsContent の `space-y-4` クラス（主要因）★

**これが714px余白の本当の原因**:

1. **Radix UI の動作**：
   - 非アクティブな TabsContent は `hidden` 属性で視覚的に隠されるが、**DOM上には存在し続ける**
   - `display: none` ではなく `hidden` 属性を使用

2. **ImpactScopeSelector での問題**：
   ```tsx
   <TabsContent value="business" className="space-y-4">  {/* ← 問題 */}
   <TabsContent value="system" className="space-y-4">    {/* ← 問題 */}
   ```
   - **両方の TabsContent に `space-y-4` が指定されている**
   - 非アクティブなタブも DOM に存在し、margin を保持する
   - Card 内の div にも `space-y-4` があり、**二重の margin 設定**

3. **累積効果**：
   - TabsContent（外側）: `space-y-4` = 各子要素間に 16px
   - Card 内 div（内側）: `space-y-4` = さらに 16px
   - 非表示タブのコンテンツが DOM 上に存在 → **隠れた状態で margin を消費**
   - これらが積み重なって約714pxの余白を生成

### 他のページとの比較

- **プロダクト要件ページ** (`/product-requirement`): TabsContent に `className="mt-6"` のみで、問題なし
- **設定ページ** (`/settings`): 同様の問題は報告されていない

つまり、**ImpactScopeSelector 特有の問題**（TabsContent に `space-y-4` を指定しているため）。

---

## 修正内容

### 修正対象ファイル

**1. `components/tickets/impact-scope-selector.tsx`（主要修正）**

76行目と90行目の TabsContent から `className="space-y-4"` を削除：

```tsx
// 修正前
<TabsContent value="business" className="space-y-4">
  <BusinessRequirementCascadeSelector ... />
</TabsContent>

<TabsContent value="system" className="space-y-4">
  <SystemRequirementCascadeSelector ... />
</TabsContent>

// 修正後
<TabsContent value="business">
  <BusinessRequirementCascadeSelector ... />
</TabsContent>

<TabsContent value="system">
  <SystemRequirementCascadeSelector ... />
</TabsContent>
```

**理由：**
- TabsContent に `space-y-4` を指定すると、非アクティブなタブも DOM 上で margin を保持する
- Radix UI は非アクティブなタブを `hidden` 属性で隠すだけで、DOM からは削除しない
- Card 内の div にすでに `space-y-4` があるため、二重の設定は不要

**2. `components/ui/tabs.tsx:60`（すでに修正済み）**

TabsContent から `flex-1` クラスを削除（この修正はすでに適用済み）：

```tsx
// 修正前
className={cn("flex-1 outline-none", className)}

// 修正後
className={cn("outline-none", className)}
```

---

## 設計判断の根拠

### なぜ TabsContent から `space-y-4` を削除するのか

**1. Radix UI の動作特性に起因する問題**
- Radix UI は非アクティブなタブを `hidden` 属性で隠すが、**DOM上には残す**
- `display: none` ではないため、CSS の margin/padding は有効なまま
- TabsContent に `space-y-4` を指定すると、非アクティブなタブも高さに影響する

**2. 二重の spacing 設定**
- TabsContent（外側）: `space-y-4`
- Card 内の div（内側）: `space-y-4`
- これらが累積して不要な余白を生成

**3. プロダクト要件ページとの一貫性**
- プロダクト要件ページでは TabsContent に `className="mt-6"` のみを指定
- `space-y-4` は使用していない
- 同じパターンに統一することで、一貫性と保守性を向上

**4. KISS原則の適用**
- TabsContent から `space-y-4` を削除するだけで問題解決
- Card 内の div の `space-y-4` は維持（コンテンツ内部の spacing は正常）
- シンプルで理解しやすい

**5. 影響範囲の最小化**
- 修正対象は ImpactScopeSelector の 2箇所のみ
- 他のページへの影響なし
- Card 内の spacing は維持されるため、見た目の変化は最小限

### 代替案を採用しない理由

**代替案A: Card に余分な spacing を追加**
```tsx
<TabsContent value="system" className="space-y-4">
  <Card className="mt-0">  {/* 余分な調整 */}
```
→ 根本原因を解決せず、ハックで対処することになる

**代替案B: 条件付きマウント**
```tsx
{isSystemTabActive && <SystemRequirementCascadeSelector />}
```
→ Radix UI の Tabs の動作を変更することになり、他の機能に影響する可能性

**代替案C: CSS で非表示タブを完全に除外**
```tsx
<TabsContent className={cn("space-y-4", !isActive && "!hidden")} />
```
→ `!important` を使用し、Radix UI の動作を上書きするため、保守性が低下

---

## 影響範囲

### 直接的な影響（修正対象）

**ImpactScopeSelector を使用しているページ:**
1. `/tickets/create` - チケット作成ページ ← **714pxの余白が解消される**
2. `/tickets/[id]/edit` - チケット編集ページ ← **同様の問題がある場合は解消される**

### 間接的な影響（回帰テスト対象）

**Tabs を使用している他のページ（変更なし）:**
3. `/settings` - 設定ページ（3つのタブ）- TabsContent に spacing 指定なし、影響なし
4. `/product-requirement` - プロダクト要件ページ（5つのタブ）- TabsContent に `mt-6` のみ、影響なし
5. その他、StructuredIoSection、PerspectiveTabs を含むページ - 影響なし

### 期待される結果

**修正後の動作:**
- **チケット作成/編集ページ**: 714pxの余白が消え、正常な高さになる
- **タブ切り替え**: スムーズに動作し、レイアウトのジャンプがなくなる
- **スクロール動作**: MainContent の scrollHeight が大幅に減少（2048px → 約1300-1400px）
- **視覚的変化**: TabsList と TabsContent の間の spacing が若干減る（`space-y-4` → Tabs の `gap-2` のみ）

**既存ページへの影響:**
- 設定ページ、プロダクト要件ページなど、他の Tabs を使用しているページは変更なし
- ImpactScopeSelector の公開インターフェース（Props）は変更なし

---

## 検証方法

### 1. 修正前の問題再現手順

```bash
# agent-browser で問題の確認
agent-browser open http://localhost:3000/tickets/create
agent-browser snapshot -i
```

1. **システム要件タブ**に切り替える
2. **システム領域**を選択（例：債権管理 AR）
3. **システム機能**をクリック（例：請求管理など）
4. **ページ下部までスクロール**
5. **約714pxの余白が表示される**ことを確認

### 2. コード修正後の検証

**主要な検証対象ページ:**

#### A. チケット作成ページ（問題が解決される）

```bash
agent-browser open http://localhost:3000/tickets/create
agent-browser snapshot -i
```

**検証フロー:**
1. システム要件タブに切り替え
2. システム領域を選択
3. システム機能をクリック
4. ページ下部までスクロール

**確認ポイント:**
- [ ] 714pxの余白が消えている
- [ ] 「起票」ボタンの下に適切な余白（Tabs の `gap-2` = 8px + Card の padding = 16px 程度）のみがある
- [ ] タブ切り替え時にレイアウトがジャンプしない
- [ ] 業務要件タブとシステム要件タブの両方で正常に動作する

#### B. DevTools での数値確認

```javascript
// MainContent のスクロール情報を確認
const main = document.querySelector('main');
console.log('scrollHeight:', main.scrollHeight);
console.log('clientHeight:', main.clientHeight);
console.log('maxScroll:', main.scrollHeight - main.clientHeight);

// TabsContent の hidden 属性を確認
const tabs = document.querySelectorAll('[role="tabpanel"]');
tabs.forEach((tab, i) => {
  console.log(`Tab ${i}:`, {
    hidden: tab.hasAttribute('hidden'),
    offsetHeight: tab.offsetHeight,
    scrollHeight: tab.scrollHeight
  });
});
```

**期待される結果:**
- scrollHeight が大幅に減少（修正前: 2048px → 修正後: 約1300-1400px）
- 非アクティブなタブの offsetHeight が 0 になっている（または無視されている）

#### C. 既存ページでの回帰テスト

**設定ページ:**
```bash
agent-browser open http://localhost:3000/settings
```
- [ ] タブの切り替えが正常に動作
- [ ] レイアウトに変化がない

**プロダクト要件ページ:**
```bash
agent-browser open http://localhost:3000/product-requirement
```
- [ ] 5つのタブが正常に表示される
- [ ] タブ切り替えがスムーズ

### 3. Edge Case の確認

- [ ] システム要件が0件の場合（フォールバックメッセージ表示）
- [ ] システム要件が多数ある場合（スクロールが必要）
- [ ] ブラウザウィンドウのリサイズ時
- [ ] タブを高速に切り替えた場合

---

## リスク評価

### 難易度: ★☆☆

**根拠:**
- 修正ファイル数: 1ファイル（`impact-scope-selector.tsx`）
- 変更箇所: 2箇所（76行目と90行目の `className="space-y-4"` を削除）
- 影響範囲: ImpactScopeSelector を使用しているページのみ（チケット作成/編集ページ）
- 既存の他のページ（設定、プロダクト要件）への影響なし

**成功率: 98%以上**

### リスク分析

**技術リスク: 極低**
- 修正内容はシンプル（CSS クラスの削除のみ）
- Radix UI の Tabs の動作を変更しない
- Card 内の spacing（`space-y-4`）は維持されるため、コンテンツ内部のレイアウトは変わらない

**機能リスク: 極低**
- TabsContent から spacing を削除するだけで、コンテンツの表示には影響しない
- Card 内の div がすでに `space-y-4` を持っているため、見た目の変化は最小限
- Tabs の `gap-2` により、TabsList と TabsContent の間には適切な spacing が維持される

**視覚的変化:**
- TabsList と TabsContent の間の spacing が若干減る可能性（`space-y-4` → Tabs の `gap-2` のみ）
- しかし、これは意図した動作（余分な spacing の削除）

**後方互換性: 完全維持**
- ImpactScopeSelector の公開インターフェースは変更なし
- Props の変更なし
- 既存の呼び出し元への影響なし

**復旧策:**
- Git で簡単に元に戻せる（1ファイル、2箇所の変更）
- ロールバックのコストは極めて低い
- 必要に応じて、Card に `mt-2` などを追加して spacing を調整可能

---

## 実装手順

### Step 1: 修正前の確認（問題再現）

```bash
# 開発サーバーが起動していることを確認
bun run dev

# 問題の確認
agent-browser open http://localhost:3000/tickets/create
agent-browser snapshot -i
```

1. システム要件タブに切り替え
2. システム領域を選択
3. システム機能をクリック
4. ページ下部までスクロール
5. 約714pxの余白が表示されることを確認

### Step 2: コード修正

**ファイル: `components/tickets/impact-scope-selector.tsx`**

76行目を修正：
```tsx
// 修正前
<TabsContent value="business" className="space-y-4">

// 修正後
<TabsContent value="business">
```

90行目を修正：
```tsx
// 修正前
<TabsContent value="system" className="space-y-4">

// 修正後
<TabsContent value="system">
```

### Step 3: 動作確認

```bash
# ページをリロード（Hot Reload で自動的に反映される場合もある）
agent-browser open http://localhost:3000/tickets/create
agent-browser snapshot -i
```

1. システム要件タブに切り替え
2. システム領域を選択
3. システム機能をクリック
4. ページ下部までスクロール
5. **余白が消えていることを確認**

### Step 4: 回帰テスト

```bash
# 既存ページでの動作確認
agent-browser open http://localhost:3000/settings
agent-browser open http://localhost:3000/product-requirement
```

- タブの切り替えが正常に動作することを確認
- レイアウトに予期しない変化がないことを確認

### Step 5: DevTools での数値確認（オプション）

ブラウザの DevTools で以下を確認：
```javascript
const main = document.querySelector('main');
console.log('scrollHeight:', main.scrollHeight);  // 大幅に減少しているはず
```

### Step 6: コミット

```bash
git add components/tickets/impact-scope-selector.tsx
git commit -m "Fix: チケット作成ページの714px余白問題を修正

- TabsContentからspace-y-4クラスを削除
- Radix UIの非アクティブタブがDOMに残る動作に起因する問題を解決
- Card内のdivのspace-y-4は維持

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Critical Files

以下のファイルが修正と検証に重要です：

### 修正対象
1. **`components/tickets/impact-scope-selector.tsx:76,90`** - TabsContent から `space-y-4` を削除

### 関連ファイル（参考）
2. **`components/tickets/system-requirement-cascade-selector.tsx`** - Card 内の `space-y-4` は維持（コンテンツ内部の spacing）
3. **`components/tickets/business-requirement-cascade-selector.tsx`** - 同様に Card 内の `space-y-4` は維持
4. **`components/ui/tabs.tsx`** - Tabs コンポーネントの実装（`flex-1` はすでに削除済み）
5. **`components/ui/card.tsx`** - Card コンポーネントの実装（`flex flex-col` を持つ）

### 検証対象ページ
6. **`app/(with-sidebar)/tickets/create/page.tsx`** - 問題が発生していたページ
7. **`app/(with-sidebar)/tickets/[id]/edit/page.tsx`** - ImpactScopeSelector を使用（回帰テスト）
8. **`app/(with-sidebar)/settings/page.tsx`** - Tabs を使用（回帰テスト）
9. **`app/(with-sidebar)/product-requirement/page.tsx`** - Tabs を使用（回帰テスト）

### レイアウト関連（背景理解用）
10. **`app/(with-sidebar)/layout.tsx`** - `flex h-[100dvh]` の親レイアウト
11. **`components/layout/main-content.tsx`** - `flex-1 h-full overflow-y-auto` の MainContent

---

## 参考情報

### 設計原則の適用

| 原則 | 適用内容 |
|------|---------|
| KISS | TabsContent から `space-y-4` を削除するだけでシンプルに問題解決 |
| YAGNI | TabsContent に spacing は不要（Card 内で管理すれば十分） |
| 一貫性 | プロダクト要件ページと同じパターンに統一（TabsContent には minimal な className のみ） |

### 学んだ教訓

`★ Insight ─────────────────────────────────────`
- **Radix UI の非表示動作の理解**: Radix UI は非アクティブなタブを `display: none` ではなく `hidden` 属性で隠すため、DOM 上には残り続ける。これにより、CSS の margin/padding が有効なままになる
- **spacing の二重設定の危険性**: 親コンテナと子コンテナの両方に `space-y-*` を設定すると、予期しない余白が累積する可能性がある。spacing は1箇所で管理するのがベスト
- **UI ライブラリの動作を仮定しない**: UI ライブラリ（Radix UI など）の内部動作を仮定せず、実際の DOM 構造と CSS を確認することが重要
- **問題の本質を見抜く**: 最初は `flex-1` が原因と思われたが、実際には `space-y-4` が主要因だった。症状だけでなく、根本原因を特定することが重要
`─────────────────────────────────────────────────`

### Radix UI Tabs の動作まとめ

**非アクティブなタブの扱い:**
- DOM 上には存在し続ける（削除されない）
- `hidden` 属性が付与される（`<div hidden="true">`）
- `display: none` ではなく、`visibility: hidden` や `opacity: 0` に近い動作
- CSS の margin/padding は有効なまま

**TabsContent に spacing を指定する際の注意点:**
- `space-y-*` は子要素間のギャップを設定するが、TabsContent 自体が非アクティブでも DOM に残るため、ギャップが累積する可能性がある
- 代わりに、TabsContent の子要素（Card など）に spacing を設定する方が安全
- または、TabsContent には minimal な className のみを指定し、spacing は Tabs の `gap-*` に任せる

### 今後の推奨パターン

**TabsContent の使い方:**
```tsx
// 推奨パターン（spacing は子要素で管理）
<TabsContent value="tab1">
  <Card>
    <div className="space-y-4">
      {/* コンテンツ */}
    </div>
  </Card>
</TabsContent>

// 非推奨パターン（TabsContent に spacing を設定）
<TabsContent value="tab1" className="space-y-4">  {/* ← 避ける */}
  <Card>...</Card>
</TabsContent>
```

**Tabs の設定:**
- Tabs 自体が `flex flex-col gap-2` を持っているため、TabsList と TabsContent の間には適切な spacing がある
- 追加の spacing が必要な場合は、TabsContent の子要素で管理する
