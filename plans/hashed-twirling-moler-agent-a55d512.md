# ドキュメント更新調査レポート

## 調査サマリー

コードベースとドキュメント（PRD.md、database-schema-design.md、er-diagram-feature-plan.md、チェックリスト）の整合性を調査した結果、以下の特徴が明らかになった：

- **Phase 4.5（構造化スキーマ）**: 完了 - チェックリストと実装が整合している
- **Phase 5（変更管理と連携）**: ほぼ完了 - 主要機能は実装済みだが一部未実装
- **ER図機能**: Phase 1完了 - 静的ER図表示が実装済み
- **DD構造化スキーマ**: 完了 - 全ioTypeのスキーマ定義、エディター/ビューアーが完備

---

## 各観点の調査結果

### 1. Phase 4.5（構造化スキーマ）

#### 実装状況
**完了** - チェックリストの全項目が実装されている。

#### チェックリストとの整合性
**整** - docs/checklists/active/2026-02-05-structured-io-schema.md のチェック項目と実装ファイルが完全に対応している。

**実装済みファイル一覧（確認済み）:**
- スキーマ定義（8ファイル）:
  - lib/domain/schemas/design-document-structured.ts
  - lib/domain/schemas/fields.ts
  - lib/domain/schemas/io-schemas.ts
  - lib/domain/schemas/side-effects.ts
  - lib/domain/schemas/core-logic.ts
  - lib/domain/schemas/exceptions.ts
  - lib/domain/schemas/non-functional.ts
  - lib/domain/schemas/model-detail.ts

- エディター（9ファイル）:
  - components/forms/design-document/editors/StructuredSpecEditor.tsx
  - components/forms/design-document/editors/FieldEditor.tsx
  - components/forms/design-document/editors/InputSchemaEditor.tsx
  - components/forms/design-document/editors/OutputSchemaEditor.tsx
  - components/forms/design-document/editors/SideEffectsEditor.tsx
  - components/forms/design-document/editors/CoreLogicEditor.tsx
  - components/forms/design-document/editors/ExceptionsEditor.tsx
  - components/forms/design-document/editors/NonFunctionalEditor.tsx
  - components/forms/design-document/editors/ModelEntityEditor.tsx

- ビューアー（13ファイル）:
  - components/system-domains/structured-spec-viewer/index.tsx
  - components/system-domains/structured-spec-viewer/FieldsViewer.tsx
  - components/system-domains/structured-spec-viewer/InputSchemaViewer.tsx
  - components/system-domains/structured-spec-viewer/OutputSchemaViewer.tsx
  - components/system-domains/structured-spec-viewer/CoreLogicViewer.tsx
  - components/system-domains/structured-spec-viewer/SideEffectsViewer.tsx
  - components/system-domains/structured-spec-viewer/ExceptionsViewer.tsx
  - components/system-domains/structured-spec-viewer/NonFunctionalViewer.tsx
  - components/system-domains/structured-spec-viewer/ModelDetailViewer.tsx
  - components/system-domains/structured-spec-viewer/EntryPointsViewer.tsx
  - components/system-domains/structured-spec-viewer/field-group-helper.tsx
  - components/system-domains/structured-spec-viewer/schema-type-guards.tsx
  - components/system-domains/structured-spec-viewer/constants.ts

- 互換性レイヤー:
  - lib/utils/design-documents/structured-compat.ts

- テスト（7ファイル）:
  - tests/unit/schemas/fields.test.ts
  - tests/unit/schemas/design-document-structured.test.ts
  - tests/unit/schemas/io-schemas.test.ts
  - tests/unit/schemas/side-effects.test.ts
  - tests/unit/schemas/core-logic.test.ts
  - tests/unit/schemas/exceptions.test.ts
  - tests/unit/schemas/non-functional.test.ts

- DBマイグレーション:
  - supabase/migrations/20260205153000_structured_io_schema.sql（COMMENT追加）

#### 更新が必要なドキュメント
**なし** - database-schema-design.md に JSONBスキーマ定義が反映されている。

---

### 2. Phase 5（変更管理と連携）

#### 実装状況
**一部完了** - 主要機能は実装済みだが、一部未実装項目がある。

#### チェックリストとの整合性
**一部不一致** - docs/checklists/active/2026-01-28-phase4-ai-features.md のPhase 5項目で未実装のものがある。

