# 業務プロセス表示の調整

## 変更概要
- `process_steps`、`inputs`、`outputs` のフォントサイズを 13px → 14px に変更
- `process_steps` のラベルを「process_steps」→「業務プロセス」に変更
- `process_steps` の各項目に自動番号付け（1. 2. 3. ...）を実装

## 変更対象ファイル

### メイン: `/usr/local/src/dev/wsl/personal-pj/req-manager/app/(with-sidebar)/business/[id]/[taskId]/components/TaskSummaryCard.tsx`

## 変更内容

### 1. ラベル変更（行52）
**変更前:**
```tsx
<ProcessStepsBlock label="process_steps" value={displayProcessSteps} />
```

**変更後:**
```tsx
<ProcessStepsBlock label="業務プロセス" value={displayProcessSteps} />
```

### 2. フォントサイズ変更（text-[13px] → text-[14px]）

以下の行を変更：
- **行78**: 空データ時のプレースホルダー
- **行99**: process_steps 空データ表示
- **行103**: process_steps 各ステップ表示
- **行127**: inputs/outputs 空データ表示
- **行131**: inputs/outputs 各アイテム表示

### 3. 番号付け実装（行102-111）

**変更前:**
```tsx
{steps.map((step, index) => (
  <div key={`${label}-${index}`} className="text-[13px] text-slate-700">
    <span className="font-medium text-slate-900">
      {step.when || "—"}
    </span>
    ...
  </div>
))}
```

**変更後:**
```tsx
{steps.map((step, index) => (
  <div key={`${label}-${index}`} className="text-[14px] text-slate-700">
    <span className="font-medium text-slate-900 mr-2">
      {index + 1}.
    </span>
    <span className="font-medium text-slate-900">
      {step.when || "—"}
    </span>
    ...
  </div>
))}
```

## 実装手順

1. `TaskSummaryCard.tsx` を開く
2. 行52のラベルを変更
3. 行78, 99, 103, 127, 131 の `text-[13px]` を `text-[14px]` に置換
4. 行102-111 で番号表示を追加

## 検証方法

### 手動検証（Playwright MCP使用）
1. 開発サーバーを起動
2. `/business/BIZ-003/TASK-015` にアクセス
3. 以下を確認：
   - フォントサイズが 14px になっていること
   - ラベルが「業務プロセス」と表示されていること
   - 各ステップの先頭に「1.」「2.」と番号が表示されていること

### 検証用スクリーンショット取得コマンド
```bash
# Playwright MCP で以下のURLにアクセスしてスクリーンショット
http://localhost:3002/business/BIZ-003/TASK-015
```

## 難易度評価

**難易度: ★☆☆**
- 根拠: 1ファイル、約6行の変更、依存なし
- リスク: 表示のみの変更なのでロジック変更なし、安全性高い
