/**
 * AR領域（売掛金管理）のサンプル業務タスク・業務要件データ
 *
 * 業務フロー:
 * 1. 売上計上 - 確定した売上を計上し、売掛金として記録
 * 2. 請求書発行 - 売掛金データに基づき請求書を発行
 * 3. 入金消込 - 入金データと売掛金データを突合し、消込処理
 * 4. 売掛金元帳照会 - 売掛金の残高確認
 * 5. 未収金管理 - 未回収の売掛金を管理・回収活動
 * 6. 与信管理 - 取引先の与信枠管理・審査
 */

export interface ProcessStep {
  when: string;
  who: string;
  action: string;
}

export interface BusinessTaskInput {
  name: string;
  description: string;
  source: string;
  condition?: string;
}

export interface BusinessTaskOutput {
  name: string;
  destination: string;
}

export interface BusinessRequirement {
  requirementId: string;
  code: string;
  requirement: string;
  goal: string;  // rationale を goal に変更（DBスキーマ対応）
  conceptIds: string[];
}

export interface BusinessTaskData {
  taskId: string;
  name: string;
  summary: string;
  processSteps: ProcessStep[];
  input: BusinessTaskInput[];
  output: BusinessTaskOutput[];
  concepts: string[];
  requirements: BusinessRequirement[];
}

/**
 * AR領域のサンプル業務タスク・業務要件データ
 */
