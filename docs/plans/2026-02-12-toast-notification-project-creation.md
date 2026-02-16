# プロジェクト作成後のトースト通知機能実装計画
> **Status:** ✅ 実装完了 (2026-02-12)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** プロジェクト作成成功時に「プロジェクトを作成しました。続けてPR設定をしてください。」とトースト通知を表示する

**Architecture:** shadcn/ui + sonner ライブラリの `Toaster` コンポーネントを活用。既にグローバルに設定済みのため、`toast` 関数をインポートして呼び出すだけのシンプルな実装。

**Tech Stack:** Next.js 15 (App Router), React 18, TypeScript, sonner (v1.7.0+), shadcn/ui

---

## タスク構成

1. **Task 1**: プロジェクト作成ダイアログにトースト機能を追加する
2. **Task 2**: 動作確認（既存の Toaster 設定確認）

---

## Task 1: プロジェクト作成ダイアログにトースト機能を追加する

**Files:**
- Modify: `components/project/project-create-dialog.tsx`

**Step 1: sonner から toast 関数をインポートする**

```typescript
// ファイル先頭に追加
import { toast } from "sonner";
```

**Step 2: プロジェクト作成成功時にトーストを表示する**

`components/project/project-create-dialog.tsx` の `handleSubmit` 関数を修正：

```typescript
// 現在の成功フロー（lines 39-54）を以下のように変更：

const { data: project, error: createError } = await createProject({
  name,
  description: description || null,
});

if (createError || !project) {
  setError(createError ?? "作成に失敗しました");
  setSubmitting(false);
  return;
}

// ✅ ここにトースト通知を追加
toast.success("プロジェクトを作成しました。続けてPR設定をしてください。");

await refreshProjects();
setCurrentProjectId(project.id);
setSubmitting(false);
onOpenChange(false);
```

**Step 3: コード変更の検証**

```bash
# TypeScript 型チェック
bunx tsc --noEmit components/project/project-create-dialog.tsx

# Expected: エラーなし
```

**Step 4: 動作確認**

```bash
# 開発サーバー起動
bun run dev

# Expected: http://localhost:3000 で起動

# 手順:
# 1. プロジェクト一覧画面（/projects）にアクセス
# 2. 「新規作成」ボタンをクリック
# 3. プロジェクト名を入力（例：「テストプロジェクト」）
# 4. 説明を入力（任意）
# 5. 「作成」ボタンをクリック
# 6. トースト通知が右上に表示されることを確認
```

**Expected Result:**
- トースト通知が画面右上に表示される
- メッセージ：「プロジェクトを作成しました。続けてPR設定をしてください。」
- 自動的に閉じる（既存の動作）
- プロジェクト一覧に戻る（既存の動作）

---

## Task 2: 動作確認（既存の Toaster 設定確認）

**Files:**
- Read: `app/layout.tsx`
- Read: `components/ui/sonner.tsx`

**Step 1: グローバル Toaster 設定を確認する**

`app/layout.tsx` で `<Toaster position="top-right" />` が設定されていることを確認：

```tsx
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ProjectProvider>{children}</ProjectProvider>
        <Toaster position="top-right" />  {/* ✅ これでOK */}
        <Agentation />
      </body>
    </html>
  );
}
```

**Step 2: sonner ラッパーコンポーネントの実装を確認する**

`components/ui/sonner.tsx` で Toaster コンポーネントが正しくエクスポートされていることを確認：

```tsx
import { Toaster } from "sonner";

export function Toaster({ ... }) {
  return (
    <ToasterProvider>
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
      />
    </ToasterProvider>
  );
}

export { Toaster };
```

**Expected Result:**
- Toaster は既にグローバルに設定済み
- `toast.success()` を呼び出すだけで通知が表示される

---

## 実装完了後の確認事項

- [x] プロジェクト作成時にトースト通知が表示される
- [x] 通知メッセージが適切に表示される
- [x] トーストが自動的に閉じる（デフォルトの挙動）
- [x] ダイアログが閉じる（既存の動作）
- [x] プロジェクト一覧に戻る（既存の動作）
- [x] TypeScript 型エラーが発生しない

---

## 参考資料

- **shadcn/ui Toast**: https://ui.shadcn.com/docs/components/toast
- **sonner Documentation**: https://sonner.emilkow.com/docs/toast
- **既存実装**: `components/project/project-create-dialog.tsx` (lines 1-120)
- **グローバル設定**: `app/layout.tsx` (lines 1-37)

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-02-12 | 初版作成 |
| 2026-02-12 | ✅ 実装完了 |
