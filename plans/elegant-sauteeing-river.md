# エンドユーザー向けER図表示ページ実装計画

## Context（背景・目的）

### なぜこの変更が必要か
要件管理システムでは、システム機能（SRF）配下に「設計書（DD）」を作成でき、その中に **type='model'** として**業務ドメインモデル（エンティティ定義）**を管理している。現在10件のmodel型DDが存在し、エンティティの属性・関連が詳細に定義されているが、**エンティティ間の関連を俯瞰するER図**が存在しない。

エンドユーザー（開発者・設計者）が業務ドメインの全体像を視覚的に把握できるよう、横串設計書として **エンドユーザー向けER図表示ページ** を追加する。

**注意**: これはデータベーステーブル定義（`database-schema-design.md`）のER図ではなく、**業務レベルのドメインモデル**のER図である。

### 解決する課題
- model型DDが10件存在するが、エンティティ間の関連が視覚的に把握しづらい
- 個別のModelDetailViewerでは単体エンティティしか見られず、全体構造が不明
- 新規メンバーがドメインモデルを理解する際の学習コストが高い

### 期待される成果
- プロジェクト全体のドメインモデルをER図として一覧表示
- エンティティ間の関連（1:1, 1:N, N:M）を矢印で可視化
- 軽量で高速な表示（Mermaid使用）
- 既存のmodel型DD（design_documents）と完全統合

---

## Implementation Plan

### フェーズ: Phase 1（静的表示のみ・MVP）

**実装範囲:**
- トップレベルページ `/schema` を作成
- マークダウン設計書からMermaid DSLを抽出
- Mermaidライブラリで静的にER図を描画
- サイドバーに「ER図」リンクを追加

**実装時間:** 1-2時間

---

## 実装詳細

### 1. ページ配置とルーティング

**新規ページ:** `/schema`

**理由:**
- ER図は全システム機能を横断するドメインモデルであり、特定の `/system/[id]` に属さない
- 将来的に `/flow`（業務フロー図）、`/screens`（画面遷移図）など、横串設計書を並列で追加しやすい

**サイドバーへの追加位置:**
現在の「概念辞書」と「変更要求一覧」の間に「ER図（ドメインモデル）」を追加。

---

### 2. データ取得戦略

**データソース:** `design_documents` テーブル（type='model'）

**現状把握:**
- 既に10件のmodel型DDが存在（顧客マスタ、支払明細テーブル、請求書テーブルなど）
- 各DDには以下の情報が含まれる:
  - `typeDetail.entityName`: エンティティ物理名（例: User, Order）
  - `typeDetail.entityLogicalName`: 論理名（例: ユーザー、注文）
  - `typeDetail.attributes[]`: 属性リスト（name, type, primaryKey, foreignKey等）
  - `typeDetail.relationships[]`: 関連リスト（target, type[1:1/1:N/N:1/N:M], columnMappings）

**取得方法:**
1. API Route `/api/schema/er` を作成
2. Supabase経由で `design_documents` を取得（`type = 'model'` でフィルタ）
3. 変換ロジック `/lib/utils/design-documents/model-to-mermaid.ts` で Mermaid DSL を生成
4. クライアントに Mermaid DSL 文字列を返す

**Mermaid変換ロジック:**
```typescript
// relationships の type を Mermaid 記号に変換
"1:1"  → "||--||"
"1:N"  → "||--o{"
"N:1"  → "}o--||"
"N:M"  → "}o--o{"

// 生成例
erDiagram
  User ||--o{ Order : "has"
  User {
    UUID id PK
    string name
    string email
  }
  Order {
    UUID id PK
    UUID user_id FK
  }
```

**キャッシング:**
- API Route で SWR / React Query でキャッシング（開発時は無効化）
- model型DD更新時は自動再読み込み

---

### 3. コンポーネント設計

#### ファイル構成

```
app/(with-sidebar)/
  schema/
    page.tsx                     # メインページ（新規作成）

components/
  schema/
    MermaidRenderer.tsx          # Mermaid描画コンポーネント（新規作成）

lib/
  utils/
    design-documents/
      model-to-mermaid.ts        # model型DD → Mermaid変換ロジック（新規作成）

app/api/
  schema/
    er/
      route.ts                   # design_documentsからER図生成（新規作成）
```

---

#### 3.1 `/app/(with-sidebar)/schema/page.tsx`

**役割:** ER図表示のメインページ

