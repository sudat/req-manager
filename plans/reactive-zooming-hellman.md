# 本日コミット内容のコード簡素化調査

## 調査対象
2026年1月19日のコミット（5件、合計63ファイル変更、約3,400行追加）

| コミット | 時刻 | 内容 |
|----------|------|------|
| 6759db2 | 13:00 | PRD v1.3 策定 |
| 23506ba | 18:00 | Phase 1 計画ドキュメント |
| 762da8d | 18:30 | DBスキーマ拡張 |
| fbca5a7 | 22:00 | データ層拡張 |
| b94b8c6 | 23:30 | UIフォーム拡張 |

## SIMPLIFY_REQUIRED 判定基準

| 基準 | 閾値 |
|------|------|
| ファイルサイズ | 概ね300行超 |
| Reactコンポーネント | 概ね180行超 |
| 関数サイズ | 概ね60行超 |
| ネスト深度 | 概ね4段超 |
| 重複ブロック | 10行以上が複数箇所 |

## 調査結果

### 新規作成ファイル

| ファイル | 行数 | 判定 |
|----------|------|------|
| `components/forms/StructuredAcceptanceCriteriaInput.tsx` | 216行 | **要検討** |
| `components/forms/EntryPointsEditor.tsx` | 152行 | OK |
| `components/forms/AcceptanceCriteriaDisplay.tsx` | 37行 | OK |
| `components/system-domains/entry-points-section.tsx` | 39行 | OK |
| `lib/data/structured.ts` | 131行 | OK |

### 更新ファイル

| ファイル | 行数 | 判定 |
|----------|------|------|
| `app/.../edit/hooks/useSystemFunctionForm.ts` | 335行 | **要検討** |
| `components/forms/requirement-card.tsx` | 243行 | **要検討** |
| `components/forms/SelectionDialog.tsx` | 165行 | OK |
| `app/.../edit/hooks/useTaskEditForm.ts` | 115行 | OK |
| `app/.../edit/hooks/useTaskSave.ts` | 145行 | OK |

## 詳細分析

### 1. StructuredAcceptanceCriteriaInput.tsx (216行)
- **基準超過**: Reactコンポーネント180行超
- **実態**: JSX中心で可読性は良好。ロジックは単純（expandedIds管理、フォーム入力）
- **ネスト**: 深いネストなし
- **結論**: 基準超過だが、構造は明確。無理な分割は逆効果

### 2. useSystemFunctionForm.ts (335行)
- **基準超過**: ファイルサイズ300行超
- **内訳**:
  - 型定義: 約90行
  - 初期値・バリデーション: 約30行
  - カスタムフック本体: 約215行
- **状態管理**: 13個のuseState（フォームの性質上必要）
- **結論**: 型定義を分離すれば300行未満になる可能性あり

### 3. requirement-card.tsx (243行)
- **基準超過**: Reactコンポーネント180行超
- **内訳**:
  - SelectionFieldヘルパー: 35行
  - RequirementCard本体: 160行
- **結論**: 本体コンポーネントは180行未満で問題なし

## 最終判定: SIMPLIFY_NOT_REQUIRED

以下の理由により、現時点でのコード簡素化は**不要**と判断：

1. **基準超過ファイルの実態分析**
   - いずれも構造が明確で、可読性に問題なし
   - 深いネスト、複雑な条件分岐なし
   - 重複コードなし

2. **無理な分割のデメリット**
   - ファイル間の依存が増え、かえって追跡困難に
   - 凝集度の低下（関連コードの分散）

3. **将来的な検討事項**（必須ではない）
   - `useSystemFunctionForm.ts`: 型定義を別ファイルに分離可能
   - ただし現状でも問題なく動作し、可読性も許容範囲

## 結論

本日のコミット内容について、**コード簡素化は不要**です。

基準を超過するファイルが3件ありますが、いずれも：
- 構造が明確
- ネストが浅い
- 重複がない
- 凝集度が高い

ため、現状のまま維持することを推奨します。
