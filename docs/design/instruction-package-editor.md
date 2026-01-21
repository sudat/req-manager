# 改修指示パッケージ編集機能 設計書

## 1. 概要

### 1.1 目的
AIが改修指示パッケージをドラフト作成し、業務ユーザーが修正できる機能を提供する。修正後のパッケージを再エクスポートし、コーディングエージェントに再実行させることで、受入条件を満たすまで繰り返し改善できる。

### 1.2 ゴール
- Export画面で改修指示パッケージを編集できる
- 変更対象ファイル、変更意図、受入条件の対応関係を修正できる
- 修正後のパッケージを再ダウンロードできる
- 変更履歴を保存し、修正前後の差分を確認できる

### 1.3 スコープ
- ✅ Export画面への編集機能追加
- ✅ パッケージ構造のビジュアル編集UI
- ✅ 変更履歴の保存と差分表示
- ❌ コーディングエージェントの自動再実行（Phase 2で実装）
- ❌ バージョン管理とロールバック（Phase 2で実装）

---

## 2. ユースケース

### 2.1 NG時のワークフロー

```
1. 業務ユーザーが受入条件をNGにする
   ↓
2. NGの理由を記録（evidenceフィールド）
   ↓
3. Export画面で該当チケットの指示パッケージを開く
   ↓
4. パッケージ編集モードに切り替え
   ↓
5. 変更対象ファイル・変更意図を修正
   ↓
6. 受入条件との対応関係を修正
   ↓
7. 修正内容をプレビュー
   ↓
8. 修正後のパッケージを保存
   ↓
9. 修正後のパッケージを再ダウンロード
   ↓
10. コーディングエージェントに再実行依頼（手動 or 自動）
   ↓
11. 再検証してOK/NG判定
```

### 2.2 ユーザーストーリー

```
業務ユーザーとして、
受入条件がNGになった場合に改修指示パッケージを修正したい。
なぜなら、コーディングエージェントの出力が不正確な場合に、
手動で修正して再実行することで、受入条件を満たせるようにしたいから。
```

---

## 3. アーキテクチャ

### 3.1 全体フロー

```
[Export画面]
    ↓ 「編集」ボタンクリック
[編集モード]
    ├─ 1. 現在のパッケージ内容を取得
    ├─ 2. ビジュアル編集UI表示
    │   ├─ 変更対象ファイル一覧
    │   ├─ 各ファイルの変更意図
    │   └─ 受入条件との対応関係
    ├─ 3. ユーザーが編集
    ├─ 4. プレビュー表示
    ├─ 5. 保存（POST /api/tickets/{id}/instruction-package）
    └─ 6. 再エクスポート（GET /api/tickets/{id}/export）
[Response] 修正後のパッケージをダウンロード
```

### 3.2 データフロー

#### 3.2.1 入力（現在のパッケージ）
```typescript
{
  change_request_id: string;
  version: number;                // パッケージバージョン
  target_files: {
    file_path: string;
    change_intent: string;        // 変更意図
    acceptance_criteria_ids: string[]; // 対応する受入条件ID
  }[];
  constraints: string[];          // 整合性制約
  prohibitions: string[];         // 禁止事項
}
```

#### 3.2.2 出力（編集後のパッケージ）
```typescript
{
  change_request_id: string;
  version: number;                // 新しいバージョン
  previous_version: number;       // 前バージョン
  modified_by: string;            // 編集者
  modified_at: string;            // 編集日時
  modification_reason: string;    // 編集理由（NG理由を引用）
  target_files: {
    file_path: string;
    change_intent: string;
    acceptance_criteria_ids: string[];
  }[];
  constraints: string[];
  prohibitions: string[];
}
```

---

## 4. 実装詳細

### 4.1 データモデル

#### 4.1.1 instruction_packages テーブル（新規作成）
```sql
CREATE TABLE instruction_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  previous_version INT,
  modified_by UUID REFERENCES auth.users(id),
  modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  modification_reason TEXT,
  target_files JSONB NOT NULL,    -- { file_path, change_intent, acceptance_criteria_ids }[]
  constraints TEXT[] NOT NULL,
  prohibitions TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(change_request_id, version)
);

CREATE INDEX idx_instruction_packages_change_request ON instruction_packages(change_request_id, version DESC);
```

