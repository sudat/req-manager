---
name: e2e-testing
description: Playwright MCPを使用したE2Eテスト実行スキル。Next.jsやReact（Vite）プロジェクトのコード改修後に動作確認を行う。使用タイミング：(1) Plan modeで改修内容を計画する際に、E2Eテストも計画に含める、(2) コード改修完了後にユーザーから「動作確認して」「テストして」「Playwrightで確認」などの指示があった場合、(3) WSL環境でのReact/Next.js動作確認が必要な場合。ポート競合の回避、データロード待機の適切な処理を含む。
---

# E2E Testing with Playwright MCP

WSL環境でNext.jsやReact（Vite）プロジェクトのE2Eテストを実行するスキル。ポート競合やデータロード待機などの典型的な問題を回避する。

## Workflow

### 1. プロジェクト種別の検出

package.jsonを読み取り、プロジェクト種別と使用ポートを特定する：

```bash
# Next.jsの検出
grep -q '"next"' package.json && echo "Next.js detected"

# Viteの検出
grep -q '"vite"' package.json && echo "Vite detected"
```

**デフォルトポート:**
- Next.js: 3000
- Vite: 5173

package.jsonのscriptsセクションでカスタムポートが指定されている場合は、それを優先する。

### 2. ポート確認とサーバー起動判断

`scripts/check_port.sh`を使用してポートの使用状況を確認：

```bash
bash scripts/check_port.sh 3000
```

**判断フロー:**

```
ポート使用中？
├─ YES → 既存サーバーを再利用
│         - ブラウザでアクセス可能か確認
│         - 問題なければそのまま使用
│         - エラーの場合のみプロセスをkillして再起動
│
└─ NO  → 新規サーバー起動
          - ビルドが必要か確認（Next.jsの場合、package.jsonに"build"スクリプトがあるか）
          - 開発サーバーをバックグラウンドで起動
```

**サーバー起動コマンド例:**

```bash
# Next.js
bun run dev &

# Vite
bun run dev &
```

起動後、サーバーが立ち上がるまで5-10秒待機する。

### 3. Playwright MCPでのテスト実行

#### 3.1 前提：Playwright MCPツールのロード

テスト実行前に、必ずPlaywright MCPツールをロードする：

```
ToolSearch: "select:mcp__playwright__browser_navigate"
```

その後、必要なツール（navigate, click, screenshot等）を使用可能にする。

#### 3.2 基本テストパターン

**画面表示確認:**

```
1. browser_navigate: http://localhost:3000/target-page
2. browser_wait_for:
   - selector: データ要素のセレクタ（例: "[data-testid='content']"）
   - timeout: 5000ms
3. browser_screenshot:
   - 全画面スクリーンショット
```

**CRITICAL: データロード待機**

スクリーンショットを撮る前に、必ず以下のいずれかを実行：
- `browser_wait_for`: 特定のセレクタが表示されるまで待機
- `browser_wait_for`: networkidle状態まで待機
- 固定待機（最終手段）: 2-3秒のsleep

**悪い例（データロード前にスクショ）:**
```
navigate → screenshot  # NG: データ未ロード
```

**良い例（適切な待機）:**
```
navigate → wait_for(selector) → screenshot  # OK
navigate → wait_for(networkidle) → screenshot  # OK
```

#### 3.3 操作テストパターン

**フォーム入力とクリック:**

```
1. browser_navigate
2. browser_wait_for: フォームの表示待ち
3. browser_fill_form: 入力値を設定
4. browser_click: 送信ボタンクリック
5. browser_wait_for: 結果表示の待機
6. browser_screenshot: 結果確認
```

#### 3.4 Playwright MCPツールの使い分け

| ツール | 用途 | 注意点 |
|--------|------|--------|
| browser_navigate | ページ遷移 | URLは `http://localhost:PORT` 形式 |
| browser_wait_for | 要素の表示待ち | データロード前に必須 |
| browser_screenshot | スクリーンショット取得 | wait_for後に実行 |
| browser_click | クリック操作 | セレクタは具体的に指定 |
| browser_fill_form | フォーム入力 | name属性またはセレクタで指定 |
| browser_console_messages | コンソールログ確認 | エラー調査時に使用 |

### 4. 結果レポート

テスト実行後、以下を報告：

```markdown
## E2Eテスト結果

### テスト対象
- URL: http://localhost:3000/xxx
- プロジェクト: Next.js / Vite

### 実行内容
1. [実行した操作]
2. [確認した項目]

### 結果
- ✅ 成功 / ❌ 失敗
- スクリーンショット: [パス]

### 問題点（あれば）
- [エラー内容]
- [コンソールログ]
```

## Plan Modeでの統合

コード改修の計画時、以下のように改修とテストを一緒に計画する：

```markdown
## 実装計画

### Phase 1: 機能実装
- [ ] コンポーネント修正
- [ ] APIエンドポイント追加

### Phase 2: E2Eテスト
- [ ] ポート確認とサーバー起動
- [ ] 画面表示テスト
- [ ] 操作フローテスト
- [ ] エラーケーステスト
```

## トラブルシューティング

### ポート競合エラー

```
Error: Port 3000 already in use
```

**対処:**
1. `scripts/check_port.sh 3000`で使用プロセス確認
2. 開発サーバーなら再利用
3. 不明なプロセスなら`kill -9 <PID>`後に再起動

### データが表示されない

```
スクリーンショットにデータが表示されていません
```

**対処:**
1. `browser_wait_for`の追加
2. セレクタの確認（devツールで要素検証）
3. タイムアウト時間の延長（5000ms → 10000ms）

### ビルドエラー

```
Build failed
```

**対処:**
1. `bun install`で依存関係再インストール
2. `.next`ディレクトリ削除後に再ビルド
3. TypeScriptエラーの確認と修正

## Resources

### scripts/

- **check_port.sh**: ポート使用状況確認スクリプト
  - Usage: `bash scripts/check_port.sh <port>`
  - 戻り値: exit 0（使用中）、exit 1（利用可能）
