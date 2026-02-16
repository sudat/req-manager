# シーケンス図設計書作成

## コンテキスト

ユーザーから `/schema/sequence` の設計書があるかという質問を受け、調査した結果、設計書が存在しないことが判明した。

**調査結果（2026-02-11）:**
- **シーケンス図機能**: 実装済み（Phase 1〜2相当）
- **設計書**: 存在しない
- **ユーザーの選択**: 「作成する」を選択

---

## 実装状況の整理

| Phase | 機能 | 実装状況 |
|-------|------|---------|
| Phase 1 | 静的シーケンス図表示 | ✅ 実装済み |
| Phase 2 | ズーム・パン機能 | ✅ 実装済み (`SchemaViewer` + `react-zoom-pan-pinch`) |
| Phase 3 | DDクリックで詳細表示 | ❌ 未実装 |
| Phase 4 | フィルタリング機能 | ❌ 未実装 |

**実装済みファイル:**
- ページ: `app/(with-sidebar)/schema/sequence/page.tsx`
- API: `app/api/schema/sequence/route.ts`
- 変換ロジック: `lib/utils/design-documents/sideeffects-to-mermaid.ts`
- コンポーネント: `components/schema/SchemaViewer.tsx`, `components/schema/MermaidRenderer.tsx`

---

## 設計書の構成案

ER図の `docs/design/er-diagram-feature-plan.md` を参考に、以下の構成で作成する：

```markdown
# シーケンス図表示機能 - 段階的発展計画

## 概要

## Phase 1: 静的シーケンス図表示（✅ 実装済み）

## Phase 2: ズーム・パン機能（✅ 実装済み）

## Phase 3: DDクリックで詳細表示（🔜 将来実装）

## Phase 4: フィルタリング機能（🔜 将来実装）

## 参考リンク

## 更新履歴
```

---

## 作成ファイル

- **ファイル**: `docs/design/sequence-diagram-feature-plan.md`
- **内容**: ER図の設計書構造に従った段階的発展計画

---

## 実装手順

1. ER図の設計書 `docs/design/er-diagram-feature-plan.md` をテンプレートとして使用
2. シーケンス図固有の内容に書き換え:
   - データソース: `design_documents` + `requirement_links` (sideEffects)
   - 変換ロジック: `sideEffectsToMermaidSequence()`
   - 参加者: DD/Database/EventBus/FileSystem/ExternalAPI
3. 実装状況を反映: Phase 1〜2は「✅ 実装済み」、Phase 3〜4は「🔜 将来実装」

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|----------|
| `docs/design/sequence-diagram-feature-plan.md` | 新規作成（ER図設計書を参考に構造化） |

## 更新対象と内容

### 1. PRD.md 第11章「実装概要計画」の更新

#### 現状
- Phase 4.5、Phase 5のチェックリスト項目は実装済み
- しかし、実装完了日が記載されていない

#### 更新内容
1. **Phase 4.5の完了を反映**
   - 完了日: 2026-02-11
   - 実装済みファイル一覧を追加

2. **Phase 5の実装状況を反映**
   - 5-7 エクスポート機能は実装済み
   - 未実装項目（5-8, 5-9, 5-10）はPhase 6以降へ

