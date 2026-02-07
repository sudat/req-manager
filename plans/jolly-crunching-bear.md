# 草案インライン編集機能

## Context

チャット機能のAI生成草案（BT/BR/SF/SR/DD）は現在「確定 or 却下して再生成」の2択。
ユーザーが草案を微修正してから確定できるよう、草案プレビューカード内にインライン編集機能を追加する。

```
難易度: ★★☆
根拠: 新規3 + 修正8 files, ~650 lines, チャットUI内で完結
リスク: ストリーミング中の編集競合（→ 編集ボタンを非表示で対処）
```

---

## 方針

- 各草案カードに **読取モード ↔ 編集モード** のトグルを追加
- 共通フック `useDraftEdit<T>` で状態管理を一元化（DRY）
- 編集→保存でメッセージ内のdraftデータを更新、その後の確定フローは既存を流用
- 複雑フィールド（processSteps, AC, entryPoints）もインライン編集可能
- 既存のYAML系コンポーネントはインターフェースが異なるため、ネイティブ配列で動く軽量エディタを新規作成

---

## 実装チェックリスト

### Phase 1: 共通基盤（新規3ファイル）

- [ ] 1-1. `hooks/use-draft-edit.ts` — 汎用編集フック
  - `useDraftEdit<T>(draft, onSave)` → `{ isEditing, editingDraft, startEdit, cancelEdit, saveEdit, updateField }`
  - startEdit: draftのコピーを作成、編集モードON
  - cancelEdit: 元に戻す、編集モードOFF
  - saveEdit: onSave(editedDraft)呼出、編集モードOFF
  - updateField: 単一フィールド更新

- [ ] 1-2. `components/ai-chat/draft-info-row.tsx` — 読取/編集兼用の情報行
  - Props: `{ label, value, isEditing?, onChange?, multiline?, readOnly? }`
  - 読取モード: 既存の InfoRow と同じ表示
  - 編集モード: `Input` or `Textarea` を表示（readOnlyの場合はグレーアウト表示）
  - 5カードで重複していた InfoRow を統一（DRY）

- [ ] 1-3. `components/ai-chat/draft-edit-fields.tsx` — 配列フィールドのインラインエディタ
  - `ProcessStepsEditor`: `{when, who, action}[]` を直接編集（行追加/削除/編集）
  - `KeySourceEditor`: `{name, source}[]` を直接編集
  - `AcDraftEditor`: `AcDraft[]` を直接編集（各ACのgiven/when/then）
  - 既存の ProcessStepsField/KeySourceListField はYAMLインターフェースのため、ネイティブ配列版を新規作成
  - UI構造は既存コンポーネント（grid + Input + 追加/削除ボタン）を踏襲

### Phase 2: 草案カード修正（既存5ファイル修正、簡単→複雑の順）

- [ ] 2-1. `components/ai-chat/br-draft-preview-card.tsx`（BR — 最もシンプル）
  - 新Props: `onUpdateDraft?: (updated: BrDraft) => void`
  - 編集対象: requirement (Textarea), rationale (Textarea)
  - 読取専用: code, business_task_id
  - [編集]ボタン: commitState が success/loading 以外 かつ isCommitted でない場合に表示
  - InfoRow → DraftInfoRow に置換

- [ ] 2-2. `components/ai-chat/sf-draft-card.tsx`（SF — シンプル）
  - 新Props: `onUpdateDraft?: (updated: SfDraft) => void`
  - 編集対象: name (Input), description (Textarea)
  - 読取専用: code, system_domain_id, srs（ネストSRは別カードで編集）
  - InfoRow → DraftInfoRow に置換

- [ ] 2-3. `components/ai-chat/draft-preview-card.tsx`（BT — 中複雑度）
  - 新Props: `onUpdateDraft?: (updated: BtDraft) => void`
  - 編集対象: name (Input), summary (Textarea), businessContext (Textarea)
  - 編集対象（配列）: processSteps → ProcessStepsEditor, input → KeySourceEditor, output → KeySourceEditor
  - 読取専用: code
  - InfoRow → DraftInfoRow に置換

- [ ] 2-4. `components/ai-chat/sr-draft-card.tsx`（SR — 中〜高複雑度）
  - 新Props: `onUpdateDraft?: (updated: SrDraft) => void`
  - 編集対象: title (Input), summary (Textarea), type (Input), rationale (Textarea)
  - 編集対象（配列）: acs → AcDraftEditor
  - 読取専用: code, task_id, srf_ids
  - InfoRow → DraftInfoRow に置換

