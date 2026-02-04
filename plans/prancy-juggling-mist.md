# code-simplify: chat-container.tsx (679行 → ~110行)

## 難易度

```
難易度: ★★☆
根拠: 6 files, ~250 lines changes, 4 new modules
リスク: hook間の依存順序(threadId循環回避), localStorage保存形式の互換性維持
```

---

## 目標・原則

| 原則 | 適用内容 |
|------|----------|
| DRY | localStorage操作を既存 `lib/utils/local-storage.ts` に統一 |
| KISS | 各責務を単一フック/コンポーネントに分離。過度な抽象化なし |
| 一貫性 | プロジェクト既存28フック構成と同じパターンに揃える |

---

## 変更ファイル一覧

| # | ファイル | 操作 | 役割 |
|---|---------|------|------|
| 1 | `components/ai-chat/types.ts` | 修正 | `ThreadSummary` 型を追加 |
| 2 | `hooks/use-chat-persistence.ts` | **新規** | スレッド＋メッセージの永続化（最大削減） |
| 3 | `hooks/use-draft-commit.ts` | **新規** | ドラフトコミットAPI＋状態 |
| 4 | `hooks/use-concept-management.ts` | **新規** | 概念候補の状態＋アクション |
| 5 | `components/ai-chat/thread-history-panel.tsx` | **新規** | 履歴サイドバーパネルUI |
| 6 | `components/ai-chat/chat-container.tsx` | 修正 | 抽出後の簡潔版（~110行） |

---

## 設計決定事項（要点3つ）

### ① threadId の循環依存を断つ方法
```
useStreamingChat は threadId を受け取る（引数）
  ↓
useChatPersistence は messages/setMessages を受け取る（引数）
```
→ `threadId` は **container で useState 管理**。`initThreadId()` を persistence ファイルからエクスポートして useState 初期化関数として使用。

### ② localStorage 保存形式の互換性
| データ | 現在の保存方法 | リファクタ後 | 理由 |
|--------|--------------|-------------|------|
| threadIdポインタ | `setItem(key, rawString)` | **そのまま** | 既存データとの互換性 |
| threads一覧 | `setItem(key, JSON.stringify(...))` | `saveToStorage()` 使用 | 同じJSON形式 |
| messages | `setItem(key, JSON.stringify(serialized))` | `saveToStorage()` 使用 | 同じJSON形式 |

### ③ Hook呼び出し順序（React Rules of Hooks に従う）
```
1. useProject()                          ← context
2. useState(threadId)                    ← initThreadId で初期化
3. useState(reasoningEffort)
4. useState(isHistoryOpen)
5. useConceptManagement({ projectId })   ← candidates/setCandidates を得る
6. useStreamingChat({ ..., onConceptCandidates: concept.setCandidates })
7. useChatPersistence({ ..., messages, setMessages })
8. useDraftCommit({ setMessages })
```

---

## 各モジュールの詳細

### [1] `types.ts` — ThreadSummary 追加

末尾に追加：
```typescript
/** スレッド履歴サマリ */
export type ThreadSummary = {
  threadId: string;
  title: string;
  updatedAt: string; // ISO 8601
  contextKey: string;
};
```

---

### [2] `hooks/use-chat-persistence.ts` — 永続化フック

**移動元（chat-container.tsx から抽出）:**
- `CHAT_STORAGE_PREFIX` 定数
- `SerializedChatMessage` 型
- `buildContextKey` / `getThreadIdStorageKey` / `getMessagesStorageKey` / `getThreadsStorageKey`
- `serializeMessages` / `deserializeMessages`
- `loadThreads` / `saveThreads` / `deriveThreadTitle`
- 4つの `useEffect`（threads読み込み・メッセージ復元・initialPrompt・デバウンス保存）
- `handleSelectThread` の永続化ロジック
- `handleNewChat` の永続化ロジック

**エクスポート:**
```typescript
// useState 初期化用（container で使用）
export function initThreadId(config: ChatConfig, projectId: string): string

// メインフック
export function useChatPersistence(props: {
  config: ChatConfig;
  projectId: string;
  threadId: string;
  setThreadId: (id: string) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}): {
  threads: ThreadSummary[];
  selectThread: (threadId: string) => void;   // messages復元＋ポインタ更新
  startNewChat: () => void;                   // messages クリア＋新スレッド
  refreshThreads: () => void;                 // threads一覧の再読み込み
}
```