#### 更新箇所
```markdown
### Phase 4.5: 構造化スキーマ

DDの入出力定義をテキスト自由記述から構造化Zodスキーマに移行する。`docs/control_plane.md` に準拠。

> **✅ 実装完了** (2026-02-11)
> 全8スキーマ、9エディタ、13ビューア、7テスト、互換性レイヤーを実装完了。

詳細なチェックリストは `docs/checklists/active/2026-02-05-structured-io-schema.md` を正本とする。

- [x] 4.5-1. フィールド定義スキーマ（`lib/domain/schemas/fields.ts`）
- [x] 4.5-2. タイプ別I/Oスキーマ（`lib/domain/schemas/io-schemas.ts`）
- [x] 4.5-3. 副作用スキーマ（`lib/domain/schemas/side-effects.ts`）
- [x] 4.5-4. 例外スキーマ（`lib/domain/schemas/exceptions.ts`）
- [x] 4.5-5. 非機能要件スキーマ（`lib/domain/schemas/non-functional.ts`）
- [x] 4.5-6. DD統合スキーマ（`lib/domain/schemas/design-document-structured.ts`）
- [x] 4.5-7. スキーマ単体テスト（7ファイル）
- [x] 4.5-8. UI/フォーム更新（9エディタ、13ビューア）
- [x] 4.5-9. データ移行・互換性レイヤー
- [x] 4.5-10. DBスキーマ変更

#### 実装済みファイル一覧

**スキーマ定義（8ファイル）:**
- `lib/domain/schemas/design-document-structured.ts`
- `lib/domain/schemas/fields.ts`
- `lib/domain/schemas/io-schemas.ts`
- `lib/domain/schemas/side-effects.ts`
- `lib/domain/schemas/core-logic.ts`
- `lib/domain/schemas/exceptions.ts`
- `lib/domain/schemas/non-functional.ts`
- `lib/domain/schemas/model-detail.ts`

**エディタ（9ファイル）:**
- `components/forms/design-document/editors/StructuredSpecEditor.tsx`
- `components/forms/design-document/editors/FieldEditor.tsx`
- `components/forms/design-document/editors/InputSchemaEditor.tsx`
- `components/forms/design-document/editors/OutputSchemaEditor.tsx`
- `components/forms/design-document/editors/SideEffectsEditor.tsx`
- `components/forms/design-document/editors/CoreLogicEditor.tsx`
- `components/forms/design-document/editors/ExceptionsEditor.tsx`
- `components/forms/design-document/editors/NonFunctionalEditor.tsx`
- `components/forms/design-document/editors/ModelEntityEditor.tsx`

**ビューア（13ファイル）:**
- `components/system-domains/structured-spec-viewer/index.tsx`
- `components/system-domains/structured-spec-viewer/FieldsViewer.tsx`
- `components/system-domains/structured-spec-viewer/InputSchemaViewer.tsx`
- `components/system-domains/structured-spec-viewer/OutputSchemaViewer.tsx`
- `components/system-domains/structured-spec-viewer/CoreLogicViewer.tsx`
- `components/system-domains/structured-spec-viewer/SideEffectsViewer.tsx`
- `components/system-domains/structured-spec-viewer/ExceptionsViewer.tsx`
- `components/system-domains/structured-spec-viewer/NonFunctionalViewer.tsx`
- `components/system-domains/structured-spec-viewer/ModelDetailViewer.tsx`
- `components/system-domains/structured-spec-viewer/EntryPointsViewer.tsx`
- `components/system-domains/structured-spec-viewer/field-group-helper.tsx`
- `components/system-domains/structured-spec-viewer/schema-type-guards.tsx`
- `components/system-domains/structured-spec-viewer/constants.tsx`

**テスト（7ファイル）:**
- `tests/unit/schemas/fields.test.ts`
- `tests/unit/schemas/design-document-structured.test.ts`
- `tests/unit/schemas/io-schemas.test.ts`
- `tests/unit/schemas/side-effects.test.ts`
- `tests/unit/schemas/core-logic.test.ts`
- `tests/unit/schemas/exceptions.test.ts`
- `tests/unit/schemas/non-functional.test.ts`

**互換性レイヤー:**
- `lib/utils/design-documents/structured-compat.ts`

---

### Phase 5: 変更管理と連携

変更要求、影響調査、コーディングエージェント連携を実装する。

> **主要機能は実装済み** (2026-02-06〜)

- [x] 5-1. DBスキーマ追加（change_requests, investigation_results, impact_scopes）
- [x] 5-2. 変更要求（CR）一覧・起票・編集画面（/tickets）
- [x] 5-3. impact_analysis Tool 実装（トップダウン分析: CR → BR → SF → SR → AC）
- [x] 5-4. 疑義リンク管理（suspect状態の設定・解消UI）
- [x] 5-5. 疑義リンクダッシュボード（SuspectLinksCard）
- [x] 5-6. CR詳細画面（影響調査結果表示、疑義リンク一覧）
- [x] 5-7. エクスポート機能（business/requirements/system の3形式、ZIP出力）

 未実装項目（将来実装予定）:
  <!-- 5-8. MCP Server 実装 - Phase 6以降で検討 -->
  <!-- 5-9. 改修指示パッケージ生成機能 - Phase 6以降で検討 -->
  <!-- 5-10. 設計決定ログ記録機能 - Phase 6以降で検討 -->
```

