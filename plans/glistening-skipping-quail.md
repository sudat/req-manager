# コード簡素化・共通化 再精査計画

## 概要

前回のPhase 0〜4実装完了後の再精査結果。
残存する簡素化・共通化の機会を特定した。

```
難易度: ★★☆
根拠: 10+ files, 300+ lines, 中規模リファクタリング
リスク: 既存機能の動作確認が必要
```

---

## 調査結果サマリー

### ✅ 前回対応済み（再対応不要）

| 対象 | 対応内容 |
|------|---------|
| SSEチャンク境界問題 | バッファリング実装済み |
| 未使用context呼び出し | 削除済み |
| CRUD共通化（4ファイル） | crud-factory.ts作成、concepts/system/tasks/impl-unit-sds対応 |
| カスケードフック | use-cascade-fetch.ts作成 |
| フィルタフック | use-list-filter.ts作成 |
| View/Edit統合 | field-configs.ts作成 |
| テーブル共通化 | data-table.tsx作成 |
| スタイルクラス | Tailwind v4設定追加 |

### 🔵 新規発見（対応推奨）

| 優先度 | 対象 | 問題点 | 推定効果 |
|--------|------|--------|---------|
| 高 | CRUD共通化（追加6ファイル） | crud-factory.ts未使用 | -400行 |
| 中 | links/page.tsx (463行) | 大きなページコンポーネント | -150行 |
| 中 | health-score/index.ts (393行) | 大きな関数 | -100行 |
| 低 | TODOコメント整理 | 17箇所のTODO | 保守性向上 |

---

## 1. 高優先度：CRUD共通化（追加ファイル）

### 現状

`crud-factory.ts` を使用しているファイル（4ファイル）:
- ✅ `lib/data/concepts.ts`
- ✅ `lib/data/system-domains.ts`
- ✅ `lib/data/tasks.ts`
- ✅ `lib/data/impl-unit-sds.ts`

### 追加対応候補（6ファイル）

| ファイル | 行数 | 対応可否 | 備考 |
|---------|------|---------|------|
| `lib/data/businesses.ts` | 168行 | ✅ 可能 | 標準CRUD構造 |
| `lib/data/projects.ts` | 156行 | ✅ 可能 | 標準CRUD構造 |
| `lib/data/system-functions.ts` | 245行 | ✅ 可能 | 標準CRUD構造 |
| `lib/data/change-requests.ts` | 180行 | ✅ 可能 | 標準CRUD構造 |
| `lib/data/product-requirements.ts` | 195行 | △ 部分的 | 特殊なupsert処理あり |
| `lib/data/business-requirements.ts` | 220行 | △ 部分的 | 複雑な関連データ取得 |

### 対応方針

標準CRUD構造のファイル（businesses, projects, system-functions, change-requests）を優先的に対応。

---

## 2. 中優先度：大きなファイルの分割

### 2.1 `app/(with-sidebar)/links/page.tsx` (463行)

**問題点**:
- テーブル、フィルター、バッチ操作が1ファイルに混在
- 状態管理が複雑（8個のuseState）

**推奨対応**:
```
RequirementLinksPage
├── RequirementLinksTable (テーブル部分)
├── LinkFilterControls (フィルター部分)
├── useLinkBatchOperations() (バッチ操作フック)
└── useRequirementLinks() (データフェッチフック)
```

### 2.2 `lib/health-score/index.ts` (393行)

**問題点**:
- `buildHealthScoreSummary` 関数が170行超
- 複数のissue計算ロジックが1関数に集約

**推奨対応**:
- issue種別ごとの計算関数に分割
- `calculateBusinessRequirementIssues()`
- `calculateSystemRequirementIssues()`
- `calculateLinkageIssues()`

### 2.3 その他の大きなファイル（参考）

| ファイル | 行数 | 優先度 | 備考 |
|---------|------|--------|------|
| `system/[id]/[srfId]/page.tsx` | 337行 | 低 | 詳細ページ |
| `product-requirement/edit/page.tsx` | 331行 | 低 | 編集ページ |
| `ideas/[id]/page.tsx` | 326行 | 低 | 詳細ページ |
| `chat-container.tsx` | 414行 | 低 | sendMessage分割検討 |

---

## 3. 低優先度：TODOコメント整理

### 現状のTODOコメント（17箇所）

| ファイル | 内容 | 対応 |
|---------|------|------|
| `chat-container.tsx` | commit_draft Tool呼び出し | 機能実装待ち |
| `chat-container.tsx` | 編集画面に遷移 | 機能実装待ち |
| `chat-container.tsx` | 再生成 | 機能実装待ち |
| `chat-container.tsx` | concepts テーブルに登録 | 機能実装待ち |
| `api/chat/route.ts` | Mastra Memoryから履歴取得 | 機能実装待ち |
| `lib/mastra/tools/*` | 各種ツール実装 | 機能実装待ち |

**対応方針**: 機能実装時に対応。現時点では整理のみ。

---

## 実装順序の推奨

### Phase 1: CRUD共通化（追加4ファイル）

```
難易度: ★☆☆
推定削減: -300行
```

1. `lib/data/businesses.ts` → crud-factory.ts使用
2. `lib/data/projects.ts` → crud-factory.ts使用
3. `lib/data/system-functions.ts` → crud-factory.ts使用
4. `lib/data/change-requests.ts` → crud-factory.ts使用

### Phase 2: links/page.tsx分割（オプション）

```
難易度: ★★☆
推定削減: -150行
```

1. `useLinkBatchOperations()` フック抽出
2. `LinkFilterControls` コンポーネント分離
3. `RequirementLinksTable` コンポーネント分離

### Phase 3: health-score分割（オプション）

```
難易度: ★★☆
推定削減: -100行
```

1. issue計算関数の分割
2. テスト追加

---

## 検証方法

各Phase完了後:
1. `bun run build` でビルドエラーがないことを確認
2. 該当画面の動作確認
3. 既存の単体テストがあれば実行

---

## 結論

前回のPhase 0〜4で主要な簡素化・共通化は完了済み。

**残存する対応候補**:
- **高優先度**: CRUD共通化（追加4ファイル）→ 効果大、リスク低
- **中優先度**: links/page.tsx, health-score分割 → 効果中、リスク中
- **低優先度**: TODOコメント整理 → 機能実装時に対応

**推奨**: Phase 1（CRUD共通化追加）のみ実施。Phase 2-3は必要に応じて。
