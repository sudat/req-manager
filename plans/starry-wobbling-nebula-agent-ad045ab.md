# DDモデル機能の3つのバグ修正計画

## 概要

DDの「モデル」機能に関する以下3つのバグを修正します：

1. **バグ①**: 照会画面でモデルタイプなのに入力/出力スキーマセクションが表示される
2. **バグ②**: 編集画面でDDタイプを切り替えるとモデルのtypeDetailデータが消失する
3. **バグ③**: FK関連設定ダイアログでカラムが表示されない（バグ②の副作用）

## 根本原因の分析

### バグ①の原因
`components/system-domains/structured-spec-viewer/index.tsx` (59-96行)で、入力/出力スキーマセクションが条件分岐なしで常に表示される。エンティティ定義セクション（48-56行）は正しく`isModelType`で条件分岐されているが、スキーマセクションには適用されていない。

### バグ②の原因（最重要）
`lib/utils/design-documents/structured-compat.ts` の`syncStructuredSpecToDdType`関数（66-87行）で、以下の問題が発生：

1. 74行で`typeDetail: undefined`として強制クリア
2. 77-82行の`isCoreIoType`分岐で、コアI/Oタイプ（api/screen/batch/job）の場合のみinputSchema/outputSchemaを復旧
3. モデルタイプは`isCoreIoType`がfalseなので、typeDetailが未復旧のまま返される

**設計意図の推測**:
- この関数は「DDタイプ切り替え時に、新しいタイプに合わないデータをクリアする」役割
- コアI/Oタイプ（api/screen/batch/job）とその他タイプ（model/external_if/report）で扱いが異なる
- コアI/Oタイプ: inputSchema/outputSchemaを使用
- モデルタイプ: typeDetailを使用
- しかし、**モデルタイプの場合のtypeDetail復旧ロジックが欠落している**

### バグ③の原因
バグ②によりtypeDetailが消失しているため、FK設定ダイアログでattributesが空配列になる。バグ②を修正すれば自動的に解決する。

## 修正方針

### 1. バグ②の修正（最優先）

**ファイル**: `lib/utils/design-documents/structured-compat.ts`

**修正内容**:
`syncStructuredSpecToDdType`関数に、モデルタイプの場合のtypeDetail保持・復旧ロジックを追加。

```typescript
export function syncStructuredSpecToDdType(
  spec: StructuredDesignDocumentSpec,
  ddType: DdType
): StructuredDesignDocumentSpec {
  const nextIoType = ddTypeToStructuredIoType(ddType);
  
  // 既存のtypeDetailを保存（同じioTypeの場合は復旧する）
  const prevTypeDetail = spec.typeDetail?.ioType === nextIoType ? spec.typeDetail : undefined;
  
  const synced: StructuredDesignDocumentSpec = {
    ...spec,
    ioType: nextIoType,
    typeDetail: undefined,  // 一旦クリア
  };

  if (isCoreIoType(nextIoType)) {
    // コアI/Oタイプ（api/screen/batch/job）の場合
    const empty = createEmptyStructuredDesignDocumentSpec(nextIoType);
    if (!synced.inputSchema) synced.inputSchema = empty.inputSchema;
    if (!synced.outputSchema) synced.outputSchema = empty.outputSchema;
    synced.inputSchema = synced.inputSchema;
    synced.outputSchema = synced.outputSchema;
    synced.typeDetail = prevTypeDetail;  // 同じioTypeなら復旧
  } else {
    // モデル等の非コアI/Oタイプの場合
    synced.inputSchema = undefined;
    synced.outputSchema = undefined;
    synced.typeDetail = prevTypeDetail;  // 同じioTypeなら復旧
  }

  return synced;
}
```

**修正のポイント**:
- typeDetailを一旦undefinedにするのは既存設計を維持
- `prevTypeDetail`として、変更前と同じioTypeの場合は保存
- コアI/Oタイプでも非コアI/Oタイプでも、同じioTypeならtypeDetailを復旧
- これにより、modelからmodelへの切り替え（実質的には再同期）でデータが保持される

### 2. バグ①の修正

**ファイル**: `components/system-domains/structured-spec-viewer/index.tsx`

**修正内容**:
入力/出力スキーマセクションに、モデルタイプの場合の非表示条件を追加。

