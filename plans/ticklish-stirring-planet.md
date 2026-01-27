# 業務タスクヘルススコア「他〇件」クリック機能実装

## 課題
業務タスク詳細ページのヘルススコアカードで「他4件」と表示されているが、クリックしても反応しない。

## 要件
- 「他〇件」をクリックすると、残りのissuesも含めて全て表示される
- 展開状態を維持するstate管理
- 展開時に「折りたたむ」機能も提供

---

## 難易度評価
**難易度**: ★☆☆
**根拠**: 1ファイル、約30行の変更、依存なし。成功率95%

---

## 実装計画

### 修正ファイル
`components/health-score/health-score-card.tsx`

### 設計方針
1. `useState` で `showAll` stateを追加
2. 「他〇件」をクリック可能なボタンに変更
3. `showAll` が true の時は全issuesを表示
4. 展開時は「折りたたむ」リンクを表示

### 変更内容

#### 1. useState のインポート（既存）
```tsx
// useStateは既にReactからインポートされている想定
```

#### 2. showAll stateの追加（52行目の後に追加）
```tsx
const [showAll, setShowAll] = useState(false);
```

#### 3. visibleIssuesの条件分岐変更（53行目）
```tsx
// 変更前
const visibleIssues = maxIssues ? issues.slice(0, maxIssues) : issues;

// 変更後
const visibleIssues = maxIssues && !showAll ? issues.slice(0, maxIssues) : issues;
```

#### 4. 「他〇件」のボタン化（184-186行目）
```tsx
// 変更前
{remainingIssues > 0 && (
  <div className="text-[12px] text-slate-400">他 {remainingIssues} 件</div>
)}

// 変更後
{remainingIssues > 0 && !showAll && (
  <button
    type="button"
    onClick={() => setShowAll(true)}
    className="text-[12px] text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
  >
    他 {remainingIssues} 件を表示
  </button>
)}
{showAll && (
  <button
    type="button"
    onClick={() => setShowAll(false)}
    className="text-[12px] text-slate-500 hover:text-slate-600 hover:underline cursor-pointer transition-colors"
  >
    折りたたむ
  </button>
)}
```

---

## 検証方法

### E2Eテスト（Playwright MCP）
1. `http://localhost:3000/business/BIZ-001/tasks/TASK-001` にアクセス
2. ヘルススコアカードの「他〇件を表示」ボタンをクリック
3. 全てのissuesが表示されることを確認
4. 「折りたたむ」ボタンをクリック
5. 最初の6件のみに戻ることを確認

### 手動テスト
- ボタンのホバー効果を確認（色変更、下線）
- クリック時に適切に展開/折りたたみされるか
- ステートが正しく維持されているか

---

## 影響範囲
- なし（単一コンポーネント内の変更のみ）
