# DeepExplore 調査結果サマリー

## 調査対象
BTを登録した直後に同じチャットスレッドでBR草案を作成しようとすると「業務タスクが見つかりません」エラーが発生する問題。

## 調査観点と結果

### 観点1: brDraftToolのBT検索ロジック

**結論**: `brDraftTool`は`btId`パラメータでDBの`business_tasks`テーブルを`id`カラムで検索しているが、AIエージェントが渡す`btId`の形式が正しくない可能性が高い。

**詳細**:
- `brDraftTool`は`btId`を受け取り、DBの`business_tasks.id`を検索する（38行目）
```typescript
const { data: bt } = await supabase
  .from('business_tasks')
  .select('code, name')
  .eq('id', btId)  // ← idカラムで完全一致検索
  .single();
```
- 検索結果がなければ「業務タスクが見つかりません」エラーを投げる（42行目）
- ワーキングメモリからの取得ロジックは存在しない（DBのみ参照）

**関連ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/tools/br-draft.ts:35-43`

### 観点2: BT登録とワーキングメモリ更新フロー

**結論**: BT登録後、ワーキングメモリの自動更新機能は実装されていない。コードレベルでの連携は期待されているが未実装。

**詳細**:
- `commitDraftTool`はDBに登録するが、ワーキングメモリを更新しない
- Mastraのワーキングメモリスキーマ（`WorkingMemorySchema`）には`committedItems`リストがあるが、`commitDraftTool`から更新されない
- ドキュメント（`plans/compiled-snuggling-flamingo.md`）には「updateWorkingMemoryツール」が記載されているが、実際にはツール一覧に存在しない
- BTはDBに即座に登録されるため、登録直後でもDB検索で見つかるはず

**関連ファイル**:
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/tools/commit-draft.ts:155-177`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/memory/working-memory-schema.ts`

### 観点3: BT ID形式とマッチングロジック

**結論**: BTのIDは`BT-{AREA}-{NNNN}`形式（例: `BT-GL-0010`）で、DBの`id`カラムにそのまま格納される。完全一致検索のため、形式が異なるとマッチしない。

**詳細**:
- ID生成ルール（`getNextBtId`関数）: `BT-${area}-${seq}` 形式
- DBの`business_tasks.id`カラムはテキスト型で、このコードがそのまま格納される
- `brDraftTool`の検索: `.eq('id', btId)` で完全一致
- **重要**: AIエージェントがBT IDではなく別の値（例えばUUID）を渡している可能性

**関連ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/utils/id-rules.ts:85-100`

### 観点4: チャットコンテキストでのBT情報の伝播

**結論**: AIエージェントは会話履歴からBT情報を推測するが、`brDraftTool`に渡す`btId`の特定方法が曖昧で、誤ったIDを渡している可能性が高い。

**詳細**:
- チャットAPIはMastra Memoryの`lastMessages: 20`で直近20メッセージを保持
- エージェントの指示文に「btId」の取得方法が明示されていない
- `btDraftTool`の成功レスポンスには`btDraft.code`（例: `BT-GL-0010`）が含まれる
- しかし、エージェントは`brDraftTool`呼び出し時に、この`code`を正しく`btId`として渡すとは限らない
- エラーメッセージ「BT-GL-0010が見つからない」→ BT-GL-0010で検索しているなら、DB登録タイミングの問題か

**関連ファイル**:
- `/usr/local/src/dev/wsl/personal-pj/req-manager/app/api/chat/route.ts:129-136`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/agents/requirements-agent.ts:122-127`

## 横断的な発見

### 根本原因の推定

**最も可能性が高い原因**: AIエージェントが`brDraftTool`に渡す`btId`が、DB登録済みの`id`と一致していない。

考えられるシナリオ:

1. **DB登録の非同期タイミング問題**
   - `commitDraftTool`がBTを登録した直後、DBへの書き込みが完了する前に`brDraftTool`が呼ばれている可能性
   - しかし、Supabaseのupsertはawaitしているため、これは考えにくい

2. **AIエージェントのID混同** (最有力)
   - `btDraftTool`の出力は`btDraft.code`に`BT-GL-0010`を含む
   - `commitDraftTool`への入力は`content.code`に同じ値を含む
   - AIエージェントが会話履歴からBT IDを抽出する際に、別の値（例えば`bdId`の`GL`や、draft生成時の仮ID）を使用している可能性

3. **brDraftToolの呼び出し前にcommitDraftToolが完了していない** (可能性あり)
   - AIエージェントがBT草案作成→確認→登録→BR草案作成の流れを一気に進めた場合
   - `commitDraftTool`の完了を待たずに`brDraftTool`を呼び出している可能性

### 注目点

1. `brDraftTool`のエラーメッセージが`BT-GL-0010が見つからない`であれば、ID形式は正しい
2. DBに本当に登録されているか確認する必要がある（チャットログだけでは判断できない）
3. `requirements-agent.ts`のinstructionsにBR登録時のBT ID取得方法が明記されていない

## 次のステップへの提案

- [x] 追加調査が必要（観点: 実際のDBデータとエージェントのツール呼び出しログ）
- [ ] バグ修正へ直進可能

**推奨アクション**:

### 1. デバッグ情報の追加（短期対応）
`brDraftTool`に受け取った`btId`をログ出力し、実際に何が渡されているか確認する:

```typescript
// br-draft.ts の execute 冒頭に追加
console.log('[br_draft] Input:', { btId, naturalLanguageInput });
```

### 2. エージェントのインストラクション改善（中期対応）
`requirements-agent.ts`のinstructionsに、BR登録時のBT ID取得ルールを明記する:

```
### 業務要件（BR）登録を依頼された場合
1. **BT IDの確認（重要）:**
   - 直前にBTを登録した場合: commitDraftToolの結果から返されたID（例: BT-GL-0010）を使用
   - BTが既に存在する場合: ユーザーに確認するか、searchRequirementsToolで検索
2. brDraftToolを呼び出す際、btIdには必ず「BT-{AREA}-{NNNN}」形式のIDを指定する
```

### 3. BTのID補完機能（長期対応）
`brDraftTool`に部分一致検索またはエリアコードからの推測機能を追加:

```typescript
// btIdがBTで始まらない場合、エリアコードとして解釈
if (!btId.startsWith('BT-')) {
  const { data: bts } = await supabase
    .from('business_tasks')
    .select('id')
    .ilike('id', `BT-${btId}-%`)
    .limit(1);
  if (bts?.[0]) btId = bts[0].id;
}
```

---

## 修正難易度

難易度: ★★☆
根拠: 2 files, 30-50 lines, 2 components（brDraftTool + requirements-agent）
リスク: エージェントの挙動変更によりBR登録フロー全体に影響する可能性
