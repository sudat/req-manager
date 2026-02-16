# シーケンス図表示機能 - 段階的発展計画

## 概要

このドキュメントは、エンドユーザー向けシーケンス図表示機能の段階的な発展計画（Phase 1 → Phase 2 → Phase 3）を記録する。

**対象範囲:**
- データソース: `design_documents` テーブル（全タイプ） + `requirement_links`（DD間依存）
- 表示粒度: システム機能（SF）単位
- ページ: `/schema/sequence`

**表示内容:**
- SFに属するDD間の呼び出し関係（`requirement_links` から抽出）
- 各DDの `sideEffects` に基づく外部システムとの相互作用（DB/EventBus/FileSystem/ExternalAPI）

---

## Phase 1: 静的シーケンス図表示（✅ 実装済み）

### 目的
- システム機能（SF）の処理フローをシーケンス図として可視化
- DD間の呼び出し関係と各DDの副作用（sideEffects）を明示

### 実装内容

#### データ取得
- API Route: `/api/schema/sequence?srfId=xxx&projectId=xxx`
- Supabase経由で以下を取得:
  - 指定SFの `system_functions`
  - SFに属する `design_documents`
  - DD間依存（`requirement_links` から `link_type='dd_calls'` を抽出）
- 変換ロジック: `/lib/utils/design-documents/sideeffects-to-mermaid.ts`

#### Mermaid変換ロジック

**参加者（Participants）の生成:**
```typescript
// DD参加者
participant DD1 as DD-001 請求書発行API
participant DD2 as DD-002 PDF生成バッチ
participant DD3 as DD-003 メール送信API

// sideEffects から生成される参加者
participant DB as Database           // dbOperations がある場合
participant EventBus as EventBus     // events がある場合
participant FileSystem as FileSystem // fileOutputs がある場合
participant ExternalSystem as ExternalSystem // externalApiCalls がある場合
```

**依存関係（DD間呼び出し）の可視化:**
```typescript
// requirement_links (link_type='dd_calls') から変換
DD1->>DD2: 同期呼び出し
DD2-->>DD1: レスポンス
DD1->>DD3: 非同期呼び出し
```

**副作用（sideEffects）の可視化:**
```typescript
// dbOperations
DD1->>DB: INSERT invoices (status = 'draft')

// externalApiCalls
DD1->>ExternalSystem: POST /api/email/send
ExternalSystem-->>DD1: レスポンス

// events
DD1->>EventBus: イベント発行 (invoice.created)

// fileOutputs
DD2->>FileSystem: ファイル出力 (pdf)
Note over FileSystem: /output/invoices/{id}.pdf
```

#### コンポーネント
- `/app/(with-sidebar)/schema/sequence/page.tsx` - メインページ
- `/components/schema/SchemaViewer.tsx` - ズーム・パン対応ビューア（共通）
- `/components/schema/MermaidRenderer.tsx` - Mermaid描画（共通）
- サイドバーに「シーケンス図（処理フロー）」リンク追加

#### 技術選定
- **Mermaid.js**: テキストベース、軽量（200KB gzip）、学習コスト低い
- **react-zoom-pan-pinch**: ズーム・パン機能（5KB gzip）
- **クライアントサイドレンダリング**: `mermaid.render()` でSVG生成

### 制約
- SF単位での表示（1つのSFに属するDDのみ）
- 参加者クリックで詳細表示なし

---

## Phase 2: ズーム・パン機能（✅ 実装済み）

### 目的
- 大きなシーケンス図を見やすくする
- 複雑な処理フローの閲覧性向上

### 実装方法

#### ライブラリ選定
- **react-zoom-pan-pinch**: 5KB gzip、軽量
- マウスホイールズーム、ドラッグ移動、ピンチ（モバイル）対応

#### コンポーネント
- **SchemaViewer（共通）**: ER図とシーケンス図で共有
  - `/components/schema/SchemaViewer.tsx`
  - `TransformWrapper` + `TransformComponent` でラップ

### 既存コードの再利用
- ER図で実装した `SchemaViewer` をそのまま再利用
- Phase 1のロジックは一切変更不要

### ユーザー操作
- **マウスホイール**: ズームイン・ズームアウト
- **ドラッグ**: シーケンス図を移動
- **ピンチ（モバイル）**: タッチでズーム
- **リセットボタン**: 初期状態に戻る

---

## Phase 3: DDクリックで詳細表示（✅ 実装済み）

### 目的
- シーケンス図上のDD参加者をクリックして詳細を確認
- 設計書（DD）の `details` 内容をモーダルで表示

### 実装方法

#### SVG DOM操作

**クリックイベント追加:**
```typescript
// components/schema/MermaidRenderer.tsx に追加
useEffect(() => {
  const svg = containerRef.current?.querySelector("svg");
  if (!svg) return;

  // シーケンス図の参加者（actor/entity）を取得
  const participants = svg.querySelectorAll([
    ".actor", // Mermaid v10+
    ".entity", // Mermaid v9
  ]);

  participants.forEach((node) => {
    node.addEventListener("click", (e) => {
      const participantText = (e.target as HTMLElement).textContent;
      if (participantText) {
        // "DD-001 請求書発行API" から DD-ID を抽出
        const ddId = extractDdId(participantText);
        onParticipantClick(ddId);
      }
    });
  });

  return () => {
    // クリーンアップ
  };
}, [mermaidCode]);
```

#### 詳細表示UI

**モーダル（推奨）:**
- `Dialog` コンポーネント（shadcn/ui）
- DD名をタイトルに表示
- 既存の `StructuredSpecViewer` を再利用

**表示内容:**
1. **DD基本情報**
   - DD ID、名前、タイプ（api/screen/batch/job等）
   - エントリポイント

