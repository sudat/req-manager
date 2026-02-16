# Test Coverage Analysis and Improvement Plan

## Context

現在のプロジェクトにおけるテストカバレッジの網羅性調査（2026-02-11 更新）。

### 最新のテスト状況

| 指標 | 現状 | 目標（業界標準） |
|------|------|------------------|
| テストファイル数 | 31ファイル | 30-50ファイル ✅ |
| テストコード行数 | 約2,000行+ | 6,000-15,000行 (15-30%) |
| 総コード行数 | 43,874行 | - |
| カバー機能モジュール | 35/60+ | 40/60+ |

### 全体テスト結果
**689 tests pass / 0 fail** (31 files)

### Phase 1 & 2 完了状況

| Phase | 対象 | ステータス |
|-------|------|----------|
| **Phase 1: クリティカルパス** | id-rules.ts | ✅ 57 tests pass |
| | create-system-function.ts | ✅ 28 tests pass |
| | save-system-function.ts | ✅ 29 tests pass |
| | validate-system-function.ts | ✅ 42 tests pass |
| **Phase 2: AI機能** | Mastra Tools (12files) | ✅ 398 tests pass |
| **スキーマ検証** | 7ファイル | ✅ 113 tests pass |

---

## Deep-Explore 調査結果 (2026-02-11)

### 1. CRUD層のテスト状況

| ファイル | 行数 | テスト有無 | カバー内容摘要 | リスク評価 |
|---------|------|-----------|--------------|----------|
| `requirement-links.ts` | 681行 | ✅ 有り | CRUD、DD依存同期、呼び出し元同期、疑義管理、ハイレベルAPIのロジック抽出テスト | 低 - ロジック部分は十分にカバー |
| `projects.ts` | 83行 | ❌ 無し | crud-factory使用のみの基本CRUD | 中 - crud-factoryテストで間接カバー |
| `businesses.ts` | 191行 | ❌ 無し | CRUD + `listBusinessesWithRequirementCounts`集計ロジック | 中 - 集計ロジック（N+1クエリ）のテストなし |
| `system-functions.ts` | 253行 | ❌ 無し | entryPoints/codeRefs相互変換、マージロジック | 中 - マージ処理のエッジケース未検証 |
| `design-documents.ts` | 205行 | ❌ 無し | 呼び出し元取得・マージ、一括作成・削除 | 中 - callers取得の結合テストなし |
| `change-requests.ts` | 212行 | ❌ 無し | CRUD + ステータス/優先度正規化 | 低 - 正規化ロジックは単純 |
| `tasks.ts` | 148行 | ❌ 無し | YAMLパース/シリアライズ処理 | 中 - YAMLパースエラー時のフォールバック未検証 |
| `concepts.ts` | 209行 | ❌ 無し | CRUD + LLM類似概念検索（`findSimilarConcepts`） | **高** - LLM呼び出し部分のモック・エッジケース未検証 |
| `investigation-results.ts` | 129行 | ❌ 無し | CRUD + JSONB正規化 | 中 - JSONB不正時の正規化ロジック未検証 |
| `suspect-detection.ts` | 245行 | ❌ 無し | 要件変更検出・疑義フラグ設定 | **高** - 変更検出ロジック（配列・オブジェクト比較）未検証 |
| `crud-factory.ts` | 328行 | ❌ 無し | **全CRUDの共通基底** | **高** - 全エンティティに影響する共通ロジック未テスト |
| `structured.ts` | 167行 | ❌ 無し | entryPoints/codeRefs正規化・相互変換 | 中 - 変換ロジックのエッジケース未検証 |

### 2. スキーマ定義のテスト状況

| スキーマ | テスト有無 | カバー内容摘要 |
|---------|-----------|--------------|
| `fields.ts` | ✅ | 19 tests |
| `io-schemas.ts` | ✅ | 18 tests |
| `core-logic.ts` | ✅ | 11 tests |
| `design-document-structured.ts` | ✅ | 25 tests |
| `side-effects.ts` | ✅ | 21 tests |
| `exceptions.ts` | ✅ | 14 tests |
| `non-functional.ts` | ✅ | 11 tests |
| `model-detail.ts` | ✅ | 5 tests |
| `system-design.ts` | ❌ | 未テスト（使用頻度低） |

### 3. 優先推奨（追加テストが必要な領域）

#### 優先度: 高
1. **crud-factory.ts** (328行) - 全CRUDの共通基底
   - `executeListQuery`のprojectIdフィルタ挙動
   - `createCrudOperations`の各メソッド（正常系・エラー系）
   - `createSortOrderUpdater`の一括更新処理

2. **suspect-detection.ts** (245行) - 疑義検出の中核ロジック
   - `detectChangedFields`のオブジェクト・配列比較
   - `shouldMarkSuspect`のフィルタロジック
   - `markRelatedLinksSuspect`のDB更新二重処理

3. **concepts.ts** (209行) - LLL類似概念検索
   - `findSimilarConcepts`のLLMモック化テスト
   - `getConceptsLookupMap`のマップ構築ロジック

#### 優先度: 中
4. **structured.ts** (167行) - EntryPoint/CodeRef変換
   - `normalizeEntryPoints`/`normalizeCodeRefs`の異常値処理
   - `codeRefsToEntryPoints`/`entryPointsToCodeRefs`の変換ロジック

5. **businesses.ts** (191行) - 集計ロジック
   - `listBusinessesWithRequirementCounts`の各種データパターン
   - タスク・要件がゼロ件の場合の挙動

6. **system-functions.ts** (253行) - マージ処理
   - `updateSystemFunction`のentryPointsマージロジック

7. **design-documents.ts** (205行) - 統合処理
   - `listDesignDocumentsBySrfId`のcallers取得・マージ

#### 優先度: 低（crud-factoryカバーで間接対応）
8. 他のCRUDファイル（projects, tasks, change-requests等）はcrud-factoryのテストで間接カバー

---

## Critical Files

### 未テストの重要ファイル（優先度高）

```
lib/data/crud-factory.ts (328行) ★高
lib/utils/suspect-detection.ts (245行) ★高
lib/data/concepts.ts (209行) ★高
lib/utils/structured.ts (167行)
lib/data/businesses.ts (191行)
lib/data/system-functions.ts (253行)
lib/data/design-documents.ts (205行)
lib/data/investigation-results.ts (129行)
lib/utils/tasks.ts (148行)
```

### 既存テスト済みファイル

```
tests/unit/utils/id-rules.test.ts (57 tests) ✅
tests/unit/utils/system-functions/create-system-function.test.ts (28 tests) ✅
tests/unit/utils/system-functions/save-system-function.test.ts (29 tests) ✅
tests/unit/utils/system-functions/validate-system-function.test.ts (42 tests) ✅
tests/unit/utils/sideeffects-to-mermaid.test.ts (2 tests) ✅
tests/unit/data/requirement-links.test.ts (21 tests) ✅
tests/unit/mastra/tools/*.test.ts (12 files, 398 tests) ✅
tests/unit/schemas/*.test.ts (7 files, 113 tests) ✅
```
