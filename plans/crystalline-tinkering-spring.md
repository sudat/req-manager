# 設計書の整理計画

## Context

`docs/design/` 配下の設計書を棚卸しした結果、1件の陳腐化、1件の命名問題、1件の暗黙知の未文書化を検出した。
設計書の信頼性向上と管理負荷低減を目的として、以下3つのアクションを実施する。

## 対象ファイル

| # | アクション | 対象ファイル | 備考 |
|---|-----------|-------------|------|
| 1 | 削除 | `docs/design/crud-persistence-design.md` | コードと乖離。`lib/data/crud-factory.ts`が実質的な設計書 |
| 2 | 改名 | `docs/design/schema.md` → `docs/design/er-diagram-feature-plan.md` | DB schemaと紛らわしい名前を修正 |
| 3 | 追記 | `docs/design/database-schema-design.md` | ID採番規約セクションを追加 |

## 手順

### Step 1: crud-persistence-design.md を削除
- `docs/design/crud-persistence-design.md` を削除する
- 他ファイルからの参照がないことは確認済み（grepで未検出）

### Step 2: schema.md を改名
- `docs/design/schema.md` → `docs/design/er-diagram-feature-plan.md`
- CLAUDE.md の `@docs/design/schema.md` 参照を更新する

### Step 3: database-schema-design.md にID採番規約を追記
- 「基本方針」セクションの直後に「ID採番規約」セクションを追加
- 内容: 各エンティティのIDフォーマット、採番元ファイルへのリンク

追記内容（案）:
```markdown
## ID採番規約

全エンティティのIDはアプリ側で生成する。採番ロジックは `lib/data/id.ts` および `lib/utils/id-rules.ts` に集約。

| エンティティ | フォーマット | 例 |
|-------------|-------------|-----|
| 業務タスク (BT) | `BT-{AREA}-{NNNN}` | BT-AR-0001 |
| 業務要件 (BR) | `BR-{AREA}-{TASK_NUM}-{SEQ}` | BR-AR-0001-0001 |
| システム機能 (SF) | `SF-{AREA}-{NNNN}` | SF-AR-0001 |
| システム要件 (SR) | `SR-{AREA}-{TASK_NUM}-{SEQ}` | SR-AR-0001-0001 |
| 設計書 (DD) | `DD-{NNN}` | DD-001 |
| 受入条件 (AC) | `AC-{NNN}` | AC-001 |
| 概念 (C) | `C{NNN}` | C001 |
| 変更要求 (CR) | `CR-{NNN}` | CR-001 |
| 製品要件 (PR) | `PR` (固定、プロジェクトにつき1件) | PR |

- `{AREA}`: 業務領域コード（AR/AP/GL等）
- `{NNNN}`: 0埋め4桁の連番
- `{SEQ}`: 0埋め4桁のシーケンス番号
- 採番は各テーブルの既存最大番号 + 1 で行う
```

## 検証
- CLAUDE.md のリンクが正しいことを確認
- `database-schema-design.md` のMarkdownが崩れていないことを確認