- [ ] 2-5. `components/ai-chat/dd-draft-card.tsx`（DD — 中〜高複雑度）
  - 新Props: `onUpdateDraft?: (updated: DdDraft) => void`
  - 編集対象: name (Input), type (Select/DdType), summary (Textarea), designPolicy (Textarea)
  - 編集対象（配列）: entryPoints → 既存 EntryPointsInlineEditor を再利用
  - 編集対象（YAML）: details → Textarea (YAML文字列編集、保存時にパース)
  - 読取専用: id, code, srfId

### Phase 3: 状態管理の接続（既存3ファイル修正）

- [ ] 3-1. `components/ai-chat/chat-container.tsx`
  - `handleUpdateDraft` コールバック追加
  - messages stateのdraftを直接更新（messageId + type + code で特定）
  - ChatMessages に `onUpdateDraft` prop を追加

- [ ] 3-2. `components/ai-chat/chat-messages.tsx`
  - `onUpdateDraft` prop をスルーパス

- [ ] 3-3. `components/ai-chat/message-bubble.tsx`
  - 新Props: `onUpdateDraft?: (payload: DraftUpdatePayload) => void`
  - 各草案カードに `onUpdateDraft` を接続（messageId/type/codeでラップ）
  - ストリーミング中（`message.isStreaming`）は onUpdateDraft を undefined にして編集を抑制

### Phase 4: テスト

- [ ] 4-1. `hooks/__tests__/use-draft-edit.test.ts` — useDraftEditフックのユニットテスト
  - startEdit/cancelEdit/saveEdit/updateField の動作確認
- [ ] 4-2. draft-edit-fields の動作確認 — ProcessStepsEditor, KeySourceEditor, AcDraftEditor の行追加/削除/編集

---

## 主要ファイル一覧

| ファイル | 操作 | 概要 |
|---------|------|------|
| `hooks/use-draft-edit.ts` | 新規 | 汎用編集フック |
| `components/ai-chat/draft-info-row.tsx` | 新規 | 読取/編集兼用InfoRow |
| `components/ai-chat/draft-edit-fields.tsx` | 新規 | 配列フィールドエディタ群 |
| `components/ai-chat/br-draft-preview-card.tsx` | 修正 | BR草案カード |
| `components/ai-chat/sf-draft-card.tsx` | 修正 | SF草案カード |
| `components/ai-chat/draft-preview-card.tsx` | 修正 | BT草案カード |
| `components/ai-chat/sr-draft-card.tsx` | 修正 | SR草案カード |
| `components/ai-chat/dd-draft-card.tsx` | 修正 | DD草案カード |
| `components/ai-chat/chat-container.tsx` | 修正 | ドラフト更新コールバック追加 |
| `components/ai-chat/chat-messages.tsx` | 修正 | props スルーパス |
| `components/ai-chat/message-bubble.tsx` | 修正 | カードへの接続 |
| `hooks/__tests__/use-draft-edit.test.ts` | 新規 | フックテスト |

## 再利用する既存コンポーネント

- `components/ui/input.tsx`, `components/ui/textarea.tsx` — フォーム要素
- `components/ui/button.tsx` — 編集/保存/キャンセルボタン
- `components/forms/entry-points/EntryPointsInlineEditor.tsx` — DD用エントリポイントエディタ
- `lib/domain/enums.ts` — DdType enum（Select選択肢）

## データフロー

```
ChatContainer
  ├─ handleUpdateDraft(payload) → setMessages(msg.draft = edited)
  └─ ChatMessages
       └─ MessageBubble
            ├─ onUpdateDraft を各カードに接続
            └─ DraftCard
                 ├─ useDraftEdit(draft, onUpdateDraft)
                 ├─ [編集] → startEdit → 編集モード
                 ├─ [保存] → saveEdit → onUpdateDraft → messages更新
                 ├─ [キャンセル] → cancelEdit → 元に戻す
                 └─ [登録する] → onCommitDraft（既存フロー、編集後のdraftを送信）
```

## エッジケース対策

| ケース | 対策 |
|--------|------|
| ストリーミング中の編集 | `message.isStreaming` 時は [編集] ボタン非表示 |
| コミット中の編集 | `commitState.status === 'loading'` 時は [編集] 非表示 |
| 確定済みの編集 | `isCommitted` or `status === 'success'` 時は [編集] 非表示 |
| 編集中のキャンセル | useDraftEdit が元のdraftを復元 |
| 配列のシャローコピー | updateField で配列を丸ごと置換（既存参照を壊さない） |

## 検証方法

1. `bun test` — useDraftEdit フックのユニットテスト
2. 手動検証: チャットでBT草案を生成 → [編集] → フィールド変更 → [保存] → [登録する] → DB反映確認
3. ストリーミング中に [編集] ボタンが非表示であることを確認
4. [キャンセル] で変更が元に戻ることを確認
