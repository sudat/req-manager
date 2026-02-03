# BR草案カード表示機能 実装計画

## 難易度評価

**難易度: ★★☆**

- 修正ファイル数: 6 files
- 変更行数概算: 150 lines
- 影響コンポーネント数: 3 components（chunk-handlers、use-streaming-chat、message-bubble）
- リスク: 
  - BTカード表示機能への影響（既存機能を壊さない保証が必要）
  - 将来の草案タイプ拡張時の変更コスト

## 背景

業務タスク（BT）登録では、AI生成時にリアルタイムでカードプレビューが表示されるが、業務要件（BR）登録では同様の機能がない。ユーザ体験を統一し、BR登録時にも実際の照会画面に近いカードを表示したい。

### 現状のBTカードフロー

1. `btDraftTool` → BT草案オブジェクト生成
2. `chunk-handlers.ts` → `meta.toolName === 'btDraftTool'` 検出
3. `ctx.sendData({ event: 'draft', draft: output.btDraft })` 送信
4. `use-streaming-chat.ts` → `event === 'draft'` 検出、`message.btDraft` に設定
5. `message-bubble.tsx` → `message.btDraft` 存在時に `DraftPreviewCard` 表示

### BR草案の現状

- `lib/mastra/tools/br-draft.ts` に `brDraftTool` 存在
- 出力スキーマに `brDraft` オブジェクトあり
- **chunk-handlers.ts に `brDraftTool` 用の処理なし**
- `ChatMessage` 型に `brDraft` フィールドなし
- BR用カードコンポーネント不在

## 設計方針

### 原則

- **KISS原則**: 現時点では複雑な抽象化を避け、BTと同じパターンを踏襲
- **YAGNI原則**: 将来の拡張（SF/SR/AC/実装単位SD）は今は実装しない
- **DRY原則**: カード内の共通UIパーツ（InfoRow等）は既存のものを再利用

### 型定義の設計

**選択肢A: 個別フィールド（BTと同じパターン）**
```typescript
export type ChatMessage = {
  // ... 既存フィールド
  btDraft?: BtDraft;
  brDraft?: BrDraft;  // 追加
}
```

**選択肢B: 汎用フィールド**
```typescript
export type ChatMessage = {
  // ... 既存フィールド
  draft?: {
    type: 'bt' | 'br' | 'sf' | 'sr' | 'ac' | 'impl-unit';
    data: BtDraft | BrDraft | ...;
  }
}
```

**採用: 選択肢A（個別フィールド）**

根拠:
- 既存のBTパターンを踏襲し、一貫性を保つ
- 型安全性が高い（TypeScriptの型推論が効く）
- 将来の拡張時も段階的に追加可能
- 複雑な型ガード不要

トレードオフ:
- 草案タイプごとにフィールド追加が必要（YAGNI的には現時点で不要なものは追加しない）
- 5種類の草案を実装する場合は5フィールド追加になるが、それでも型安全性のメリットが大きい

### カードコンポーネントの設計

**選択肢A: 個別コンポーネント（BTと同じパターン）**
```typescript
// DraftPreviewCard: BT専用
// BrDraftPreviewCard: BR専用 ← 新規作成
```

**選択肢B: 汎用コンポーネント**
```typescript
<DraftPreviewCard 
  type="br" 
  draft={brDraft} 
/>
```

**採用: 選択肢A（個別コンポーネント）**

根拠:
- BTとBRで表示内容が全く異なる
- BR: シンプルな2-3行の要件テキスト表示
- BT: 複雑な業務プロセステーブル、input/outputテーブル
- 無理に共通化すると条件分岐が増え、かえって複雑化する

### BRカードの表示内容

実際の照会画面（`business-requirement-card.tsx`）に近い形式:

```
┌─────────────────────────────────────┐
│ 📄 業務要件草案          [未確定]   │
├─────────────────────────────────────┤
│ コード: BT-AP-0001-001              │
│ 要件:   請求書データを一括登録できる│
│ 根拠:   業務を効率的に実行するため  │
│ BT ID:  BT-AP-0001                  │
└─────────────────────────────────────┘
```

シンプルに4項目のみ。概念候補は別途 `concept_candidates` イベントで表示される。

## 実装ステップ

### Phase 1: 型定義の拡張

**ファイル: `components/ai-chat/types.ts`**

1. `BrDraft` 型を追加
```typescript
export type BrDraft = {
  code: string;
  requirement: string;
  rationale: string;
  business_task_id: string;
  concept_ids?: string[];
};
```

2. `ChatMessage` 型に `brDraft` フィールドを追加
```typescript
export type ChatMessage = {
  // ... 既存
  btDraft?: BtDraft;
  brDraft?: BrDraft;  // 追加
};
```

