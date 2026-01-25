# 設定画面とプロジェクト編集画面の重複フォーム項目解決計画

## 概要

設定画面 (`/settings`) から重複項目を削除し、プロジェクト編集画面 (`/projects/[id]/edit`) のみに表示する。

## 重複項目の削除方針

| 項目 | 設定画面 | プロジェクト編集 |
|------|----------|------------------|
| `githubUrl` | 削除 | 残す（バリデーション追加） |
| `reviewLinkThreshold` | 削除 | 残す |
| `autoSave` | 削除 | 残す |

## 推奨アプローチ

**設定画面から項目を削除し、プロジェクト編集画面にバリデーションを追加**

### 理由
- 設定画面はシステム全体の設定を管理する場所（将来的な拡張性考慮）
- プロジェクト固有の設定はプロジェクト編集画面で管理する方が直感的
- 重複の完全排除

## 難易度評価

```
難易度: ★☆☆
根拠: 2 files, 削除約80行 / 追加約30行, 依存は限定的
リスク: 設定画面から項目削除のため、既存ユーザーへの影響に注意
```

## 実装手順

### 1. 設定画面から項目を削除

**修正ファイル**: `app/(with-sidebar)/settings/page.tsx`

- 以下の項目を削除:
  - GitHub URLフィールド（L193-222）
  - 要確認リンク判定基準フィールド（L141-168）
  - 自動保存スイッチ（L172-189）
- 関連するstateを削除:
  - `githubUrl`, `setGithubUrl`
  - `reviewLinkThreshold`, `setReviewLinkThreshold`
  - `autoSave`, `setAutoSave`
  - `githubUrlError`, `setGithubUrlError`
  - `isUrlTouched`, `setIsUrlTouched`
  - `handleGithubUrlChange` 関数
- 保存ボタンのハンドラー `handleSave` を簡素化（項目更新なし）

### 2. プロジェクト編集画面にバリデーション追加

**修正ファイル**: `app/projects/[id]/edit/page.tsx`

- GitHub URLにバリデーションを追加:
  - `validateGitHubUrl`, `normalizeGitHubUrl` をインポート
  - エラー状態管理用stateを追加
  - バリデーションエラー表示を追加
  - 保存時のバリデーションを追加

## Critical Files

| ファイル | 操作 | 説明 |
|---------|------|------|
| `app/(with-sidebar)/settings/page.tsx` | 修正 | 重複項目を削除（約80行削除） |
| `app/projects/[id]/edit/page.tsx` | 修正 | GitHub URLバリデーションを追加（約30行追加） |

## 参照ファイル（変更なし）

- `lib/utils.ts` - `validateGitHubUrl`, `normalizeGitHubUrl` 関数を使用
- `lib/data/projects.ts` - `updateProject` 関数を使用
- `lib/domain/entities.ts` - `Project` 型定義

## 検証方法

### 手動テスト項目

1. **設定画面** (`/settings`):
   - [ ] 画面が正常に表示される
   - [ ] 重複項目（GitHub URL、要確認リンク判定基準、自動保存）が表示されない
   - [ ] 他の設定項目が正常に動作する

2. **プロジェクト編集画面** (`/projects/[id]/edit`):
   - [ ] GitHub URLに無効な値を入力 → エラーメッセージ表示
   - [ ] GitHub URLに有効な値を入力 → エラー消える
   - [ ] GitHub URLが正規化される（http:// → https://）
   - [ ] 要確認リンク判定基準の変更が保存される
   - [ ] 自動保存スイッチの変更が保存される
   - [ ] エラー時に保存ボタンが無効化される

### 回帰テスト

- [ ] プロジェクト作成機能が動作する
- [ ] プロジェクト一覧が正しく表示される
- [ ] プロジェクト切り替えが正しく動作する

### E2Eテスト（Playwright MCP）

WSL環境で以下を確認:
- 設定画面でGitHub URLバリデーションが動作
- プロジェクト編集画面でGitHub URLバリデーションが動作
- 両画面で保存が正常に完了

## バックワード互換性

- データ層への変更なし
- 既存機能への影響なし
- プロジェクト編集画面でのバリデーション追加は機能追加として妥当
