import type { Concept } from '@/lib/domain';
import { tasks } from '../tasks';
import { systemFunctions } from '../srf';

export interface RequirementReference {
  id: string;
  title: string;
  type: "業務要件" | "システム要件";
}

export const concepts: Concept[] = [
  // 基本概念（共通・3件）
  {
    id: "C001",
    name: "インボイス制度",
    synonyms: ["適格請求書", "適格請求書等保存方式"],
    areas: ["AR", "GL"],
    definition: `適格請求書等保存方式のこと。2023年10月より開始。

### 要件
- 登録番号の記載（T + 13桁）
- 税率ごとの区分表示（10%対象・8%対象・不課税）
- 交付時の相手方確認（適格請求書発行事業者か否か）

### 保存要件
- 保存期間：7年間
- 真贋性（タイムスタンプまたは訂正削除履歴）
- 可視性（検索機能：取引日・金額・取引先）

### 関連法令
- 消費税法（昭和63年法律第108号）
- 電子帳簿保存法（昭和43年法律第126号）`,
    relatedDocs: [
      "https://www.nta.go.jp/taxes/tetsuzuki/shinsei/tokubetsu/000001.htm",
      "/docs/accounting-rules/ar-invoice-protocol-v2.1.pdf",
      "DD-TASK-003-001",
      "/docs/masters/account-codes.xlsx",
    ],
    requirementCount: 26,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C002",
    name: "消費税計算",
    synonyms: ["Tax Calculation", "税額計算"],
    areas: ["AR", "AP", "GL"],
    definition: `消費税の税率計算および税額計算に関する機能。

### 複数税率対応
- 軽減税率8%（飲料食品を除く飲食料品・定期購読新聞）
- 標準税率10%（その他）
- 経過措置税率（旧税率対応品）

### 端数処理
- 切捨て/四捨五入/切上げ
- 単位：明細行単位・請求書単位・月次集計単位

### 税額計算方式
- 税額控除方式（課税売上消費税 - 課税仕入消費税）
- 原則課税方式と簡易課税方式の選択`,
    relatedDocs: [
      "https://www.nta.go.jp/taxes/shirizu/zeimoku/202401/pdf/001.pdf",
      "/docs/accounting-rules/tax-calculation-v1.5.pdf",
      "DD-TASK-003-002",
      "/docs/masters/tax-rates.xlsx",
    ],
    requirementCount: 26,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C003",
    name: "電子帳簿保存法",
    synonyms: ["電子保存", "電磁的記録"],
    areas: ["AR", "AP", "GL"],
    definition: `帳簿書類を電子データで保存することを認める法律。

### 電子取引データの保存義務（2024年1月施行）
- 電子取引の電子保存が義務化
- 紙への出力保存は原則不可

### 保存要件
#### 真贋性要件
- タイムスタンプの付与
- 訂正削除履歴の保存

#### 可視性要件
- 検索機能：取引日・金額・取引先
- 見読可能な状態での保存

#### 保存期間
- 法定保存期間：7年間`,
    relatedDocs: [
      "https://www.nta.go.jp/taxes/shirizu/zenbun/denshi/03.htm",
      "/docs/accounting-rules/electronic-bookkeeping-v3.0.pdf",
      "DD-TASK-022-001",
      "/docs/masters/retention-period.xlsx",
    ],
    requirementCount: 16,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // AR関連（11件）
  {
    id: "C004",
    name: "売掛金",
    synonyms: ["Accounts Receivable", "債権"],
    areas: ["AR"],
    definition: `商品やサービスを提供した対価として、将来回収される金銭債権。

### 発生元
- 売上計上基準：出基準・検収基準・請求基準
- 売上伝票からの自動計上
- 掛売による債権発生

### 管理
- Ageing管理：未経過・1ヶ月超・3ヶ月超・6ヶ月超
- 貸倒引当金：一般基準・個別評価
- 与信枠との連動管理

### 消費税の影響
- 税抜方式：税抜額を売掛金として計上
- 税込方式：税込額を売掛金として計上`,
    relatedDocs: [
      "/docs/accounting-rules/ar-receivables-v2.0.pdf",
      "DD-TASK-002-001",
      "/docs/masters/aging-categories.xlsx",
    ],
    requirementCount: 26,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C005",
    name: "請求書発行",
    synonyms: ["Invoice Generation", "請求書作成"],
    areas: ["AR"],
    definition: `顧客に対して商品やサービスの対価を請求する書類を発行する機能。

### 請求書の種類
- 売上計上請求書：通常の請求
- 仮請求書：検収前の一部請求
- 中間金請求書：長期工事の中間金請求
- 完成請求書：検収後の残金請求

### 請求内容
- 取引日・請求日・支払期日
- 取引明細（品名・数量・単価・金額）
- 税率別の対価と税額
- 登録番号（適格請求書）

### 発行方法
- PDF出力・郵送
- 電子請求書送信`,
    relatedDocs: [
      "/docs/accounting-rules/ar-invoice-issuance-v1.8.pdf",
      "DD-TASK-003-001",
      "/docs/masters/invoice-templates.xlsx",
    ],
    requirementCount: 26,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C006",
    name: "入金消込",
    synonyms: ["Payment Reconciliation", "消込処理"],
    areas: ["AR"],
    definition: `入金データと請求データを突合し、債権を消し込む処理。

### 消込方式
- 全額消込：入金額と請求額が一致
- 一部消込：入金額が請求額未満
- 複数請求消込：1入金で複数請求を消込
- 相殺消込：売掛と買掛の相殺

### 消込ロジック
- 顧客コード一致
- 請求番号・支払期日・金額での突合
- 手数料・値引の考慮

### 消込結果
- 消込済債権の更新
- 未消込一覧の作成
- 入金過不足の検出`,
    relatedDocs: [
      "/docs/accounting-rules/ar-payment-reconciliation-v2.2.pdf",
      "DD-TASK-004-002",
      "/docs/masters/reconciliation-rules.xlsx",
    ],
    requirementCount: 16,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C007",
    name: "与信管理",
    synonyms: ["Credit Management", "信用管理"],
    areas: ["AR"],
    definition: `顧客の与信枠を管理し、与信リスクをコントロールする機能。

### 与信枠設定
- 顧客別与信枠の設定
- 与信枠の有効期限管理
- 与信枠の階層管理（社内承認）

### 与信チェック
- 売上時の与信残確認
- 与信超過時のアラート
- 与信超過時の出荷停止

### 与信見直し
- 延滞状況による与信見直し
- 与信枠の増減申請フロー
- 与信履歴の管理`,
    relatedDocs: [
      "/docs/accounting-rules/ar-credit-management-v1.5.pdf",
      "DD-TASK-001-001",
      "/docs/masters/credit-limit-rules.xlsx",
    ],
    requirementCount: 16,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C008",
    name: "債権回収",
    synonyms: ["Collection", "債権回収"],
    areas: ["AR"],
    definition: `未回収の債権を回収するための活動および管理。

### 回収活動
- 電話・メールによる督促
- 訪問による回収交渉
- 内容証明郵便の送付

### 回収計画
- 延滞債権の分類管理
- 回収予定日と回収方法の策定
- 回収進捗の管理

### 法的措置
- 支払督促の申立て
- 訴訟の提起
- 強制執行の手続き`,
    relatedDocs: [
      "/docs/accounting-rules/ar-collection-v1.3.pdf",
      "DD-TASK-006-001",
      "/docs/masters/collection-procedures.xlsx",
    ],
    requirementCount: 16,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C010",
    name: "電子請求書",
    synonyms: ["E-Invoice", "デジタルインボイス"],
    areas: ["AR"],
    definition: `電子的な形式で作成・送信される請求書。

### 送信方式
- 顧客ポータルへの送信
- 電子メールへの添付
- API連携による自動送信

### 電子請求書の要件
- 適格請求書の要件を満たすこと
- 電子署信による真正性担保
- タイムスタンプによる作成時の証明

### 受領確認
- 開封確認
- 承認状況の追跡
- 再送機能`,
    relatedDocs: [
      "/docs/accounting-rules/ar-e-invoice-v1.2.pdf",
      "DD-TASK-003-003",
      "/docs/masters/e-invoice-specs.xlsx",
    ],
    requirementCount: 26,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C011",
    name: "督促状",
    synonyms: ["Dunning Letter", "催促状"],
    areas: ["AR"],
    definition: `支払期限を過ぎた債権について支払を督促する文書。

### 督促の段階
- 第1次督促：支払期限後1週間
- 第2次督促：支払期限後1ヶ月
- 第3次督促：支払期限後2ヶ月

### 督促内容
- 未回収金額の明示
- 支払期日と支払方法の案内
- 遅延損害金の通知

### 自動送信
- 延滞日数に応じた自動送信
- カスタママイズ可能なテンプレート
- 送信履歴の管理`,
    relatedDocs: [
      "/docs/accounting-rules/ar-dunning-v1.1.pdf",
      "DD-TASK-006-001",
      "/docs/masters/dunning-templates.xlsx",
    ],
    requirementCount: 16,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C012",
    name: "与信枠",
    synonyms: ["Credit Limit", "信用限度"],
    areas: ["AR"],
    definition: `顧客に対して設定した与信の限度額。

### 設定単位
- 顧客別与信枠
- 拠点別与信枠
- 親会社包括与信枠

### 与信枠管理
- 与信枠の設定・変更・廃止
- 与信枠の有効期限管理
- 与信枠の一時停止・解除

### 与信枠の活用
- 売上時の与信チェック
- 与信枠の利用率表示
- 与信枠超過時の承認フロー`,
    relatedDocs: [
      "/docs/accounting-rules/ar-credit-limit-v1.4.pdf",
      "DD-TASK-001-001",
      "/docs/masters/credit-limit-rules.xlsx",
    ],
    requirementCount: 16,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C013",
    name: "未回収債権",
    synonyms: ["Outstanding Receivables", "未消込債権"],
    areas: ["AR"],
    definition: `まだ回収されていない売掛金。

### 未回収債権の分類
- 通常債権：支払期日内
- 延滞債権：支払期限経過
- 貸倒債権：回収不能

### 管理指標
- 未回収残高
- 平均回収期間（DSO）
- 延滞率

### 回収対応
- 督促状の送付
- 回収計画の策定
- 貸倒処理の手続き`,
    relatedDocs: [
      "/docs/accounting-rules/ar-outstanding-v1.2.pdf",
      "DD-TASK-005-001",
      "/docs/masters/aging-report.xlsx",
    ],
    requirementCount: 16,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C014",
    name: "回収計画",
    synonyms: ["Collection Plan", "回収スケジュール"],
    areas: ["AR"],
    definition: `延滞債権の回収に向けた計画およびスケジュール。

### 回収計画の内容
- 回収予定日
- 回収方法（電話・訪問・法的措置）
- 回収目標額

### 進捗管理
- 回収実績の記録
- 回収率の算出
- 回収遅延の要因分析

### レポート
- 回収計画一覧
- 回収実績報告
- 延滞債権推移表`,
    relatedDocs: [
      "/docs/accounting-rules/ar-collection-plan-v1.1.pdf",
      "DD-TASK-006-001",
      "/docs/masters/collection-schedule.xlsx",
    ],
    requirementCount: 16,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C015",
    name: "売上伝票",
    synonyms: ["Sales Slip", "売上計上書類"],
    areas: ["AR"],
    definition: `売上計上の元となる取引伝票。

### 伝票の種類
- 売上伝票：通常の売上
- 返品伝票：返品・値引
- 注文伝票：受注記録

### 計上項目
- 取引日
- 顧客コード
- 品目コード・数量・単価
- 税率・税額

### 伝票処理
- 伝票入力・検証
- 伝票からの自動仕訳
- 伝票の承認フロー`,
    relatedDocs: [
      "/docs/accounting-rules/ar-sales-slip-v1.6.pdf",
      "DD-TASK-002-001",
      "/docs/masters/slip-templates.xlsx",
    ],
    requirementCount: 12,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // AP関連（10件）
  {
    id: "C016",
    name: "買掛金",
    synonyms: ["Accounts Payable", "債務"],
    areas: ["AP"],
    definition: `商品やサービスの仕入れに対して生じる支払債務。

### 買掛金の発生
- 仕入時の買掛計上
- 検収時の未払計上
- 掛仕入による債務発生

### 管理
- 買掛残高管理
- 支払期日管理
- 仕入先別の買掛集計

### 支払計画
- 支払予定の作成
- キャッシュフローとの連動
- 支払優先順位の決定`,
    relatedDocs: [
      "/docs/accounting-rules/ap-payables-v2.0.pdf",
      "DD-TASK-008-001",
      "/docs/masters/ap-aging-report.xlsx",
    ],
    requirementCount: 22,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C017",
    name: "支払依頼",
    synonyms: ["Payment Request", "支払申請"],
    areas: ["AP"],
    definition: `支払を実行するために依頼するプロセスおよび書類。

### 依頼内容
- 支払先情報
- 支払金額
- 支払期日
- 支払方法（振込・手形・小切手）

### 承認フロー
- 支払依頼の入力
- 上承者の承認
- 承認済み依頼の支払実行への連携

### 依頼管理
- 依頼状況の追跡
- 未承認依頼の一覧
- 承認履歴の管理`,
    relatedDocs: [
      "/docs/accounting-rules/ap-payment-request-v1.3.pdf",
      "DD-TASK-009-001",
      "/docs/masters/payment-workflow.xlsx",
    ],
    requirementCount: 8,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C018",
    name: "支払承認",
    synonyms: ["Payment Approval", "支払承認フロー"],
    areas: ["AP"],
    definition: `支払依頼を承認し、支払実行の可否を判断するプロセス。

### 承認権限
- 金額別承認権限
- 支払先別承認権限
- 代理承認の設定

### 承認処理
- 承認・却下・差戻し
- 承認コメントの入力
- 一括承認機能

### 承認後処理
- 承認済み依頼の支払実行への連携
- 承認済み依頼のキャンセル
- 承認履歴の記録`,
    relatedDocs: [
      "/docs/accounting-rules/ap-payment-approval-v1.2.pdf",
      "DD-TASK-010-001",
      "/docs/masters/approval-authority.xlsx",
    ],
    requirementCount: 8,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C019",
    name: "手形管理",
    synonyms: ["Bill Management", "手形支払"],
    areas: ["AP"],
    definition: `支払手形の発行、受取、期日管理を行う機能。

### 手形の種類
- 約束手形
- 為替手形
- 小切手

### 手形処理
- 手形発行依頼
- 手形の作成・送付
- 手形期日管理
- 手形決済処理

### 手形管理
- 手形台帳の作成
- 期日別の手形一覧
- 満期日のアラート
- 手形不渡り時の対応`,
    relatedDocs: [
      "/docs/accounting-rules/ap-bill-management-v1.5.pdf",
      "DD-TASK-012-001",
      "/docs/masters/bill-maturity-schedule.xlsx",
    ],
    requirementCount: 17,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C020",
    name: "仕入先マスタ",
    synonyms: ["Vendor Master", "サプライヤーマスタ"],
    areas: ["AP"],
    definition: `仕入先の基本情報を管理するマスタデータ。

### マスタ項目
- 仕入先コード
- 仕入先名・住所
- 担当者情報
- 支払条件
- 銀行口座情報

### 管理機能
- マスタの登録・変更・削除
- 重複チェック
- 履歴管理

### 支払条件
- 支払サイト（月末締翌月末払・Nets 60日）
- 手形サイト
- 支払方法（振込・手形）`,
    relatedDocs: [
      "/docs/accounting-rules/ap-vendor-master-v2.1.pdf",
      "DD-TASK-013-001",
      "/docs/masters/vendor-templates.xlsx",
    ],
    requirementCount: 9,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C021",
    name: "仕入請求書",
    synonyms: ["Purchase Invoice", "ベンダー請求書"],
    areas: ["AP"],
    definition: `仕入先から受領する請求書。

### 請求書受領
- 郵送による受領
- 電子請求書の受領
- 仕入先ポータルからの取得

### 請求内容確認
- 受注・検収との突合
- 単価・数量の確認
- 税額の計算チェック

### 請求書取込
- 請求書データの読み込み
- 買掛金への計上
- 支払予定への連携`,
    relatedDocs: [
      "/docs/accounting-rules/ap-purchase-invoice-v1.4.pdf",
      "DD-TASK-007-001",
      "/docs/masters/invoice-verification.xlsx",
    ],
    requirementCount: 7,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C022",
    name: "支払予定",
    synonyms: ["Payment Schedule", "支払カレンダー"],
    areas: ["AP"],
    definition: `将来の支払予定を管理するデータ。

### 支払予定の作成
- 買掛データからの自動作成
- 支払期日によるグルーピング
- 支払方法別の集計

### 支払予定の表示
- 支払期日別一覧
- 仕入先別支払予定
- 支払方法別支払予定

### キャッシュフロー管理
- 月別支払予定額
- 資金繰りとの連動
- 支払の繰上げ・繰下げ`,
    relatedDocs: [
      "/docs/accounting-rules/ap-payment-schedule-v1.6.pdf",
      "DD-TASK-013-001",
      "/docs/masters/payment-calendar.xlsx",
    ],
    requirementCount: 17,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C023",
    name: "支払実行",
    synonyms: ["Payment Execution", "送金処理"],
    areas: ["AP"],
    definition: `実際に支払を実行する処理（銀行送信等）。

### 支払方法
- 銀行振込
- 手形決済
- 小切手決済

### 支払実行処理
- 承認済支払データの抽出
- 銀行IFへの送信
- 支払完了の確認

### 支払結果
- 支払成功・失敗の記録
- 銀行手数料の計上
- 支払明細の作成`,
    relatedDocs: [
      "/docs/accounting-rules/ap-payment-execution-v1.3.pdf",
      "DD-TASK-011-001",
      "/docs/masters/bank-interface.xlsx",
    ],
    requirementCount: 8,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C024",
    name: "買掛残高",
    synonyms: ["AP Balance", "債務残高"],
    areas: ["AP"],
    definition: `未払いの買掛金の残高。

### 残高管理
- 仕入先別残高
- 支払期日別残高
- 通貨別残高

### 残高確認
- 買掛残高一覧
- 仕入請求書との突合
- 仕入先への残高確認

### 支払計画
- 残高に基づく支払計画
- 支払優先順位の決定
- キャッシュフロー予測`,
    relatedDocs: [
      "/docs/accounting-rules/ap-balance-v1.5.pdf",
      "DD-TASK-014-001",
      "/docs/masters/ap-balance-report.xlsx",
    ],
    requirementCount: 17,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C025",
    name: "仕入伝票",
    synonyms: ["Purchase Slip", "仕入計上書類"],
    areas: ["AP"],
    definition: `仕入計上の元となる取引伝票。

### 伝票の種類
- 仕入伝票：通常の仕入
- 返品伝票：返品・値引
- 注文伝票：発注記録

### 計上項目
- 取引日
- 仕入先コード
- 品目コード・数量・単価
- 税率・税額

### 伝票処理
- 伝票入力・検証
- 伝票からの自動仕訳
- 伝票の承認フロー`,
    relatedDocs: [
      "/docs/accounting-rules/ap-purchase-slip-v1.4.pdf",
      "DD-TASK-008-001",
      "/docs/masters/purchase-templates.xlsx",
    ],
    requirementCount: 8,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // GL関連（10件）
  {
    id: "C026",
    name: "仕訳",
    synonyms: ["Journal Entry", "転記"],
    areas: ["GL"],
    definition: `勘定科目間の取引を記録する会計処理。

### 仕訳の構成要素
- 日付：取引発生日
- 借方勘定科目と金額
- 貸方勘定科目と金額
- 摘要：取引の説明

### 複式簿記の原則
- 貸借平均の原則
- 借方合計 = 貸方合計

### 仕訳の種類
- 手動仕訳：経理担当による入力
- 自動仕訳：業務プロセスからの自動生成
- 振替仕訳：勘定科目間の振替
- 決算整理仕訳：決算時の整理`,
    relatedDocs: [
      "/docs/accounting-rules/gl-journal-entry-v2.5.pdf",
      "DD-TASK-015-001",
      "/docs/masters/account-codes.xlsx",
    ],
    requirementCount: 33,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C027",
    name: "手動仕訳計上",
    synonyms: ["Manual Journal Entry", "手動転記"],
    areas: ["GL"],
    definition: `手動で仕訳データを入力し、計上する機能。

### 入力項目
- 仕訳日付
- 借方勘定科目・金額
- 貸方勘定科目・金額
- 摘要
- 部門・プロジェクト（補助科目）

### 入力支援
- 勘定科目の検索
- 補助科目の検索
- 定型仕訳の呼出し

### 仕訳承認
- 仕訳の承認フロー
- 承認後の自動転記
- 仕訳の取り消し`,
    relatedDocs: [
      "/docs/accounting-rules/gl-manual-entry-v1.3.pdf",
      "DD-TASK-015-001",
      "/docs/masters/manual-entry-templates.xlsx",
    ],
    requirementCount: 6,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C028",
    name: "総勘定元帳",
    synonyms: ["General Ledger", "GL"],
    areas: ["GL"],
    definition: `すべての勘定科目の取引明細を記録した元帳。

### 元帳の構造
- 勘定科目別の明細
- 取引日・仕訳番号
- 借方金額・貸方金額
- 残高

### 元帳の作成
- 仕訳からの転記
- 勘定科目別の集計
- 期間別の集計

### 元帳の活用
- 残高確認
- 取引履歴の照会
- 試算表・財務諸表の作成基礎`,
    relatedDocs: [
      "/docs/accounting-rules/gl-general-ledger-v2.0.pdf",
      "DD-TASK-017-001",
      "/docs/masters/gl-templates.xlsx",
    ],
    requirementCount: 16,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C029",
    name: "試算表",
    synonyms: ["Trial Balance", "TB"],
    areas: ["GL"],
    definition: `総勘定元帳から作成する残高試算表。

### 試算表の種類
- 合計残高試算表
- 残高試算表
- 合計試算表

### 試算表の構造
- 勘定科目
- 借方合計・貸方合計
- 借方残高・貸方残高

### 貸借整合
- 借方合計 = 貸方合計の確認
- 貸借不一致の原因究明
- 修正仕訳の入力`,
    relatedDocs: [
      "/docs/accounting-rules/gl-trial-balance-v1.4.pdf",
      "DD-TASK-018-001",
      "/docs/masters/tb-templates.xlsx",
    ],
    requirementCount: 7,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C030",
    name: "貸借対照表",
    synonyms: ["Balance Sheet", "B/S"],
    areas: ["GL"],
    definition: `一定時点における会社の財政状態を示す財務諸表。

### B/Sの構造
#### 資産の部
- 流動資産：現金預金・売掛金・棚卸資産
- 固定資産：有形固定資産・無形固定資産

#### 負債の部
- 流動負債：買掛金・未払金
- 固定負債：長期借入金

#### 純資産の部
- 資本金
- 利剰余金

### 作成基準
- 貸借対照表等式：資産 = 負債 + 純資産
- 継続性の原則`,
    relatedDocs: [
      "/docs/accounting-rules/gl-balance-sheet-v1.8.pdf",
      "DD-TASK-019-001",
      "/docs/masters/bs-templates.xlsx",
    ],
    requirementCount: 10,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C031",
    name: "損益計算書",
    synonyms: ["Income Statement", "P/L"],
    areas: ["GL"],
    definition: `一定期間における会社の経営成績を示す財務諸表。

### P/Lの構造
#### 収益の部
- 売上高
- 営業外収益
- 特別利益

#### 費用の部
- 売上原価
- 販売費及び一般管理費
- 営業外費用
- 特別損失

### 利益の計算
- 売上総利益 = 売上高 - 売上原価
- 営業利益 = 売上総利益 - 販売費及び一般管理費
- 経常利益 = 営業利益 + 営業外収益 - 営業外費用
- 当期純利益 = 経常利益 + 特別利益 - 特別損失`,
    relatedDocs: [
      "/docs/accounting-rules/gl-income-statement-v1.8.pdf",
      "DD-TASK-019-001",
      "/docs/masters/pl-templates.xlsx",
    ],
    requirementCount: 10,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C032",
    name: "決算整理",
    synonyms: ["Closing Adjustment", "決算整理仕訳"],
    areas: ["GL"],
    definition: `決算時に行う整理仕訳および費用・収益の見越・繰延べ。

### 決算整理の種類
#### 見越計算
- 未払費用の計上
- 未収収益の計上

#### 繰延計算
- 前払費用の繰延
- 前受収益の繰延

#### 評価計算
- 棚卸資産の評価
- 貸倒引当金の計上
- 減価償却費の計上

### 決算整理仕訳
- 整理仕訳の入力
- 整理後試算表の作成
- 決算資料の作成`,
    relatedDocs: [
      "/docs/accounting-rules/gl-closing-v2.0.pdf",
      "DD-TASK-020-001",
      "/docs/masters/closing-templates.xlsx",
    ],
    requirementCount: 18,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C033",
    name: "固定資産",
    synonyms: ["Fixed Assets", "有形固定資産"],
    areas: ["GL"],
    definition: `長期にわたって事業のために使用する資産。

### 固定資産の種類
#### 有形固定資産
- 建物
- 構築物
- 機械装置
- 車両運搬具
- 工具器具備品

#### 無形固定資産
- ソフトウェア
- 特許権
- 借地権

### 固定資産管理
- 取得：取得価額の決定
- 償却：減価償却の計算
- 廃棄：除却処理
- 移管：部門間移動`,
    relatedDocs: [
      "/docs/accounting-rules/gl-fixed-assets-v1.5.pdf",
      "DD-TASK-021-001",
      "/docs/masters/fixed-assets-master.xlsx",
    ],
    requirementCount: 9,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C034",
    name: "減価償却",
    synonyms: ["Depreciation", "償却"],
    areas: ["GL"],
    definition: `固定資産の取得価額を耐用年数にわたって配分する会計処理。

### 償却方法
- 定額法：毎期同額を償却
- 定率法：初年度多めに償却
- 生産高比例法：利用量に比例して償却

### 償却計算
- 取得価額
- 耐用年数
- 残存価額（通常1円）
- 償却率

### 償却記録
- 償却費の計上
- 減価償却累計額の記録
- 帳簿価額の算出`,
    relatedDocs: [
      "/docs/accounting-rules/gl-depreciation-v1.4.pdf",
      "DD-TASK-021-001",
      "/docs/masters/depreciation-rates.xlsx",
    ],
    requirementCount: 9,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "C035",
    name: "税申告",
    synonyms: ["Tax Filing", "申告作業"],
    areas: ["GL"],
    definition: `税務署に提出する税申告書の作成および提出。

### 申告税目
- 消費税
- 法人税
- 法人住民税
- 法人事業税

### 申告資料作成
- 課税売上高の集計
- 課税仕入高の集計
- 納付税額の計算
- 申告書の作成

### 申告手続き
- e-Taxによる電子申告
- 税務署への提出
- 納税の手続き`,
    relatedDocs: [
      "https://www.nta.go.jp/taxes/shiruku/zeimoku/202311/data/01.pdf",
      "/docs/accounting-rules/gl-tax-filing-v1.7.pdf",
      "DD-TASK-022-001",
      "/docs/masters/tax-templates.xlsx",
    ],
    requirementCount: 16,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

export const getConceptById = (id: string): Concept | undefined => {
  return concepts.find(c => c.id === id);
};

export const getConceptsByArea = (area: string): Concept[] => {
  return concepts.filter(c => c.areas.includes(area as any));
};

export const getConceptsByName = (name: string): Concept[] => {
  return concepts.filter(c => c.name.includes(name) || c.synonyms.some(s => s.includes(name)));
};

// 概念に関連する要件を取得（Task・SRFデータから動的に紐付け）
export const getRelatedRequirements = (conceptId: string): RequirementReference[] => {
  // Step 1: 概念を使用しているタスクを取得
  const relatedTasks = tasks.filter(t => t.concepts.includes(conceptId));

  // Step 2: タスクに関連するSRFを取得
  const relatedSRFs = relatedTasks.flatMap(task =>
    systemFunctions.filter(srf => srf.relatedTaskIds.includes(task.id))
  );

  // Step 3: SRFから要件IDを抽出して重複排除
  const requirementIds = Array.from(new Set(
    relatedSRFs.flatMap(srf => srf.requirementIds)
  ));

  // Step 4: 要件情報を整形
  return requirementIds.map(reqId => {
    // SR-TASK-XXX-YYY または BR-TASK-XXX-YYY 形式からTASK-XXXを抽出
    const parts = reqId.split('-');
    const taskId = parts.length >= 3 ? `TASK-${parts[1]}-${parts[2]}` : null;
    const task = taskId ? tasks.find(t => t.id === taskId) : null;

    return {
      id: reqId,
      title: task ? `${task.name}に関する要件` : "システム要件",
      type: reqId.startsWith("BR-") ? "業務要件" : "システム要件"
    };
  });
};