export const AR_BUSINESS_TASKS_DATA: BusinessTaskData[] = [
  {
    taskId: "BT-AR-0001",
    name: "売上計上",
    summary: "確定した売上を計上し、売掛金として記録する",
確定した受注データに基づき、売掛金元帳に計上データを登録する。

**前提条件:**
- 受注データが「確定」ステータスであること
- 請求処理締日を経過していること

**関連する業務ルール:**
- 売上計上日は出荷日基準とする
- 与信NGの取引先への売上は、与信部門の承認後に計上する
- 計上後の取消は、取消伝票を起票して対応する（直接削除は禁止）`,
    processSteps: [
      { when: "締め日翌営業日", who: "経理担当", action: "計上対象の売上を抽出する" },
      { when: "抽出後", who: "経理担当", action: "売上の妥当性を確認し、例外を差し戻す" },
      { when: "確認後", who: "システム", action: "売掛金元帳に計上データを登録する" },
      { when: "計上後", who: "システム", action: "関係者に計上完了通知を送信する" }
    ],
    input: [
      { name: "確定済み売上データ", description: "受注管理システムから連携された売上データ", source: "受注管理システム", condition: "ステータスが「確定」" },
      { name: "与信判定結果", description: "取引先の与信ステータス", source: "与信管理システム", condition: "与信OKまたは承認済み" }
    ],
    output: [
      { name: "売掛金元帳データ", destination: "会計システム" },
      { name: "計上完了通知", destination: "経理担当・営業担当" }
    ],
    concepts: ["REVENUE_RECOGNITION", "ACCOUNTS_RECEIVABLE"],
    requirements: [
      {
        requirementId: "BR-AR-0001-0001",
        code: "AR-001-001",
        requirement: "売上を自動的に計上できる",
        goal: "手入力のミスを削減し、処理効率を向上させるため、確定した売上から売掛金を自動的に計上する。与信判定結果と連動し、与信NGの場合は承認フローを経由する。"
      },
      {
        requirementId: "BR-AR-0001-0002",
        code: "AR-001-002",
        requirement: "売上計上処理の結果を出力できる",
        goal: "計上件数、金額、例外件数を集計し、処理結果を経理担当が確認できるようにする。"
      }
    ]
  },
  {
    taskId: "BT-AR-0002",
    name: "請求書発行",
    summary: "売掛金データに基づき請求書を発行し、顧客に送付する",
売掛金元帳のデータから請求書を生成し、顧客へ送付する。

**前提条件:**
- 売掛金データが計上済みであること
- 請求書発行対象期間が確定していること

**関連する業務ルール:**
- 適格請求書としての法的要件を満たすこと（登録番号、税率ごとの対価等）
- 請求書番号は連番で管理し、欠番を避けること
- メール送付失敗時は再送処理ができること`,
    processSteps: [
      { when: "請求処理開始", who: "経理担当", action: "請求対象期間を設定し、請求書発行処理を起動する" },
      { when: "起動後", who: "システム", action: "請求対象の売掛金データを抽出する" },
      { when: "抽出後", who: "システム", action: "適格請求書形式で請求書PDFを生成する" },
      { when: "生成後", who: "システム", action: "請求書番号を連番で採番し記録する" },
      { when: "採番後", who: "システム", action: "顧客へメールで請求書を送付する" },
      { when: "送付後", who: "システム", action: "請求書送付履歴を記録する" }
    ],
    input: [
      { name: "請求対象売掛金データ", description: "売掛金元帳から抽出された未請求の売掛金", source: "売掛金元帳", condition: "請求対象期間内かつ未請求" },
      { name: "顧客情報", description: "請求先のメールアドレス・送付方法", source: "顧客マスタ", condition: "有効なメールアドレスが登録済み" },
      { name: "会社情報", description: "登録番号等の適格請求書情報", source: "会社情報マスタ", condition: "登録済み" }
    ],
    output: [
      { name: "請求書PDF", destination: "ファイルシステム・顧客メール" },
      { name: "請求書送付履歴", destination: "請求書管理テーブル" },
      { name: "売掛金の請求ステータス更新", destination: "売掛金元帳" }
    ],
    concepts: ["TAX_INVOICE_JP", "INVOICE_NUMBERING"],
    requirements: [
      {
        requirementId: "BR-AR-0002-0001",
        code: "AR-002-001",
        requirement: "適格請求書としての法的要件を満たす請求書を発行できる",
        goal: "2023年10月以降の仕入税額控除の要件として、適格請求書（インボイス）として必要な記載事項（登録番号、税率ごとの対価と消費税額等）を満たした請求書を発行する必要がある。"
      },
      {
        requirementId: "BR-AR-0002-0002",
        code: "AR-002-002",
        requirement: "請求書をPDFで出力できる",
        goal: "顧客への請求書送付手段としてPDF形式を使用する。ファイルサイズは5MB以下（メール添付制限）とする。"
      },
      {
        requirementId: "BR-AR-0002-0003",
        code: "AR-002-003",
        requirement: "請求書をメールで送付できる",
        goal: "郵送コスト削減と即時性のため、請求書をメールで自動送付する。送付失敗時は再送処理ができること。"
      }
    ]
  },
  {
    taskId: "BT-AR-0003",
    name: "入金消込",
    summary: "入金データと売掛金データを突合し、消込処理を行う",
銀行口座への入金データと売掛金データを突合し、消込を行う。

**前提条件:**
- 銀行口座に入金データがあること
- 対応する売掛金が存在すること

**関連する業務ルール:**
- 入金額と売掛金額の相違を検出した場合は仮消込とする
- 複数請求の一部入金の場合は、消込順序を設定する
- 消込後の売掛金残高を即座に更新する`,
    processSteps: [
      { when: "入金処理開始", who: "経理担当", action: "銀行口座の入金データを取り込む" },
      { when: "取り込み後", who: "システム", action: "入金データを売掛金データと自動突合する" },
      { when: "突合後", who: "経理担当", action: "消込対象と消込額を確認する" },
      { when: "確認後", who: "システム", action: "消込処理を実行し、売掛金残高を更新する" },
      { when: "消込後", who: "システム", action: "消込結果を顧客・営業担当に通知する" }
    ],
    input: [
      { name: "銀行入金データ", description: "銀行口座への入金明細", source: "銀行APIまたは手入力", condition: "未処理の入金データ" },
      { name: "売掛金元帳データ", description: "未回収の売掛金データ", source: "売掛金元帳", condition: "入金済みでない" }
    ],
    output: [
      { name: "消込明細", destination: "消込管理テーブル" },
      { name: "売掛金残高更新", destination: "売掛金元帳" },
      { name: "入金完了通知", destination: "顧客・営業担当" }
    ],
    concepts: ["PAYMENT_ALLOCATION", "ACCOUNTS_RECEIVABLE"],
    requirements: [
      {
        requirementId: "BR-AR-0003-0001",
        code: "AR-003-001",
        requirement: "入金データと売掛金データを自動突合できる",
        goal: "手入力によるミスを削減するため、銀行口座の入金データと売掛金データを金額・日付等のキーで自動突合する。部分一致・過不足入金の場合は仮消込として扱う。"
      },
      {
        requirementId: "BR-AR-0003-0002",
        code: "AR-003-002",
        requirement: "消込順序を設定できる",
        goal: "複数請求に対する一部入金の場合、消込順序（古い請求優先・金額の大きい順等）を設定し、自動消込できること。"
      }
    ]
  },
  {
    taskId: "BT-AR-0004",
    name: "売掛金元帳照会",
    summary: "売掛金の残高状況を照会・確認する",
取引先別の売掛金残高、年齢別内訳を確認する。

**前提条件:**
- 取引先が登録されていること
- 売掛金データが存在すること

**関連する業務ルール:**
- 残高は請求書発行済みの未消込分を表示する
- 年齢区分（期日内、1ヶ月超、3ヶ月超等）で内訳を表示する`,
    processSteps: [
      { when: "照会開始", who: "営業担当・経理担当", action: "取引先と照会条件を指定する" },
      { when: "指定後", who: "システム", action: "売掛金元帳から該当データを検索する" },
      { when: "検索後", who: "システム", action: "残高・年齢別内訳を集計する" },
      { when: "集計後", who: "システム", action: "照会結果を表示する" }
    ],
    input: [
      { name: "取引先コード", description: "照会対象の取引先", source: "ユーザー入力", condition: "有効な取引先コード" },
      { name: "照会条件", description: "期間・金額等のフィルタ条件", source: "ユーザー入力", condition: "任意" }
    ],
    output: [
      { name: "売掛金残高一覧", destination: "画面表示" },
      { name: "年齢別内訳", destination: "画面表示" }
    ],
    concepts: ["ACCOUNTS_RECEIVABLE", "AGING_REPORT"],
    requirements: [
      {
        requirementId: "BR-AR-0004-0001",
        code: "AR-004-001",
        requirement: "売掛金残高を取引先別に照会できる",
        goal: "営業活動・回収活動のために、取引先別の売掛金残高をリアルタイムで確認する必要がある。"
      },
      {
        requirementId: "BR-AR-0004-0002",
        code: "AR-004-002",
        requirement: "年齢別内訳を表示できる",
        goal: "未収金管理のため、売掛金を支払期日からの経過日数で分類（期日内、1ヶ月超、3ヶ月超等）し、リスク評価に使用する。"
      }
    ]
  },
  {
    taskId: "BT-AR-0005",
    name: "未収金管理",
    summary: "未回収の売掛金を管理し、回収活動を行う",
期日超過の売掛金を抽出し、顧客へ督促・回収を行う。

**前提条件:**
- 期日超過の売掛金が存在すること
- 回収担当が割り当てられていること

**関連する業務ルール:**
- 期日超過日数に応じて督促内容を変える
- 回収履歴を記録し、次回アクションの判断材料とする
- 法的手続き（内容証明・支払督促等）の要件を満たす`,
    processSteps: [
      { when: "回収活動開始", who: "回収担当", action: "期日超過の売掛金一覧を確認する" },
      { when: "確認後", who: "回収担当", action: "顧客へ連絡（電話・メール・訪問）し、支払いを督促する" },
      { when: "連絡後", who: "回収担当", action: "回収履歴と次回アクション予定を記録する" },
      { when: "支払約束あり", who: "システム", action: "約束日をアラーム登録する" },
      { when: "回収完了", who: "回収担当", action: "回収完了を記録し、次回アクションをキャンセルする" }
    ],
    input: [
      { name: "期日超過売掛金", description: "回収対象の売掛金データ", source: "売掛金元帳", condition: "支払期日超過" },
      { name: "回収担当マスタ", description: "担当者と取引先の紐づけ", source: "回収担当マスタ", condition: "登録済み" }
    ],
    output: [
      { name: "回収履歴", destination: "回収管理テーブル" },
      { name: "次回アクションアラーム", destination: "タスク管理システム" },
      { name: "回収完了通知", destination: "売掛金元帳（入金消込）" }
    ],
    concepts: ["COLLECTION_MANAGEMENT", "OVERDUE_ACCOUNTS"],
    requirements: [
      {
        requirementId: "BR-AR-0005-0001",
        code: "AR-005-001",
        requirement: "期日超過の売掛金を一覧表示できる",
        goal: "回収活動の効率化のため、期日超過日数・金額順に並べ替えた一覧を表示する。"
      },
      {
        requirementId: "BR-AR-0005-0002",
        code: "AR-005-002",
        requirement: "回収履歴を記録できる",
        goal: "複数メンバーでの対応履歴を共有するため、連絡内容・約束事項を記録する。"
      }
    ]
  },
  {
    taskId: "BT-AR-0006",
    name: "与信管理",
    summary: "取引先の与信枠を管理し、与信審査を行う",
新規取引先の与信審査、既存取引先の与信枠見直しを行う。

**前提条件:**
- 新規取引先登録申請があること
- 既存取引先の与信見直しタイミングであること

**関連する業務ルール:**
- 与信枠は売掛金残高の上限を示す
- 与信審査は決裁フローに従う（担当者→マネージャー→役員）
- 与信NGの場合は売上計上を承認制御する`,
    processSteps: [
      { when: "与信審査依頼", who: "営業担当", action: "新規取引先または与信枠増額申請を行う" },
      { when: "依頼受領後", who: "与信担当", action: "取引先の財務情報・信用情報を収集する" },
      { when: "収集後", who: "与信担当", action: "与信評価スコアを算出し、与信枠案を作成する" },
      { when: "作成後", who: "与信担当", action: "決裁者へ審査依頼を回す" },
      { when: "決裁後", who: "システム", action: "与信枠を登録し、取引先マスタを更新する" },
      { when: "更新後", who: "システム", action: "営業担当・経理担当へ与信枠変更を通知する" }
    ],
    input: [
      { name: "新規取引先情報", description: "会社名・住所・決算期日等", source: "営業担当入力", condition: "新規登録申請" },
      { name: "財務情報", description: "決算書・信用情報等", source: "与信担当入力", condition: "審査用資料" },
      { name: "既存取引先売掛実績", description: "支払状況・遅延履歴", source: "売掛金元帳", condition: "与信見直し時" }
    ],
    output: [
      { name: "与信枠登録", destination: "取引先マスタ" },
      { name: "与信評価結果", destination: "与信管理テーブル" },
      { name: "与信通知", destination: "営業担当・経理担当" }
    ],
    concepts: ["CREDIT_MANAGEMENT", "CREDIT_LIMIT"],
    requirements: [
      {
        requirementId: "BR-AR-0006-0001",
        code: "AR-006-001",
        requirement: "与信枠を登録・管理できる",
        goal: "売掛金残高の上限管理とリスクコントロールのため、取引先ごとの与信枠を設定する。"
      },
      {
        requirementId: "BR-AR-0006-0002",
        code: "AR-006-002",
        requirement: "与信審査フローを実行できる",
        goal: "与信審査の適正化を図るため、申請→一次審査→二次審査→決裁のフローをシステム化し、履歴を残す。"
      },
      {
        requirementId: "BR-AR-0006-0003",
        code: "AR-006-003",
        requirement: "与信NGの場合は売上計上を制限できる",
        goal: "リスク回避のため、与信NG取引先への売上計上を承認制御し、与信部門の承認後に計上を許可する。"
      }
    ]
  }
];