**実装ポイント:**
- `loadFromStorage` / `saveToStorage` を threads・messages の読み書きに使用
- threadIdポインタは `window.localStorage.setItem/getItem`（raw文字列）のまま
- `deserializeMessages` は null 受け付け（loadFromStorage の戻り値をそのまま渡し可）
- Effect 4 の依存配列に `contextKey` と `config.initialPrompt` を追加（現コードの漏れを修正）

---

### [3] `hooks/use-draft-commit.ts` — ドラフトコミット

**移動元:** `draftCommitStates` state, `buildDraftKey`, `getCommitState`, `handleCommitDraft`

**エクスポート:**
```typescript
export function useDraftCommit(props: {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}): {
  commitDraft: (payload: {               // ← ChatMessages.onCommitDraft と型一致
    messageId: string;
    type: "bt" | "br";
    code: string;
    content: BtDraft | BrDraft;
  }) => Promise<void>;
  getCommitState: (                      // ← ChatMessages.getCommitState と型一致
    messageId: string,
    type: "bt" | "br",
    code: string,
  ) => DraftCommitState | undefined;
}
```

**実装ポイント:**
- `buildDraftKey` は内部ヘルパー（unexported）
- `setDraftCommitStates` は内部 useState

---

### [4] `hooks/use-concept-management.ts` — 概念候補管理

**移動元:** `conceptCandidates` state, `showConceptForm` state, `handleConceptAction`, `handleConceptApproval`

**エクスポート:**
```typescript
export function useConceptManagement(props: {
  projectId: string;
}): {
  candidates: ConceptCandidate[];
  setCandidates: React.Dispatch<React.SetStateAction<ConceptCandidate[]>>; // ← useStreamingChat の onConceptCandidates に渡す
  activeFormTerm: string | null;
  setActiveFormTerm: (term: string | null) => void;
  handleAction: (candidate: ConceptCandidate, action: ConceptAction) => void;
  handleApproval: (approval: ConceptApproval) => Promise<void>;
}
```

**実装ポイント:**
- `handleApproval` は `resolvedProjectId` を引数で受け取る（container で計算済み）
- 既存の `console.log` はそのまま（動作互換）

---

### [5] `components/ai-chat/thread-history-panel.tsx` — 履歴パネル

**移動元:** chat-container.tsx lines 566-623 のオーバーレイJSX

```typescript
import type { ThreadSummary } from "./types";

type ThreadHistoryPanelProps = {
  isOpen: boolean;
  threads: ThreadSummary[];
  currentThreadId: string;
  onSelect: (threadId: string) => void;
  onClose: () => void;
};

export function ThreadHistoryPanel(props: ThreadHistoryPanelProps) {
  // オーバーレイ + スライドインパネル + スレッド一覧
  // アニメーション・Tailwind クラスは現コードをそのまま移動
}
```

---

### [6] `components/ai-chat/chat-container.tsx` — 簡潔版

```typescript
// インポート (~15行)
// ChatContainerProps 型 (~4行)
// export function ChatContainer (~90行):
//   - Hook呼び出し (8行: 順序は設計決定事項③)
//   - useCallback × 4 (openHistory, closeHistory, handleSelectThread, handleNewChat)
//   - return JSX:
//       <ThreadHistoryPanel />
//       <ChatMessages />
//       {concept candidates JSX}  ← ~20行のインライン
//       <ChatInput />
```

**削除するコード:**
- `SerializedChatMessage` 型
- `ThreadSummary` 型（types.ts へ）
- `CHAT_STORAGE_PREFIX` 定数
- 全8つのユーティリティ関数
- 4つの `useEffect`
- `hasLoadedHistoryRef` / `persistTimerRef`
- `draftCommitStates` state, `buildDraftKey`, `getCommitState`, `handleCommitDraft`
- `conceptCandidates` / `showConceptForm` state, `handleConceptAction`, `handleConceptApproval`
- 履歴オーバーレイJSX (~57行)

---

## 検証計画

| 検証項目 | 方法 |
|---------|------|
| チャット送信・ストリーミング表示 | E2E: `/chat` に遷移し、メッセージ入力・送信 |
| 履歴切り替え | E2E: 履歴パネル開閉・別スレッド選択・メッセージ復元確認 |
| 新規チャット | E2E: 新規チャットボタン→メッセージクリア→新スレッド |
| ドラフトコミット | E2E: 草案表示→確定ボタン→API呼び出し→ステータス遷移 |
| 概念候補 | E2E: 概念候補カード表示→承認/却下/保留アクション |
| localStorage 互換性 | 起動時に既存データが正しく復元されることを確認 |