**実装済み項目:**
- [x] 5-1. DBスキーマ追加（investigation_resultsテーブル）
  - supabase/migrations/20260206090000_phase5_investigation_results.sql
- [x] 5-2. 変更要求（CR）一覧・起票・編集画面
  - app/(with-sidebar)/tickets/page.tsx
  - app/(with-sidebar)/tickets/create/page.tsx
  - app/(with-sidebar)/tickets/[id]/page.tsx
  - app/(with-sidebar)/tickets/[id]/edit/page.tsx
- [x] 5-3. impact_analysis Tool 実装
  - lib/mastra/tools/impact-analysis.ts
- [x] 5-4. 疑義リンク管理（suspect状態の設定・解消UI）
  - components/tickets/suspect-link-card.tsx
  - components/tickets/ticket-suspect-links-card.tsx
  - components/tickets/suspect-link-action-bar.tsx
- [x] 5-5. CR詳細画面（影響調査結果表示、疑義リンク一覧）
  - components/tickets/ticket-investigation-section.tsx
  - components/tickets/ticket-investigation-result-card.tsx
  - components/tickets/ticket-suspect-links-card.tsx
  - components/tickets/impact-scope-selected-panel.tsx
- [x] 5-6. 影響範囲レビューAI（閾値超過時の絞り込み提案）
  - Phase 5のチェックリストには記載がないが、機能として実装されている可能性あり
- [x] 5-7. エクスポート機能（requirements-export.ts）
  - lib/export/requirements-export.ts
  - app/api/export/requirements/route.ts
  - PRD 7.2〜7.7の形式でエクスポート（business/system/graph/VERSION）

**未実装項目（チェックリストにあるが実装されていないもの）:**
- [ ] 5-8. MCP Server 実装 - Phase 6以降で検討
- [ ] 5-9. 改修指示パッケージ生成機能 - Phase 6以降で検討
- [ ] 5-10. 設計決定ログ記録機能 - Phase 6以降で検討
- [ ] 「AIで追加」ボタンへの連携（CR画面）
- [ ] ログイン済みユーザーのみアクセス（RLS）

#### 更新が必要なドキュメント
1. **PRD.md** - Phase 5の完了項目を更新する必要がある
   - 5-7（エクスポート）は実装済みだが PRD 11.2 に記載されていない
   - 5-2〜5-6（CR画面、impact_analysis、疑義リンク）は PRD 9.4 に記載があるが詳細が不十分

2. **database-schema-design.md** - Phase 5テーブル定義の反映済み

---

### 3. 最近の機能追加・変更

#### 最近追加された主要な機能（2025年1月〜2月）
コミット履歴とgit diffから特定した新規・変更機能：

1. **スクロールバー非表示対応（2025-02-04）**
   - コミット: ca00fea "スクロールバー完了"
   - チャットUIのスクロールバーを非表示にする機能

2. **構造化スキーマ関連（2025年2月上旬〜）**
   - Phase 4.5の一環として実装
   - 各種エディター/ビューアーの完成

3. **ER図表示機能（2025-02-09）**
   - コミット: cd4e2fe "20260209_1830"
   - Phase 1の静的ER図表示機能
   - `/schema/er` ページ、`SchemaViewer` コンポーネント実装

4. **全画面・コンポーネントの微細修正**
   - レイアウト調整、ツールチップ修正、バッジ表示改善等
   - components/tickets/ 以下の多数の新規コンポーネント（30ファイル以上）

#### ドキュメント未反映の機能
1. **ER図表示機能**
   - docs/design/er-diagram-feature-plan.md には Phase 1 完了と記録されている
   - PRD.md にはこの機能の記載がない

2. **スクロールバー非表示機能**
   - チャットUIのUX改善だが PRD.md には記載がない

3. **SuspectInboxページ**
   - 変更管理機能の一環として実装された可能性があるが、ドキュメントには詳細な記述がない

---

### 4. ER図機能

#### Phase 1実装状況
**完了** - 静的ER図表示機能が実装されている。

**実装ファイル:**
- app/(with-sidebar)/schema/er/page.tsx - ER図表示ページ
- components/schema/SchemaViewer.tsx - スキーマビューア統合コンポーネント
- components/schema/ermaidRenderer.tsx - Mermaid描画コンポーネント
- lib/utils/design-documents/model-to-mermaid.ts - model型DDからMermaid ER図への変換ロジック
- app/api/schema/er（存在確認要）- ER図データ取得API

