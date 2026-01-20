← 親ファイルの [PRD](../prd.md) の第5章に戻る。

---

# 5. エクスポート仕様（Claude Code連携）

本章は、本ツールの正本をClaude Codeが参照できる形式で出力する仕様を定義する。

## 5.1 出力ファイル構成

2.7のデータ構造（業務側とシステム側の分離）に従い、以下の構成で出力する。
```
docs/requirements/
  INDEX.md                           - ルーティング表（全体の目次）
  concept-dictionary.yml             - 概念辞書

  business/                          # 業務側の正本
    {業務分類ID}/
      _index.md                      # 業務分類の概要
      {業務タスクID}.md              # 業務タスク＋業務要件＋業務受入条件

  system/                            # システム側の正本
    {システム領域ID}/
      _index.md                      # システム領域の概要
      {システム機能ID}.md            # システム機能＋システム要件＋エントリポイント

  graph/
    requirements-links.json          # 業務要件↔システム要件のリンク（根拠データ含む）

  VERSION.md                         - エクスポート時点の版情報
```

#### ディレクトリ構成の意図

| ディレクトリ | 内容 | Claude Codeの利用シーン |
|-------------|------|------------------------|
| `business/` | 業務タスク・業務要件・業務受入条件 | 「なぜこの変更が必要か」の業務文脈を理解する |
| `system/` | システム機能・システム要件・エントリポイント | 「どのファイルを修正すべきか」を特定する |
| `graph/` | 要件間のリンクと根拠 | 影響範囲の波及を辿る |

## 5.2 業務タスクファイルフォーマット

`business/{業務分類ID}/{業務タスクID}.md`
※受入条件はMVPでも構造化形式（verification_method）を保持する。出力は description を箇条書きにし、メタデータが入力されている場合は併記する（未入力は省略可）。
```yaml
---
id: BT-BIL-001
title: 請求書発行
business_domain_id: BD-BIL
business_domain_name: 請求
---

## 概要

請求書を発行し、顧客へ送付するまでの業務フロー。

## 業務要件

### BR-BIL-001: 請求書をPDFで出力できる

#### 受入条件
- 経理担当者が請求書PDFをダウンロードできること
- 請求書PDFに登録番号が印字されていること

#### 関連システム要件
- [SR-BIL-001](../../system/SD-BIL/SF-BIL-010.md#sr-bil-001)
- [SR-BIL-002](../../system/SD-BIL/SF-BIL-010.md#sr-bil-002)

#### 関連概念
- TAX_INVOICE_JP
```

## 5.3 システム機能ファイルフォーマット

`system/{システム領域ID}/{システム機能ID}.md`
```yaml
---
id: SF-BIL-010
title: 請求書出力バッチ
system_domain_id: SD-BIL
system_domain_name: SD請求
entry_points:
  - path: /app/billing/invoice/InvoicePdfGenerator.ts
    type: job
    responsibility: 請求書PDF生成
  - path: /app/billing/invoice/
    type: template
    responsibility: 帳票テンプレート群
---

## 概要

請求書PDFを生成するバッチ処理。月次締め後に実行される。

## システム要件

### SR-BIL-001: 請求書PDFに登録番号と税率別合計を出力

#### 受入条件
- 登録番号が帳票右上に印字されていること
- 税率ごとの合計金額が明細の下に表示されること

#### 関連業務要件
- [BR-BIL-001](../../business/BD-BIL/BT-BIL-001.md#br-bil-001)

#### 関連概念
- TAX_INVOICE_JP

### SR-BIL-002: 請求書PDFを指定フォルダに保存

#### 受入条件
- 出力先フォルダが設定画面で指定できること
- 保存完了後にログが出力されること

#### 関連業務要件
- [BR-BIL-001](../../business/BD-BIL/BT-BIL-001.md#br-bil-001)
```

## 5.4 概念辞書フォーマット

