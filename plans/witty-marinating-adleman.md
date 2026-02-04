# ヘルススコアから「概念辞書の用語にリンクされている」チェックを削除

## 背景
ヘルススコアには2つの概念関連チェックがある：
1. **業務要件に概念が紐づいている**（high重み、2倍）- 残す
2. **概念辞書の用語にリンクされている**（medium重み、1倍）- **削除する**

後者はシステム要件も含めたチェックだが、業務要件の概念紐付けで十分カバーされているため削除する。

## 実装計画

### 修正ファイル一覧

| ファイル | 変更内容 | 行数概算 |
|---------|---------|---------|
| `lib/health-score/linkage-issues.ts` | `calculateConceptTermsWithLinksIssue`関数を削除 | -27行 |
| `lib/health-score/index.ts` | import削除、呼び出し削除、フィルター定義削除 | -13行 |

**合計**: 2 files, 約40行削除

### 詳細手順

#### 1. lib/health-score/linkage-issues.ts
- `calculateConceptTermsWithLinksIssue` 関数全体（行44-69）を削除

#### 2. lib/health-score/index.ts
- 行14-16: importから `calculateConceptTermsWithLinksIssue` を削除
- 行122-126: `healthIssueFilters` の `concept_terms_with_links` 定義を削除
- 行234-241: `buildHealthScoreSummary` 内での呼び出しを削除

### 影響範囲

#### DB/API
- 影響なし（DB変更なし、API変更なし）

#### UI
- ダッシュボード、業務タスク詳細、システム機能詳細のヘルススコアカードから「概念辞書の用語にリンクされている」項目が消える
- コンポーネントの変更は不要（表示項目が自動的に減るのみ）

#### スコア計算
- medium重要度の項目が1つ減るため、スコア値が少し変動する可能性がある

### 検証計画

#### 1. 関数未使用確認
```bash
grep -r "calculateConceptTermsWithLinksIssue" --exclude-dir=node_modules
```
→ 0件になることを確認

#### 2. 型チェック
```bash
bunx tsc --noEmit
```
→ 型エラーが出ないことを確認

#### 3. E2E表示確認
- ダッシュボード（/dashboard）にアクセス
- ヘルススコアカードに「概念辞書の用語にリンクされている」が表示されていないこと
- 他のチェック項目が正常に表示されていること

#### 4. スコア計算確認
- スコア値が正常に計算されていること（NaNやエラーになっていない）

## 難易度評価

**難易度**: ★☆☆

**根拠**:
- 修正ファイル数: 2 files
- 変更行数概算: 約40行
- 影響コンポーネント数: 0（UIコンポーネント変更なし）

**リスク**: 低
- スコア値の変動はあるが、ロジックの破壊的変更ではない
- コンポーネント変更なしで表示自動調整
