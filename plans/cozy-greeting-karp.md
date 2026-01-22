# サイドメニュー構造変更計画

## 目的
サイドメニューの項目順序を変更し、区切り線を追加する。

## 変更内容
**現在の順序:**
1. ダッシュボード
2. 照会
3. 業務一覧
4. 変更要求一覧
5. ベースライン履歴
6. エクスポート
--- （区切り線） ---
7. 概念辞書
8. システム領域一覧
9. 設定

**変更後の順序:**
1. ダッシュボード
2. 照会
3. 業務一覧
4. **システム領域一覧** ← 移動
--- （区切り線） ← 新規追加
5. 変更要求一覧
6. ベースライン履歴
7. エクスポート
--- （区切り線）
8. 概念辞書
9. 設定

## 難易度
**難易度: ★☆☆**
根拠: 1ファイル、約50行の変更、既存スタイルの再利用
リスク: 型定義の追加とレンダリングロジックの書き換えが必要

## 実装方式
単一配列方式（MenuItem・Divider・Sectionを混ぜた`menuConfig`配列）

## 修正ファイル
- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/layout/sidebar.tsx`

## 実装手順

### 1. 型定義の追加（22行目の後に挿入）

```typescript
type MenuItem = {
  key: string
  label: string
  href: string
  icon: any
}

type MenuSection = {
  type: "section"
  label?: string
}

type MenuDivider = {
  type: "divider"
}

type MenuConfig = MenuItem | MenuSection | MenuDivider
```

### 2. 配列の統合（23-36行目を置換）

```typescript
const menuConfig: MenuConfig[] = [
  { key: "dashboard", label: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { key: "query", label: "照会", href: "/query", icon: Search },
  { key: "business", label: "業務一覧", href: "/business", icon: Briefcase },
  { key: "system-domains", label: "システム領域一覧", href: "/system-domains", icon: Boxes },
  { type: "divider" as const },
  { key: "tickets", label: "変更要求一覧", href: "/tickets", icon: ListChecks },
  { key: "baseline", label: "ベースライン履歴", href: "/baseline", icon: History },
  { key: "export", label: "エクスポート", href: "/export", icon: Download },
  { type: "divider" as const },
  { type: "section" as const, label: "管理" },
  { key: "ideas", label: "概念辞書", href: "/ideas", icon: BookOpen },
  { key: "settings", label: "設定", href: "/settings", icon: Settings },
]
```

### 3. モバイル版レンダリングの修正（60-113行目を置換）

現在の2つの`<ul>`ブロックを1つに統合：

```tsx
<nav className="py-2">
  <ul className="space-y-0">
    {menuConfig.map((item, index) => {
      if (item.type === "divider") {
        return <div key={`divider-${index}`} className="mx-5 my-2 h-px bg-slate-200" aria-hidden="true" />
      }
      if (item.type === "section") {
        return (
          <div key={`section-${index}`} className="mt-4 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {item.label}
          </div>
        )
      }
      // MenuItem
      const active = isActive(item.href)
      const Icon = item.icon
      return (
        <li key={item.key}>
          <Link
            href={item.href}
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-100 hover:text-slate-900",
              active ? "bg-brand-50 text-brand-700 font-semibold" : "text-slate-600"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        </li>
      )
    })}
  </ul>
</nav>
```

### 4. デスクトップ版レンダリングの修正（148-225行目を置換）

`isCollapsed`対応を含めた同様の統合：

```tsx
<nav className={cn("flex flex-col py-2 pb-6", isCollapsed && "pt-[90px]")}>
  <ul className={cn("flex flex-col space-y-0", isCollapsed && "space-y-1.5")}>
    {menuConfig.map((item, index) => {
      if (item.type === "divider") {
        return (
          <div
            key={`divider-${index}`}
            className={cn("mx-5 my-2 h-px bg-slate-200", isCollapsed && "mx-3 my-1")}
            aria-hidden="true"
          />
        )
      }
      if (item.type === "section") {
        return !isCollapsed ? (
          <div key={`section-${index}`} className="mt-4 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {item.label}
          </div>
        ) : null
      }
      // MenuItem
      const active = isActive(item.href)
      const Icon = item.icon
      return (
        <li key={item.key}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-100 hover:text-slate-900",
              isCollapsed && "justify-center px-0 py-2.5",
              active ? "bg-brand-50 text-brand-700 font-semibold" : "text-slate-600"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className={cn("transition-opacity duration-300", isCollapsed && "sr-only")}>
              {item.label}
            </span>
          </Link>
        </li>
      )
    })}
  </ul>
</nav>
```

## 検証手順

### 1. ビルド確認
```bash
bun run build
```

### 2. 動作確認（Playwright MCP）
1. 開発サーバーを起動: `bun run dev`
2. 各メニュー項目が正しく表示されることを確認
3. アクティブなページのハイライトが正しく機能することを確認
4. サイドバーの折りたたみ（`isCollapsed`）機能を確認
5. モバイル表示（Sheet内メニュー）を確認

### 3. 項目別チェック
- [ ] ダッシュボード
- [ ] 照会
- [ ] 業務一覧
- [ ] システム領域一覧（正しい位置にあるか）
- [ ] 区切り線（システム領域一覧の後にあるか）
- [ ] 変更要求一覧
- [ ] ベースライン履歴
- [ ] エクスポート
- [ ] 区切り線
- [ ] 「管理」セクションラベル
- [ ] 概念辞書
- [ ] 設定
