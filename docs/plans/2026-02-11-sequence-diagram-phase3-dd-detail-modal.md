# シーケンス図 Phase 3: DDクリックで詳細表示モーダル実装

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** シーケンス図上のDD参加者（DD1, DD2...）をクリックすると、そのDDの詳細情報をモーダルで表示できるようにする

**Architecture:**
- `MermaidRenderer` でSVG描画後にDOM操作でクリックイベントを追加
- Propsコールバック `onParticipantClick` を `MermaidRenderer` → `SchemaViewer` → `SequenceDiagramPage` に渡す
- クリック時に `/api/design-documents/[ddId]` でDD詳細を非同期取得
- shadcn/ui Dialog + `StructuredSpecViewer` でモーダル表示

**Tech Stack:** TypeScript, React, Mermaid.js, shadcn/ui, sonner

---

## Task 1: APIレスポンスにddMappingを追加

**Files:**
- Modify: `app/api/schema/sequence/route.ts`

**Step 1: APIレスポンスタイプにddMappingを追加**

`app/api/schema/sequence/route.ts` の `SequenceDiagramResponse` 型に `ddMapping` フィールドを追加：

```typescript
interface SequenceDiagramResponse {
  mermaidCode: string;
  sfInfo: {
    id: string;
    name: string;
    description: string;
  };
  ddCount: number;
  ddMapping: Record<string, string>; // "DD1": "dd-id-001", "DD2": "dd-id-002"
}
```

**Step 2: sideEffectsToMermaidSequenceの戻り値にddMappingを含める**

`lib/utils/design-documents/sideeffects-to-mermaid.ts` の戻り値型を変更：

```typescript
export function sideEffectsToMermaidSequence(
  sf: SystemFunction,
  dds: DesignDocument[],
  dependencies: DdDependencyLink[] = []
): { mermaidCode: string; ddMapping: Record<string, string> } {
  // ... 既存のロジック ...

  const ddMapping = Object.fromEntries(
    parsed.map((item) => [item.alias, item.dd.id] as const)
  );

  return {
    mermaidCode: lines.join("\n"),
    ddMapping,
  };
}
```

**Step 3: API RouteでddMappingを返す**

`app/api/schema/sequence/route.ts` で `sideEffectsToMermaidSequence` の戻り値から `ddMapping` を抽出してレスポンスに含める：

```typescript
const { mermaidCode, ddMapping } = sideEffectsToMermaidSequence(sf, dds, dependencies);

return NextResponse.json({
  mermaidCode,
  sfInfo: { id: sf.id, name: sf.title, description: sf.description || "" },
  ddCount: dds.length,
  ddMapping,
});
```

**Step 4: コミット**

```bash
git add app/api/schema/sequence/route.ts lib/utils/design-documents/sideeffects-to-mermaid.ts
git commit -m "feat(sequence): add ddMapping to sequence diagram API response"
```

---

## Task 2: DD詳細取得APIの実装

**Files:**
- Create: `app/api/design-documents/[ddId]/route.ts`

**Step 1: API Routeを作成**

`app/api/design-documents/[ddId]/route.ts` を新規作成：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDesignDocumentById } from "@/lib/data/design-documents";

export async function GET(
  request: NextRequest,
  { params }: { params: { ddId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const dd = await getDesignDocumentById(params.ddId, projectId);

    if (!dd) {
      return NextResponse.json({ error: "DesignDocument not found" }, { status: 404 });
    }

    return NextResponse.json({ dd });
  } catch (error) {
    console.error("Failed to fetch design document:", error);
    return NextResponse.json(
      { error: "Failed to fetch design document" },
      { status: 500 }
    );
  }
}
```

**Step 2: コミット**

```bash
git add app/api/design-documents/[ddId]/route.ts
git commit -m "feat(api): add design document detail API endpoint"
```

---

## Task 3: MermaidRendererにonParticipantClick propを追加

**Files:**
- Modify: `components/schema/MermaidRenderer.tsx`

**Step 1: propsにonParticipantClickを追加**

```typescript
interface MermaidRendererProps {
  code: string;
  className?: string;
  onParticipantClick?: (alias: string) => void; // 追加
  ddMapping?: Record<string, string>; // 追加（DDのみクリック可能にするため）
}
```

**Step 2: useEffectでクリックイベントを追加**

`useEffect` 内のSVG描画処理の後に、クリックイベントを追加：

```typescript
useEffect(() => {
  // ... 既存の描画処理 ...

  const renderDiagram = async () => {
    try {
      // ... 既存のMermaid描画 ...

      // SVGをコンテナに挿入
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
      }

      // クリックイベントを追加（ここから追加）
      if (onParticipantClick && ddMapping) {
        const svgElement = containerRef.current?.querySelector("svg");
        if (!svgElement) return;

        // Mermaidシーケンス図の参加者要素を取得
        // actor（Mermaid v10+）またはentity（Mermaid v9）クラスを使用
        const participantElements = svgElement.querySelectorAll(".actor, .entity");

        participantElements.forEach((element) => {
          const textContent = element.textContent;
          if (!textContent) return;

          // ddMappingに含まれるエイリアスのみクリック可能にする
          if (ddMapping[textContent]) {
            element.style.cursor = "pointer";

            element.addEventListener("click", () => {
              onParticipantClick(textContent);
            });
          }
        });
      }
    } catch (err) {
      // ... 既存のエラーハンドリング ...
    }
  };

  renderDiagram();
}, [code, isInitialized, onParticipantClick, ddMapping]); // 依存配列に追加
```

**Step 3: コミット**

```bash
git add components/schema/MermaidRenderer.tsx
git commit -m "feat(mermaid): add onParticipantClick support for sequence diagrams"
```

---

## Task 4: SchemaViewerにonParticipantClickをバインド

**Files:**
- Modify: `components/schema/SchemaViewer.tsx`

**Step 1: propsを追加**

```typescript
interface SchemaViewerProps {
  code: string;
  onParticipantClick?: (alias: string) => void; // 追加
  ddMapping?: Record<string, string>; // 追加
}