**既存パターンの再利用:**
- `/system/[id]/[srfId]/page.tsx` のレイアウトパターンを参考
- `useProject()` フックでプロジェクトコンテキスト取得
- `SectionCard` コンポーネントで統一的な表示
- パンくずリスト、タイトル、ローディング/エラー状態の統一

**主要なロジック:**
1. `useEffect` で API `/api/schema/er` を呼び出し
2. Mermaid DSL を state に保存
3. `MermaidRenderer` コンポーネントに渡す

---

#### 3.2 `/components/schema/MermaidRenderer.tsx`

**役割:** Mermaidライブラリを使ってER図を描画

**技術仕様:**
- `"use client"` ディレクティブでクライアントサイドレンダリング
- `mermaid.render()` で SVG 生成
- `useEffect` でコンポーネントマウント時に描画

**エラーハンドリング:**
- Mermaid構文エラー時にフォールバック表示

---

#### 3.3 `/lib/utils/design-documents/model-to-mermaid.ts`

**役割:** model型DDの配列から Mermaid ER図DSLを生成

**技術仕様:**
```typescript
export function modelDDsToMermaidErDiagram(
  dds: DesignDocument[]
): string {
  // 1. type='model' のみフィルタ
  const models = dds.filter(dd => dd.type === 'model');

  // 2. Mermaid ER図のヘッダー
  let mermaid = 'erDiagram\n';

  // 3. relationships から関連線を生成
  for (const model of models) {
    const entityName = model.details.typeDetail.entityName;
    for (const rel of model.details.typeDetail.relationships || []) {
      const symbol = relationshipTypeToMermaidSymbol(rel.type);
      mermaid += `  ${entityName} ${symbol} ${rel.target} : "${rel.description || 'relates'}"\n`;
    }
  }

  // 4. attributes からエンティティ定義を生成
  for (const model of models) {
    const entityName = model.details.typeDetail.entityName;
    mermaid += `  ${entityName} {\n`;
    for (const attr of model.details.typeDetail.attributes || []) {
      const constraints = [];
      if (attr.primaryKey) constraints.push('PK');
      if (attr.foreignKey) constraints.push('FK');
      if (attr.unique) constraints.push('UNIQUE');
      if (!attr.nullable) constraints.push('NOT NULL');

      mermaid += `    ${attr.type} ${attr.name} ${constraints.join(' ')}\n`;
    }
    mermaid += `  }\n`;
  }

  return mermaid;
}

function relationshipTypeToMermaidSymbol(type: string): string {
  switch (type) {
    case '1:1': return '||--||';
    case '1:N': return '||--o{';
    case 'N:1': return '}o--||';
    case 'N:M': return '}o--o{';
    default: return '||--||';
  }
}
```

**再利用する既存関数:**
- `listDesignDocuments()` (from `lib/data/design-documents.ts`)
- `DesignDocument` 型 (from `lib/domain/types/design-document.ts`)

---

#### 3.4 `/app/api/schema/er/route.ts`

**役割:** Supabaseからmodel型DDを取得し、Mermaid DSLを返す

**技術仕様:**
```typescript
import { NextResponse } from "next/server";
import { listDesignDocuments } from "@/lib/data/design-documents";
import { modelDDsToMermaidErDiagram } from "@/lib/utils/design-documents/model-to-mermaid";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: "プロジェクトIDが必要です" },
        { status: 400 }
      );
    }

    // design_documents を取得
    const { data: dds, error } = await listDesignDocuments(projectId);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    // model型のみフィルタしてMermaid生成
    const mermaidCode = modelDDsToMermaidErDiagram(dds || []);

    return NextResponse.json({ mermaidCode });
  } catch (error) {
    console.error("ER diagram generation error:", error);
    return NextResponse.json(
      { error: "ER図の生成に失敗しました" },
      { status: 500 }
    );
  }
}
```

**キャッシング:**
- Next.js の API Route キャッシュは使用しない（動的生成）
- クライアント側で SWR / React Query でキャッシング

---

### 4. サイドバーへのリンク追加

**修正ファイル:** `/components/layout/sidebar.tsx`

**追加位置:** 「概念辞書」の下

**追加内容:**
```typescript
{
  type: "item" as const,
  key: "schema",
  label: "ER図",
  href: "/schema",
  icon: Database, // lucide-react の Database アイコン
}
```

---

## Critical Files（重要ファイル）

