# FK参照設定UI改善計画

## Context（背景・目的）

DDのモデル機能において、FK（外部キー）参照設定のUIに以下の課題がある：

1. **FK設定ダイアログの情報不足**: カラム一覧で、どのカラムがPK（主キー）、UK（UNIQUE）、NN（Not Null）かが分からず、適切なFK参照先を選びにくい
2. **FK設定状態の視覚的フィードバック不足**: FK参照を設定しても、ボタンの見た目が変わらず、どのエンティティを参照しているか分からない
3. **制約フィールドの混在**: 「追加の制約・参照」フィールドにFK参照とCHECK制約が混在し、管理しにくい

これらを改善し、FK参照設定の操作性と視認性を向上させる。

## 要件

### 1. FK設定ダイアログのカラム一覧にタグ表示
- **PK（主キー）**: `primaryKey=true` の場合に表示
- **NN（Not Null）**: `nullable=false` または未設定の場合に表示
- **UK（Unique）**: `unique=true` の場合に表示

### 2. FK参照設定ボタンの右にFK参照タグを表示
- FK参照が設定されている場合、ボタンの右に `→ EntityName.attributeName` 形式のタグを表示
- 例: `FK参照設定 → products.id`

### 3. 「追加の制約・参照」フィールドを分離
- **FK参照**: 読み取り専用のタグ表示エリアに移動（削除ボタン付き）
- **CHECK制約**: 新しい「CHECK制約」入力フィールドを追加
- 既存の `constraints` フィールド内でFK参照とCHECK制約を混在管理（スキーマ変更不要）

## 実装方針

### データ格納方式
- **既存方式を維持**: `constraints` フィールドに `"FK: xxx.yyy"` 形式で格納
- **後方互換性**: 既存データはそのまま動作（データ移行不要）
- **分離表示**: UIレベルでFK参照とCHECK制約を分離

### タグデザイン
| タグ | variant | 用途 |
|------|---------|------|
| PK | default（青） | 主キー |
| NN | secondary（グレー） | Not Null |
| UK | outline（白地黒枠） | Unique制約 |
| FK参照 | outline | `→ EntityName.attributeName` |

## 実装内容

### Phase 1: ユーティリティ関数の追加

**ファイル**: `components/forms/design-document/DesignDocumentCard.tsx`（先頭付近）

FK参照情報を抽出・管理する関数を追加：

```typescript
// constraints から FK参照情報を抽出
const extractForeignKeyReference = (constraints?: string): { entity: string; attribute: string } | null => {
  if (!constraints) return null;
  const match = constraints.match(/^FK:\s*(\w+)\.(\w+)$/m);
  if (!match) return null;
  return { entity: match[1], attribute: match[2] };
};

// constraints から FK以外の制約（CHECK制約）を抽出
const extractCheckConstraints = (constraints?: string): string => {
  if (!constraints) return '';
  if (constraints.startsWith('FK:')) {
    // FK参照の行を除外して残りを返す
    const lines = constraints.split('\n');
    return lines.slice(1).join('\n').trim();
  }
  return constraints;
};
```

### Phase 2: FK設定ダイアログのカラム一覧にタグ表示

**ファイル**: `components/forms/design-document/DesignDocumentCard.tsx` (415-432行)

**変更内容**:
```tsx
// 変更前
<div className="font-medium">{attr.name}</div>

// 変更後
<div className="flex items-center gap-2">
  <span className="font-medium">{attr.name}</span>
  <div className="flex gap-1">
    {attr.primaryKey && <Badge variant="default" className="text-xs">PK</Badge>}
    {(attr.nullable === false || attr.nullable === undefined) &&
      <Badge variant="secondary" className="text-xs">NN</Badge>}
    {attr.unique && <Badge variant="outline" className="text-xs">UK</Badge>}
  </div>
</div>
```

### Phase 3: FK参照設定ボタンにFK参照タグを追加

**ファイル**: `components/forms/design-document/DesignDocumentCard.tsx` (1269-1275行)

**変更内容**:
```tsx
// 変更前
<Button variant="outline" size="sm" onClick={() => onOpenFkDialog(attrIndex)}>
  FK参照設定
</Button>

// 変更後
<div className="flex items-center gap-2">
  <Button variant="outline" size="sm" onClick={() => onOpenFkDialog(attrIndex)}>
    FK参照設定
  </Button>
  {(() => {
    const fkRef = extractForeignKeyReference(attr.constraints);
    return fkRef ? (
      <Badge variant="outline" className="text-xs flex items-center gap-1">
        <span className="text-muted-foreground">→</span>
        {fkRef.entity}.{fkRef.attribute}
      </Badge>
    ) : null;
  })()}
</div>
```

### Phase 4: 制約フィールドの分離

**ファイル**: `components/forms/design-document/DesignDocumentCard.tsx` (1164-1182行)

**変更内容**: 「追加の制約・参照」フィールドを2つのセクションに分離

#### 4-1. FK参照の表示（読み取り専用）
```tsx
{/* FK参照の表示（読み取り専用、タグ形式） */}
{(() => {
  const fkRef = extractForeignKeyReference(attr.constraints);
  return fkRef ? (
    <div className="space-y-1">
      <Label className="text-xs">FK参照</Label>
      <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
        <Badge variant="outline" className="text-xs">
          → {fkRef.entity}.{fkRef.attribute}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // FK参照をクリア
            updateStructuredSpec((current) => ({
              ...current,
              typeDetail: {
                ioType: "model",
                ...(current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
                  i === attrIndex ? { ...a, constraints: extractCheckConstraints(a.constraints) } : a
                ) || [],
              },
            }));
          }}
          className="ml-auto h-6 text-xs"
        >
          削除
        </Button>
      </div>
    </div>
  ) : null;
})()}
```

