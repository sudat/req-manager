# URL構造統一計画: Business側をSystem側に合わせる

## 概要
Business側のURL構造をSystem Domains側に合わせてシンプル化する。

### 変更前後の比較

| ページ | Before | After |
|--------|--------|-------|
| タスク一覧 | `/business/[id]/tasks` | `/business/[id]` |
| タスク詳細 | `/business/[id]/tasks/[taskId]` | `/business/[id]/[taskId]` |
| タスク編集 | `/business/[id]/tasks/[taskId]/edit` | `/business/[id]/[taskId]/edit` |
| タスク作成 | `/business/[id]/tasks/create` | `/business/[id]/create` |
| AI修正指示 | `/business/[id]/tasks/ai-order` | `/business/[id]/ai-order` |

---

## 難易度評価

```
難易度: ★★☆
根拠: 8 files, ~100 lines, ディレクトリ構造変更を含む
リスク: 既存リンク・ブックマークが無効になる（開発環境のため影響軽微）
```

---

## 実装ステップ

### Step 1: ディレクトリ構造の変更
`app/(with-sidebar)/business/[id]/` 配下を再構成

```
# Before
business/[id]/
├── edit/page.tsx
└── tasks/
    ├── page.tsx              → [id]/page.tsx に移動
    ├── create/               → [id]/create/ に移動
    ├── ai-order/             → [id]/ai-order/ に移動
    └── [taskId]/             → [id]/[taskId]/ に移動

# After
business/[id]/
├── page.tsx                  # タスク一覧（旧 tasks/page.tsx）
├── edit/page.tsx             # 業務編集（変更なし）
├── create/                   # タスク作成（旧 tasks/create/）
├── ai-order/                 # AI修正指示（旧 tasks/ai-order/）
└── [taskId]/                 # タスク詳細（旧 tasks/[taskId]/）
    ├── page.tsx
    └── edit/
```

### Step 2: 内部リンクの更新
以下のファイルで `/tasks` を含むリンクを修正：

1. **サイドバー・ナビゲーション**
   - `components/layout/sidebar.tsx`

2. **一覧ページからのリンク**
   - `app/(with-sidebar)/business/page.tsx` - 各行クリック時のリンク

3. **詳細ページからのリンク**
   - `app/(with-sidebar)/business/[id]/page.tsx` (旧tasks/page.tsx)
   - 戻るボタン、作成ボタンなど

4. **パンくずリスト（存在すれば）**

5. **フォーム送信後のリダイレクト**
   - `create/` ページの送信後リダイレクト
   - `edit/` ページの保存後リダイレクト

### Step 3: インポートパスの修正
ディレクトリ移動に伴う相対パスの修正

---

## 修正対象ファイル一覧

### ディレクトリ移動

| Before | After |
|--------|-------|
| `business/[id]/tasks/page.tsx` | `business/[id]/page.tsx` |
| `business/[id]/tasks/create/` | `business/[id]/create/` |
| `business/[id]/tasks/ai-order/` | `business/[id]/ai-order/` |
| `business/[id]/tasks/[taskId]/` | `business/[id]/[taskId]/` |

### 内部リンク修正（18箇所）

| ファイル | 箇所数 | 変更内容 |
|----------|--------|----------|
| `business/[id]/tasks/page.tsx` | 5 | `/tasks/` を削除 |
| `business/[id]/tasks/create/page.tsx` | 2 | `/tasks` を削除 |
| `business/[id]/tasks/create/components/TaskForm.tsx` | 1 | `/tasks` を削除 |
| `business/[id]/tasks/ai-order/page.tsx` | 3 | `/tasks` を削除 |
| `business/[id]/tasks/[taskId]/page.tsx` | 2 | `/tasks/` を削除 |
| `business/[id]/tasks/[taskId]/edit/hooks/useTaskSave.ts` | 1 | `/tasks/` を削除 |
| `business/[id]/tasks/[taskId]/edit/components/TaskEditHeader.tsx` | 1 | `/tasks/` を削除 |
| `config/resource-lists.tsx` | 2 | `/tasks` を削除 |
| `components/system-domains/system-requirements-section.tsx` | 1 | `/tasks/` を削除 |

---

## 検証方法

1. **手動確認（Playwright MCP使用）**
   - `/business` 一覧から領域をクリック → `/business/[id]` に遷移確認
   - タスク一覧が正しく表示されるか
   - タスク作成 → 保存 → 一覧に戻るフロー確認
   - タスク詳細 → 編集 → 保存フロー確認

2. **リンク切れ確認**
   - 各ページ間のナビゲーションが機能するか
   - パンくずリストが正しく動作するか

3. **System Domains側との一貫性確認**
   - `/system-domains/[id]` と `/business/[id]` のURL構造が一致しているか

---

## 備考
- 旧URL（`/business/[id]/tasks`）へのアクセスは404になる
- 本番環境でなければリダイレクト設定は不要
