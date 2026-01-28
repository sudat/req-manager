# design_policy データ更新プラン

## 目的
AR/AP/GLドメインの全システム機能（SF）について、`design_policy` フィールドに本物っぽい設計方針データを投入する。

## 背景知識

### design_policy の定義（PRDより）
> **design_policy**: 複数の実装単位SDにまたがる横断的な設計方針

### 階層構造
```
システム領域(SD)
 └ システム機能(SF)
      ├─ システム要件(SR) → 受入基準(AC)
      └─ 実装単位SD(N)  ※画面/API/バッチ/外部I/F 等
```

### 現状
- **SRF-001のみ**: "E2E検証: 設計方針保存テスト"（無意味なテスト文字列）
- **その他24SF**: 空文字

## 更新対象一覧

### ARドメイン（9件）
| SF-ID | タイトル | 実装単位SD | 設計方針の焦点 |
|-------|---------|-----------|--------------|
| SRF-001 | 請求書発行 | 画面+API | ID採番、トランザクション境界 |
| SRF-002 | 税率別内訳集計機能 | （未定） | データ集計方針 |
| SRF-003 | 入金データ取り込み機能 | バッチ | 取り込みエラーハンドリング |
| SRF-004 | 入金消込機能 | API+画面 | 消込ロック設計 |
| SRF-005 | 債権管理一覧 | （未定） | 一覧取得性能設計 |
| SRF-006 | 与信管理 | （未定） | 与信判定タイミング |
| SRF-007 | 電子請求書送信 | 外部IF | 再送設計、ステータス管理 |
| SRF-008 | 延滞債権アラート機能 | （未定） | アラート通知設計 |
| SRF-025 | 売掛金自動計上バッチ処理 | （未定） | バッチ設計 |

### APドメイン（8件）
| SF-ID | タイトル | 実装単位SD | 設計方針の焦点 |
|-------|---------|-----------|--------------|
| SRF-009 | 支払依頼 | 画面+API | ワフロ設計 |
| SRF-010 | 支払承認 | 画面 | 承認状態遷移 |
| SRF-011 | 支払実行機能 | バッチ | 実行結果管理 |
| SRF-012 | 手形管理 | （未定） | 手形期日管理 |
| SRF-013 | 仕入請求書取込機能 | API | OCR連携想定 |
| SRF-014 | 買掛残高確認 | 画面 | 残高集計方式 |
| SRF-015 | 仕入先ポータル | （未定） | ポータル認証 |
| SRF-016 | 支払予定表作成機能 | （未定） | 作成スケジュール |

### GLドメイン（8件）
| SF-ID | タイトル | 実装単位SD | 設計方針の焦点 |
|-------|---------|-----------|--------------|
| SRF-017 | 手動仕訳入力 | 画面 | 仕訳バリデーション |
| SRF-018 | 仕訳転記機能 | バッチ | 転記元帳設計 |
| SRF-019 | 総勘定元帳 | 画面 | 開始残高処理 |
| SRF-020 | 試算表 | API | 集計パフォーマンス |
| SRF-021 | 財務諸表 | 画面+API | 帳票出力設計 |
| SRF-022 | 決算整理機能 | （未定） | 決算整理仕訳 |
| SRF-023 | 固定資産償却機能 | （未定） | 償却計算方式 |
| SRF-024 | 税申告 | （未定） | 申告データ出力 |
| SRF-027 | テスト伝票 | 画面 | テストデータ分離 |

## 実装方針

### Step 1: design_policyデータ作成
各SFに適した設計方針をMarkdown形式で作成する。内容は以下を含む：
- 複数SD間の整合性保証（該当する場合）
- エラーハンドリング方針
- 再実行・再試行設計
- ID採番方針
- トランザクション境界

### Step 2: Supabase更新
`supabase_crud` スキルを使用して更新：
1. `system_functions` テーブルの `design_policy` カラムをUPDATE
2. 対象: `system_domain_id IN ('AR', 'AP', 'GL')`

### design_policy記述パターン（簡潔版）

#### パターンA: 複数SDがあるSF
```
- ID採番は画面側で実施（INV-{YYYYMM}-{連番5桁}）
- API側でヘッダー/明細のトランザクション整合性を保証
- バリデーションエラーは画面即時反馈、業務エラーはAPI側で集約
```

#### パターンB: 単一SDのSF
```
- 取込エラーはレベル別ログ出力、全件失敗時のみロールバック
- 取込日時で重複実行防止、失敗分のみ再取込可能
```

#### パターンC: 実装単位SD未定のSF
```
- バッチ方式で月次集計、集計期間はキャッシュで保持
- 集計失敗時は前月データをフォールバックとして使用
```

## 実行SQL（Supabase MCPで実行）

