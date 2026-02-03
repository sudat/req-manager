# SF/SRカード表示機能 実装プラン

## 概要
/chat画面において、システム機能（SF）・システム要件（SR）のカード表示機能を実装する。
BT（業務タスク）カードと同様のUIで、草案内容を表形式で表示する。

## 難易度評価

- **難易度**: ★★☆
- **根拠**: 5 files, 約150-200 lines, 3コンポーネント連携
- **リスク**:
  - BTカードとの共通化設計が不十分だと重複コードが増加
  - SF/SRの階層構造表示のUI設計に迷いが生じる可能性

## 設計原則

| 原則 | 適用箇所 |
|------|----------|
| **DRY** | BTカードとSF/SRカードで共通の`InfoRow`コンポーネントを再利用 |
| **KISS** | SFカードはSR一覧を含むシンプルな構成、SRカードはAC一覧を含む |
| **YAGNI** | 実装単位（IU）のカード表示は現時点では実装しない |

## 実装ファイル一覧

### 新規ファイル
| ファイルパス | 目的 |
|-------------|------|
| `components/ai-chat/sf-draft-card.tsx` | SF草案カードコンポーネント |
| `components/ai-chat/sr-draft-card.tsx` | SR草案カードコンポーネント |

### 修正ファイル
| ファイルパス | 修正内容 |
|-------------|----------|
| `components/ai-chat/types.ts` | `SfDraft`, `SrDraft`, `AcDraft`型の追加、`ChatMessage`型にフィールド追加 |
| `app/api/chat/lib/chunk-handlers.ts` | `systemDraftTool`結果の検出と`draft`イベント送信 |
| `hooks/use-streaming-chat.ts` | `sfDraft`/`srDraft`イベントの処理追加 |
| `components/ai-chat/message-bubble.tsx` | SF/SRカードの表示条件追加 |

## 詳細実装内容

### Step 1: 型定義の追加 (`components/ai-chat/types.ts`)

以下の型を追加する：

```typescript
/**
 * 受入基準（AC）草案の型定義
 */
export type AcDraft = {
  code: string;
  given: string;
  when: string;
  then: string;
};

/**
 * システム要件（SR）草案の型定義
 */
export type SrDraft = {
  code: string;
  type: string;
  requirement: string;
  rationale: string;
  acs: AcDraft[];
};

/**
 * システム機能（SF）草案の型定義
 */
export type SfDraft = {
  code: string;
  name: string;
  description: string;
  system_domain_id: string;
  srs: SrDraft[];
};
```

`ChatMessage`型に以下フィールドを追加：
```typescript
export type ChatMessage = {
  // ... 既存フィールド ...
  btDraft?: BtDraft;
  sfDraft?: SfDraft;  // ← 追加
  srDraft?: SrDraft;  // ← 追加
};
```

### Step 2: SFカードコンポーネント (`components/ai-chat/sf-draft-card.tsx`)

**UI構成:**
```
┌─────────────────────────────────────────┐
│ [アイコン] システム機能草案      [未確定] │
├─────────────────────────────────────────┤
│ コード        SF-SD-0001                │
│ 機能名        売上データ登録機能          │
│ 説明          売上データを登録する機能     │
├─────────────────────────────────────────┤
│ ▼ システム要件 (1件)                    │
├─────────────────────────────────────────┤
│ SR-SD-0001-0001  売上データを入力できる  │
│   └ AC: 3件                             │
└─────────────────────────────────────────┘
```

**実装ポイント:**
- `InfoRow`コンポーネントは`draft-preview-card.tsx`からインポート（共通化検討）
- SR一覧は折りたたみ可能に（初期状態: 展開）
- SRコードをクリックで詳細表示（将来的な拡張）

### Step 3: SRカードコンポーネント (`components/ai-chat/sr-draft-card.tsx`)

