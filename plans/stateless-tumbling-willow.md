# 実装単位SD UI/UX改善計画

## 概要
システム機能詳細ページの実装単位SD表示をPRDの目的（コーディングエージェントへの改修指示の的確さ向上）に沿った形に改善する。

## 難易度
```
難易度: ★★☆
根拠: 4 files, ~120 lines, UI調整中心
リスク: レイアウト変更による既存表示への影響（軽微）
```

---

## 実装計画

### Step 1: TYPE_LABELSの統一定義作成

**ファイル**: `lib/domain/enums.ts`

```typescript
// 実装単位の種別ラベル定義
export const IMPL_UNIT_TYPE_LABELS: Record<ImplUnitType, string> = {
  screen: "画面",
  api: "API",
  batch: "バッチ",
  external_if: "外部I/F",
};

// 種別ごとの色設定（Badge用）
export const IMPL_UNIT_TYPE_COLORS: Record<ImplUnitType, string> = {
  screen: "border-violet-200 bg-violet-50 text-violet-700",
  api: "border-emerald-200 bg-emerald-50 text-emerald-700",
  batch: "border-amber-200 bg-amber-50 text-amber-700",
  external_if: "border-sky-200 bg-sky-50 text-sky-700",
};
```

### Step 2: 表示コンポーネントの改善（P0+P1）

**ファイル**: `components/system-domains/impl-unit-sd-section.tsx`

#### 変更点:
1. **entry_pointを名称直下に移動**（概要の前）
2. **モノスペースフォント + FileCodeアイコン適用**
3. **entry_pointのtype/responsibilityを表示**
4. **種別Badgeの色分け**
5. **統一定義をインポート**

```tsx
// Before: entry_pointは概要の後ろ
<div className="space-y-1">
  <h3>名称</h3>
  <Badge>種別</Badge>
  <div>概要</div>
</div>
<div>エントリポイント</div> // ← 3番目

// After: entry_pointを名称直下に移動
<div className="space-y-1">
  <h3>名称</h3>
  <Badge className={IMPL_UNIT_TYPE_COLORS[item.type]}>種別</Badge>
</div>
<div>  // ← 2番目（目立つ位置）
  <FileCode2 className="h-4 w-4 text-slate-500" />
  <code className="font-mono">{entry.path}</code>
  {entry.type && <span>({entry.type})</span>}
  {entry.responsibility && <span>- {entry.responsibility}</span>}
</div>
<div>概要</div> // ← 3番目に移動
```

### Step 3: 編集カードのアクセシビリティ改善（P1）

**ファイル**: `components/forms/impl-unit-sd/ImplUnitSdCard.tsx`

#### 変更点:
1. **削除ボタンにaria-label追加**
2. **統一定義をインポート**

```tsx
// Before
<Button title="削除" onClick={onDelete}>
  <Trash2 />
</Button>

// After
<Button
  title="削除"
  aria-label={`${item.name || '実装単位SD'} を削除`}
  onClick={onDelete}
>
  <Trash2 />
</Button>
```

### Step 4: エントリポイント編集のUX改善（P1）

**ファイル**: `components/forms/entry-points/EntryPointsInlineEditor.tsx`

#### 変更点:
1. **追加時にauto-focus**
2. **削除ボタンにaria-label追加**

```tsx
// auto-focus用のref追加
const lastInputRef = useRef<HTMLInputElement>(null);

// 追加時にfocus
const addEntryPoint = () => {
  onChange([...entryPoints, { ...emptyEntryPoint }]);
  // 次のレンダリング後にfocus
  setTimeout(() => lastInputRef.current?.focus(), 0);
};

// 削除ボタンにaria-label
<Button
  aria-label={`エントリポイント ${entry.path || index + 1} を削除`}
  onClick={() => removeEntryPoint(index)}
>
  <Trash2 />
</Button>
```

---

## 修正ファイル一覧

| ファイル | 修正内容 | 行数目安 |
|----------|----------|:--------:|
| `lib/domain/enums.ts` | TYPE_LABELS + COLORS 統一定義追加 | +15行 |
| `components/system-domains/impl-unit-sd-section.tsx` | entry_point位置変更、色分け、詳細表示 | ~40行変更 |
| `components/forms/impl-unit-sd/ImplUnitSdCard.tsx` | aria-label追加、統一定義インポート | ~10行変更 |
| `components/forms/entry-points/EntryPointsInlineEditor.tsx` | auto-focus、aria-label追加 | ~15行変更 |

---

## 検証方法

1. **表示確認（Playwright MCP）**
   - http://localhost:3002/system-domains/AR/SRF-001 にアクセス
   - entry_pointが名称直下に表示されていることを確認
   - 種別ごとに色分けされていることを確認
   - type/responsibilityが表示されていることを確認

2. **編集確認**
   - http://localhost:3002/system-domains/AR/SRF-001/edit にアクセス
   - 実装単位SDを追加→エントリポイント追加時にauto-focusされることを確認
   - 削除ボタンのaria-labelがスクリーンリーダーで読み上げられることを確認

3. **一貫性確認**
   - 表示画面と編集画面で種別ラベルが一致することを確認

---

## 期待される効果

1. **目的適合性向上**: entry_pointが最も目立つ位置に配置され、コーディングエージェントがファイルを即座に特定可能
2. **識別性向上**: 種別ごとの色分けにより、一覧表示でAPIだけ/画面だけなどの視認が容易に
3. **アクセシビリティ向上**: aria-labelにより、スクリーンリーダーユーザーも適切に操作可能
4. **編集効率向上**: auto-focusにより、エントリポイント追加がスムーズに
