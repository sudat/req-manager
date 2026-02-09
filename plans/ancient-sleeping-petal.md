# デザインドキュメント照会画面のセクション表示順序修正

## Context

### 問題
編集画面（`/system/[id]/[srfId]/edit/design-documents`）と照会画面（`/system/[id]/[srfId]`）で、デザインドキュメントのセクション表示順序が異なっている。

### 現状の不一致

| 順位 | 編集画面（正しい順序） | 照会画面（現在の順序） |
|------|----------------------|----------------------|
| 1 | エントリポイント | エントリポイント |
| 2 | 入力スキーマ | 入力スキーマ |
| 3 | **コアロジック** | ~~入力項目（データ）~~ ❌ |
| 4 | **出力スキーマ** | **コアロジック** ❌ |
| 5 | 入力項目（データ） | **出力スキーマ** ❌ |
| 6 | 出力項目（データ） | 出力項目（データ） |

### 目的
編集画面と照会画面で一貫したセクション表示順序を実現する。

---

## Implementation Plan

### 修正対象ファイル
```
components/system-domains/structured-spec-viewer/index.tsx
```

### 修正内容
L76-85の「入力項目（データ）」セクションを、L107の直後（出力スキーマセクションの後）に移動する。

#### 修正前（現在の順序）
```tsx
      {/* 入力スキーマ（L62-74） */}
      {!isModelType && (
        <FoldableStructuredSection title="入力スキーマ" ...>
          <InputSchemaViewer ... />
        </FoldableStructuredSection>
      )}

      {/* 入力項目（データ）（L76-85）← ここを移動 */}
      {!isModelType && (
        <FoldableStructuredSection title="入力項目（データ）" ...>
          <FieldsViewer fields={spec.inputFields} ... />
        </FoldableStructuredSection>
      )}

      {/* コアロジック（L87-96） */}
      {!isModelType && (
        <FoldableStructuredSection title="コアロジック" ...>
          <CoreLogicViewer coreLogic={spec.coreLogic} />
        </FoldableStructuredSection>
      )}

      {/* 出力スキーマ（L98-107） */}
      {!isModelType && (
        <FoldableStructuredSection title="出力スキーマ" ...>
          <OutputSchemaViewer ... />
        </FoldableStructuredSection>
      )}
```

#### 修正後（正しい順序）
```tsx
      {/* 入力スキーマ（L62-74） */}
      {!isModelType && (
        <FoldableStructuredSection title="入力スキーマ" ...>
          <InputSchemaViewer ... />
        </FoldableStructuredSection>
      )}

      {/* コアロジック（L87-96）← 入力スキーマの直後に移動 */}
      {!isModelType && (
        <FoldableStructuredSection title="コアロジック" ...>
          <CoreLogicViewer coreLogic={spec.coreLogic} />
        </FoldableStructuredSection>
      )}

      {/* 出力スキーマ（L98-107）← コアロジックの直後に移動 */}
      {!isModelType && (
        <FoldableStructuredSection title="出力スキーマ" ...>
          <OutputSchemaViewer ... />
        </FoldableStructuredSection>
      )}

      {/* 入力項目（データ）（L76-85）← 出力スキーマの後に移動 */}
      {!isModelType && (
        <FoldableStructuredSection title="入力項目（データ）" ...>
          <FieldsViewer fields={spec.inputFields} ... />
        </FoldableStructuredSection>
      )}
```

---

## Verification

### 手順
1. 開発サーバーを起動: `bun run dev`
2. 照会画面にアクセス: `http://localhost:3000/system/AR/SF-AR-0001`
3. デザインドキュメントセクションを展開
4. 以下の順序でセクションが表示されていることを目視確認：
   - エントリポイント
   - 入力スキーマ
   - **コアロジック** ← 入力スキーマの直後
   - **出力スキーマ** ← コアロジックの直後
   - **入力項目（データ）** ← 出力スキーマの直後
   - 出力項目（データ）
   - 副作用
   - 例外
   - 非機能要件

### 期待結果
編集画面（`/system/AR/SF-AR-0001/edit/design-documents`）と同じ順序でセクションが表示される。

---

## Critical Files

| ファイル | 役割 |
|---------|------|
| `components/system-domains/structured-spec-viewer/index.tsx` | **修正対象ファイル** |
| `components/forms/design-document/DesignDocumentCard.tsx` | 正しい順序の参照元（編集画面） |

---

## 難易度評価

**難易度: ★☆☆**

**根拠**:
- 修正ファイル数: 1ファイル
- 変更内容: 10行の移動のみ
- 影響範囲: 表示順序のみ、ロジックやデータフローに影響なし

**リスク**: なし（各セクションは独立したコンポーネントとして実装されているため）
