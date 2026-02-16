# ドキュメント一括最新化計画

## コンテキスト

2026-02-07〜2026-02-09の期間で、以下の主要機能が実装された：
- **Phase 4.5 構造化I/Oスキーマ**: DDの入出力定義をテキスト自由記述から構造化Zodスキーマに移行
- **ER図表示機能 Phase 1**: ドメインモデルのER図静的表示
- **システム機能画面リファクタリング**: URL構造の簡素化（`/system-domains` → `/system`）
- **AIチャット改善**: ドラフト編集機能の追加

これらの実装完了に伴い、関連ドキュメントを最新化する。

---

## 更新対象ドキュメント一覧

### 1. PRD.md

| 更新内容 | 現在 | 更新後 |
|---------|--------|--------|
| Phase 4.5 ステータス | 実装中（4.5-8以降未完了） | ✅ 実装完了 |
| ER図機能 | 未記載 | 追加（9章画面構成または10章以降） |
| システム機能画面URL | `/system-domains/...` | `/system/...` に修正 |

### 2. database-schema-design.md

| 更新内容 | 現在 | 更新後 |
|---------|--------|--------|
| 変更履歴 | 2026-02-09まで記載あり | 最新の変更を確認し、必要に応じて追記 |

### 3. er-diagram-feature-plan.md

| 更新内容 | 現在 | 更新後 |
|---------|--------|--------|
| Phase 1 ステータス | 🔜 将来実装 | ✅ 実装完了（2026-02-09） |
| 更新履歴 | なし | 追加 |

### 4. チェックリストファイル

| ファイル | アクション |
|---------|-----------|
| `docs/checklists/active/2026-02-05-structured-io-schema.md` | 未完了項目を確認し、完了に更新 |
| 完了したチェックリスト | `docs/checklists/completed/` へ移動 |

---

## 実装手順

### Step 1: PRD.md の更新

```bash
# ファイルパス
docs/PRD.md
```

**更新箇所:**
1. Phase 4.5 のチェックリスト項目（4.5-1〜4.5-7）を ✅ に更新
2. Phase 4.5-8〜4.5-10 は「未実装」のまま残す（UI/フォーム更新は別途）
3. 9章画面構成にER図ページの記載を追加
4. システム機能画面のURLを `/system/...` に修正

### Step 2: database-schema-design.md の確認

```bash
# ファイルパス
docs/design/database-schema-design.md
```

**更新箇所:**
- 変更履歴が最新（2026-02-09）まで記載されているか確認
- key_label_mappings テーブルが反映されているか確認

### Step 3: er-diagram-feature-plan.md の更新

```bash
# ファイルパス
docs/design/er-diagram-feature-plan.md
```

**更新箇所:**
1. Phase 1 のステータスを「✅ 実装完了（2026-02-09）」に更新
2. 更新履歴に以下を追加：
   ```markdown
   | 日付 | Phase | 内容 |
   |------|-------|------|
   | 2026-02-09 | Phase 1 | 実装完了。静的ER図表示機能をリリース |
   ```

### Step 4: チェックリストの更新

```bash
# ファイルパス
docs/checklists/active/2026-02-05-structured-io-schema.md
```

**更新箇所:**
1. 4.5-1〜4.5-7 を `- [x]` に更新
2. 4.5-8〜4.5-10 は `- [ ]` のまま残す

```bash
# 完了したチェックリストの移動
mv docs/checklists/active/2026-02-05-structured-io-schema.md docs/checklists/completed/
```

---

## 検証方法

1. **PRD.md**: Phase 4.5 のステータスが「実装完了」となっているか
2. **er-diagram-feature-plan.md**: Phase 1 が完了マークになっているか
3. **URL記載**: システム機能画面のURLが `/system/...` に修正されているか
4. **チェックリスト**: 完了済みファイルが `completed/` に移動されているか

---

## 参考ファイル

- `docs/PRD.md` - 製品要件定義書
- `docs/design/database-schema-design.md` - DBスキーマ設計書
- `docs/design/er-diagram-feature-plan.md` - ER図機能の段階的発展計画
- `docs/checklists/active/2026-02-05-structured-io-schema.md` - Phase 4.5チェックリスト
