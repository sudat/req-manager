# 影響領域バッジのリンク化

## 概要
タスク詳細ページのシステム要件カードに表示される「影響領域」バッジをクリック時に、対応するシステム領域ページ（`/system-domains/{影響領域}`）に遷移できるようにする。

## 難易度評価
```
難易度: ★☆☆
根拠: 1 file, ~10 lines, 1 component
リスク: 低 - 既存パターンを踏襲、遷移先ページは既に存在
```

## 変更ファイル一覧

| ファイルパス | 変更内容 |
|-------------|----------|
| `app/business/[id]/tasks/[taskId]/system-requirement-card.tsx` | 73-81行目を変更 |

## 実装内容

### 現状（73-81行目）
```tsx
{requirement.impacts && requirement.impacts.length > 0 && (
  <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
    <div className="text-[12px] font-medium text-slate-500">影響領域</div>
    <div className="flex flex-wrap gap-1.5">
      {requirement.impacts.map((impact, i) => (
        <Badge key={i} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
          {impact}
        </Badge>
      ))}
    </div>
  </div>
)}
```

### 変更後
```tsx
{requirement.impacts && requirement.impacts.length > 0 && (
  <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
    <div className="text-[12px] font-medium text-slate-500">影響領域</div>
    <div className="flex flex-wrap gap-1.5">
      {requirement.impacts.map((impact) => (
        <Link key={impact} href={`/system-domains/${impact}`}>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
            {impact}
          </Badge>
        </Link>
      ))}
    </div>
  </div>
)}
```

### 変更点
1. `Badge` を `Link` でラップ
2. `key={i}` → `key={impact}` に変更（影響領域コードは一意）
3. `hover:bg-slate-100` を追加してホバー時の視覚的フィードバック

## 設計原則の適用
- **DRY**: 既存の関連概念バッジ（63-67行目）と同じパターンを使用
- **KISS**: Linkコンポーネントでラップするのみのシンプルな変更
- **YAGNI**: 必要最小限の機能実装

## 検証方法

### Playwright MCPでの確認
1. `http://localhost:3000/business/BIZ-001/tasks/TASK-001` にアクセス
2. システム要件カードの「影響領域」バッジを確認
3. バッジにホバーしたときに背景色が変わることを確認
4. バッジをクリックして `/system-domains/AR` に遷移することを確認

### エッジケース
- 影響領域が複数ある場合、それぞれのバッジが正しく遷移する
- 存在しないシステム領域コードの場合は404ページが表示される（想定通りの動作）