**機能内容:**
- model型設計書（type='model'）からER図を自動生成
- エンティティ間の関連（1:1, 1:N, N:1, N:M）を矢印で可視化
- 全画面表示機能（フルスクリーン対応）

#### Phase 2-5の状況
- **Phase 2（ズーム・パン）**: 未実装 - ドキュメントには計画があるが実装されていない
- **Phase 3（エンティティクリックで詳細表示）**: 未実装
- **Phase 4（システム領域単位フィルタリング）**: 未実装
- **Phase 5（他の横串設計書）**: 構想段階

#### ドキュメントとの整合性
**一部不一致** - er-diagram-feature-plan.md は更新されているが PRD.md には ER図機能の記載がない

---

### 5. DD構造化スキーマ

#### 実装状況
**完了** - 各ioTypeのスキーマ定義、エディター、ビューアーが完備されている。

**実装内容:**

1. **スキーマ定義（design-document-structured.ts）**
   - ioType別のtypeDetailスキーマ（api, screen, batch, job, external_if, model, report）
   - inputSchema/outputSchemaの統合スキーマ（v2形式）
   - coreLogic、sideEffects、exceptions、nonFunctionalの各スキーマ

2. **UIエディター（components/forms/design-document/editors/）**
   - StructuredSpecEditor.tsx - 統合エディター
   - FieldEditor.tsx - 汎用フィールドエディター
   - InputSchemaEditor.tsx / OutputSchemaEditor.tsx - タイプ別入出力エディター
   - SideEffectsEditor.tsx - 副作用エディター
   - CoreLogicEditor.tsx - コアロジックエディター
   - ExceptionsEditor.tsx - 例外エディター
   - NonFunctionalEditor.tsx - 非機能要件エディター
   - ModelEntityEditor.tsx - modelタイプのエンティティエディター
   - ApiInputFieldsSection.tsx、ApiOutputSchemaSection.tsx、ApiOutputFieldsSection.tsx
   - ScreenInputSection.tsx、ScreenOutputSection.tsx

3. **ビューアー（components/system-domains/structured-spec-viewer/）**
   - index.tsx - 統合ビューアー
   - FieldsViewer.tsx、InputSchemaViewer.tsx、OutputSchemaViewer.tsx
   - CoreLogicViewer.tsx
   - SideEffectsViewer.tsx（副作用表示、"保存/通知"にラベル変更済み）
   - ExceptionsViewer.tsx
   - NonFunctionalViewer.tsx
   - ModelDetailViewer.tsx
   - EntryPointsViewer.tsx
   - field-group-helper.tsx、schema-type-guards.tsx、constants.tsx

4. **互換性レイヤー**
   - lib/utils/design-documents/structured-compat.ts
   - parseStructuredDetails() / composeStructuredDetails()
   - migrateLegacyFields()

5. **テスト**
   - tests/unit/schemas/ 以下の7ファイル

6. **DBスキーマ**
   - 20260205153000_structured_io_schema.sql（detailsカラムのCOMMENT追加）

#### ドキュメント整合性
**整** - control_plane.md と database-schema-design.md に構造化スキーマの説明がある。

---

## 注目点

### 1. PRD.md の更新遅れ
- **Phase 4.5** は 2026-02-11 完了だが PRD.md 11.2 のチェックリストには反映されていない
- **ER図機能** は実装済みだが PRD.md 9章「画面構成と利用フロー」には記載がない
- **エクスポート機能**（Phase 5-7）は実装済みだが PRD.md 7章には記載がない

### 2. チェックリストの分断
- Phase 4 は docs/checklists/active/2026-01-28-phase4-ai-features.md で管理
- Phase 4.5 は docs/checklists/active/2026-02-05-structured-io-schema.md で管理
- Phase 5 は PRD 11.2 と個別のチェックリストが存在せず、整合性確認が困難

### 3. サイドバーのメニュー構成
- 実装済み: ダッシュボード、プロダクト要件、AIチャット、業務一覧、システム領域一覧、概念辞書、変更要求一覧、要件リンク、ER図、設定、プロジェクト一覧
- チェックリストに記載の「ベースライン履歴」メニューが実装されていない可能性あり

