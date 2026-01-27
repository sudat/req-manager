# AC（受入基準）表示のPRD適合性レビュー

## 概要
システム機能詳細ページ（`/system-domains/AR/SRF-001`）のAC表示がPRD 3.8に沿っているか、およびコーディングエージェントへの改修指示の的確さ向上・ユーザビリティの観点でレビューを行う。

---

## 1. PRD 3.8の要件と現状比較

| PRD要件 | 現状 | 適合性 |
|---------|------|--------|
| GWT形式（Given-When-Then）で記述 | ✅ 実装済み | ⭕ 適合 |
| AC ID（AC-XXX-XXX形式）の表示 | ❌ 読み取り画面では非表示 | ⚠️ 要改善 |
| シナリオ名（scenario）の表示 | ✅ descriptionとして表示 | ⭕ 適合 |
| 検証方法（verification_method）表示 | ✅ 実装済み | ⭕ 適合 |
| 折りたたみ/展開機能 | ❌ 読み取り画面では未実装 | ⚠️ 要改善 |
| 正常系/異常系/境界条件の分類表示 | ❌ 未実装 | ⚠️ 要検討 |

---

## 2. 確認した良い点 ✅

### 2.1 GWT形式の視覚的表示
- Given/When/Then のラベルが明確に分かれている
- 背景色・ボーダーで区切られ、読みやすい
- `<pre>` タグで整形済みテキストをそのまま表示

### 2.2 コンテキスト情報の充実
- **関連概念へのリンク**: 「インボイス制度」「消費税計算」などの概念辞書へのリンク
- **関連業務要件へのリンク**: BRへのナビゲーションが可能
- **検証方法の明示**: 「自動テスト」「手動テスト」が表示される

### 2.3 SR-TASK-003-001 は良い例
```
正常系: 請求書PDFが正常に生成されること
境界:   軽減税率対象商品が正しく区分されていること
異常系: 顧客情報が不足している場合、エラーが表示されること
```
→ PRDの「正常系最低1つ、異常系最低1つ」を満たしている

---

## 3. 改善が必要な点 ⚠️

### 3.1 【重要】テンプレートのプレースホルダーがそのまま表示されている

**現象**: SR-TASK-003-002, 006, 009 の AC で以下のようなテンプレート文字列がそのまま表示されている

```yaml
Given: description: "[前提となる状態・データ]"
       preconditions: - "[ユーザーの状態（ログイン済み等）]"
When:  description: "[ユーザーの操作・トリガー]"
       trigger: "[ボタン押下、API呼び出し等]"
Then:  description: "[期待される結果]"
       expected_outcomes: - "[状態の変化]"
```

**問題点**:
1. ユーザーに「未入力」であることが伝わりにくい
2. コーディングエージェントがこれを仕様と誤解するリスク
3. ヘルススコアとの連携が不十分（未入力ACの警告がない）

**改善案**:
- テンプレート状態を検出し、「未入力」バッジを表示
- または GWT 部分を非表示にして「詳細未設定」と表示

---

### 3.2 ACのIDが表示されていない

**現象**: `AcceptanceCriteriaDisplay` コンポーネントで `item.id` は key としてのみ使用され、画面上に表示されない

**問題点**:
- コーディングエージェントに「AC-XXX-XXを満たすように実装して」と指示できない
- テストケースとACの対応付けが困難
- 変更管理・トレーサビリティが弱い

**改善案**:
```tsx
<div className="flex items-center gap-2">
  <span className="text-[11px] font-mono text-slate-400">{item.id}</span>
  <span className="text-[13px] text-slate-700">{item.description}</span>
</div>
```

---

### 3.3 折りたたみ/展開機能がない

**現象**: PRDのワイヤーフレームでは `[展開]` ボタンがあるとされているが、読み取り画面では全ACが展開状態

**問題点**:
- SRが多い場合（現在4件）、画面が非常に長くなる
- 全体像を把握しにくい

**改善案**:
- 入力コンポーネント（`StructuredAcceptanceCriteriaInput`）と同様の展開/折りたたみ機能を追加
- デフォルトは折りたたみ、クリックで展開

---

### 3.4 正常系/異常系/境界条件の分類表示がない

**現象**: ACのカテゴリ（正常系/異常系/境界条件）がデータとして保持されていない、または表示されていない

**問題点**:
- PRDの「正常系最低1つ、異常系最低1つ」のカバレッジ確認が困難
- コーディングエージェントがテスト網羅性を判断しにくい

**改善案**:
- ACにカテゴリフィールドを追加（`category: 'positive' | 'negative' | 'boundary'`）
- バッジとして表示（🟢 正常系 / 🔴 異常系 / 🟡 境界）

---

## 4. コーディングエージェントへの指示の的確さ向上の観点

### 4.1 現状の課題

| 観点 | 現状 | 影響 |
|------|------|------|
| AC識別 | IDなし | 「AC-XXXを満たす」という指示が不可能 |
| 仕様の完全性 | テンプレート表示 | 誤った仕様として解釈されるリスク |
| テストカバレッジ | 分類なし | 網羅性の判断が困難 |
| 情報量 | 全展開 | ノイズが多く重要情報が埋もれる |