```typescript
{/* 入力スキーマ（モデルタイプ以外） */}
{!isModelType && (
  <FoldableStructuredSection
    title="入力スキーマ"
    description="処理の入口となる振る舞い・経路・条件"
    titleTooltip="操作の入口条件を記述します。画面なら操作対象・トリガー・前提条件、APIならメソッドとパスなど「どう始まるか」を書きます。"
  >
    <InputSchemaViewer
      inputSchema={spec.inputSchema}
      ioType={spec.ioType}
      elements={screenElements}
    />
  </FoldableStructuredSection>
)}

{/* 入力項目（モデルタイプ以外） */}
{!isModelType && (
  <FoldableStructuredSection
    title="入力項目（データ）"
    description="実際に受け取るデータ項目"
    titleTooltip="受け取る実データの項目を記述します。1タグ=1項目として、名前・型・必須有無・説明を定義してください。"
  >
    <FieldsViewer fields={spec.inputFields} emptyMessage="未設定" />
  </FoldableStructuredSection>
)}

{/* コアロジック（モデルタイプ以外） */}
{!isModelType && (
  <FoldableStructuredSection
    title="コアロジック"
    description="入力から出力への処理ルール"
    titleTooltip="入力データを出力データに変換する際に適用されるビジネスルール（検証、計算、状態遷移、判定、集約等）を記述します。"
  >
    <CoreLogicViewer coreLogic={spec.coreLogic} />
  </FoldableStructuredSection>
)}

{/* 出力スキーマ（モデルタイプ以外） */}
{!isModelType && (
  <FoldableStructuredSection
    title="出力スキーマ"
    description="処理結果として返す振る舞い・ステータス"
    titleTooltip="処理後の振る舞いを記述します。画面なら遷移先・表示メッセージ、APIなら成功/エラーのステータスコードなどを定義してください。"
  >
    <OutputSchemaViewer outputSchema={spec.outputSchema} ioType={spec.ioType} />
  </FoldableStructuredSection>
)}

{/* 出力項目（モデルタイプ以外） */}
{!isModelType && (
  <FoldableStructuredSection
    title="出力項目（データ）"
    description="実際に返却・表示するデータ項目"
    titleTooltip="返却・表示する実データの項目を記述します。1タグ=1項目として、名前・型・必須有無・説明を定義してください。"
  >
    <FieldsViewer fields={spec.outputFields} emptyMessage="未設定" />
  </FoldableStructuredSection>
)}

{/* 副作用（モデルタイプ以外） */}
{!isModelType && (
  <FoldableStructuredSection
    title="副作用"
    description="DB更新・外部連携・イベント発行"
    titleTooltip="この機能の実行により発生する外部への影響を記述します。DB更新、外部API呼び出し、イベント発行などを具体化してください。"
  >
    <SideEffectsViewer sideEffects={spec.sideEffects} />
  </FoldableStructuredSection>
)}

{/* 例外（モデルタイプ以外） */}
{!isModelType && (
  <FoldableStructuredSection
    title="例外"
    description="エラー発生時の挙動"
    titleTooltip="想定されるエラー条件、エラーコード、HTTPステータス、ユーザー向けメッセージ、リカバリ方針を記述します。"
  >
    <ExceptionsViewer exceptions={spec.exceptions} />
  </FoldableStructuredSection>
)}

{/* 非機能要件（モデルタイプ以外） */}
{!isModelType && (
  <FoldableStructuredSection
    title="非機能要件"
    description="性能、セキュリティ、可用性など"
    titleTooltip="機能以外の品質要件を記述します。応答時間、稼働率、認証/認可など、運用上の基準を明示してください。"
  >
    <NonFunctionalViewer nonFunctional={spec.nonFunctional} />
  </FoldableStructuredSection>
)}
```

**修正のポイント**:
- モデルタイプは「エンティティ定義」のみを表示し、I/O・ロジック・副作用・例外・非機能要件は表示しない
- 既存の`isModelType`変数を活用
- エントリポイントセクションはすべてのタイプで共通なので条件分岐不要

### 3. バグ③の対応（防御的実装）

**ファイル**: `components/forms/design-document/DesignDocumentCard.tsx`

バグ②を修正すれば自動的に解決するが、防御的に以下を追加：

```typescript
{fkSelectedModelId ? (
  (() => {
    const selectedModel = modelTypeDDs.find((dd) => dd.id === fkSelectedModelId);
    const attributes =
      selectedModel?.structuredSpec?.typeDetail?.ioType === "model"
        ? selectedModel.structuredSpec.typeDetail.attributes || []
        : [];
    const entityName =
      selectedModel?.structuredSpec?.typeDetail?.ioType === "model"
        ? selectedModel.structuredSpec.typeDetail.entityName
        : selectedModel?.name || "";

    // データが正しく取得できない場合の警告
    if (!selectedModel) {
      return <p className="text-sm text-destructive p-2">選択したモデルが見つかりません</p>;
    }
    if (!selectedModel.structuredSpec?.typeDetail) {
      return <p className="text-sm text-destructive p-2">モデルのデータが読み込めません。編集画面で保存し直してください。</p>;
    }
    if (attributes.length === 0) {
      return <p className="text-sm text-muted-foreground p-2">属性が登録されていません</p>;
    }

    return attributes.map((attr, idx) => (
      // ... 既存のコード
    ));
  })()
) : (
  <p className="text-sm text-muted-foreground p-2">モデルを選択してください</p>
)}
```

