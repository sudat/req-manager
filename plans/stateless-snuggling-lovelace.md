# LLM/通知設定のUI/UX統合計画

## 概要
LLM設定と通知設定の保存ボタンを、プロジェクト設定と同じUI/UXに統一する。

**難易度: ★☆☆**
- 変更ファイル: 2 files（修正のみ）
- 変更行数: 50-80 lines
- リスク: なし（ダミー実装のため）

---

## 問題の現状

| 問題 | 現状 | 期待動作 |
|------|------|----------|
| ダイアログ表示 | `alert()` でダイアログが出る | 画面内に成功メッセージを表示 |
| 永続化 | リロードしたら値が戻る | 将来的にDB保存（今はダミー） |
| ボタン名 | 「変更を保存」 | 「保存」に統一 |
| 不要なボタン | 接続テストボタンがある | 削除 |

---

## 参照ファイル

### 参照実装
- `components/settings/project-settings-content.tsx` - 保存フローの正解パターン

### 修正対象
- `components/settings/llm-settings-content.tsx`
- `components/settings/notification-settings-content.tsx`

---

## 実装内容

### Step 1: LLM設定の修正

#### 1.1 状態管理を追加

```typescript
// 既存:
const [showApiKey, setShowApiKey] = useState(false);
const [temperature, setTemperature] = useState([1]);

// 追加:
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
```

#### 1.2 ダミー保存処理を実装

```typescript
const handleSave = async () => {
  setSaving(true);
  setError(null);
  setSuccess(null);

  // ダミーの非同期処理
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 未実装であることを表示（infoスタイル）
  setError("この機能はまだ実装されていません");
  setSaving(false);
};
```

#### 1.3 未実装メッセージ表示を追加

```tsx
{/* ボタンの直前に追加 */}
{error && (
  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
    <p className="text-[13px] text-amber-700">{error}</p>
  </div>
)}

{success && (
  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
    <p className="text-[13px] text-emerald-700">{success}</p>
  </div>
)}
```

#### 1.4 ボタンを修正

```tsx
// 変更前:
<div className="flex justify-end gap-3 pt-4">
  <Button variant="outline" className="h-8 px-6">接続テスト</Button>
  <Button className="bg-slate-900 hover:bg-slate-800 h-8 px-6">変更を保存</Button>
</div>

// 変更後:
<div className="flex justify-end gap-3 pt-4">
  <Button
    onClick={handleSave}
    disabled={saving}
    className="bg-slate-900 hover:bg-slate-800 h-8 px-6"
  >
    {saving ? "保存中..." : "保存"}
  </Button>
</div>
```

---

### Step 2: 通知設定の修正

#### 2.1 状態管理を追加

```typescript
// 追加:
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
```

#### 2.2 Switchを制御化（オプション）

```tsx
// 変更前:
<Switch defaultChecked />

// 変更後:
const [settings, setSettings] = useState({
  changeRequestUpdates: true,
  suspectLinkAlerts: true,
  reviewRequests: true,
  weeklySummary: false,
});

<Switch
  checked={settings.changeRequestUpdates}
  onCheckedChange={(checked) =>
    setSettings((prev) => ({ ...prev, changeRequestUpdates: checked }))
  }
/>
```

#### 2.3 ダミー保存処理を実装

```typescript
const handleSave = async () => {
  setSaving(true);
  setError(null);
  setSuccess(null);

  // ダミーの非同期処理
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 未実装であることを表示（infoスタイル）
  setError("この機能はまだ実装されていません");
  setSaving(false);
};
```

#### 2.4 未実装メッセージ表示とボタン修正

```tsx
{/* Switchリストの直後に追加 */}
{error && (
  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
    <p className="text-[13px] text-amber-700">{error}</p>
  </div>
)}

{success && (
  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
    <p className="text-[13px] text-emerald-700">{success}</p>
  </div>
)}

{/* ボタンを修正 */}
<div className="flex justify-end pt-4">
  <Button
    onClick={handleSave}
    disabled={saving}
    className="bg-slate-900 hover:bg-slate-800 h-8 px-6 text-[14px]"
  >
    {saving ? "保存中..." : "保存"}
  </Button>
</div>
```

---

## 将来的な実装（参考）

### 型定義

```typescript
// lib/domain/entities.ts に追加

export type LLMSettings = {
  provider: 'openai' | 'anthropic' | 'google' | 'azure';
  apiKey: string;
  model: string;
  temperature: number;
};

export type NotificationSettings = {
  changeRequestUpdates: boolean;
  suspectLinkAlerts: boolean;
  reviewRequests: boolean;
  weeklySummary: boolean;
};
```

### API関数

```typescript
// lib/data/llm-settings.ts（新規作成）
export const updateLLMSettings = async (
  projectId: string,
  settings: LLMSettings
) => {
  // TODO: Supabaseの projects.llm_settings (jsonb) に保存
};

// lib/data/notification-settings.ts（新規作成）
export const updateNotificationSettings = async (
  projectId: string,
  settings: NotificationSettings
) => {
  // TODO: Supabaseの projects.notification_settings (jsonb) に保存
};
```

### DBマイグレーション

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_llm_notification_settings.sql

ALTER TABLE projects
  ADD COLUMN llm_settings jsonb DEFAULT '{}',
  ADD COLUMN notification_settings jsonb DEFAULT '{}';
```

---

## 検証手順

### 手動テスト

1. **LLM設定タブ**
   - 「保存」ボタンをクリック
   - 300ms後に「この機能はまだ実装されていません」が表示される
   - ボタンテキストが「保存中...」→「保存」に戻る

2. **通知設定タブ**
   - 「保存」ボタンをクリック
   - 300ms後に「この機能はまだ実装されていません」が表示される
   - ボタンテキストが「保存中...」→「保存」に戻る

3. **プロジェクト設定との一貫性**
   - ボタン名がすべて「保存」
   - 保存中の表示が統一されている

### E2Eテスト（Playwright MCP）

```bash
# 1. /settings に移動
# 2. LLM設定タブで「保存」をクリック → 未実装メッセージが表示される
# 3. 通知設定タブで「保存」をクリック → 未実装メッセージが表示される
```

---

## 実装の注意点

### State管理
- `saving` は保存中のみ `true` にする
- `success` は保存成功時に設定
- `error` はエラー発生時に設定（今はダミーなので使われない）

### スタイル維持
- 成功メッセージ: `border-emerald-200 bg-emerald-50 text-emerald-700`
- 未実装メッセージ（info）: `border-amber-200 bg-amber-50 text-amber-700`
- ボタン: `bg-slate-900 hover:bg-slate-800 h-8 px-6`

### 将来の拡張性
- `handleSave` 内に `// TODO` コメントを残す
- 型定義は将来的に `lib/domain` に追加する予定
