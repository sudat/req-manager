# プロダクト要件画面の閲覧/編集モード分離

## 概要
`/product-requirement` 画面を閲覧モード（照会）と編集モード（`/edit`）に分離し、誤編集を防止するとともに、閲覧時にはMarkdown/YAMLを適切に表示する。

## 現状の課題
- `/product-requirement` で常に編集可能状態（Textarea直接編集）
- 見に来ただけなのに誤って編集してしまうリスク
- Markdownが生テキストで表示されて読みにくい

## 設計方針
1. **ルート構造**: `/business/[id]/[taskId]/` パターンに倣い、ViewとEditを分離
2. **コンポーネント設計**: 共通コンポーネントを抽出し、DRY原則を適用
3. **YAML表示**: シンタックスハイライト未実装（将来的な拡張として考慮）
4. **状態管理**: Edit Modeでのみフォーム状態を管理

## ファイル構成

```
app/(with-sidebar)/product-requirement/
├── page.tsx                  # View Mode（新規作成）
└── edit/
    └── page.tsx             # Edit Mode（現在のpage.tsxを移行・修正）

components/product-requirement/  # 新規ディレクトリ
├── view-header.tsx         # View Mode用ヘッダー（編集ボタン付き）
├── edit-header.tsx         # Edit Mode用ヘッダー（保存/キャンセルボタン付き）
├── basic-info-view.tsx     # 基本情報タブの閲覧コンポーネント
├── basic-info-edit.tsx     # 基本情報タブの編集コンポーネント
├── tech-stack-view.tsx     # 技術スタックタブの閲覧コンポーネント
├── tech-stack-edit.tsx     # 技術スタックタブの編集コンポーネント
├── markdown-field-view.tsx # Markdownフィールド閲覧用（ラベル+MarkdownRenderer）
└── yaml-field-view.tsx     # YAMLフィールド閲覧用（ラベル+<pre>表示）
```

## 実装ステップ

### Step 1: 共通コンポーネントの作成
1. `components/product-requirement/markdown-field-view.tsx` - Markdownフィールドの閲覧表示
2. `components/product-requirement/yaml-field-view.tsx` - YAMLフィールドの閲覧表示
3. `components/product-requirement/view-header.tsx` - 閲覧モード用ヘッダー
4. `components/product-requirement/edit-header.tsx` - 編集モード用ヘッダー

### Step 2: タブコンポーネントの作成
1. `components/product-requirement/basic-info-view.tsx` - 基本情報タブ（閲覧）
2. `components/product-requirement/basic-info-edit.tsx` - 基本情報タブ（編集）
3. `components/product-requirement/tech-stack-view.tsx` - 技術スタックタブ（閲覧）
4. `components/product-requirement/tech-stack-edit.tsx` - 技術スタックタブ（編集）

### Step 3: ルートの実装
1. `app/(with-sidebar)/product-requirement/page.tsx` - 閲覧モードページ（新規）
2. `app/(with-sidebar)/product-requirement/edit/page.tsx` - 編集モードページ（現在のpage.tsxを移行）

## ナビゲーションフロー

```
/product-requirement (View Mode)
  - Markdown/YAMLを適切に表示
  - "編集"ボタン → /product-requirement/edit へ
  - データ未登録時は "新規作成" プロンプト表示

/product-requirement/edit (Edit Mode)
  - Textarea/YamlTextareaFieldで編集
  - "保存" → 保存成功後、/product-requirement へ遷移
  - "キャンセル" → 変更がある場合は確認ダイアログ → /product-requirement へ
```

## コンポーネント設計

### MarkdownFieldView
```typescript
interface MarkdownFieldViewProps {
  label: string;
  content: string;
}

// ラベル + MarkdownRenderer で表示
```

### YamlFieldView
```typescript
interface YamlFieldViewProps {
  label: string;
  content: string | null;
}

// ラベル + <pre className="yaml-content">{content}</pre> で表示
// nullの場合は "未設定" を表示
```

### ViewHeader
```typescript
interface ViewHeaderProps {
  onEdit: () => void;
  hasData: boolean;
}

// 編集ボタンを表示
// データ未登録時は "新規作成" テキスト表示
```

### EditHeader
```typescript
interface EditHeaderProps {
  onSave: () => void;
  onCancel: () => void;
  hasChanges: boolean;
  isSaving: boolean;
}

// 保存・キャンセルボタンを表示
// hasChangesがtrueの場合のみキャンセル確認
```

## エッジケース対応

| ケース | 対応 |
|--------|------|
| データ未登録時 | View Modeで「まだデータがありません。新規作成してください。」を表示 |
| プロジェクト未選択 | 両モードでエラー表示 |
| キャンセル時変更確認 | 確認ダイアログ表示（useRouterのbeforePopState利用） |
| 保存失敗 | エラーメッセージ表示、編集続行可能 |

## 参考ファイル

| パス | 用途 |
|------|------|
| `app/(with-sidebar)/product-requirement/page.tsx` | 現在の実装（編集モードへ移行） |
| `components/markdown/markdown-renderer.tsx` | Markdown表示で再利用 |
| `lib/data/product-requirements.ts` | データ操作関数（既存実装を再利用） |
| `components/forms/yaml-textarea-field.tsx` | YAML編集で再利用 |
| `app/(with-sidebar)/business/[id]/[taskId]/page.tsx` | View Modeの実装パターン参考 |

## 検証方法

### 1. 閲覧モードの確認
```bash
# 1. プロジェクトを選択
# 2. /product-requirement にアクセス
# 3. Markdown/YAMLが適切に表示されていることを確認
# 4. "編集"ボタンをクリックして /edit に遷移することを確認
```

### 2. 編集モードの確認
```bash
# 1. /product-requirement/edit にアクセス
# 2. 編集フォームが表示されていることを確認
# 3. "キャンセル" で閲覧モードに戻ることを確認
# 4. 編集して "保存" で反映されることを確認
```

### 3. Playwright MCPでのE2E確認
```bash
# スキル: e2e-testing
# 1. /product-requirement でスクリーンショット
# 2. 編集ボタンクリック → /edit に遷移
# 3. 編集して保存 → 反映されているか確認
```

## 難易度評価

**難易度: ★★☆**
- 修正ファイル数: 7-9 files
- 変更行数: 300-400 lines
- 影響コンポーネント数: 6 components

**リスク:**
- 状態管理の複雑化（View/Editでstateを分ける）
- フォーム変更検出の実装
- 既存動作のリグレッション

## マイルストーン

1. ✅ Phase 1: 共通コンポーネント作成
2. ✅ Phase 2: タブコンポーネント実装
3. ✅ Phase 3: ルート実装
4. ✅ Phase 4: E2Eテストで動作確認
