# 「業務領域別 要件分布」コンポーネント削除計画

## 概要
Dashboard ページから「業務領域別 要件分布」コンポーネントを削除する

## 難易度評価
**難易度: ★☆☆**
- 修正ファイル: 1 file
- 削除行数: 約50行（lines 268-316）
- リスク: なし（依存関係なし、ハードコードデータのみ）

## 変更内容

### 変更ファイル
`app/(with-sidebar)/dashboard/page.tsx`

### 削除範囲
Lines 268-316（以下のブロック）

```tsx
{/* 業務領域別要件分布 */}
<Card className="rounded-md border border-slate-200 bg-white">
  <CardHeader className="border-b border-slate-100 px-4 py-3">
    <CardTitle className="text-[15px] font-semibold text-slate-900">
      業務領域別 要件分布
    </CardTitle>
  </CardHeader>
  <CardContent className="p-4">
    <div className="space-y-3">
      {/* AR, AP, GL のプログレスバー表示 */}
      {/* 合計表示 */}
    </div>
  </CardContent>
</Card>
```

## 実装手順

1. `app/(with-sidebar)/dashboard/page.tsx` を読み込んで現状を確認
2. Lines 268-316 の Card ブロック全体を削除
3. （オプション）グリッドレイアウトの調整を検討
   - 削除後、同セクションには「レビュー待ち変更要求」カードのみ残る
   - `grid-cols-1 lg:grid-cols-2` のままで問題ない場合は変更なし

## 検証方法

1. 開発サーバー起動
   ```bash
   bun run dev
   ```
2. Playwright MCP で以下を確認
   - `http://localhost:3000/dashboard` にアクセス
   - 「業務領域別 要件分布」が表示されていないこと
   - 他のカード（Health Score、レビュー待ち変更要求など）が正常に表示されていること
   - レイアウト崩れがないこと

## 影響範囲
- **依存関係**: なし
- **テスト**: 該当テストなし
- **ドキュメント**: アーカイブ済みのチェックリストに記載あり（更新不要）
