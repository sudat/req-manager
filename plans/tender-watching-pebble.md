# UIバグ修正：関連システム機能Badgeのtruncate対応

## 問題概要
- **問題**: 業務要件カードの「関連システム機能」で、Badgeがカードを突き抜けて表示される
- **原因**: Badgeコンポーネントのデフォルトスタイル(`w-fit`, `shrink-0`, `whitespace-nowrap`)が、flex-wrap環境で悪影響を及ぼしている
- **望まれる挙動**:
  1. Badgeがカード幅内に収まる
  2. 長いテキストは `...` でtruncateされる
  3. ホバーすれば全文が見える
  4. Badge内に「ID: 名」形式で表示

---

## 修正ファイル

| ファイル | 変更内容 |
|---------|---------|
| `components/forms/requirement-card.tsx` | Badgeに `max-w-[200px] truncate` 追加 |

---

## 実装詳細

### 修正対象コード (L66-73)

**現在の実装**:
```tsx
selectedIds.map((id) => (
  <Badge
    key={id}
    variant="outline"
    className="border-slate-200 bg-slate-50 text-slate-600 text-[11px]"
    title={`${id}: ${nameMap.get(id) ?? id}`}
  >
    {id}: {nameMap.get(id) ?? id}
  </Badge>
))
```

**修正後**:
```tsx
selectedIds.map((id) => (
  <Badge
    key={id}
    variant="outline"
    className="border-slate-200 bg-slate-50 text-slate-600 text-[11px] max-w-[200px] truncate"
    title={`${id}: ${nameMap.get(id) ?? id}`}
  >
    {id}: {nameMap.get(id) ?? id}
  </Badge>
))
```

### 追加するクラスと理由

| クラス | 理由 |
|--------|------|
| `max-w-[200px]` | Badgeの最大幅を200pxに制限。カード幅(grid-cols-2のカラム)に収まる適切なサイズ |
| `truncate` | 長いテキストを「...」で省略。Tailwindの`truncate`は`overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`を含む |

### 既存実装との整合性

他のファイルでのtruncate実装例:
- `app/business/page.tsx` L184: `max-w-[300px] truncate`
- `app/system-domains/[id]/page.tsx` L284: `max-w-[300px] truncate block`
- `components/forms/SelectionDialog.tsx` L67: `truncate`

今回の修正は、Badge特有の制約(`w-fit`, `shrink-0`の上書き)を考慮し、`max-w-[200px]`というより小さい幅を採用。

---

## 検証手順（Playwright MCP）

### シナリオ1: 長いテキストを持つBadgeの表示確認
1. `http://localhost:3000/business/BIZ-003/tasks/TASK-015/edit` を開く
2. 関連システム機能が既に選択されている状態を確認（SRF-017など）
3. Badgeがカード幅内に収まっていることを確認
4. テキストが「...」でtruncateされていることを確認

### シナリオ2: ホバー時の全文表示確認
1. truncateされたBadgeにホバー
2. title属性で全文が表示されることを確認

### シナリオ3: 複数Badgeの折り返し確認
1. 複数の関連項目を選択
2. Badgeが適切に折り返されることを確認

### シナリオ4: 短いテキストのBadge確認
1. 短いID/名前のBadgeが正常に表示されることを確認

---

## 難易度評価

```
難易度: ★☆☆
根拠: 1 file, 約5 lines, 1 component
リスク: 低 - 表示のみの変更でロジック変更なし
```

---

## 参考ファイル

- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/forms/requirement-card.tsx` - 修正対象ファイル（L66-73のBadgeコンポーネント）
- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/ui/badge.tsx` - Badgeコンポーネントのデフォルトスタイル参照（`w-fit`, `shrink-0`, `whitespace-nowrap`）
- `/usr/local/src/dev/wsl/personal-pj/req-manager/app/business/page.tsx` - truncate実装の参考例（L184）
- `/usr/local/src/dev/wsl/personal-pj/req-manager/app/system-domains/[id]/page.tsx` - truncate実装の参考例（L284）
