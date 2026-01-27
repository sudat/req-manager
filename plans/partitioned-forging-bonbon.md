# AC表示問題の修正プラン - 完了

## 実行内容

`components/system-domains/system-requirements-section.tsx` に受入基準（AC）表示機能を追加しました。

## 変更箇所

### 1. Import追加
```tsx
import { AcceptanceCriteriaDisplay } from "@/components/forms/AcceptanceCriteriaDisplay";
```

### 2. AC表示セクション追加
`RequirementItem` 内、`systemReqImpacts` の後に以下を追加：

```tsx
{req.systemReqAcceptanceCriteriaJson && req.systemReqAcceptanceCriteriaJson.length > 0 && (
  <div className="border-t border-slate-100 pt-3 space-y-2">
    <div className="text-[12px] font-medium text-slate-500">受入条件</div>
    <AcceptanceCriteriaDisplay
      items={req.systemReqAcceptanceCriteriaJson}
      emptyMessage="未登録"
    />
  </div>
)}
```

## ACの表示位置

各システム要件カード内で以下の順序で表示されます：

1. Badge + タイトル
2. システム要約
3. 関連概念
4. 影響領域
5. **受入条件（AC）** ← 新規追加
6. 関連業務要件

## 検証方法

1. `http://localhost:3002/system-domains/GL/SRF-017` にアクセス
2. 「システム要件」セクションの「手動仕訳入力」カードを確認
3. 影響領域の下に「受入条件」ラベルと共にACが3つ表示されることを確認
