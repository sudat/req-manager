# モデル型設計書のエントリポイントセクション非表示実装計画

## 背景と要件

### ユーザーからの指摘
- エントリポイントは「依存関係のあるコードツリーを調べるための処理の起点」を記述するもの
- モデル（テーブル）は静的なデータ構造であり、処理の起点ではない
- したがって、モデル型（`ioType: "model"`）の設計書にエントリポイントセクションは不要

### PRD準拠性
PRD 3.9では、DDは以下の7種別を定義：
- screen（画面）
- api（API）
- batch（バッチ）
- job（ジョブ）
- external_if（外部I/F）
- **model（モデル）** ← データモデル・ドメインモデル
- report（レポート）

PRDでは「entry_pointを持つ」と記載されているが、モデル型は論理エンティティの構造定義であり、
処理の起点という概念とは整合しない。

## 調査結果

### 現状の実装

#### 1. StructuredSpecViewer（詳細画面）
**ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/components/system-domains/structured-spec-viewer/index.tsx`

```tsx
export function StructuredSpecViewer({ spec, entryPoints }: StructuredSpecViewerProps): ReactNode {
  const isModelType = spec.ioType === "model";  // 35行目: 既に判定変数が存在

  return (
    <div className="space-y-3">
      {/* エントリポイント */}
      <FoldableStructuredSection  // 40-46行目: 常時表示されている
        title="エントリポイント"
        description="処理の起点となるコード位置・コンポーネント"
        titleTooltip="この機能の実装が存在するコードパス（ファイルパス、クラス名、関数名など）を記述します。複数のエントリポイントがある場合はすべて列挙してください。"
      >
        <EntryPointsViewer entryPoints={entryPoints} />
      </FoldableStructuredSection>

      {/* モデル定義（modelタイプの場合のみ） */}
      {isModelType && spec.typeDetail?.ioType === "model" && (  // 49行目: パターン例
        ...
      )}

      {/* 入力スキーマ（モデルタイプ以外） */}
      {!isModelType && (  // 60行目: パターン例
        ...
      )}
    </div>
  );
}
```

**問題点**:
- 他のセクションでは `{!isModelType && ...}` で条件付き表示を実装済み
- エントリポイントセクションだけが無条件で表示されている

#### 2. DesignDocumentCard（編集画面）
**ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/components/forms/design-document/DesignDocumentCard.tsx`

```tsx
function StructuredEditorSection({
  spec,
  entryPoints,
  onChange,
  onEntryPointsChange,
  ...
}: {
  spec: StructuredDesignDocumentSpec;
  entryPoints: EntryPoint[];
  onChange: (next: StructuredDesignDocumentSpec) => void;
  onEntryPointsChange: (entryPoints: EntryPoint[]) => void;
  ...
}): ReactNode {
  return (
    <div className="space-y-4">
      <FoldableStructuredSection  // 1151-1160行目: 常時表示
        title="エントリポイント"
        description="処理の起点となるコード位置・コンポーネントを定義します"
        titleTooltip="この機能の実装が存在するコードパス（ファイルパス、クラス名、関数名など）を記述します。複数のエントリポイントがある場合はすべて列挙してください。"
      >
        <EntryPointsInlineEditor
          entryPoints={entryPoints}
          onChange={onEntryPointsChange}
        />
      </FoldableStructuredSection>

      <FoldableStructuredSection
        title={spec.ioType === "model" ? "エンティティ定義" : "入力スキーマ"}  // 1163行目: 条件分岐例
        ...
      >
      ...
      </FoldableStructuredSection>

      {spec.ioType === "model" && (  // 1303行目: 条件表示例
        <div className="space-y-4">
          ...
        </div>
      )}

      {spec.ioType !== "model" && (  // 1667行目以降: 条件表示例
        ...
      )}
    </div>
  );
}
```

**問題点**:
- エントリポイントセクションが無条件で表示
- 他のセクションでは `spec.ioType === "model"` や `spec.ioType !== "model"` で条件分岐済み

#### 3. データ構造
**型定義**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/value-objects.ts`

```tsx
export interface EntryPoint {
  path: string;
  type: string | null;
  responsibility: string | null;
}
```

**エンティティ**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/entities.ts`

```tsx
export interface DesignDocument {
  id: string;
  srfId: string;
  projectId: string;
  name: string;
  type: DdType;  // "screen" | "api" | "batch" | "job" | "external_if" | "model" | "report"
  summary: string;
  entryPoints: EntryPoint[];  // DB上は全DDタイプで保持
  designPolicy: string;
  details: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

## 実装方針

### 基本原則
1. **表示層のみ修正**: データ構造とDB定義は変更しない
2. **データ保持**: 既存のモデル型DDにエントリポイントデータがあっても、それは残す（削除しない）
3. **一貫性**: 詳細画面と編集画面の両方で同じ条件を適用
4. **後方互換性**: 将来的にモデル型でもエントリポイントを表示したくなった場合、条件分岐を外すだけで復元可能

### データ整合性の方針
- **既存データ**: モデル型DDに既にエントリポイントが登録されている場合、データは削除せず保持
- **表示制御**: UI上で非表示にするのみ
- **保存時**: エントリポイントデータは引き続き保存される（空配列になる可能性はある）
- **理由**: 
  - データマイグレーションのリスク回避
  - 仕様変更時の柔軟性確保
  - 既存の他の機能（検索、影響分析等）への影響を最小化

## 実装手順

### Step 1: StructuredSpecViewer（詳細画面）の修正

**ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/components/system-domains/structured-spec-viewer/index.tsx`