### Phase 2: チャンクハンドラーの拡張

**ファイル: `app/api/chat/lib/chunk-handlers.ts`**

`handleToolResult` 関数内に `brDraftTool` の検出処理を追加（141-175行の直後）:

```typescript
// br_draftツールの結果を検出してdraftイベントを送信
if (meta.toolName === 'brDraftTool') {
  const output = meta.output as {
    brDraft?: unknown;
    conceptCandidates?: unknown;
  };
  console.log('[Chat API] br_draft tool completed, output:', JSON.stringify(output, null, 2));
  if (output?.brDraft) {
    console.log('[Chat API] Sending draft event with brDraft:', (output.brDraft as { code?: string }).code);
    ctx.sendData({ event: 'draft', draft: output.brDraft, draftType: 'br' });
  } else {
    console.log('[Chat API] brDraft not found in output');
  }

  // conceptCandidatesの処理（BTと同じ）
  const rawCandidates = output?.conceptCandidates;
  if (Array.isArray(rawCandidates) && rawCandidates.length > 0) {
    // ... BTと同じロジック
  }
}
```

注意:
- `draftType: 'br'` を追加し、フロントエンドで区別できるようにする
- BTの処理（141-175行）は一切変更しない

### Phase 3: ストリーミングチャットフックの拡張

**ファイル: `hooks/use-streaming-chat.ts`**

`sendMessage` 内の `draft` イベント処理を修正（192-204行）:

```typescript
if (data.event === 'draft' && data.draft) {
  const draftType = data.draftType || 'bt';  // デフォルトはBT（後方互換性）
  
  if (draftType === 'bt') {
    console.log('[Chat] Received BT draft event:', data.draft.code);
    assistantMessage.btDraft = data.draft;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessage.id
          ? { ...msg, btDraft: assistantMessage.btDraft }
          : msg
      )
    );
  } else if (draftType === 'br') {
    console.log('[Chat] Received BR draft event:', data.draft.code);
    assistantMessage.brDraft = data.draft;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessage.id
          ? { ...msg, brDraft: assistantMessage.brDraft }
          : msg
      )
    );
  }
  console.log('[Chat] Updated message with draft:', assistantMessage.id);
  continue;
}
```

注意:
- `draftType` フィールドで判別
- デフォルトは `'bt'` として後方互換性を保つ
- BTの既存動作を壊さない

### Phase 4: BRカードコンポーネントの作成

**ファイル: `components/ai-chat/br-draft-preview-card.tsx`（新規作成）**

```typescript
"use client";

import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrDraft } from './types';

type BrDraftPreviewCardProps = {
  draft: BrDraft;
};

export function BrDraftPreviewCard({ draft }: BrDraftPreviewCardProps) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600" />
          <h3 className="text-[13px] font-semibold text-slate-700">
            業務要件草案
          </h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
          未確定
        </span>
      </div>

      {/* 基本情報テーブル */}
      <div className="divide-y divide-slate-200">
        <InfoRow label="コード" value={draft.code} />
        <InfoRow label="要件" value={draft.requirement} />
        <InfoRow label="根拠" value={draft.rationale} />
        <InfoRow label="業務タスクID" value={draft.business_task_id} />
      </div>
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex">
      <div className="w-32 flex-shrink-0 px-4 py-2 bg-slate-50 text-[12px] font-medium text-slate-600">
        {label}
      </div>
      <div className="flex-1 px-4 py-2 text-[12px] text-slate-700 whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}
```

設計ポイント:
- `DraftPreviewCard` と同じスタイル（ヘッダー、「未確定」バッジ、InfoRowテーブル）
- BRは構造がシンプルなので、業務プロセステーブルなどは不要
- `InfoRow` は内部で再定義（将来的に共通化する場合は別ファイルに切り出し）

### Phase 5: メッセージバブルの拡張

**ファイル: `components/ai-chat/message-bubble.tsx`**

1. import追加（2-4行あたり）
```typescript
import { BrDraftPreviewCard } from './br-draft-preview-card';
```

2. カード表示ロジックを拡張（70-72行を修正）
```typescript
{message.btDraft && (
  <DraftPreviewCard draft={message.btDraft} />
)}
{message.brDraft && (
  <BrDraftPreviewCard draft={message.brDraft} />
)}
```

注意:
- BTカード表示の直後に追加
- 両方とも存在する場合は両方表示される（通常は起こらないが、念のため）

## テスト・検証方法

### 手動テスト手順

**前提条件:**
- Supabaseに業務タスク（BT）が1件以上登録されていること
- BT IDがわかっていること（例: `BT-AP-0001`）

**手順:**