**修正のポイント**:
- バグ②修正後も、データが不正な場合のエラーメッセージを改善
- ユーザーに「保存し直してください」と具体的なリカバリ手順を提示

## テスト計画

### 単体テスト追加

**ファイル**: `tests/unit/utils/design-document-structured-compat.test.ts`

```typescript
it("preserves model typeDetail when syncing model to model", () => {
  const modelSpec: StructuredDesignDocumentSpec = {
    version: "1",
    ioType: "model",
    typeDetail: {
      ioType: "model",
      entityName: "Order",
      entityDescription: "注文エンティティ",
      attributes: [
        { name: "id", type: "UUID", primaryKey: true },
        { name: "amount", type: "number" },
      ],
      relationships: [
        { target: "Customer", type: "N:1", description: "顧客との関連" },
      ],
    },
    inputFields: [],
    coreLogic: { rules: [] },
    outputFields: [],
    sideEffects: { description: "副作用なし" },
    exceptions: [],
    nonFunctional: {},
  };

  const synced = syncStructuredSpecToDdType(modelSpec, "model");

  expect(synced.ioType).toBe("model");
  expect(synced.typeDetail?.ioType).toBe("model");
  if (synced.typeDetail?.ioType === "model") {
    expect(synced.typeDetail.entityName).toBe("Order");
    expect(synced.typeDetail.attributes).toHaveLength(2);
    expect(synced.typeDetail.relationships).toHaveLength(1);
  }
  // inputSchema/outputSchemaはクリアされるべき
  expect(synced.inputSchema).toBeUndefined();
  expect(synced.outputSchema).toBeUndefined();
});

it("clears model typeDetail when syncing model to api", () => {
  const modelSpec: StructuredDesignDocumentSpec = {
    version: "1",
    ioType: "model",
    typeDetail: {
      ioType: "model",
      entityName: "Order",
      attributes: [{ name: "id", type: "UUID", primaryKey: true }],
    },
    inputFields: [],
    coreLogic: { rules: [] },
    outputFields: [],
    sideEffects: { description: "副作用なし" },
    exceptions: [],
    nonFunctional: {},
  };

  const synced = syncStructuredSpecToDdType(modelSpec, "api");

  expect(synced.ioType).toBe("api");
  expect(synced.typeDetail).toBeUndefined();  // クリアされる
  expect(synced.inputSchema).toBeDefined();   // API用に復旧
  expect(synced.outputSchema).toBeDefined();  // API用に復旧
});
```

### E2Eテスト（手動確認）

1. **バグ②の確認**:
   - モデルタイプのDDを作成し、エンティティ定義を入力
   - 保存して詳細画面で表示を確認
   - 編集画面に戻ってDDタイプを変更せずに保存
   - 詳細画面でエンティティ定義が保持されていることを確認

2. **バグ①の確認**:
   - モデルタイプのDDの詳細画面で、入力/出力スキーマセクションが表示されないことを確認
   - エンティティ定義セクションのみ表示されることを確認

3. **バグ③の確認**:
   - モデルタイプのDDでFK設定ダイアログを開く
   - 参照先モデルを選択し、カラムリストが正しく表示されることを確認
   - カラムを選択してFK関連設定ができることを確認

## 実装順序

1. **Phase 1**: バグ②の修正（最優先）
   - `structured-compat.ts`のロジック修正
   - 単体テスト追加
   - 既存テストの実行で回帰がないことを確認

2. **Phase 2**: バグ①の修正
   - `structured-spec-viewer/index.tsx`の条件分岐追加
   - E2E確認（手動）

3. **Phase 3**: バグ③の防御的実装（オプション）
   - `DesignDocumentCard.tsx`のエラーメッセージ改善
   - E2E確認（手動）

## リスク評価

**難易度**: ★☆☆

**根拠**:
- 修正ファイル数: 3ファイル
- 変更行数概算: 100行
- 影響コンポーネント数: 3コンポーネント
- テストケース: 既存テストあり、新規追加2件

**リスク**:
- `syncStructuredSpecToDdType`は複数箇所から呼ばれるため、予期しない副作用の可能性
- ただし、既存の単体テストでカバーされているため、回帰は検出可能
- バグ①の修正は表示ロジックのみで影響範囲が限定的

**成功率**: 95%

## 代替案の検討

なし（修正方針は明確で、代替案を検討する必要性は低い）

## 完了条件

- [ ] バグ②修正: `syncStructuredSpecToDdType`でモデルtypeDetailが保持される
- [ ] バグ①修正: 照会画面でモデルタイプの場合、入力/出力スキーマセクションが非表示
- [ ] バグ③修正: FK設定ダイアログでカラムが正しく表示される
- [ ] 単体テスト追加: 2件のテストケースが追加され、パスする
- [ ] 既存テスト: 回帰がないことを確認
- [ ] E2Eテスト: 手動で3つのシナリオを確認