**変更箇所**: 40-46行目

**修正前**:
```tsx
  return (
    <div className="space-y-3">
      {/* エントリポイント */}
      <FoldableStructuredSection
        title="エントリポイント"
        description="処理の起点となるコード位置・コンポーネント"
        titleTooltip="この機能の実装が存在するコードパス（ファイルパス、クラス名、関数名など）を記述します。複数のエントリポイントがある場合はすべて列挙してください。"
      >
        <EntryPointsViewer entryPoints={entryPoints} />
      </FoldableStructuredSection>
```

**修正後**:
```tsx
  return (
    <div className="space-y-3">
      {/* エントリポイント（モデルタイプ以外） */}
      {!isModelType && (
        <FoldableStructuredSection
          title="エントリポイント"
          description="処理の起点となるコード位置・コンポーネント"
          titleTooltip="この機能の実装が存在するコードパス（ファイルパス、クラス名、関数名など）を記述します。複数のエントリポイントがある場合はすべて列挙してください。"
        >
          <EntryPointsViewer entryPoints={entryPoints} />
        </FoldableStructuredSection>
      )}
```

**ポイント**:
- 既存の `isModelType` 変数（35行目）をそのまま利用
- 他のセクションと同じパターン（`{!isModelType && ...}`）で統一
- コメントを更新（「（モデルタイプ以外）」を追加）

### Step 2: DesignDocumentCard（編集画面）の修正

**ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/components/forms/design-document/DesignDocumentCard.tsx`

**変更箇所**: 1151-1160行目（`StructuredEditorSection` 関数内）

**修正前**:
```tsx
  return (
    <div className="space-y-4">
      <FoldableStructuredSection
        title="エントリポイント"
        description="処理の起点となるコード位置・コンポーネントを定義します"
        titleTooltip="この機能の実装が存在するコードパス（ファイルパス、クラス名、関数名など）を記述します。複数のエントリポイントがある場合はすべて列挙してください。"
      >
        <EntryPointsInlineEditor
          entryPoints={entryPoints}
          onChange={onEntryPointsChange}
        />
      </FoldableStructuredSection>
```

**修正後**:
```tsx
  return (
    <div className="space-y-4">
      {/* エントリポイント（モデルタイプ以外） */}
      {spec.ioType !== "model" && (
        <FoldableStructuredSection
          title="エントリポイント"
          description="処理の起点となるコード位置・コンポーネントを定義します"
          titleTooltip="この機能の実装が存在するコードパス（ファイルパス、クラス名、関数名など）を記述します。複数のエントリポイントがある場合はすべて列挙してください。"
        >
          <EntryPointsInlineEditor
            entryPoints={entryPoints}
            onChange={onEntryPointsChange}
          />
        </FoldableStructuredSection>
      )}
```

**ポイント**:
- `spec.ioType !== "model"` で条件分岐（既存の他セクションと同じパターン）
- コメントを追加（「（モデルタイプ以外）」）

## 検証計画

### 検証ケース

#### Case 1: モデル型DD - 詳細画面
**手順**:
1. モデル型（`type: "model"`）のDDを作成または既存のものを選択
2. 詳細画面（`/system/[id]/[srfId]/detail`）で表示を確認

**期待結果**:
- エントリポイントセクションが表示されない
- エンティティ定義セクションが表示される
- その他のセクションは全て非表示（モデル型は入力/出力/コアロジック等を持たない）

#### Case 2: モデル型DD - 編集画面
**手順**:
1. モデル型のDDを編集画面（`/system/[id]/[srfId]/edit`）で開く
2. 設計書セクションのフォームを確認

**期待結果**:
- エントリポイントセクションが表示されない
- エンティティ名、論理名、説明、属性、関連などのフィールドが表示される

#### Case 3: 画面型DD - 詳細画面
**手順**:
1. 画面型（`type: "screen"`）のDDを詳細画面で開く

**期待結果**:
- エントリポイントセクションが表示される
- 入力スキーマ、入力項目、コアロジック、出力スキーマ等が表示される

#### Case 4: API型DD - 編集画面
**手順**:
1. API型（`type: "api"`）のDDを編集画面で開く

**期待結果**:
- エントリポイントセクションが表示され、編集可能
- HTTPメソッド、パス、入力/出力フィールドが編集可能

#### Case 5: バッチ型DD
**手順**:
1. バッチ型（`type: "batch"`）のDDで確認

**期待結果**:
- エントリポイントセクションが表示される
- トリガー、スケジュール等のバッチ固有項目が表示される

#### Case 6: 既存モデル型DDのデータ保持確認
**手順**:
1. DB内で既にエントリポイントを持つモデル型DDを特定（もしあれば）
2. 詳細画面で非表示を確認
3. 編集画面で非表示を確認
4. DB内のデータが削除されていないことを確認

**期待結果**:
- UI上では表示されない
- DB上のデータは保持されている

### E2E テスト（手動確認）

1. **新規作成フロー**
   - システム機能詳細画面で「設計書を追加」
   - 種別を「モデル」に設定
   - エントリポイント入力欄が表示されないことを確認
   - エンティティ定義のフィールドが表示されることを確認

2. **型変更フロー**
   - API型のDDを作成し、エントリポイントを入力
   - 種別を「モデル」に変更
   - エントリポイントセクションが非表示になることを確認
   - 種別を「API」に戻す
   - エントリポイントセクションが再表示され、以前の入力内容が保持されていることを確認

3. **保存・再読み込みフロー**
   - モデル型DDを保存
   - ページをリロード
   - エントリポイントセクションが引き続き非表示であることを確認

## リスクと対策

### リスク1: 既存のモデル型DDに大量のエントリポイントデータがある
**影響度**: 低  
**発生確率**: 低（モデル型は比較的新しい機能のため）  
**対策**: データは削除せず保持。将来必要になった場合は条件分岐を外すだけで復元可能

### リスク2: 他の機能がモデル型DDのエントリポイントに依存している
**影響度**: 中  
**発生確率**: 低  
**対策**: 
- 影響調査機能（`impact_analysis` tool）がエントリポイントを参照している可能性あり
- PRD 6.8では「affectedEntryPoints: Array<{ sfId: string; path: string }>」を返すと記載
- 検証時に影響調査を実行し、モデル型DDのエントリポイントが結果に含まれないことを確認

### リスク3: バリデーションエラー
**影響度**: 低  
**発生確率**: 低  
**対策**: 
- 現在のスキーマでは `entryPoints` は必須フィールドではない（空配列が許容される）
- `DesignDocument` 型では `entryPoints: EntryPoint[]` であり、空配列でも有効

## 実装後の確認事項

### コード品質
- [ ] 両方のファイルで同じ条件分岐パターンを使用している
- [ ] コメントが適切に更新されている
- [ ] 既存の他のセクションの条件分岐パターンと整合している

### 機能確認
- [ ] モデル型DDでエントリポイントが表示されない（詳細画面）
- [ ] モデル型DDでエントリポイントが表示されない（編集画面）
- [ ] 他の種別（screen/api/batch/job/external_if/report）ではエントリポイントが表示される
- [ ] モデル型のエンティティ定義セクションが正常に表示される

### データ確認
- [ ] 既存のモデル型DDのエントリポイントデータが削除されていない
- [ ] 型を変更したときのデータ保持が正しく動作する

### 影響調査
- [ ] 影響調査機能（Mastra tools）がエラーを起こさない
- [ ] モデル型DDが影響範囲に含まれる変更要求で、エントリポイント表示が正しい

## 設計原則の適用

### YAGNI（You Aren't Gonna Need It）
- データマイグレーションは行わない（今は必要ない）
- 複雑な条件分岐は追加しない（単純な `!isModelType` チェックのみ）

### DRY（Don't Repeat Yourself）
- 既存の `isModelType` 変数を再利用（StructuredSpecViewer）
- 既存の条件分岐パターンを踏襲（DesignDocumentCard）

### KISS（Keep It Simple, Stupid）
- 表示層のみの修正
- 既存パターンに従った単純な条件分岐
- データ構造やバリデーションの変更なし

## 難易度評価

**難易度**: ★☆☆  
**根拠**: 
- 修正ファイル数: 2ファイル
- 変更行数概算: 約10行（条件分岐とコメントの追加のみ）
- 影響コンポーネント数: 2コンポーネント（ビューアとエディタ）
- パターン: 既存の条件分岐パターンを踏襲

**リスク**: 
- 既存機能への影響: 極めて低い（表示制御のみ）
- データ整合性: リスクなし（データ削除なし）
- テスト: 手動確認で十分（E2Eテストケースは既存のものを流用可能）

**成功率**: 95%

## 追加の考慮事項

### 将来の拡張性
- エントリポイントが不要な他のDDタイプが追加される可能性
  - その場合: `spec.ioType !== "model" && spec.ioType !== "newType"` のように条件を追加
  - または: `const showEntryPoints = !["model", "newType"].includes(spec.ioType)` で配列管理

### PRDの更新
- PRD 3.9の記述「entry_pointを持つ」が全DD種別に該当する表現になっている
- 実装後、PRDを更新して「model以外はentry_pointを持つ」と明記することを推奨