```sql
-- ARドメイン
UPDATE public.system_functions SET design_policy = '- 請求書番号は画面側で採番（INV-{YYYYMM}-{00001}）- API側でヘッダー/明細のトランザクション整合性を保証- バリデーションエラーは画面即時反馈、業務エラーはAPI側で集約' WHERE id = 'SRF-001';
UPDATE public.system_functions SET design_policy = '- 月次バッチで集計実行、集計結果は税コード別に保持- 集計失敗時は前月データを参照- 税率変更時は履歴テーブルで遡及適用を管理' WHERE id = 'SRF-002';
UPDATE public.system_functions SET design_policy = '- 銀行フォーマット別のパーサーで取り込み- エラーレコードは別テーブルに保持、再取込可能- 取込日時で重複実行を防止' WHERE id = 'SRF-003';
UPDATE public.system_functions SET design_policy = '- 消込処理はAPI側で排他ロックを取得- 画面側では消込結果を参照のみ- 部分消込・相殺消込に対応' WHERE id = 'SRF-004';
UPDATE public.system_functions SET design_policy = '- 債権残高はリアルタイム集計、結果はキャッシュで保持- 回収サイト別に集計、督促管理と連携' WHERE id = 'SRF-005';
UPDATE public.system_functions SET design_policy = '- 与信限度額は顧客マスタで centrally 管理- 与信判定は請求発行時と出荷時の2段階で実施- 限度額超過時はアラート通知とホールド処理' WHERE id = 'SRF-006';
UPDATE public.system_functions SET design_policy = '- 顧客ポータル経由で電子請求書を配信- 送信ステータスは別テーブルで管理- 再送・送信失敗時のリトライ設計を含む' WHERE id = 'SRF-007';
UPDATE public.system_functions SET design_policy = '- 延滞日数ベースでアラート通知- 通知先は営業担当者と経理部門を分けて管理- アラート履歴は監査用に保持' WHERE id = 'SRF-008';
UPDATE public.system_functions SET design_policy = '- 日次バッチで売掛金を自動計上- 計上失敗時はエラーログを出力し、翌日再実行- 計上ステータスは別テーブルで管理' WHERE id = 'SRF-025';

-- APドメイン
UPDATE public.system_functions SET design_policy = '- ワークフローは申請→承認の2段階- 承認状態はステータス管理テーブルで保持- 画面側でバリデーション、API側で業務チェック' WHERE id = 'SRF-009';
UPDATE public.system_functions SET design_policy = '- 承認/却下は承認者のみ実行可能- 承認履歴は監査用に保持- 却下時はコメント必須' WHERE id = 'SRF-010';
UPDATE public.system_functions SET design_policy = '- 支払実行はバッチで一括処理- 実行結果は成功/失敗別テーブルで管理- 失敗時は再実行可能な設計' WHERE id = 'SRF-011';
UPDATE public.system_functions SET design_policy = '- 手形期日管理テーブルで満期日を監視- 満期到来時に自動消込処理を実行- 手形不渡り時のエラーハンドリングを含む' WHERE id = 'SRF-012';
UPDATE public.system_functions SET design_policy = '- 仕入先ポータルから請求書データを取込- OCR連携を想定したデータ構造- 取込エラーは別テーブルに保持' WHERE id = 'SRF-013';
UPDATE public.system_functions SET design_policy = '- 買掛残高はリアルタイム集計- 仕入先別・支払サイト別に集計- 残高確認時はスナップショットを取得' WHERE id = 'SRF-014';
UPDATE public.system_functions SET design_policy = '- 仕入先ポータルはBasic認証で保護- 仕入先IDでアクセス制限- APIキー発行・廃止機能を含む' WHERE id = 'SRF-015';
UPDATE public.system_functions SET design_policy = '- 支払予定表は週次で作成- 作成スケジュールはジョブスケジューラで管理- 予定表出力はPDF/Excel両対応' WHERE id = 'SRF-016';

-- GLドメイン
UPDATE public.system_functions SET design_policy = '- 仕訳入力は借方/貸方のバランスチェックを実施- 勘定科目の有効性チェックを含む- 仕訳採番は連番で管理' WHERE id = 'SRF-017';
UPDATE public.system_functions SET design_policy = '- 仕訳転記は日次バッチで実施- 転記元帳は総勘定元帳と補助元帳に分離- 転記失敗時はロールバックしエラーログを出力' WHERE id = 'SRF-018';
UPDATE public.system_functions SET design_policy = '- 総勘定元帳は勘定科目別に表示- 開始残高は期間初日時点で計算- ページング処理で大量データ対応' WHERE id = 'SRF-019';
UPDATE public.system_functions SET design_policy = '- 試算表は要否/合計で2段階集計- 集計結果はキャッシュで保持- 決算期切り替え時に履歴を保存' WHERE id = 'SRF-020';
UPDATE public.system_functions SET design_policy = '- 財務諸表生成はAPI側で実施- 画面側は表示のみ、PDF出力機能を含む- 帳票テンプレートは外部ファイルで管理' WHERE id = 'SRF-021';
UPDATE public.system_functions SET design_policy = '- 決算整理仕訳は手動入力- 整理仕訳は通常仕訳と区分して管理- 決算確定後に修正不可とする' WHERE id = 'SRF-022';
UPDATE public.system_functions SET design_policy = '- 償却計算は定額法と定率法に対応- 資産マスタで償却方法を管理- 月次償却をバッチ処理で実行' WHERE id = 'SRF-023';
UPDATE public.system_functions SET design_policy = '- 税申告データは税区分別に集計- 申告書フォーマットはテンプレートで管理- e-Tax連携を想定したデータ構造' WHERE id = 'SRF-024';
UPDATE public.system_functions SET design_policy = '- テスト伝票は本番データと分離して管理- テスト環境識別子で明示- テストデータの定期削除機能を含む' WHERE id = 'SRF-027';
```

## 検証方法

1. Supabase MCPで更新後のデータを確認
2. ブラウザで各SF詳細画面を確認（http://localhost:3002/system-domains/{ドメイン}/{SF-ID}）
3. design_policyが正しく表示されていることを確認

## リスク
- なし（単なるデータ追加）