#### 4.1.2 target_filesのスキーマ
```typescript
type TargetFile = {
  file_path: string;
  change_intent: string;
  acceptance_criteria_ids: string[];
  is_new: boolean;               // 新規作成ファイルか
  is_deleted: boolean;           // 削除予定ファイルか
  dependencies: string[];        // 依存ファイルパス
};
```

### 4.2 APIエンドポイント

#### 4.2.1 GET /api/tickets/{id}/instruction-package

現在のパッケージ（最新バージョン）を取得する。

**Response**
```typescript
{
  id: string;
  version: number;
  target_files: TargetFile[];
  constraints: string[];
  prohibitions: string[];
  acceptance_criteria: {
    id: string;
    description: string;
    status: 'ok' | 'ng';
    evidence: string;
  }[];
}
```

#### 4.2.2 POST /api/tickets/{id}/instruction-package

編集後のパッケージを保存する。

**Request Body**
```typescript
{
  modification_reason: string;
  target_files: TargetFile[];
  constraints: string[];
  prohibitions: string[];
}
```

**Response**
```typescript
{
  success: boolean;
  new_version: number;
  message: string;
}
```

#### 4.2.3 GET /api/tickets/{id}/instruction-package/diff?v1={version1}&v2={version2}

2つのバージョン間の差分を取得する。

**Response**
```typescript
{
  added_files: TargetFile[];
  removed_files: TargetFile[];
  modified_files: {
    file_path: string;
    old_change_intent: string;
    new_change_intent: string;
    old_acceptance_criteria_ids: string[];
    new_acceptance_criteria_ids: string[];
  }[];
  added_constraints: string[];
  removed_constraints: string[];
  added_prohibitions: string[];
  removed_prohibitions: string[];
}
```

### 4.3 UI実装

#### 4.3.1 Export画面への編集ボタン追加

**対象ファイル**: `app/tickets/export/page.tsx` （新規作成予定のファイル）

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InstructionPackageEditor } from '@/components/tickets/instruction-package-editor';