### 新規作成
1. `/app/(with-sidebar)/schema/page.tsx` - メインページ
2. `/components/schema/MermaidRenderer.tsx` - Mermaid描画コンポーネント
3. `/lib/utils/design-documents/model-to-mermaid.ts` - model型DD → Mermaid変換ロジック
4. `/app/api/schema/er/route.ts` - API Route
5. `/docs/design/schema.md` - Phase 1,2,3の段階的発展計画書

### 修正
1. `/components/layout/sidebar.tsx` - サイドバーにリンク追加
2. `/package.json` - `mermaid` パッケージ追加

### 参照（データソース）
1. `/lib/data/design-documents.ts` - `listDesignDocuments()` 関数を使用
2. `/lib/domain/schemas/design-document-structured.ts` - model型の型定義
3. `/lib/domain/schemas/model-detail.ts` - ModelAttribute, ModelRelationship の型定義

---

## 既存の再利用可能なコンポーネント

以下の既存コンポーネントを活用する：

| コンポーネント | 場所 | 用途 |
|--------------|------|------|
| `SectionCard` | `components/system-domains/section-card.tsx` | ER図を囲むカード表示 |
| `Breadcrumb` | `@/components/ui/breadcrumb` | パンくずリスト |
| `useProject` | `components/project/project-context.tsx` | プロジェクトID取得 |

---

## 実装手順

### Step 1: パッケージインストール
```bash
bun add mermaid
```

### Step 2: 変換ロジック作成
- `/lib/utils/design-documents/model-to-mermaid.ts` を作成
- `modelDDsToMermaidErDiagram()` 関数を実装
- relationships → 関連線、attributes → エンティティ定義

### Step 3: API Route 作成
- `/app/api/schema/er/route.ts` を作成
- Supabaseから design_documents (type='model') を取得
- 変換ロジックを呼び出してMermaid DSL生成
- 動作確認: `curl "http://localhost:3000/api/schema/er?projectId=xxx"`

### Step 4: Mermaid描画コンポーネント作成
- `/components/schema/MermaidRenderer.tsx` を作成
- `mermaid.render()` で SVG 生成
- エラーハンドリング実装

### Step 5: メインページ作成
- `/app/(with-sidebar)/schema/page.tsx` を作成
- `useProject()` で現在のプロジェクトID取得
- API呼び出し、ローディング・エラー状態管理
- `MermaidRenderer` コンポーネントを配置

### Step 6: サイドバーにリンク追加
- `/components/layout/sidebar.tsx` を修正
- `Database` アイコンを import
- menuConfig 配列に新規アイテム追加（"概念辞書"と"変更要求一覧"の間）

### Step 7: 動作確認
- 開発サーバー起動: `bun dev`
- ブラウザで `/schema` にアクセス
- 既存の10件のmodel型DDからER図が生成されることを確認
- エンティティ間の関連（矢印）が正しく表示されることを確認
- サイドバーからアクセスできることを確認

### Step 8: 段階的発展計画の文書化
- `/docs/design/schema.md` を新規作成
- Phase 1（今回実装）: 静的ER図表示
- Phase 2（将来）: ズーム・パン機能追加
- Phase 3（将来）: エンティティクリックで詳細表示
- 技術選定理由、拡張方法、サンプルコードを記載

---

## Verification（検証方法）

### 手動テスト

#### テストケース 1: ER図の正常表示
1. ブラウザで `/schema` にアクセス
2. ER図が正しく描画される
3. テーブル間のリレーション（矢印）が表示される

#### テストケース 2: ローディング状態
1. Network タブで "Slow 3G" に設定
2. ページリロード
3. "読み込み中..." が表示される
4. ER図が遅延して表示される

#### テストケース 3: エラーハンドリング
1. `/docs/design/database-schema-design.md` を一時的にリネーム
2. ページリロード
3. エラーメッセージが表示される

#### テストケース 4: サイドバーナビゲーション
1. サイドバーで「ER図」をクリック
2. `/schema` ページに遷移する
3. アクティブ状態が視覚的に表示される

### E2Eテスト（オプション）

`e2e-testing` スキルまたは Playwright MCP を使用して、WSL環境での動作確認を実施。

```bash
# agent-browser での確認例
agent-browser open http://localhost:3000/schema
agent-browser snapshot -i
agent-browser screenshot
```

---

## Future Extensions（将来的な拡張）

### docs/design/schema.md に文書化する内容