### 4.2 改善後の期待効果

改善することで、以下のようなエージェントへの指示が可能になる：

```markdown
# 改修指示パッケージ

## 対象機能
SF: SRF-001 請求書発行

## 満たすべき受入基準
- AC-TASK-003-001-01（正常系）: 税率別内訳を含むPDF生成
- AC-TASK-003-001-02（境界）: 軽減税率対象の区分
- AC-TASK-003-001-03（異常系）: 顧客情報不足エラー

## 実装方針
エントリポイント: /invoices/generate
上記ACを全て満たすよう実装してください。
```

---

## 5. 推奨アクション（優先度順）

### P1（必須）
1. **テンプレート状態の検出・警告表示**
   - 対象: `AcceptanceCriteriaDisplay.tsx`
   - 工数: ★☆☆

2. **ACのID表示追加**
   - 対象: `AcceptanceCriteriaDisplay.tsx`
   - 工数: ★☆☆

### P2（推奨）
3. **折りたたみ/展開機能の追加**
   - 対象: `AcceptanceCriteriaDisplay.tsx`
   - 工数: ★★☆

### P3（将来検討）
4. **正常系/異常系/境界条件の分類機能**
   - 対象: データモデル変更 + UI変更
   - 工数: ★★★

---

## 6. 関連ファイル

| ファイル | 役割 |
|----------|------|
| `components/forms/AcceptanceCriteriaDisplay.tsx` | AC読み取り表示（主要改修対象） |
| `components/forms/StructuredAcceptanceCriteriaInput.tsx` | AC入力フォーム（参考実装あり） |
| `lib/data/structured.ts` | `AcceptanceCriterionJson` 型定義 |
| `app/(with-sidebar)/system-domains/[id]/[srfId]/page.tsx` | システム機能詳細ページ |

---

## 7. 実装計画（P1 + P2）

### 難易度
```
難易度: ★★☆
根拠: 1 file, ~80 lines 追加/変更, 1 component
リスク: 低（表示ロジックのみ、データモデル変更なし）
```

### 修正対象ファイル
- `components/forms/AcceptanceCriteriaDisplay.tsx` （主要改修）

### 実装詳細

#### P1-1: テンプレート状態の検出・警告表示

**テンプレート検出ロジック**:
```typescript
const isTemplateText = (text: string | undefined): boolean => {
  if (!text || text.trim().length === 0) return false;
  // プレースホルダーパターンを検出
  return /\[.*?\]/.test(text) || text.includes('description:');
};

const isTemplateAC = (item: AcceptanceCriterionJson): boolean =>
  isTemplateText(item.givenText) ||
  isTemplateText(item.whenText) ||
  isTemplateText(item.thenText);
```

**表示**:
- テンプレート状態なら「⚠️ 詳細未設定」バッジを表示
- GWT部分は非表示（または薄いグレーで「テンプレート」と表示）

#### P1-2: ACのID表示

**変更箇所**: line 21-22 付近
```tsx
// Before
<div className="text-[13px] text-slate-700">{item.description}</div>

// After
<div className="flex items-center gap-2">
  <span className="text-[11px] font-mono text-slate-400 shrink-0">
    {item.id}
  </span>
  <span className="text-[13px] text-slate-700">{item.description}</span>
</div>
```

#### P2: 折りたたみ/展開機能

**参考**: `StructuredAcceptanceCriteriaInput.tsx` の実装（line 49-75）

**追加する状態管理**:
```typescript
const [expandedIds, setExpandedIds] = useState<string[]>([]);

const toggleExpand = (id: string) => {
  setExpandedIds((prev) =>
    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
  );
};
```

**UI変更**:
- シナリオ名の横に ChevronDown アイコン追加
- クリックでGWT部分を展開/折りたたみ
- デフォルトは折りたたみ状態

### 検証方法
1. http://localhost:3002/system-domains/AR/SRF-001 を開く
2. 以下を確認:
   - [ ] ACのID（例: AC-TASK-003-001-01）が表示される
   - [ ] SR-TASK-003-001 のACはGWTが正常表示される
   - [ ] SR-TASK-003-002, 006, 009 のACは「⚠️ 詳細未設定」と表示される
   - [ ] 各ACをクリックで展開/折りたたみできる

---

## 8. 結論

現在の実装は **PRD 3.8の基本要件（GWT形式）は満たしている** が、以下の点で改善が必要：

1. **テンプレート状態のACが仕様として表示される問題**（最重要）
2. **ACのID非表示**（エージェント指示に支障）
3. **折りたたみ機能なし**（UX）

特に1と2は、本アプリの目的である「コーディングエージェントへの改修指示の的確さ向上」に直接影響するため、優先的に対応すべき。

**今回の実装スコープ**: P1（テンプレート警告 + ID表示）+ P2（折りたたみ）
