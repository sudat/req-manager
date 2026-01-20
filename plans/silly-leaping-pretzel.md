# システム機能説明のマークダウン化 - 機能名重複の修正

## 問題
実装時にsummaryの1行目に機能名を誤って追加してしまい、titleと重複している。

**現在（問題あり）:**
```markdown
## 税率別内訳集計機能

税率別内訳集計機能
請求明細から税率別の対価と税額を集計し、帳票出力APIへ提供する機能
```

**修正後:**
```markdown
## 税率別内訳集計機能

請求明細から税率別の対価と税額を集計し、帳票出力APIへ提供する機能
```

---

## フォーマット（正）

```markdown
## [機能名]

[1文で表す目的 - 機能名を含まない]

### 主な機能
- [機能1の簡潔な説明]
- [機能2の簡潔な説明]
- [機能3の簡潔な説明]

### 対象
[対象ユーザ/利用シーン]

### 関連
- [関連する機能IDやタスクID]
```

---

## 実装計画

### Step 1: スクリプト更新
更新スクリプトのsummaryから機能名を削除

**ファイル**: `lib/scripts/update-srf-summary-markdown.ts`

### Step 2: モックデータ更新
モックデータのsummaryから機能名を削除

**ファイル**: `lib/mock/data/srf/srf.ts`

### Step 3: Supabase更新
スクリプトを実行してSupabaseを更新

### Step 4: 動作確認
システム機能詳細ページで重複が解消されていることを確認

---

## 関連ファイル

### 更新対象
- `lib/scripts/update-srf-summary-markdown.ts` - 更新スクリプト
- `lib/mock/data/srf/srf.ts` - モックデータ
- Supabase `system_functions` テーブル - `summary` カラム

---

## 検証方法

1. `http://localhost:3000/system-domains/GL/SRF-017` にアクセス
2. 見出しの直後に機能名が重複して表示されていないことを確認
3. 他のSRFでも同様に確認