---

### 2. PRD.md 第9章「画面構成と利用フロー」へのER図機能追加

#### 現状
- ER図機能は実装済み（`/schema/er` ページ、`SchemaViewer` コンポーネント）
- サイドバーに「スキーマ」グループとして既に追加されている
- しかし、PRD.md 9章には記載がない

#### 更新内容
「9.2 主要画面の構成」セクションにER図ページの説明を追加

```markdown
### ER図表示画面（/schema/er）

プロジェクト全体のドメインモデルをER図として一覧表示する画面。model型の設計書（`type='model'`）からMermaid ER図を自動生成する。

```
┌─────────────────────────────────────────────────────────────────────┐
│ ER図（ドメインモデル）                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ER図表示エリア                                      │   │
│  │                                                             │   │
│  │ Entity1 ||--o{ Entity2 : "has"                             │   │
│  │ Entity2 {                                                    │   │
│  │   UUID id PK                                                 │   │
│  │   string name                                                 │   │
│  │ }                                                            │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### データソース
- `design_documents` テーブル（`type='model'`）
- `lib/utils/design-documents/model-to-mermaid.ts` でMermaid ER図へ変換

#### コンポーネント
- `app/(with-sidebar)/schema/er/page.tsx` - メインページ
- `components/schema/SchemaViewer.tsx` - ER図ビューア
- `components/schema/er/MermaidRenderer.tsx` - Mermaid描画

#### サイドバーメニュー
- スキーマグループ → ER図（`/schema/er`）
- スキーマグループ → シーケンス図（`/schema/sequence`）
```
```

---

### 3. PRD.md 第3.9節「DD（Design Document）」のsideEffectsラベル更新

#### 現状
- PRD.md 842行目に既に反映済み：`| **UIラベル** | - | 「副作用」→「保存/通知」に変更 |`
- 追加の更新は不要

---

### 4. PRD.md 第7章「エクスポート仕様」の追加

#### 現状
- Phase 5-7 でエクスポート機能は実装済み
- しかし、PRD.md 7章には詳細な記載がない

#### 更新内容
「7. エクスポート仕様（Claude Code連携）」セクションを追加

```markdown
## 7. エクスポート仕様（Claude Code連携）

本章は、本ツールの正本をClaude Codeが参照できる形式で出力する仕様を定義する。

### 7.1 出力ファイル構成

エクスポートにより `docs/requirements/` ディレクトリに以下の構造でファイルが出力される。

```
docs/requirements/
├── product/
│   └── product-requirement.yml
├── business/
│   ├── {business_domain_id}/
│   │   └── {business_task_id}.md
│   └── INDEX.md
├── system/
│   ├── {system_domain_id}/
│   │   └── {system_function_id}.md
│   └── INDEX.md
├── graph/
│   └── requirements-links.json
├── concepts/
│   └── concept-dictionary.yml
└── INDEX.md
```

### 7.2 プロダクト要件ファイルフォーマット

### 7.3 業務タスクファイルフォーマット

### 7.4 システム機能ファイルフォーマット

### 7.5 概念辞書フォーマット

### 7.6 リンク・根拠データフォーマット

### 7.7 INDEX.md（ルーティング表）

### 実装ファイル
- `lib/export/requirements-export.ts` - エクスポートロジック
- `app/api/export/requirements/route.ts` - API Route

### エクスポート形式
- **business**: 業務要件のエクスポート（Markdown形式）
- **requirements**: システム要件のエクスポート（Markdown形式）
- **system**: システム機能・設計書のエクスポート（Markdown形式）
- **graph**: 要件間リンクのエクスポート（JSON形式）

※ ZIP形式で一括ダウンロードも対応
```

---

### 5. MEMORY.md の更新

#### 現状
- Phase 5 の完了が記録されている
- Phase 4.5 は未記録

#### 更新内容

```markdown
## Phase 4.5: 構造化スキーマ (2026-02-11 完了)

### ポイント・落とし穴
- **Zodスキーマ構造**: JSONBに保存する構造化データはZodで厳密に型定義する
- **UIラベル**: sideEffectsのUI表示は「保存/通知」に変更（「副作用」は廃止）
- **互換性レイヤー**: `structured-compat.ts` で旧テキスト形式から新構造化スキーマへの変換をサポート
- **エディタ/ビューアの分離**: エディタは `components/forms/design-document/editors/`、ビューアは `components/system-domains/structured-spec-viewer/`

### 実装済みファイル
- **スキーマ定義（8ファイル）**: lib/domain/schemas/（fields, io-schemas, side-effects, core-logic, exceptions, non-functional, design-document-structured, model-detail）
- **エディタ（9ファイル）**: components/forms/design-document/editors/
- **ビューア（13ファイル）**: components/system-domains/structured-spec-viewer/
- **テスト（7ファイル）**: tests/unit/schemas/
- **互換性レイヤー**: lib/utils/design-documents/structured-compat.ts

### 既存エラー（手を出さない）
- （新規に発生したエラーがあればここに追加）

---

## Phase 5: ER図機能 (2026-02-09 Phase 1完了)

### ポイント・落とし穴
- **Mermaid形式**: ER図はMermaidテキストから生成し、クライアント側で `mermaid.render()` でSVGに変換
- **データソース**: `design_documents` テーブル（`type='model'`）を対象とする。物理テーブル定義ではなく論理エンティティ（業務視点）を表現
- **関連タイプ**: relationships の type を Mermaid の記法に変換（1:1→||--||、1:N→||--o{）

### 実装済みファイル
- **ページ**: `app/(with-sidebar)/schema/er/page.tsx`
- **ビューア**: `components/schema/SchemaViewer.tsx`、`components/schema/er/MermaidRenderer.tsx`
- **ユーティリティ**: `lib/utils/design-documents/model-to-mermaid.ts`
- **API**: `app/api/schema/er/route.ts`

### 既存エラー（手を出さない）
- （新規に発生したエラーがあればここに追加）
```

---

## 更新しないドキュメント

以下のドキュメント更新は、今回のスコープ外とする（優先度低）：

1. **database-schema-design.md の JSONB スキーマ詳細追加**
   - 理由: PRD.md 第3.9節に既に詳細な説明があるため、重複を避ける
   - 必要に応じて別途対応

2. **チェックリストの統合**
   - 理由: 複数のチェックリストファイルが分散しているが、統合には別途検討が必要
   - Phase 4 / Phase 4.5 / Phase 5 の別ファイル管理を継続

---

## 検証方法

各ドキュメント更新後に以下を確認する：

1. **PRD.md 第11章**
   - Phase 4.5、Phase 5 の完了日が記載されているか
   - 実装済みファイル一覧が追加されているか

2. **PRD.md 第9章**
   - ER図表示画面の説明が追加されているか
   - サイドバーメニューとの整合性が取れているか

3. **PRD.md 第7章**
   - エクスポート仕様の説明が追加されているか

4. **MEMORY.md**
   - Phase 4.5、ER図機能の記録が追加されているか

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|----------|
| `docs/PRD.md` | 第11章の更新（Phase 4.5完了、Phase 5状況、実装ファイル一覧） |
| `docs/PRD.md` | 第9章へのER図機能追加 |
| `docs/PRD.md` | 第7章へのエクスポート仕様追加 |
| `/home/test/.claude/projects/-usr-local-src-dev-wsl-personal-pj-req-manager/memory/MEMORY.md` | Phase 4.5、ER図機能の記録追加 |