**UI構成:**
```
┌─────────────────────────────────────────┐
│ [アイコン] システム要件草案      [未確定] │
├─────────────────────────────────────────┤
│ コード        SR-SD-0001-0001           │
│ タイプ        functional                │
│ 要件          売上データを入力できる      │
│ 根拠          業務要件を実現するため      │
├─────────────────────────────────────────┤
│ ▼ 受入基準 (3件)                        │
├─────────────────────────────────────────┤
│ AC-001: Given... When... Then...        │
│ AC-002: Given... When... Then...        │
│ AC-003: Given... When... Then...        │
└─────────────────────────────────────────┘
```

**実装ポイント:**
- ACはGiven-When-Thenを表形式で表示
- 複数ACがある場合は縦に展開

### Step 4: ストリーミング処理の修正

#### `app/api/chat/lib/chunk-handlers.ts`

`handleToolResult`関数に`systemDraftTool`の処理を追加：

```typescript
// system_draftツールの結果を検出
if (meta.toolName === 'systemDraftTool') {
  const output = meta.output as {
    sfDrafts?: SfDraft[];
    previewAvailable?: boolean;
  };

  if (output?.sfDrafts && output.sfDrafts.length > 0) {
    // SFと内包するSRを個別にイベント送信
    for (const sfDraft of output.sfDrafts) {
      ctx.sendData({ event: 'draft', draftType: 'sf', draft: sfDraft });

      for (const srDraft of sfDraft.srs) {
        ctx.sendData({
          event: 'draft',
          draftType: 'sr',
          draft: srDraft,
          parentSfCode: sfDraft.code
        });
      }
    }
  }
}
```

#### `hooks/use-streaming-chat.ts`

`data.event === 'draft'`の処理を拡張：

```typescript
if (data.event === 'draft' && data.draft) {
  if (data.draftType === 'sf') {
    assistantMessage.sfDraft = data.draft;
  } else if (data.draftType === 'sr') {
    assistantMessage.srDraft = data.draft;
  } else {
    assistantMessage.btDraft = data.draft;  // 既存
  }
  // メッセージ更新処理...
}
```

### Step 5: メッセージバブルの修正 (`components/ai-chat/message-bubble.tsx`)

カード表示条件を追加：

```typescript
// インポート追加
import { SfDraftCard } from './sf-draft-card';
import { SrDraftCard } from './sr-draft-card';

// レンダリング部分
return (
  <div className={...}>
    {/* BTカード */}
    {message.btDraft && <DraftPreviewCard draft={message.btDraft} />}

    {/* SFカード */}
    {message.sfDraft && <SfDraftCard draft={message.sfDraft} />}

    {/* SRカード */}
    {message.srDraft && <SrDraftCard draft={message.srDraft} />}
  </div>
);
```

## 依存関係

```
system-draft.ts (Tool) → chunk-handlers.ts → use-streaming-chat.ts → message-bubble.tsx
                                                              ↓
                                                    ┌─────────┴─────────┐
                                                    ↓                   ↓
                                              sf-draft-card.tsx   sr-draft-card.tsx
                                                    ↑                   ↑
                                              types.ts (SfDraft/SrDraft型)
```

## 実装順序

1. **Step 1**: `types.ts`に型定義を追加（基盤）
2. **Step 2**: `sf-draft-card.tsx`と`sr-draft-card.tsx`を作成（UI）
3. **Step 3**: `chunk-handlers.ts`に`systemDraftTool`処理を追加（バックエンド）
4. **Step 4**: `use-streaming-chat.ts`にイベント処理を追加（フック）
5. **Step 5**: `message-bubble.tsx`にカード表示を追加（統合）

## テスト計画

実装後、E2Eテストで以下を確認：
1. システム要件登録依頼時にSFカードが表示される
2. SRカードが表示される
3. カード内の情報（コード、名称、説明等）が正しく表示される
4. SR一覧・AC一覧の折りたたみ/展開が動作する

## Critical Files

- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/ai-chat/types.ts`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/app/api/chat/lib/chunk-handlers.ts`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/hooks/use-streaming-chat.ts`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/ai-chat/message-bubble.tsx`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/ai-chat/draft-preview-card.tsx` (参考用)