export function SchemaViewer({ code, onParticipantClick, ddMapping }: SchemaViewerProps) {
  return (
    <TransformWrapper ...>
      <TransformComponent ...>
        <MermaidRenderer
          code={code}
          onParticipantClick={onParticipantClick}
          ddMapping={ddMapping}
        />
      </TransformComponent>
    </TransformWrapper>
  );
}
```

**Step 2: コミット**

```bash
git add components/schema/SchemaViewer.tsx
git commit -m "feat(schema-viewer): pass onParticipantClick to MermaidRenderer"
```

---

## Task 5: DdDetailDialogコンポーネントを作成

**Files:**
- Create: `components/schema/DdDetailDialog.tsx`

**Step 1: DdDetailDialogコンポーネントを作成**

```typescript
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { StructuredSpecViewer } from "@/components/system-domains/structured-spec-viewer";
import type { DesignDocument, EntryPoint } from "@/lib/domain";
import type { StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";

interface DdDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ddId: string;
  projectId: string;
}

export function DdDetailDialog({ isOpen, onClose, ddId, projectId }: DdDetailDialogProps) {
  const [dd, setDd] = useState<DesignDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !ddId || !projectId) return;

    const fetchDd = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/design-documents/${ddId}?projectId=${projectId}`
        );

        if (!response.ok) {
          throw new Error("DDの取得に失敗しました");
        }

        const data = await response.json();
        setDd(data.dd);
      } catch (err) {
        console.error("Failed to fetch DD:", err);
        setError(err instanceof Error ? err.message : "DDの取得に失敗しました");
        setDd(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDd();
  }, [isOpen, ddId, projectId]);

  const entryPoints: EntryPoint[] = dd?.entryPoints ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dd?.name ?? ddId} の詳細</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            <span className="ml-3 text-slate-600">読み込み中...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : dd ? (
          <StructuredSpecViewer
            spec={dd.details as StructuredDesignDocumentSpec}
            entryPoints={entryPoints}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: コミット**

```bash
git add components/schema/DdDetailDialog.tsx
git commit -m "feat(dialog): add DdDetailDialog component for showing DD details"
```

---

## Task 6: SequenceDiagramPageにモーダル表示ロジックを追加

**Files:**
- Modify: `app/(with-sidebar)/schema/sequence/page.tsx`

**Step 1: ステートを追加**

```typescript
const [modalOpen, setModalOpen] = useState(false);
const [selectedDdId, setSelectedDdId] = useState<string>("");
```

**Step 2: handleParticipantClick関数を追加**

```typescript
const handleParticipantClick = async (alias: string) => {
  const ddId = diagramData?.ddMapping[alias];
  if (!ddId) {
    // ddMappingにないエイリアス（DB/EventBus等）は無視
    return;
  }

  setSelectedDdId(ddId);
  setModalOpen(true);
};
```

**Step 3: SchemaViewerにpropsを渡す**

```tsx
<SchemaViewer
  code={diagramData.mermaidCode}
  onParticipantClick={handleParticipantClick}
  ddMapping={diagramData.ddMapping}
/>
```

**Step 4: DdDetailDialogをレンダリング**

```tsx
{/* メインコンテンツの後に追加 */}
{selectedDdId && (
  <DdDetailDialog
    isOpen={modalOpen}
    onClose={() => {
      setModalOpen(false);
      setSelectedDdId("");
    }}
    ddId={selectedDdId}
    projectId={currentProjectId}
  />
)}
```

**Step 5: コミット**

```bash
git add app/(with-sidebar)/schema/sequence/page.tsx
git commit -m "feat(sequence): add DD detail modal on participant click"
```

---

## Task 7: エラーハンドリングの追加（sonner toast）

**Files:**
- Modify: `app/(with-sidebar)/schema/sequence/page.tsx`

**Step 1: toastをインポート**

```typescript
import { toast } from "sonner";
```

**Step 2: handleParticipantClickでエラー処理を追加**

```typescript
const handleParticipantClick = async (alias: string) => {
  const ddId = diagramData?.ddMapping[alias];
  if (!ddId) {
    return;
  }

  setSelectedDdId(ddId);
  setModalOpen(true);

  // エラーが発生した場合に備えたtoast（DdDetailDialog内で処理）
  // 必要に応じて追加のエラーハンドリング
};
```

※ DdDetailDialog内でエラーが発生した場合のtoastは、DdDetailDialogコンポーネント内で既にUI表示されているため、追加不要。

**Step 3: コミット**

```bash
git add app/(with-sidebar)/schema/sequence/page.tsx
git commit -m "refactor(sequence): add error handling for DD detail modal"
```

---

## Task 8: 設計書の更新

**Files:**
- Modify: `docs/design/sequence-diagram-feature-plan.md`

**Step 1: Phase 3のステータスを更新**

```markdown
## Phase 3: DDクリックで詳細表示（✅ 実装済み）