1. 開発サーバー起動
```bash
cd /usr/local/src/dev/wsl/personal-pj/req-manager
bun dev
```

2. チャット画面を開く
```
/chat?screen=BT&btId=BT-AP-0001
```

3. BR草案生成を依頼
```
ユーザ入力例:
「請求書データを一括登録できるようにしたい」
```

4. 期待動作
   - AI応答中にプログレスステップが表示される
   - `br_draft` ツール完了後、BRカードが表示される
   - カード内容: コード、要件、根拠、BT ID
   - 「未確定」バッジが表示される
   - 概念候補があればカード下に表示される

5. ブラウザコンソールで確認
```
[Chat API] br_draft tool completed
[Chat API] Sending draft event with brDraft: BT-AP-0001-001
[Chat] Received BR draft event: BT-AP-0001-001
```

6. BT草案も試して、既存機能が壊れていないことを確認
```
/chat?screen=BD&bdId=GL
「月次決算業務を登録したい」
→ BTカードが表示されること
```

### エッジケース

1. **BR草案生成中にエラー発生**
   - BT IDが存在しない場合
   - 期待: エラーメッセージが表示され、カードは表示されない

2. **概念候補なし**
   - conceptCandidates が空配列の場合
   - 期待: カードのみ表示、概念候補セクションなし

3. **BT草案との同時使用**
   - 通常は起こらないが、両方のツールが呼ばれた場合
   - 期待: BTカード、BRカードが両方表示される

### Playwright MCPでのE2Eテスト（推奨）

**e2e-testing スキルを使用:**

```bash
# テスト項目
1. BR草案生成フロー全体
2. カード表示の確認（スクリーンショット取得）
3. 既存のBT草案生成が壊れていないこと
```

テストシナリオ:
1. `/chat?screen=BT&btId=BT-AP-0001` に移動
2. 「請求書データを一括登録できるようにしたい」を入力
3. ストリーミング完了まで待機（progress-steps の status=done を監視）
4. `br-draft-preview-card` の存在を確認
5. カード内のテキスト検証（コード、要件、根拠）

## ファイル構成と変更箇所

```
components/ai-chat/
├── types.ts                       [変更] BrDraft型、ChatMessage型拡張
├── message-bubble.tsx             [変更] BrDraftPreviewCard表示追加
├── br-draft-preview-card.tsx      [新規] BRカードコンポーネント
└── draft-preview-card.tsx         [変更なし]

hooks/
└── use-streaming-chat.ts          [変更] draft イベント処理拡張

app/api/chat/lib/
└── chunk-handlers.ts              [変更] brDraftTool 検出処理追加

lib/mastra/tools/
└── br-draft.ts                    [変更なし] ツール出力は既に対応済み
```

## リスクと対策

### リスク1: BT草案表示が壊れる

**対策:**
- BTの処理ロジックは一切変更しない
- chunk-handlers.tsでは `btDraftTool` の処理ブロックをそのまま残す
- use-streaming-chat.tsでは `draftType` のデフォルト値を `'bt'` にする

**検証:**
- 実装後、必ずBT草案生成をテストする

### リスク2: draftTypeフィールドの互換性

**対策:**
- `draftType` が未定義の場合は `'bt'` として扱う（後方互換性）
- 既存のBT草案生成APIレスポンスは変更不要

### リスク3: 型定義の不整合

**対策:**
- TypeScript型チェックを厳格に実施
- `brDraft` フィールドをオプショナル (`?`) にする
- 実行時に `undefined` チェックを徹底

## 将来の拡張パス

現時点では実装しないが、将来的に以下の草案タイプに拡張可能:

1. **SF/SR/AC草案** (system-draft.ts)
   - `ChatMessage` に `sfDrafts?: SfDraft[]` 追加
   - `SfDraftPreviewCard` コンポーネント作成
   - SF階層表示（SF → SR配列 → AC配列）

2. **実装単位SD草案** (impl-unit-draft.ts)
   - `ChatMessage` に `implUnitDraft?: ImplUnitDraft` 追加
   - `ImplUnitDraftPreviewCard` コンポーネント作成
   - entry_point、design_notes表示

3. **汎用化リファクタリング** (5種類実装後)
   - `ChatMessage` の個別フィールドを union型にリファクタ
   - カードコンポーネントを type-dispatch パターンに統一
   - ただし、YAGNI原則により現時点では不要

## まとめ

- **難易度:** ★★☆
- **推定工数:** 2-3時間
- **影響範囲:** AIチャット関連のみ（業務画面には影響なし）
- **テスト:** 手動テスト + Playwright MCP推奨
- **リスク:** BT機能への影響（対策済み）

この計画に従って実装すれば、BR草案カード表示機能を安全かつ段階的に追加できます。