export default function ExportPage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">改修指示パッケージ</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? '閲覧モード' : '編集モード'}
          </Button>
          <Button variant="outline">ダウンロード</Button>
        </div>
      </div>

      {isEditing ? (
        <InstructionPackageEditor changeRequestId={changeRequestId} />
      ) : (
        <InstructionPackageViewer changeRequestId={changeRequestId} />
      )}
    </div>
  );
}
```

#### 4.3.2 InstructionPackageEditor コンポーネント

**対象ファイル**: `components/tickets/instruction-package-editor.tsx` （新規作成）

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TargetFile {
  file_path: string;
  change_intent: string;
  acceptance_criteria_ids: string[];
  is_new: boolean;
  is_deleted: boolean;
  dependencies: string[];
}

export function InstructionPackageEditor({ changeRequestId }: { changeRequestId: string }) {
  const [targetFiles, setTargetFiles] = useState<TargetFile[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [prohibitions, setProhibitions] = useState<string[]>([]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<any[]>([]);
  const [modificationReason, setModificationReason] = useState('');

  useEffect(() => {
    fetchPackage();
  }, [changeRequestId]);

  const fetchPackage = async () => {
    const response = await fetch(`/api/tickets/${changeRequestId}/instruction-package`);
    const data = await response.json();
    setTargetFiles(data.target_files);
    setConstraints(data.constraints);
    setProhibitions(data.prohibitions);
    setAcceptanceCriteria(data.acceptance_criteria);
  };

  const handleSave = async () => {
    const response = await fetch(`/api/tickets/${changeRequestId}/instruction-package`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modification_reason: modificationReason,
        target_files: targetFiles,
        constraints,
        prohibitions,
      }),
    });

    const result = await response.json();

    if (result.success) {
      toast.success(`パッケージを保存しました（バージョン: ${result.new_version}）`);
    } else {
      toast.error('パッケージの保存に失敗しました');
    }
  };

  const handleFileChange = (index: number, field: string, value: any) => {
    const updated = [...targetFiles];
    updated[index] = { ...updated[index], [field]: value };
    setTargetFiles(updated);
  };

  const handleAddFile = () => {
    setTargetFiles([
      ...targetFiles,
      {
        file_path: '',
        change_intent: '',
        acceptance_criteria_ids: [],
        is_new: true,
        is_deleted: false,
        dependencies: [],
      },
    ]);
  };

  const handleRemoveFile = (index: number) => {
    setTargetFiles(targetFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* 編集理由 */}
      <Card>
        <CardHeader>
          <CardTitle>編集理由</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="なぜこのパッケージを編集するのか理由を記載してください"
            value={modificationReason}
            onChange={(e) => setModificationReason(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* 変更対象ファイル */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>変更対象ファイル</CardTitle>
          <Button onClick={handleAddFile} size="sm">
            ファイル追加
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {targetFiles.map((file, index) => (
            <div key={index} className="border p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  {/* ファイルパス */}
                  <div>
                    <label className="text-sm font-medium">ファイルパス</label>
                    <Input
                      value={file.file_path}
                      onChange={(e) => handleFileChange(index, 'file_path', e.target.value)}
                      placeholder="src/components/example.tsx"
                    />
                  </div>

                  {/* 変更意図 */}
                  <div>
                    <label className="text-sm font-medium">変更意図</label>
                    <Textarea
                      value={file.change_intent}
                      onChange={(e) => handleFileChange(index, 'change_intent', e.target.value)}
                      placeholder="このファイルを変更する理由と、達成したいこと"
                    />
                  </div>

                  {/* 受入条件との対応 */}
                  <div>
                    <label className="text-sm font-medium">対応する受入条件</label>
                    <div className="space-y-2 mt-2">
                      {acceptanceCriteria.map((criteria) => (
                        <div key={criteria.id} className="flex items-start gap-2">
                          <Checkbox
                            checked={file.acceptance_criteria_ids.includes(criteria.id)}
                            onCheckedChange={(checked) => {
                              const ids = checked
                                ? [...file.acceptance_criteria_ids, criteria.id]
                                : file.acceptance_criteria_ids.filter((id) => id !== criteria.id);
                              handleFileChange(index, 'acceptance_criteria_ids', ids);
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{criteria.description}</span>
                              <Badge variant={criteria.status === 'ok' ? 'default' : 'destructive'}>
                                {criteria.status.toUpperCase()}
                              </Badge>
                            </div>
                            {criteria.status === 'ng' && criteria.evidence && (
                              <p className="text-xs text-muted-foreground mt-1">
                                NG理由: {criteria.evidence}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  className="ml-2"
                >
                  削除
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 整合性制約 */}
      <Card>
        <CardHeader>
          <CardTitle>整合性制約</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={constraints.join('\n')}
            onChange={(e) => setConstraints(e.target.value.split('\n').filter(Boolean))}
            placeholder="影響を受ける他ファイルとの整合性制約を記載"
            rows={5}
          />
        </CardContent>
      </Card>

      {/* 禁止事項 */}
      <Card>
        <CardHeader>
          <CardTitle>禁止事項</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={prohibitions.join('\n')}
            onChange={(e) => setProhibitions(e.target.value.split('\n').filter(Boolean))}
            placeholder="コーディング時の禁止事項を記載"
            rows={5}
          />
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={fetchPackage}>
          リセット
        </Button>
        <Button onClick={handleSave} disabled={!modificationReason}>
          保存
        </Button>
      </div>
    </div>
  );
}
```

#### 4.3.3 差分表示コンポーネント

