# Plan: SF/SR 採番バグ修正

## 難易度・リスク

```
難易度: ★★☆
根拠: 2 files, ~60 lines, ツールロジック改修
リスク: ① ループ構造変更がSF/SR草案の階層構造に波及
        ② DB照会追加による生成レイテンシー増加（1回のSF・SR SELECT追加）
```

---

## 根本原因まとめ

| バグ | 根本原因 | 証拠（ファイル:行） |
|------|----------|---------------------|
| ① SF ID重複 | `system-draft.ts:173` で `String(i + 1)` をSFシーケンスとする。ループインデックスベースで既存IDを一切照会しない | `SF-${normalizedDomainId}-${String(i + 1).padStart(4, '0')}` |
| ② SR採番異常 | (A) `system-draft.ts:275` でSRシーケンスを `String(1)` とハードコード（常に0001） | `SR-${normalizedDomainId}-${sfSeq}-${String(1).padStart(4, '0')}` |
| | (B) ループが「1BR→1SF」構造なので、3BRの場合は3つのSFが生成され、SRコードの中間部（SF番号）が0001/0002/0003と変化する | `for (let i = 0; i < resolvedBrs.length; i++)` で毎イテレーションにSF作成 |

### 参考：BT採番（正しい実装）
`bt-draft.ts:85-100` の `getNextBtId` は既存BT IDを全件照会し、MAX+1で採番する。SF/SRも同じパターンに揃える。

---

## 改修件 ①　`lib/utils/id-rules.ts` — `getNextSfId` 追加

**追加位置**: line 100（`getNextBtId` の直後）

**実装**: `getNextBtId`（lines 85-100）と全く同じパターン。`BT_ID_REGEX` → `SF_ID_REGEX`、`"BD"` → `"SD"` に差し替え。

```typescript
export const getNextSfId = (area: string, existingIds: string[]): string => {
  const normalized = normalizeAreaCode(area) || "SD";
  const prefix = `SF-${normalized}-`;
  const maxNumber = existingIds.reduce((max, id) => {
    const sfMatch = SF_ID_REGEX.exec(id);
    if (sfMatch && sfMatch[1] === normalized) {
      return Math.max(max, Number.parseInt(sfMatch[2], 10));
    }
    return max;
  }, 0);
  return `${prefix}${pad(maxNumber + 1, 4)}`;
};
```

**エクスポート**: 既に `export` で定義するため追加不要。`system-draft.ts` のインポート行で参照する。

---

## 改修件 ②　`lib/mastra/tools/system-draft.ts` — SF/SR生成ロジック再構成

### 2-a. インポート行（line 5）に `getNextSfId` を追加

```typescript
import { normalizeAreaCode, getNextSfId } from '@/lib/utils/id-rules';
```

### 2-b. ループ「前」に既存SF照会＋SF コード決定（line 159の直後）

現在の line 159 の直後に以下を挿入：

```typescript
// 既存SF IDを照会 → 次のSFコードを決定
const { data: existingSfs } = await supabase
  .from('system_functions')
  .select('id')
  .eq('project_id', resolvedProjectId);
const existingSfIds = (existingSfs || []).map((sf: any) => sf.id as string);
const sfCode = getNextSfId(normalizedDomainId, existingSfIds);
const sfSeq = sfCode.split('-')[2] || '0001';
```

### 2-c. ループ構造の再構成（lines 170-320）

現在のループは「1BR→1SF」で、SF作成もSR作成もループ内に混在している。
再構成後は「1つのSF」「N件のSR」になる。

**変更後のフロー**:

```
[ループ外] SF コード・名称・説明の決定（1件）
[ループ内] 各BR → LLM呼び出し → SR 1件 → allSrs に収集
[ループ外] sfDrafts に { code: sfCode, srs: allSrs } を1件push
```

**具体的な変更点**:

1. **SF名・説明の決定** — ループ開始前に決定
   - `name`: `additionalContext` が提供されている場合はその前半を使用（slice 0-60）。なければ最初のBRのタイトルに「機能」を付加
   - `description`: 全BRのタイトルを「・」で結合 + を実現する機能

2. **ループ外に `allSrs: any[] = []` 配列を用意**

3. **ループ内**:
   - `sfCode` の生成を削除（ループ外で済んでる）
   - `existingSf` クエリを削除（ループ外で済んでる）
   - `sfSeq` の生成を削除（ループ外で済んでる）
   - LLM呼び出し（lines 237-261）はそのまま維持
   - SR コード：`SR-${normalizedDomainId}-${sfSeq}-${String(i + 1).padStart(4, '0')}`
     - `i` はBRのインデックス → SR連番になる（0001, 0002, 0003…）
   - `srf_ids: [sfCode]`（全SR同じSF参照）
   - AC コード：`AC-${srCode}-${String(acIndex + 1).padStart(3, '0')}` — 変更なし
   - `allSrs.push(srDraft)` で収集

4. **ループ後**:
   - `implUnits` は1件のみ（`IU-${sfCode}-001`）
   - `sfDrafts.push({ code: sfCode, name: sfName, description: sfDescription, srs: allSrs, implUnits, ... })`

### 2-d. realizesLinksの修正（line 323-327）

現在: `target_id: \`sf-draft-${i}\``（各BRが異なるSFに紐付）
変更後: `target_id: 'sf-draft-0'`（全BRが同じ1つのSFに紐付）

```typescript
const realizesLinks = resolvedBrs.map((br: any) => ({
  source_id: br.id ?? br.code ?? `br-draft-unknown`,
  target_id: 'sf-draft-0',
  link_type: 'realizes',
}));
```

---

## 検証方法

1. **バグ① 重複チェック**
   - GL領域に既に SF-GL-0001〜0003 が存在する状態で、新規SF生成を実行
   - → 生成されたSFコードが SF-GL-0004 であること
   - サーバーログで `[system_draft]` の SF code を確認

2. **バグ② SR連番チェック**
   - 3件のBRを指定してSF/SR生成を実行
   - → 1つのSFカードが表示され、その配下に3件のSRが表示されること
   - → SRコードが SR-GL-{sfNum}-0001, 0002, 0003 と連番であること
   - → AC コードも各SR配下で正しく 001, 002, 003 と連番であること

3. **既存動作の回帰チェック**
   - 1件のBRからSF/SR生成 → 1SF + 1SR が正しく生成されること
   - BRが未確定草案（brDrafts パラメータ）の場合も同様に動作すること