`concept-dictionary.yml`
```yaml
TAX_INVOICE_JP:
  name: 適格請求書
  synonyms: [インボイス, 登録番号, 税率ごとの対価]
  impacts:
    system_domains: [SD-BIL, SD-FI]
    system_functions: [SF-BIL-010, SF-FI-020]
  must_read:
    - system/SD-BIL/SF-BIL-010.md
    - system/SD-FI/SF-FI-020.md
```

## 5.5 リンク・根拠データフォーマット

`graph/requirements-links.json`

業務要件とシステム要件のリンク、およびリンクの根拠を構造化して出力する。
```json
{
  "links": [
    {
      "source": "BR-BIL-001",
      "source_type": "business_requirement",
      "target": "SR-BIL-001",
      "target_type": "system_requirement",
      "evidence": {
        "matched_concepts": ["TAX_INVOICE_JP"],
        "reason": "請求書PDF出力の業務要件を実現するためのシステム要件"
      },
      "last_confirmed": "2025-01-17T12:00:00Z",
      "suspect": false,
      "suspect_severity": null
    },
    {
      "source": "SR-BIL-001",
      "source_type": "system_requirement",
      "target": "SR-FI-003",
      "target_type": "system_requirement",
      "evidence": {
        "matched_concepts": ["TAX_INVOICE_JP"],
        "source_field": "summary",
        "source_span": "消費税調整仕訳",
        "reason": "SD請求でインボイス対応するとFI税務仕訳にも影響"
      },
      "last_confirmed": "2025-01-17T12:00:00Z",
      "suspect": false,
      "suspect_severity": null
    }
  ]
}
```

## 5.6 INDEX.md（ルーティング表）

Claude Codeが最初に読むべきファイル。全体構成と参照方法を示す。
```markdown
# 要件正本 INDEX

## 構成

- `business/` - 業務タスク・業務要件（なぜこの機能が必要か）
- `system/` - システム機能・システム要件・エントリポイント（どう実装されているか）
- `graph/requirements-links.json` - 要件間のリンクと根拠
- `concept-dictionary.yml` - 用語辞書（同義語・影響範囲）

## 参照手順

1. 変更要求の内容から、関連する概念を`concept-dictionary.yml`で検索
2. 概念の`must_read`に記載されたシステム機能ファイルを読む
3. システム機能ファイルの`entry_points`から実装の起点を特定
4. 必要に応じて`graph/requirements-links.json`で波及影響を確認

## 業務分類一覧

| ID | 名称 | ファイル |
|----|------|---------|
| BD-BIL | 請求 | [business/BD-BIL/_index.md](business/BD-BIL/_index.md) |
| BD-FI | 会計 | [business/BD-FI/_index.md](business/BD-FI/_index.md) |

## システム領域一覧

| ID | 名称 | ファイル |
|----|------|---------|
| SD-BIL | SD請求 | [system/SD-BIL/_index.md](system/SD-BIL/_index.md) |
| SD-FI | FI会計 | [system/SD-FI/_index.md](system/SD-FI/_index.md) |
```

## 5.7 Claude Code Skill連携

Claude Codeの`.claude/skills/`にSKILL.mdを配置し、「まずINDEX.mdを読み、概念辞書でヒットしたmust_readを読む」手順を提案する。

SKILL.mdはprogressive disclosureに従い軽量に保ち（目安500行以下）、詳細手順は別ファイルに分離する。
```markdown
# 要件正本参照スキル

## 概要
このプロジェクトには構造化された要件正本があります。変更を行う前に必ず参照してください。

## 参照手順
1. `docs/requirements/INDEX.md` を読む
2. 変更内容に関連する概念を `concept-dictionary.yml` で検索
3. 概念の `must_read` に記載されたファイルを読む
4. システム機能ファイルの `entry_points` から実装起点を確認
5. 受入条件を確認し、何を満たせばOKか理解する

## 注意
- 影響範囲が不明な場合は `graph/requirements-links.json` で波及を確認
- 受入条件を満たさない変更は行わない
```

---

