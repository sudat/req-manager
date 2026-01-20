# Phase 5: 変更要求UI実装計画

## 概要

モックデータを使用している変更要求（チケット）関連ページを、DB連携へ移行します。Phase 4で実装したデータアクセス層をUIに統合します。

### 難易度
```
難易度: ★★☆
根拠: 4 files, ~400 lines, 既存コンポーネント再利用
リスク: Mock/DBの型マッピング、影響範囲選択UIは簡易実装
成功率: 80%
```

---

## 設計決定

### 1. 実装範囲の優先順位

| 優先 | 機能 | 理由 |
|------|------|------|
| 1 | 一覧ページDB連携 | 既存ページの最小変更 |
| 2 | 詳細ページDB連携 | 既存Cardコンポーネント再利用 |
| 3 | 作成ページ実装 | 新規だがパターンあり |
| 4 | 受入条件確認UI | 新規コンポーネント、後回し可能 |

### 2. 影響範囲選択UIの方針

**Phase 5では簡易実装**
- テキスト入力で対象IDを直接指定（カンマ区切り）
- 本格的な選択ダイアログはPhase 5.5以降で実装

### 3. ID形式の違い扱い

| Mock | DB | 扱い |
|------|-----|------|
| `CR-001` | UUID | `ticketId`フィールドでCR-001を保持、内部IDはUUID |

---

## 実装内容

### 5.1 変更要求一覧ページ（DB連携）
**ファイル**: `app/tickets/page.tsx`

#### 現状
- Mockデータ使用 (`@/lib/mock/data` の `tickets`)
- 検索・フィルタはUIのみ

#### 変更内容
```typescript
// 追加 imports
import { listChangeRequests, deleteChangeRequest } from "@/lib/data/change-requests";
import type { ChangeRequest } from "@/lib/domain/value-objects";
import { confirmDelete } from "@/lib/utils/confirm-dialog";

// 状態管理
const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState("");
const [statusFilter, setStatusFilter] = useState<string>("all");

// データ取得
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await listChangeRequests();
    if (error) setError(error);
    else setChangeRequests(data ?? []);
    setLoading(false);
  };
  fetchData();
}, []);

// 検索・フィルタロジック（クライアントサイド）
const filtered = changeRequests.filter(cr => {
  const matchSearch = cr.title.toLowerCase().includes(searchQuery.toLowerCase());
  const matchStatus = statusFilter === "all" || cr.status === statusFilter;
  return matchSearch && matchStatus;
});

// 削除機能
const handleDelete = async (id: string) => {
  const confirmed = await confirmDelete({
    title: "変更要求の削除",
    message: "この変更要求を削除しますか？",
  });
  if (!confirmed) return;

  const { error } = await deleteChangeRequest(id);
  if (error) {
    toast.error("削除に失敗しました");
    return;
  }
  toast.success("削除しました");
  setChangeRequests(prev => prev.filter(cr => cr.id !== id));
};
```

#### 確認項目
- [ ] ローディング状態でSkeleton表示
- [ ] エラー状態でメッセージ表示
- [ ] 検索・フィルタが動作する
- [ ] 削除確認ダイアログ表示

---

### 5.2 変更要求詳細ページ（DB連携）
**ファイル**: `app/tickets/[id]/page.tsx`

#### 現状
- Server Component
- Mockデータ (`getTicketById`)
- 既存Cardコンポーネント使用

#### 変更内容
```typescript
// Server Component として実装
import { getChangeRequestById } from "@/lib/data/change-requests";
import { listImpactScopesByChangeRequestId } from "@/lib/data/impact-scopes";
import { getAcceptanceConfirmationCompletionStatus } from "@/lib/data/acceptance-confirmations";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const { data: changeRequest, error } = await getChangeRequestById(params.id);

  if (error || !changeRequest) {
    return <div>変更要求が見つかりません</div>;
  }

  const { data: impactScopes } = await listImpactScopesByChangeRequestId(params.id);
  const { data: completionStatus } = await getAcceptanceConfirmationCompletionStatus(params.id);

  // 既存Cardコンポーネントにデータを渡す
  return (
    <div>
      <TicketBasicInfoCard changeRequest={changeRequest} />
      <TicketImpactCard impactScopes={impactScopes ?? []} />
      <AcceptanceCompletionStatusCard status={completionStatus} />
    </div>
  );
}
```