**対象ファイル**: `components/tickets/instruction-package-diff.tsx` （新規作成）

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function InstructionPackageDiff({
  changeRequestId,
  version1,
  version2,
}: {
  changeRequestId: string;
  version1: number;
  version2: number;
}) {
  const [diff, setDiff] = useState<any>(null);

  useEffect(() => {
    fetchDiff();
  }, [version1, version2]);

  const fetchDiff = async () => {
    const response = await fetch(
      `/api/tickets/${changeRequestId}/instruction-package/diff?v1=${version1}&v2=${version2}`
    );
    const data = await response.json();
    setDiff(data);
  };

  if (!diff) return <div>読み込み中...</div>;

  return (
    <div className="space-y-4">
      {/* 追加されたファイル */}
      {diff.added_files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="default">追加</Badge>
              追加されたファイル
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {diff.added_files.map((file: any) => (
                <li key={file.file_path} className="text-sm text-green-600">
                  + {file.file_path}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 削除されたファイル */}
      {diff.removed_files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="destructive">削除</Badge>
              削除されたファイル
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {diff.removed_files.map((file: any) => (
                <li key={file.file_path} className="text-sm text-red-600">
                  - {file.file_path}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 変更されたファイル */}
      {diff.modified_files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="outline">変更</Badge>
              変更されたファイル
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {diff.modified_files.map((file: any) => (
                <li key={file.file_path} className="border-l-2 border-blue-400 pl-3">
                  <div className="font-medium text-sm">{file.file_path}</div>
                  {file.old_change_intent !== file.new_change_intent && (
                    <div className="mt-1 text-xs">
                      <div className="text-red-600">- {file.old_change_intent}</div>
                      <div className="text-green-600">+ {file.new_change_intent}</div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## 5. エクスポート機能

### 5.1 パッケージのフォーマット

改修指示パッケージは以下のフォーマットでエクスポートする。

**ファイル名**: `instruction-package-{change_request_id}-v{version}.md`

**内容**:
```markdown
# 改修指示パッケージ

## メタ情報
- 変更依頼ID: {change_request_id}
- パッケージバージョン: {version}
- 最終更新日時: {modified_at}
- 最終更新者: {modified_by}
- 編集理由: {modification_reason}

## 変更の背景と目的
{change_request.background}

## 期待効果
{change_request.expected_effect}

## 変更対象ファイル

### 1. {file_path}
- **変更意図**: {change_intent}
- **対応する受入条件**:
  - [{criteria_id}] {criteria_description}
- **依存ファイル**: {dependencies}

### 2. ...

## 整合性制約
- {constraint_1}
- {constraint_2}

## 禁止事項
- {prohibition_1}
- {prohibition_2}

## 受入条件
| ID | 説明 | ステータス | エビデンス |
|----|------|----------|----------|
| {id} | {description} | {status} | {evidence} |
```

### 5.2 エクスポートAPIエンドポイント

#### GET /api/tickets/{id}/export?version={version}

指定バージョンのパッケージをMarkdown形式でエクスポートする。

**Query Parameters**:
- `version` (optional): バージョン番号（省略時は最新バージョン）

**Response**:
- Content-Type: `text/markdown`
- Content-Disposition: `attachment; filename="instruction-package-{id}-v{version}.md"`

---

## 6. セキュリティ

### 6.1 認証・認可
- 編集操作は変更依頼の作成者のみ可能
- 閲覧は関係者（作成者 + レビュー担当者）のみ可能

### 6.2 変更履歴の保護
- 過去バージョンの削除は不可（論理削除のみ）
- 変更履歴の改ざん防止（updated_atを監視）

---

## 7. パフォーマンス

### 7.1 バージョン数の上限
- 1つの変更依頼につき最大100バージョンまで
- 古いバージョンはアーカイブ（別テーブルに移動）

### 7.2 差分計算の最適化
- JSONBの差分計算はアプリケーション層で実施
- 大量のファイルがある場合はページング

---

## 8. テスト戦略

### 8.1 ユニットテスト
- パッケージ保存のテスト
- 差分計算のテスト
- バージョン管理のテスト

### 8.2 E2Eテスト（Playwright）
1. Export画面を開く
2. 「編集モード」ボタンをクリック
3. ファイルパスと変更意図を編集
4. 受入条件との対応を変更
5. 保存ボタンをクリック
6. バージョンが更新されることを確認
7. ダウンロードボタンをクリック
8. Markdownファイルがダウンロードされることを確認

---

## 9. マイルストーン

### Phase 1（MVP）
- [ ] `instruction_packages` テーブル作成
- [ ] GET /api/tickets/{id}/instruction-package 実装
- [ ] POST /api/tickets/{id}/instruction-package 実装
- [ ] InstructionPackageEditor コンポーネント実装
- [ ] Export画面への編集ボタン追加
- [ ] Markdownエクスポート機能

### Phase 2（拡張）
- [ ] 差分表示機能（InstructionPackageDiff）
- [ ] バージョン履歴の一覧表示
- [ ] ロールバック機能
- [ ] コーディングエージェントの自動再実行

---

## 10. 参考資料

- PRD 6.5.3節: 改修指示パッケージの必要要素
- PRD 7.2節: 検証と修正のフィードバックループ