Phase 2, 3 の詳細な実装計画を `/docs/design/schema.md` に文書化する。以下の内容を含む：

#### Phase 1: 静的ER図表示（今回実装）
- データソース: design_documents (type='model')
- 変換ロジック: model-to-mermaid.ts
- 表示: Mermaid.js でクライアントサイド描画
- ページ: `/schema`

#### Phase 2: ズーム・パン機能
- **ライブラリ**: `react-zoom-pan-pinch`（5KB gzip、軽量）
- **実装方法**:
  ```typescript
  // components/schema/SchemaViewer.tsx
  import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
  import { MermaidRenderer } from "./MermaidRenderer";

  export function SchemaViewer({ code }: { code: string }) {
    return (
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit
      >
        <TransformComponent>
          <MermaidRenderer code={code} />
        </TransformComponent>
      </TransformWrapper>
    );
  }
  ```
- **既存コードの再利用**: `MermaidRenderer` をそのまま利用
- **実装時間**: 1-2時間
- **ユーザー操作**: マウスホイールズーム、ドラッグ移動、ピンチ（モバイル）

#### Phase 3: エンティティクリックで詳細表示
- **実装方法**: SVG DOM要素に直接アクセスしてクリックイベント追加
- **詳細表示**: モーダルまたはサイドパネル
- **表示内容**:
  - エンティティ名・論理名・説明
  - 属性一覧（既存の `ModelDetailViewer` を再利用）
  - 関連一覧
  - 状態遷移（あれば）
- **実装例**:
  ```typescript
  useEffect(() => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;

    const entityNodes = svg.querySelectorAll(".er-entityName");
    entityNodes.forEach((node) => {
      node.addEventListener("click", (e) => {
        const entityName = (e.target as HTMLElement).textContent;
        if (entityName) {
          setSelectedEntity(entityName);
          setModalOpen(true);
        }
      });
    });
  }, [mermaidCode]);
  ```
- **データ取得**: model型DDの元データをAPI経由で再取得
- **実装時間**: 2-3時間

#### Phase 4: システム領域単位でのフィルタリング
- システム領域（AR/AP/GL）ごとにER図を絞り込み表示
- ドロップダウンメニューでフィルタ切り替え
- URL: `/schema?domain=AR`

#### Phase 5: 他の横串設計書
- `/flow` - 業務フロー図（business_tasks の process_steps から生成）
- `/screens` - 画面遷移図（screen型DD の route から生成）
- `/architecture` - システム構成図（external_if型DD から生成）

---

### 技術選定理由の記載

**なぜ Mermaid を選んだか:**
- テキストベースで Git 管理しやすい
- 軽量（200KB gzipped）
- 学習コスト低い（既存の設計書でも使用）
- GitHub, GitLab, Notion などで標準採用されている

**なぜデータベーステーブルではなくmodel型DDを使うか:**
- エンドユーザー向けの業務ドメインモデルを表現するため
- 論理エンティティ（業務視点）と物理テーブル（実装視点）は分離すべき
- model型DDには論理名・説明が含まれ、ドキュメントとして有用

---

## Technical Notes

### Mermaidライブラリの選定理由
- **軽量**: 約200KB gzipped
- **実績**: GitHub, GitLab, Notionなどで採用
- **テキストベース**: Gitで差分管理しやすい
- **TypeScript対応**: 型安全な実装が可能

### パフォーマンス最適化
- API Route の静的生成でビルド時に処理
- Mermaidの遅延読み込み（`next/dynamic`）も検討可能

### レスポンシブ対応
- コンテナに `overflow-auto` を指定
- モバイルでは水平スクロールで対応
- Phase 2以降はピンチズームで拡大

---

## Estimated Effort

| タスク | 時間 |
|--------|------|
| パッケージインストール | 5分 |
| 変換ロジック実装 | 30分 |
| API Route 実装 | 20分 |
| MermaidRenderer 実装 | 20分 |
| メインページ実装 | 30分 |
| サイドバー修正 | 10分 |
| 動作確認・調整 | 30分 |
| docs/design/schema.md 作成 | 20分 |
| **合計** | **2.5時間** |

---

## Success Criteria

✅ `/schema` ページにアクセスするとER図が表示される
✅ サイドバーから「ER図」をクリックして遷移できる
✅ ローディング状態とエラー状態が適切に表示される
✅ 既存の設計書（Markdown）との整合性が保たれている
✅ レスポンシブ対応（モバイルでもスクロール可能）