#### Cardコンポーネント更新
- `ticket-basic-info-card.tsx`: `ChangeRequest`型を受け取るよう更新
- `ticket-impact-card.tsx`: `ImpactScope[]`型を受け取るよう更新

#### 確認項目
- [ ] 詳細が正しく表示される
- [ ] 北極星KPI達成状況が表示される

---

### 5.3 変更要求作成ページ（DB連携）
**ファイル**: `app/tickets/create/page.tsx`

#### 現状
- フォームUIのみ
- submitハンドラ未実装

#### 変更内容
```typescript
import { createChangeRequest } from "@/lib/data/change-requests";
import { useRouter } from "next/navigation";

export default function CreateTicketPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const ticketId = `CR-${String(Date.now()).slice(-3)}`; // 簡易生成

    const { data, error } = await createChangeRequest({
      ticketId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      background: formData.get("background") as string,
      expectedBenefit: formData.get("expectedBenefit") as string,
      status: "open",
      priority: "medium",
    });

    setSubmitting(false);

    if (error) {
      toast.error("作成に失敗しました");
      return;
    }

    toast.success("変更要求を作成しました");
    router.push(`/tickets/${data.id}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 既存フォームUI */}
      <Input name="title" required />
      <Textarea name="background" required />
      <Textarea name="expectedBenefit" />
      <Button type="submit" disabled={submitting}>
        {submitting ? "作成中..." : "起票"}
      </Button>
    </form>
  );
}
```

#### 確認項目
- [ ] バリデーションが動作する
- [ ] 作成後詳細ページへ遷移する
- [ ] エラー時トースト表示

---

### 5.4 変更要求編集ページ（DB連携）
**ファイル**: `app/tickets/[id]/edit/page.tsx`

#### 実装内容
```typescript
import { getChangeRequestById, updateChangeRequest } from "@/lib/data/change-requests";

export default async function EditTicketPage({ params }: { params: { id: string } }) {
  const { data: changeRequest } = await getChangeRequestById(params.id);

  if (!changeRequest) {
    return <div>変更要求が見つかりません</div>;
  }

  return <TicketEditForm changeRequest={changeRequest} />;
}

// Client Component
function TicketEditForm({ changeRequest }: { changeRequest: ChangeRequest }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const { error } = await updateChangeRequest(changeRequest.id, {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      background: formData.get("background") as string,
      expectedBenefit: formData.get("expectedBenefit") as string,
    });

    setSubmitting(false);

    if (error) {
      toast.error("更新に失敗しました");
      return;
    }

    toast.success("更新しました");
    router.push(`/tickets/${changeRequest.id}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input name="title" defaultValue={changeRequest.title} required />
      {/* 他フィールドも同様 */}
    </form>
  );
}
```

---

## 参照ファイル

### 参照すべき既存実装
| ファイル | 用途 |
|---------|------|
| `app/system-domains/page.tsx` | DB連携・ローディング・エラーハンドリング |
| `app/system-domains/[id]/functions/page.tsx` | フィルタ・削除機能 |
| `components/tickets/*.tsx` | 既存Cardコンポーネント |

### 新規作成ファイル
| ファイル | 用途 |
|---------|------|
| （なし） | 既存ファイルを更新のみ |

---

## 実装順序

1. **一覧ページ** - 最も影響が小さい
2. **詳細ページ** - Server Componentのまま実装
3. **作成ページ** - フォーム実装
4. **編集ページ** - 作成ページのパターンを流用

---

## 検証方法

### TypeScriptビルド
```bash
bun run build
```

### 動作確認（Playwright MCP）
- 一覧ページが表示される
- 検索・フィルタが動作する
- 作成→詳細→編集のフローが動作する

---

## 完了基準

- [ ] 一覧ページがDB連携されている
- [ ] 詳細ページがDB連携されている
- [ ] 作成ページがDB保存する
- [ ] 編集ページがDB更新する
- [ ] TypeScriptビルドが成功する
- [ ] Playwrightで基本フローが通る