#### 4-2. CHECK制約フィールド
```tsx
{/* CHECK制約（FK参照を除外） */}
<div className="space-y-1">
  <Label className="text-xs">CHECK制約</Label>
  <Input
    value={extractCheckConstraints(attr.constraints)}
    onChange={(e) => {
      const fkRef = extractForeignKeyReference(attr.constraints);
      const newConstraints = e.target.value
        ? (fkRef ? `FK: ${fkRef.entity}.${fkRef.attribute}\n${e.target.value}` : e.target.value)
        : (fkRef ? `FK: ${fkRef.entity}.${fkRef.attribute}` : '');

      updateStructuredSpec((current) => ({
        ...current,
        typeDetail: {
          ioType: "model",
          ...(current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
          attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
            i === attrIndex ? { ...a, constraints: newConstraints } : a
          ) || [],
        },
      }));
    }}
    placeholder="例: CHECK (age >= 0)"
  />
</div>
```

### Phase 5: 閲覧ビューの改善（オプション）

**ファイル**: `components/system-domains/structured-spec-viewer/ModelDetailViewer.tsx` (78-82行)

**変更内容**: FK参照とCHECK制約を別々のBadgeで表示

```tsx
// 変更前
{attr.constraints && (
  <Badge variant="outline" className="text-xs">
    {attr.constraints}
  </Badge>
)}

// 変更後
{(() => {
  const fkRef = extractForeignKeyReference(attr.constraints);
  const checkConstraints = extractCheckConstraints(attr.constraints);

  return (
    <>
      {fkRef && (
        <Badge variant="outline" className="text-xs">
          → {fkRef.entity}.{fkRef.attribute}
        </Badge>
      )}
      {checkConstraints && (
        <Badge variant="secondary" className="text-xs">
          {checkConstraints}
        </Badge>
      )}
    </>
  );
})()}
```

**注意**: Phase 5では `extractForeignKeyReference` と `extractCheckConstraints` をユーティリティファイル（例: `lib/utils/foreign-key-helpers.ts`）に切り出して共通化することを推奨。

## Critical Files

実装において最も重要なファイル：

1. **`components/forms/design-document/DesignDocumentCard.tsx`**
   - FK設定ダイアログ（415-432行）
   - FK参照設定ボタン（1269-1275行）
   - 制約フィールド（1164-1182行）
   - メインの実装ファイル

2. **`components/system-domains/structured-spec-viewer/ModelDetailViewer.tsx`**
   - 閲覧ビューのFK参照表示（78-82行）
   - オプション：Phase 5で改善

3. **`lib/domain/schemas/model-detail.ts`**
   - `ModelAttribute` 型の定義
   - 参照用（変更不要）

4. **`components/ui/badge.tsx`**
   - Badgeコンポーネント
   - 参照用（変更不要）

## リスク評価

**難易度**: ★★☆（成功率85%）

**根拠**:
- 修正ファイル数: 2-3ファイル
- 変更行数概算: 100-150行
- 影響コンポーネント数: 2コンポーネント（編集UI + 閲覧UI）
- データ構造の変更なし（既存データとの互換性維持）

**リスク**:
1. **レイアウト崩れ**: タグの追加でレイアウトが崩れる可能性（特にモバイル表示）
2. **複雑な制約の扱い**: FK参照とCHECK制約が複数行にわたる場合の処理
3. **正規表現の限界**: FK参照の形式が `FK: EntityName.attributeName` 以外の場合に対応できない

**対策**:
1. レスポンシブデザインの確認（`flex-wrap` 対応）
2. FK参照とCHECK制約の区切りを改行で明確化
3. FK参照の正規表現パターンをマルチラインモード（`/m`フラグ）で対応

## 段階的リリース計画

### Phase 1-3（優先度: 高）
- FK設定ダイアログのタグ表示
- FK参照設定ボタンのタグ表示
- **リリース判断**: ここまでで主要な改善は達成、フィードバック収集可能

### Phase 4（優先度: 中）
- 制約フィールドの分離
- **リリース判断**: ユーザーのフィードバックを得てから実装

### Phase 5（優先度: 低）
- 閲覧ビューの改善
- ユーティリティ関数の共通化

## Verification（検証手順）

### 1. FK設定ダイアログのタグ表示確認
1. モデルタイプのDDを編集画面で開く
2. 属性を追加し、PrimaryKey、NotNull、Uniqueをそれぞれ設定
3. FK参照設定ダイアログを開く
4. 参照先モデルのカラム一覧でPK、NN、UKタグが正しく表示されることを確認

### 2. FK参照タグ表示確認
1. FK参照設定ダイアログで参照先を選択
2. FK参照設定ボタンの右に `→ EntityName.attributeName` タグが表示されることを確認
3. FK参照を削除して、タグが消えることを確認

### 3. 制約フィールドの分離確認
1. FK参照を設定した属性で、「FK参照」エリアに読み取り専用タグが表示されることを確認
2. 「CHECK制約」フィールドにCHECK制約を入力できることを確認
3. FK参照の「削除」ボタンでFK参照のみが削除され、CHECK制約は残ることを確認

### 4. 既存データとの互換性確認
1. 既存のDDで `constraints` に `"FK: xxx.yyy"` が入っているデータを開く
2. FK参照が正しく表示・編集できることを確認
3. CHECK制約のみのデータも正しく表示・編集できることを確認

### 5. ブラウザ動作確認
- URL: http://localhost:3000/system/AR/SF-AR-0001/edit/design-documents
- モデルタイプのDD（例: 請求書テーブル）で上記の検証を実施
