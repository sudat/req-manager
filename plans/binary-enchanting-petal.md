# BT登録確定機能の修正プラン

## 問題の概要

AIチャットでBT（業務タスク）を登録する際、草案生成は成功するが「登録して」と言っても確定処理が実行されない。

### 根本原因

エージェントの **instructions** に「草案確定フロー」の指示が欠けている：
- 「登録してほしい」「作成してほしい」→ 草案**作成**のTool呼び出し指示はある（L134）
- 「確定して」「登録して」→ **commitDraftTool** を呼ぶ指示が**ない**

### サーバーログの謎

「登録して」の時にツール呼び出しログが出ないのは、エージェントが「何を呼べばいいか分からない」状態だったため。

---

## 修正内容

### 対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `lib/mastra/agents/requirements-agent.ts` | instructions に草案確定フローを追加 |

### 修正詳細

**requirements-agent.ts** の instructions に以下のセクションを追加する（L127付近、システム要件生成の後）：

```markdown
### 草案の確定を依頼された場合（「登録して」「確定して」「コミットして」など）
1. Working MemoryのactiveDraftsから対象の草案を確認する
2. 草案がある場合、**commitDraftTool**を呼び出す：
   - draftId: activeDrafts[].id（なければ "draft-" + type + "-" + Date.now()）
   - type: activeDrafts[].type（例: 'bt'）
   - content: activeDrafts[].content（草案の全データ）
3. 成功したら**updateWorkingMemory**を呼び出す：
   - activeDraftsをクリア（null）
   - committedItemsに追加
4. ユーザーに結果を報告する
5. 草案がない場合は「確定する草案がありません」と伝える

**重要**: contentには草案の全データを渡すこと。btの場合は以下のフィールドが必要：
- business_domain_id, project_id, code, name, summary, businessContext, processSteps, input, output
```

---

## 難易度

```
難易度: ★☆☆
根拠: 1 file, ~30 lines, 0 components
リスク: instructions の追加のみで既存機能への影響なし
```

---

## 検証方法

1. **開発サーバー起動**: `bun run dev`
2. **AIチャットでBT登録フローをテスト**:
   - 「業務タスクを登録したいです」→ 業務領域検索
   - 「月次残高照合を追加したい」→ 草案生成
   - 「OKです」→ 草案確認
   - 「登録して」→ **commitDraftTool が呼ばれることを確認**
3. **サーバーログで確認**: `[commit_draft]` のログが出力されること
4. **Supabaseで確認**: `business_tasks` テーブルにレコードが追加されること

---

## 実装手順

1. `requirements-agent.ts` の instructions に草案確定フローのセクションを追加
2. 開発サーバーで動作確認
3. 必要に応じてログを追加して検証