### 目的
- シーケンス図上のDD参加者をクリックして詳細を確認
- 設計書（DD）の `details` 内容をモーダルで表示
```

**Step 2: 実装ファイル一覧を追加**

```markdown
#### 実装済みファイル
- `components/schema/DdDetailDialog.tsx` - DD詳細モーダルコンポーネント
- `components/schema/MermaidRenderer.tsx` - クリックイベント追加
- `components/schema/SchemaViewer.tsx` - props追加
- `app/(with-sidebar)/schema/sequence/page.tsx` - モーダル表示ロジック
- `app/api/design-documents/[ddId]/route.ts` - DD詳細取得API
```

**Step 3: コミット**

```bash
git add docs/design/sequence-diagram-feature-plan.md
git commit -m "docs(sequence): update Phase 3 status to implemented"
```

---

## Task 9: MEMORY.mdの更新

**Files:**
- Modify: `/home/test/.claude/projects/-usr-local-src-dev-wsl-personal-pj-req-manager/memory/MEMORY.md`

**Step 1: シーケンス図Phase 3の記録を追加**

```markdown
## シーケンス図機能 (2026-02-11 Phase 1〜3完了)

### Phase 3: DDクリックで詳細表示（2026-02-XX 完了）
- **SVG DOM操作**: Mermaidの `.actor` / `.entity` 要素にクリックイベントを追加
- **ddMapping**: APIレスポンスにエイリアス→DD-IDのマッピングを含める
- **DdDetailDialog**: shadcn/ui Dialog + StructuredSpecViewerでモーダル表示
```

**Step 2: コミット**

```bash
git add /home/test/.claude/projects/-usr-local-src-dev-wsl-personal-pj-req-manager/memory/MEMORY.md
git commit -m "docs(memory): add sequence diagram Phase 3 implementation record"
```

---

## Task 10: E2Eテスト（オプション）

**Files:**
- Create: `tests/e2e/sequence-diagram-phase3.spec.ts`

**Step 1: E2Eテストを作成**

```typescript
import { test, expect } from "@playwright/test";

test("sequence diagram Phase 3: DD detail modal", async ({ page }) => {
  // ダッシュボードからシーケンス図ページへ遷移
  await page.goto("/dashboard");
  await page.click('text="シーケンス図"');

  // システム機能を選択
  await page.click('button:has-text("システム機能を選択してください")');
  await page.click('.system-function-item:first-child');

  // シーケンス図が描画されるのを待つ
  await page.waitForSelector("svg");
  await page.waitForTimeout(1000);

  // DD1をクリック
  const dd1Element = page.locator("svg .actor, svg .entity").filter({ hasText: /DD1/ });
  await dd1Element.click();

  // モーダルが表示されることを確認
  await expect(page.locator('dialog[open="true"]')).toBeVisible();
  await expect(page.locator('dialog')).toContainText("の詳細");

  // モーダルを閉じる
  await page.click('button[aria-label="Close"]');

  // モーダルが閉じることを確認
  await expect(page.locator('dialog[open="true"]')).not.toBeVisible();
});
```

**Step 2: コミット**

```bash
git add tests/e2e/sequence-diagram-phase3.spec.ts
git commit -m "test(e2e): add sequence diagram Phase 3 DD detail modal test"
```

---

## テスト計画

### 単体テスト（必要に応じて追加）

- `MermaidRenderer` の `onParticipantClick` が正しく呼ばれること
- `ddMapping` にないエイリアスをクリックしてもエラーにならないこと

### E2Eテスト

- シーケンス図ページでDDをクリックするとモーダルが開くこと
- モーダル内にDD詳細が表示されること
- 存在しないDD-IDを指定した場合にエラー表示されること

---

## 実装後の確認事項

1. シーケンス図ページでDD1/DD2/DD3をクリックしてモーダルが開くこと
2. モーダル内でI/O・コアロジック・保存/通知などのセクションが表示されること
3. DB/EventBus/FileSystemをクリックしても何も起きないこと
4. ネットワークエラー時にToastエラーが表示されること

---

**Plan complete and saved to `docs/plans/2026-02-11-sequence-diagram-phase3-dd-detail-modal.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