2. **構造化I/O**
   - `inputFields` / `outputFields`
   - `inputSchema` / `outputSchema`（タイプ別）

3. **コアロジック**
   - `coreLogic.rules`（validate/read/derive/decide）

4. **保存/通知**
   - `sideEffects`（dbOperations/externalApiCalls/events/fileOutputs）

5. **例外・非機能**
   - `exceptions` / `nonFunctional`

#### データ取得

**API追加:**
```typescript
// app/api/design-documents/[ddId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { ddId: string } }
) {
  const { ddId } = params;
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const { data: dd } = await getDesignDocument(ddId, projectId);
  return NextResponse.json({ dd });
}
```

### 既存コンポーネントの再利用
- `/components/system-domains/structured-spec-viewer/index.tsx`
- `@/components/ui/dialog` (shadcn/ui)

### 実装済みファイル一覧
- `lib/utils/design-documents/sideeffects-to-mermaid.ts` - 戻り値型変更、ddMapping生成
- `app/api/schema/sequence/route.ts` - ddMappingをレスポンスに追加
- `app/api/design-documents/[ddId]/route.ts` - DD詳細取得API
- `components/schema/DdDetailDialog.tsx` - DD詳細モーダルコンポーネント
- `components/schema/MermaidRenderer.tsx` - クリックイベント追加
- `components/schema/SchemaViewer.tsx` - props追加
- `app/(with-sidebar)/schema/sequence/page.tsx` - モーダル表示ロジック

### 実装時間
- 2-3時間（API追加、クリックイベント、モーダルUI、動作確認）

---

## Phase 4: フィルタリング機能（🔜 将来実装）

### 目的
- 大規模プロジェクトでSF数が多い場合のUX向上
- システム領域（SD）ごとにSFを絞り込み

### 実装方法

#### UI追加
```typescript
// app/(with-sidebar)/schema/sequence/page.tsx
<Select value={selectedDomain} onValueChange={setSelectedDomain}>
  <SelectItem value="all">全て</SelectItem>
  <SelectItem value="SD-BIL">請求（SD-BIL）</SelectItem>
  <SelectItem value="SD-FI">財務（SD-FI）</SelectItem>
  <SelectItem value="SD-GL">総勘定元帳（SD-GL）</SelectItem>
</Select>
```

#### フィルタリングロジック
```typescript
// SF一覧取得時にシステム領域でフィルタ
const filteredSFs = selectedDomain === 'all'
  ? systemFunctions
  : systemFunctions.filter(sf => sf.system_domain_id === selectedDomain);
```

#### URL対応
- `/schema/sequence` - 全SD表示
- `/schema/sequence?domain=SD-BIL` - 請求SDのみ
- `/schema/sequence?srfId=SF-BIL-010` - 特定SFのシーケンス図（直接指定）

---

## Phase 5: 他の横串設計書（🔮 構想段階）

### 業務フロー図 (`/flow`)
- **データソース**: `business_tasks` テーブルの `process_steps`
- **ライブラリ**: Mermaid flowchart
- **表示内容**: 業務プロセスの流れ（いつ／誰が／何をする）

### 画面遷移図 (`/screens`)
- **データソース**: screen型DDの `route` + requirement_links
- **ライブラリ**: Mermaid flowchart or React Flow
- **表示内容**: 画面間の遷移関係

### システム構成図 (`/architecture`)
- **データソース**: external_if型DD
- **ライブラリ**: Mermaid graph
- **表示内容**: 外部システムとの連携構成

---

## 技術選定の理由

### なぜ Mermaid を選んだか

| 理由 | 説明 |
|------|------|
| **テキストベース** | Git で差分管理しやすい、コードレビュー可能 |
| **軽量** | 200KB gzipped、ページ読み込み高速 |
| **学習コスト低い** | 既存の設計書（`database-schema-design.md`）でも使用 |
| **標準採用** | GitHub, GitLab, Notion などで標準サポート |
| **拡張性** | SVG出力なので後からJSで操作可能 |

### なぜ sideEffects からシーケンス図を生成するか

| 理由 | 説明 |
|------|------|
| **実装視点の可視化** | 構造化データにより外部システムとの相互作用を正確に表現 |
| **既存UI完備** | `SideEffectsViewer` 等で作成・表示が完成済み |
| **依存関係との統合** | DD間呼び出し（`requirement_links`）と副作用を1つの図に統合 |

### シーケンス図 vs 他の図法

| 項目 | シーケンス図 | アクティビティ図 | コラボレーション図 |
|------|-------------|----------------|------------------|
| **用途** | 時系列のメッセージ交換 | 業務プロセスの流れ | オブジェクト間の静的関係 |
| **表現力** | 呼び出し順序・同期/非同期 | 条件分岐・並列 | 責務分配 |
| **本機能の適合性** | **最適**（処理フロー） | 不適（業務フローは別途） | 不適（静的構造はER図で対応） |

---

## 参考リンク

- [Mermaid公式ドキュメント - Sequence Diagram](https://mermaid.js.org/syntax/sequenceDiagram.html)
- [Mermaid.js](https://mermaid.js.org/)
- [react-zoom-pan-pinch](https://www.npmjs.com/package/react-zoom-pan-pinch)

---

## 更新履歴

| 日付 | Phase | 内容 |
|------|-------|------|
| 2026-02-11 | Plan | 本ドキュメント作成、Phase 1-5 の計画策定 |
| 2026-02-11 | Phase 1 | 実装完了。静的シーケンス図表示機能をリリース |
| 2026-02-11 | Phase 2 | 実装完了。ズーム・パン機能を追加（ER図と共通化） |
| 2026-02-11 | Phase 3 | 実装完了。DDクリックで詳細表示モーダル実装 |