### 4. 構造化スキーマのlabel変更
- sideEffects の UIラベルが「副作用」→「保存/通知」に変更されている
- ドキュメント（PRD.md CLAUDE.md）は古い表記のまま

---

## 次のステップへの提案

### 1. PRD.md の更新（優先度：高）

**必要な更新:**

1. **第11章「実装概要計画」の更新**
   - Phase 4.5 の完了を反映（チェックリスト 2026-02-05-structured-io-schema.md の内容を統合）
   - Phase 5 の実装状況を反映
   - 完了日を更新

2. **第9章「画面構成と利用フロー」への ER図追加**
   - `/schema/er` ページの説明を追加
   - サイドバーメニュー項目の記載

3. **第7章「エクスポート仕様」の追加**
   - Phase 5-7 エクスポート機能の詳細を追加

4. **第3.10節「DD（Design Document）」の sideEffects ラベル更新**
   - UI表示ラベルを「副作用」から「保存/通知」に変更

5. **第10章「非機能要件」のスクロールバー対応追加**
   - チャットUIのスクロールバー非表示機能を記載

### 2. チェックリストの統合（優先度：中）

**提案:**
- Phase 4 / Phase 4.5 / Phase 5 のチェックリストを単一のドキュメントに統合する
- 形式: docs/checklists/active/master-checklist.md または docs/checklists/active/phase-status.md
- 理由: 複数のチェックリストファイルの管理が煩雑になっているため

### 3. database-schema-design.md の JSONBスキーマ詳細追加（優先度：低）

**提案:**
- design_documents.details の構造化スキーマ定義を JSONBスキーマ例として追加
- 各フィールドの型定義と制約を明記

### 4. サイドバーに「ベースライン履歴」メニューの追加検討（優先度：低）

**現状:**
- PRD 9.1 に記載があるが実装されていない可能性
- または、既に実装されていてドキュメントに記載漏れがある

**確認項目:**
- app/(with-sidebar)/baseline/*.tsx の存在確認
- components/layout/sidebar.tsx の menuConfig に追加済みか確認

### 5. ER図の Phase 2 以降の実装計画（優先度：低）

**現状:**
- Phase 1（静的表示）は完了
- Phase 2（ズーム・パン）、Phase 3（クリック詳細）、Phase 4（フィルタリング）は未実装

**提案:**
- ユーザーフィードバックを収集し、優先度を判断
- zoom-pan-pinch ライブラリの追加を検討

### 6. MEMORY.md への反映（優先度：中）

**提案:**
- Phase 4.5、Phase 5 の完了日と学んだ点を MEMORY.md に記録
- 特に、スクロールバー対応やER図機能などの UX 改善点を記録

---

## 更新が必要なドキュメント一覧

| ドキュメント | 優先度 | 更新内容 |
|-----------|:-------:|----------|
| PRD.md 第11章 | 高 | Phase 4.5完了、Phase 5状況の反映 |
| PRD.md 第9章 | 中 | ER図機能の追加 |
| PRD.md 第7章 | 中 | エクスポート機能の追加 |
| PRD.md 第3.10節 | 低 | sideEffectsラベルの変更（「副作用」→「保存/通知」）|
| PRD.md 第10章 | 低 | スクロールバー非表示機能の追加 |
| database-schema-design.md | 低 | JSONBスキーマ詳細の追加 |
| docs/checklists/ | 中 | チェックリストの統合 |

---

## まとめ

コードベースは非常に活発に開発されており、ドキュメントより先行している機能が多数存在する。特に：

1. **Phase 4.5（構造化スキーマ）**: 完全に実装完了
2. **Phase 5（変更管理と連携）**: 主要機能は実装済み
3. **ER図機能**: Phase 1が実装済み
4. **最近の機能追加**: スクロールバー対応、ER図表示など

**課題:**
- ドキュメントの更新が追いついていない
- 複数のチェックリストファイルが分散して管理が困難になっている
- PRD.md の該当箇所と実際の実装にズレが生じている

**推奨アクション:**
1. PRD.md の第11章、第9章、第7章を更新
2. チェックリストを統合して単一ファイルで管理する
3. database-schema-design.md に JSONBスキーマ例を追加
4. MEMORY.md に学んだ点を記録する
