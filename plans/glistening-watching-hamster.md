# Systemドメイン一覧ページに「AIで追加」ボタンを追加

## 概要
`/system/[id]` ページのシステム機能一覧に「AIで追加」ボタンを追加する。

## 現状
- ✅ Businessドメイン一覧：`/business/[id]` → 「AIで追加」ボタンあり
- ❌ Systemドメイン一覧：`/system/[id]` → 「AIで追加」ボタンなし
- ✅ System機能詳細：`/system/[id]/[srfId]` → 「AIで追加」ボタンあり

## 実装内容

### 修正ファイル
`components/system-functions/system-function-list-toolbar.tsx`

### 変更内容
1. **Sparkles アイコンを追加**
   ```tsx
   import { Sparkles } from "lucide-react";
   ```

2. **「AIで追加」ボタンを追加**
   - 追加位置: 既存の「新規作成」ボタンの前
   - 遷移先: `/chat?screen=SF&sdId=${domainId}`
   - スタイル: Business側と同様のグラデーションボタン

   ```tsx
   <Link href={`/chat?screen=SF&sdId=${domainId}`}>
     <Button className="h-8 gap-2 text-[14px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
       <Sparkles className="h-4 w-4" />
       AIで追加
     </Button>
   </Link>
   ```

## 難易度
**★☆☆**
- 根拠: 1ファイル、約10行追加、既存パターンの適用
- リスク: 低（既存のBusiness側実装と同一パターン）

## 検証方法
1. `http://localhost:3000/system/AR` にアクセス
2. ページ上部のツールバーに「AIで追加」ボタンが表示されることを確認
3. ボタンをクリックして `/chat?screen=SF&sdId=AR` に遷移することを確認
