# サイドバー改善実装計画（変更管理メニューの追加）

## Context

現在のサイドバーはメニューが機能単位で並んでおり、「スキーマ」グループが独立しているため、関連機能（ER図・シーケンス図）が分析・運用系の他メニューと分断されている。ユーザーから「散らばっている感じがする」というフィードバックを受けた。

**追加の要望（2026-02-11）:**
- 変更要求一覧、要件リンク、ベースライン履歴を「要件管理」グループ内にサブメニューとして追加
- ポップアップ機能は不要（フラット表示で十分）

## 目的

メニューをワークフローに沿ってグルーピングし、視認性と使い勝手を向上する。

---

## 実装内容

### 1. menuConfig の構造変更

**ファイル:** `components/layout/sidebar.tsx`

**変更後の構造:**
```typescript
const menuConfig: MenuConfig[] = [
  // グループ: メイン
  {
    type: "group",
    key: "main",
    label: "メイン",
    icon: LayoutDashboard,
    children: [
      { type: "item", key: "dashboard", label: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
      { type: "item", key: "product-requirement", label: "プロダクト要件", href: "/product-requirement", icon: FileText },
      { type: "item", key: "chat", label: "AIチャット", href: "/chat", icon: Bot },
    ],
  },
  // グループ: 要件管理（変更管理を含む）
  {
    type: "group",
    key: "requirements",
    label: "要件管理",
    icon: Briefcase,
    children: [
      { type: "item", key: "business", label: "業務一覧", href: "/business", icon: Briefcase },
      { type: "item", key: "system-domains", label: "システム領域一覧", href: "/system", icon: Boxes },
      { type: "item", key: "ideas", label: "概念辞書", href: "/ideas", icon: BookOpen },
      // 変更管理サブメニュー
      {
        type: "item",
        key: "change-management",
        label: "変更管理",
        href: "#",
        icon: ListChecks,
        children: [
          { type: "item", key: "tickets", label: "変更要求一覧", href: "/tickets", icon: ListChecks },
          { type: "item", key: "links", label: "要件リンク", href: "/links", icon: Link2 },
          { type: "item", key: "baseline", label: "ベースライン履歴", href: "/baseline", icon: History },
        ],
      },
    ],
  },
  // グループ: 分析・運用（ER図・シーケンス図のみを残す）
  {
    type: "group",
    key: "analysis",
    label: "分析・運用",
    icon: BarChart,
    children: [
      { type: "item", key: "schema-er", label: "ER図", href: "/schema/er", icon: Database },
      { type: "item", key: "schema-sequence", label: "シーケンス図", href: "/schema/sequence", icon: Database },
      { type: "item", key: "export", label: "エクスポート", href: "/export", icon: Download },
    ],
  },
  // 設定はグループなしでフラット
  { type: "item", key: "settings", label: "設定", href: "/settings", icon: Settings },
];
```

**ポイント:**
- 「要件管理」グループ内にネストした「変更管理」サブメニューを追加
- 「分析・運用」グループはER図・シーケンス図・エクスポートのみに絞る

---

### 2. 新しいMenuGroup型定義の追加

**サブメニュー用のグループ型:**
```typescript
type MenuGroup = {
  type: "group";
  key: string;
  label: string;
  icon: any;
  children: MenuItem[];
};

type NestedMenuGroup = {
  type: "group";
  key: string;
  label: string;
  icon: any;
  children: (MenuItem | NestedMenuGroup)[];  // サブメニューを許容
};

type MenuConfig = MenuItem | MenuGroup | NestedMenuGroup;
```

---

### 3. レンダリングロジックの調整

**変更点:**
- ネストしたグループ（変更管理）を展開表示
- アクティブメニューの左側ボーダーを維持

**グループヘッダーのスタイル:**
```typescript
// ネストしたグループのヘッダー
<div className="px-5 py-2">
  <div className={cn(
    "flex items-center gap-3 text-sm font-medium",
    isGroupActive ? "text-brand-700" : "text-slate-700"
  )}>
    <GroupIcon className="h-5 w-5" />
    <span>{item.label}</span>
    {hasNestedChildren && <ChevronDown className="h-4 w-4 ml-auto" />}
  </div>
</div>

// 子メニューのリスト
<ul className="mt-1 ml-8 space-y-0 border-l-2 border-slate-200 pl-3">
  {item.children.map((child) => {
    // childがMenuItemの場合はLink、NestedMenuGroupの場合は再帰処理
  })}
</ul>
```

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `components/layout/sidebar.tsx` | menuConfig書き換え、NestedMenuGroup型追加、サブメニュー表示ロジック実装 |
| `components/ui/popover.tsx` | shadcn/uiのPopoverコンポーネント（既存）を利用 |

---

## 動作確認（Verification）

1. 「要件管理」グループ内に「変更管理」サブメニューが表示されることを確認
2. 「変更管理」をクリックすると、変更要求一覧・要件リンク・ベースライン履歴が展開表示されることを確認
3. 変更管理内の各項目をクリックすると、該当ページに遷移することを確認
4. アクティブメニューに左側のボーダーが表示されていることを確認
5. 「分析・運用」グループにはER図・シーケンス図・エクスポートのみが含まれることを確認

---

## 予測される表示イメージ

### 展開時
```
┌─────────────────────┐
│ 要件管理ツール      │
├─────────────────────┤
│ 🏠 メイン           │
│   🏠 ダッシュボード  │
│   📄 プロダクト要件 │
│   🤖 AIチャット     │
│                     │
│ 💼 要件管理        │
│   💼 業務一覧     │
│   📦 システム領域   │
│   📖 概念辞書      │
│   📋 変更管理 ▼   │ ← サブメニュー展開時
│     📋 変更要求一覧   │
│     🔗 要件リンク     │
│     📚 ベースライン     │
│                     │
│ 📊 分析・運用       │
│   📄 ER図         │
│   📄 シーケンス図    │
│   ⬇️ エクスポート    │
│                     │
│ ⚙️ 設定          │
└─────────────────────┘
```

### Collapsed時
```
┌─────────────────────┐
│              開 [×]│
├─────────────────────┤
│ 🏠               │
│ 💼               │
│ 📋               │ ← ネスト展開
│ 📊               │
│ 📄               │
│ ⚙️               │
└─────────────────────┘
```

---

## 所要時間

- **実装**: 45分
- **動作確認**: 15分
- **合計**: 1時間

---

## リスク

- **サブメニューの再帰的処理**: ネストしたグループの子要素にさらにグループがある場合の処理が必要
- **既存のアイコン使用**: ChevronDown はインポート済みだが、確認が必要
