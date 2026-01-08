import { Ticket } from '../types';

export const tickets: Ticket[] = [
  // AR関連（10件）
  {
    id: "CR-001",
    title: "インボイス制度対応",
    description: "2023年10月より開始されるインボイス制度に対応するため、請求書フォーマットの変更および税額計算ロジックの改修が必要",
    businessIds: ["BIZ-001"],
    areas: ["AR"],
    status: "applied",
    targetVersions: ["v2.0", "v2.1"],
    priority: "high",
    requestedBy: "経理部長",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
    background: "2023年10月より開始されるインボイス制度（適格請求書等保存方式）により、請求書には登録番号の記載および税率ごとの区分記載が義務付けられる。現行の請求書フォーマットではこれらの要件を満たしていないため、法令対応に向けた緊急の改修が必要。また、複数税率（10%、8%）に対応した税額計算ロジックの見直しもあわせて実施する。",
    impactRequirements: [
      {
        id: "BR-TASK-003-001",
        title: "適格請求書（インボイス）形式で請求書を発行する",
        type: "業務要件"
      },
      {
        id: "BR-TASK-003-002",
        title: "電子請求書を顧客ポータルへ送信する",
        type: "業務要件"
      },
      {
        id: "SR-TASK-003-001",
        title: "税率別内訳を集計し、帳票出力へ反映する",
        type: "システム要件"
      },
      {
        id: "SR-TASK-003-002",
        title: "税率別内訳集計機能",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C001", name: "インボイス制度", status: "承認済" },
      { id: "C002", name: "消費税計算", status: "レビュー中" },
      { id: "C005", name: "請求書発行", status: "レビュー中" }
    ],
    versionHistory: [
      { version: "v2.0", appliedDate: "2024-01-20", status: "適用済" },
      { version: "v2.1", appliedDate: "2024-02-15", status: "適用済" }
    ]
  },
  {
    id: "CR-004",
    title: "入金消込自動化",
    description: "銀行ファイルを自動取り込みし、請求データとの自動消込を行う機能を追加する",
    businessIds: ["BIZ-001"],
    areas: ["AR"],
    status: "open",
    targetVersions: [],
    priority: "medium",
    requestedBy: "経理担当",
    createdAt: "2024-02-15T00:00:00Z",
    updatedAt: "2024-02-15T00:00:00Z",
    background: "現在、入金消込作業は銀行からダウンロードしたCSVファイルを手動でシステムに取り込み、請求データとの突合作業を手動で行っている。この作業は毎月数時間要しており、ヒューマンエラーのリスクも高い。銀行ファイルの自動取り込みと、顧客コード・金額による自動マッチング機能を実装することで、作業効率化と品質向上を図る。",
    impactRequirements: [
      {
        id: "BR-TASK-004-001",
        title: "銀行ファイルから入金データを取り込む",
        type: "業務要件"
      },
      {
        id: "BR-TICKET-CR-004-001",
        title: "主要銀行フォーマットの自動判定機能を追加する",
        type: "業務要件"
      },
      {
        id: "SR-TASK-004-001",
        title: "入金データ取り込み機能",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C004", name: "売掛金", status: "レビュー中" },
      { id: "C006", name: "入金消込", status: "レビュー中" }
    ]
  },
  {
    id: "CR-006",
    title: "請求書PDFテンプレート変更",
    description: "社外向け請求書のPDFテンプレートを変更し、ブランドロゴを追加する",
    businessIds: ["BIZ-001"],
    areas: ["AR"],
    status: "review",
    targetVersions: [],
    priority: "low",
    requestedBy: "マーケティング部",
    createdAt: "2024-02-20T00:00:00Z",
    updatedAt: "2024-02-20T00:00:00Z",
    background: "現在の請求書PDFテンプレートは機能重視のデザインとなっており、ブランドイメージが十分に反映されていない。マーケティング部からの要望により、請求書にもブランドロゴと会社デザインガイドラインに沿ったレイアウトを反映することで、顧客との接点におけるブランド体験を統一する。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-006-001",
        title: "請求書PDFテンプレートにブランドロゴを配置する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-006-001",
        title: "請求書PDF生成ロジックにロゴ画像差し込み機能を追加する",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C005", name: "請求書発行", status: "レビュー中" },
      { id: "C010", name: "電子請求書", status: "レビュー中" }
    ]
  },
  {
    id: "CR-009",
    title: "電子請求書対応強化",
    description: "電子請求書の送信機能を強化し、複数フォーマット（Peppol、UBL等）に対応する",
    businessIds: ["BIZ-001"],
    areas: ["AR"],
    status: "open",
    targetVersions: [],
    priority: "high",
    requestedBy: "IT部長",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
    background: "現在、電子請求書は自社フォーマットのみに対応しているが、海外取引の拡大に伴い国際標準フォーマット（Peppol、UBL等）への対応が急務となっている。また、大手顧客からは特定フォーマットでの送信要望が多く、ビジネスチャンス拡大のための早期対応が求められている。",
    impactRequirements: [
      {
        id: "BR-TASK-003-002",
        title: "電子請求書を顧客ポータルへ送信する",
        type: "業務要件"
      },
      {
        id: "BR-TICKET-CR-009-001",
        title: "Peppolネットワーク経由での電子請求書送信に対応する",
        type: "業務要件"
      },
      {
        id: "SR-TASK-003-003",
        title: "電子請求書送信機能",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C005", name: "請求書発行", status: "レビュー中" },
      { id: "C010", name: "電子請求書", status: "レビュー中" }
    ]
  },
  {
    id: "CR-012",
    title: "延滞債権アラート機能追加",
    description: "支払期限を超過した債権について、自動的にアラート通知を送る機能を追加する",
    businessIds: ["BIZ-001"],
    areas: ["AR"],
    status: "review",
    targetVersions: [],
    priority: "medium",
    requestedBy: "回収担当",
    createdAt: "2024-03-10T00:00:00Z",
    updatedAt: "2024-03-10T00:00:00Z",
    background: "現在、延滞債権の管理は担当者が手動で一覧を確認する方式となっており、対応遅れが発生している。支払期限超過時に自動的に担当者へ通知する機能を追加することで、早期対応と回収率向上を図る。特に重要度の高い顧客の延滞については、上位管理者へもエスカレーションする。",
    impactRequirements: [
      {
        id: "BR-TASK-006-002",
        title: "延滞債権に対してアラートを発報する",
        type: "業務要件"
      },
      {
        id: "SR-TASK-006-001",
        title: "延滞債権アラート機能",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C008", name: "債権回収", status: "レビュー中" },
      { id: "C011", name: "督促状", status: "レビュー中" },
      { id: "C013", name: "未回収債権", status: "レビュー中" }
    ]
  },
  {
    id: "CR-015",
    title: "与信枠管理機能改善",
    description: "顧客別の与信枠管理機能を改善し、履歴管理や承認フローを追加する",
    businessIds: ["BIZ-001"],
    areas: ["AR"],
    status: "approved",
    targetVersions: [],
    priority: "high",
    requestedBy: "与信管理者",
    createdAt: "2024-03-15T00:00:00Z",
    updatedAt: "2024-03-15T00:00Z",
    background: "現在、与信枠の設定・変更は単純なマスタ更新のみで、変更履歴や承認プロセスが存在しない。このため、誰がいつ変更したか追跡できず、不正リスクもある。与信枠変更時の承認フロー導入と履歴管理機能の追加により、ガバナンス強化と監査対応を実現する。",
    impactRequirements: [
      {
        id: "BR-TASK-001-001",
        title: "顧客別与信枠を設定・管理する",
        type: "業務要件"
      },
      {
        id: "BR-TASK-001-002",
        title: "与信枠超過時の対応フローを定義する",
        type: "業務要件"
      },
      {
        id: "BR-TICKET-CR-015-001",
        title: "与信枠変更時に承認フローを経由する",
        type: "業務要件"
      }
    ],
    relatedConcepts: [
      { id: "C007", name: "与信管理", status: "レビュー中" },
      { id: "C012", name: "与信枠", status: "レビュー中" }
    ]
  },
  {
    id: "CR-018",
    title: "請求書一括発行機能",
    description: "複数の顧客に対して一括で請求書を発行する機能を追加する",
    businessIds: ["BIZ-001"],
    areas: ["AR"],
    status: "open",
    targetVersions: [],
    priority: "medium",
    requestedBy: "経理担当",
    createdAt: "2024-03-20T00:00:00Z",
    updatedAt: "2024-03-20T00:00:00Z",
    background: "月末の請求書発行ピーク時には、数百件の請求書を個別に発行しており、業務負荷が高い。対象期間を一括指定し、バックグラウンドでPDF生成を行う機能を実装することで、業務効率化と処理時間短縮を図る。また、発行エラーのハンドリングと再試行メカニズムも必要となる。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-018-001",
        title: "請求対象を一括選択し、バッチ処理で請求書を発行する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-018-001",
        title: "一括発行バッチ処理とエラーハンドリング機能",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C005", name: "請求書発行", status: "レビュー中" }
    ]
  },
  {
    id: "CR-021",
    title: "顧客マスタ連携強化",
    description: "顧客マスタと請求データの連携を強化し、自動データ同期を実現する",
    businessIds: ["BIZ-001"],
    areas: ["AR"],
    status: "review",
    targetVersions: [],
    priority: "low",
    requestedBy: "IT部",
    createdAt: "2024-03-25T00:00:00Z",
    updatedAt: "2024-03-25T00:00Z",
    background: "現在、顧客マスタ（CRM）と請求システムは連携しておらず、データの不一致が発生している。顧客情報の変更が請求システムに反映されないケースがあり、問い合わせの原因となっている。API連携によるデータ同期と、変更履歴の可視化により、データ品質と業務効率を向上させる。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-021-001",
        title: "CRMシステムと顧客マスタをAPI連携する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-021-001",
        title: "顧客マスタ自動同期APIを実装する",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C007", name: "与信管理", status: "レビュー中" }
    ]
  },
  {
    id: "CR-024",
    title: "債権回収レポート自動化",
    description: "債権回収状況のレポートを自動生成する機能を追加する",
    businessIds: ["BIZ-001"],
    areas: ["AR"],
    status: "open",
    targetVersions: [],
    priority: "medium",
    requestedBy: "回収担当",
    createdAt: "2024-04-01T00:00:00Z",
    updatedAt: "2024-04-01T00:00:00Z",
    background: "現在、債権回収レポートはExcelで手作業で作成しており、毎月の作業に2日程度要している。未回収債権の ageing analysis や回収率の推移など、経営層への報告に必要な情報を自動集計し、ダッシュボードで可視化することで、意思決定の迅速化と業務削減を実現する。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-024-001",
        title: "債権回収状況を集計し、ダッシュボードで表示する",
        type: "業務要件"
      },
      {
        id: "BR-TASK-005-001",
        title: "未回収債権の一覧を参照できる",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-024-001",
        title: "回収レポート自動生成機能",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C008", name: "債権回収", status: "レビュー中" },
      { id: "C014", name: "回収計画", status: "レビュー中" }
    ]
  },
  {
    id: "CR-027",
    title: "請求データCSV出力機能",
    description: "請求データをCSV形式で出力する機能を追加する",
    businessIds: ["BIZ-001"],
    areas: ["AR"],
    status: "approved",
    targetVersions: [],
    priority: "low",
    requestedBy: "経理担当",
    createdAt: "2024-04-05T00:00:00Z",
    updatedAt: "2024-04-05T00:00:00Z",
    background: "現在、請求データの分析や外部ツールでの処理を行う際、画面から手動でコピペしており手間がかかっている。請求データをCSV形式でダウンロードできる機能を追加することで、Excelでの分析や会計システムへのインポートなどの業務効率を向上させる。",
    impactRequirements: [
      {
        id: "BR-TASK-002-001",
        title: "売上伝票をもとに売掛金を計上する",
        type: "業務要件"
      }
    ],
    relatedConcepts: [
      { id: "C004", name: "売掛金", status: "レビュー中" }
    ]
  },
  // AP関連（8件）
  {
    id: "CR-003",
    title: "支払依頼フロー改善",
    description: "支払依頼の承認フローを改善し、複数承認に対応する",
    businessIds: ["BIZ-002"],
    areas: ["AP"],
    status: "review",
    targetVersions: [],
    priority: "high",
    requestedBy: "購買部長",
    createdAt: "2024-02-10T00:00:00Z",
    updatedAt: "2024-02-10T00:00:00Z",
    background: "現在、支払依頼の承認は単一承認のみで、多額の支払については二重承認プロセスが必要とされている。コンプライアンス強化の観点から、金額に応じた多段階承認フローを実装し、内部統制を強化する。また、承認履歴の可視化と承認状況のメール通知も併せて実装する。",
    impactRequirements: [
      {
        id: "BR-TASK-010-001",
        title: "支払依頼を承認し、支払実行可否を判断する",
        type: "業務要件"
      },
      {
        id: "BR-TICKET-CR-003-001",
        title: "金額に応じた多段階承認フローを定義する",
        type: "業務要件"
      },
      {
        id: "SR-TASK-010-001",
        title: "支払承認画面",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C017", name: "支払依頼", status: "レビュー中" },
      { id: "C018", name: "支払承認", status: "レビュー中" }
    ]
  },
  {
    id: "CR-010",
    title: "仕入請求書OCR読取",
    description: "仕入請求書をOCRで読み取り、自動データ化する機能を追加する",
    businessIds: ["BIZ-002"],
    areas: ["AP"],
    status: "open",
    targetVersions: [],
    priority: "high",
    requestedBy: "購買担当",
    createdAt: "2024-03-05T00:00:00Z",
    updatedAt: "2024-03-05T00:00:00Z",
    background: "現在、仕入請求書のデータ入力は完全に手作業で行っており、紙の請求書からキーボード入力するため、ヒューマンエラーと時間のコストが高い。OCR技術を活用して請求書画像から自動的に項目を抽出し、データ入力を自動化することで、業務効率とデータ精度を大幅に向上させる。",
    impactRequirements: [
      {
        id: "BR-TASK-007-001",
        title: "仕入請求書を受け取り、内容を確認する",
        type: "業務要件"
      },
      {
        id: "BR-TICKET-CR-010-001",
        title: "請求書画像をアップロードし、OCR処理を実行する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-010-001",
        title: "OCRエンジン連携と請求書項目抽出機能",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C021", name: "仕入請求書", status: "レビュー中" }
    ]
  },
  {
    id: "CR-013",
    title: "電子手形対応",
    description: "電子手形の発行・管理に対応する",
    businessIds: ["BIZ-002"],
    areas: ["AP"],
    status: "approved",
    targetVersions: [],
    priority: "medium",
    requestedBy: "経理担当",
    createdAt: "2024-03-12T00:00:00Z",
    updatedAt: "2024-03-12T00:00:00Z",
    background: "紙の手形から電子手形への移行が進んでおり、支払业务務でも電子手形の発行・期日管理・支払処理が必要となっている。でんさいネットワーク等の電子手形プラットフォームとの連携により、手形業務の完全電子化と効率化を実現する。",
    impactRequirements: [
      {
        id: "BR-TASK-012-001",
        title: "支払手形の発行、管理、期日管理を行う",
        type: "業務要件"
      },
      {
        id: "BR-TICKET-CR-013-001",
        title: "でんさいネットワークと連携し、電子手形を発行する",
        type: "業務要件"
      },
      {
        id: "SR-TASK-012-001",
        title: "手形管理画面",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C019", name: "手形管理", status: "レビュー中" }
    ]
  },
  {
    id: "CR-016",
    title: "支払一括承認機能",
    description: "複数の支払依頼を一括承認する機能を追加する",
    businessIds: ["BIZ-002"],
    areas: ["AP"],
    status: "open",
    targetVersions: [],
    priority: "medium",
    requestedBy: "管理者",
    createdAt: "2024-03-18T00:00:00Z",
    updatedAt: "2024-03-18T00:00:00Z",
    background: "月末の支払承認ピーク時には、数百件の支払依頼を個別に承認しており、管理者の業務負荷が高い。金額範囲や仕入先ごとに支払依頼をグルーピングし、一括承認できる機能を実装することで、承認業務の効率化を図る。ただし、異常値の検知と個別承認への切り替えも考慮する必要がある。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-016-001",
        title: "支払依頼をグルーピングし、一括承認する",
        type: "業務要件"
      },
      {
        id: "SR-TASK-010-001",
        title: "支払承認画面",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C018", name: "支払承認", status: "レビュー中" }
    ]
  },
  {
    id: "CR-019",
    title: "仕入先ポータル連携",
    description: "仕入先ポータルと連携し、請求書データを自動取得する",
    businessIds: ["BIZ-002"],
    areas: ["AP"],
    status: "review",
    targetVersions: [],
    priority: "high",
    requestedBy: "購買部",
    createdAt: "2024-03-22T00:00:00Z",
    updatedAt: "2024-03-22T00:00Z",
    background: "大手仕入先は独自のポータルサイトを展開しており、そこから請求書をダウンロードする運用になっている。API連携によりポータルから直接請求書データを取得できれば、ダウンロードとデータ入力の手間が省け、業務効率が大幅に向上する。まずは主要仕入先5社のポータルとの連携から開始する。",
    impactRequirements: [
      {
        id: "BR-TASK-007-001",
        title: "仕入請求書を受け取り、内容を確認する",
        type: "業務要件"
      },
      {
        id: "BR-TASK-013-001",
        title: "仕入先への支払予定を管理し、支払を行う",
        type: "業務要件"
      },
      {
        id: "SR-TASK-015-001",
        title: "仕入先ポータルIF",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C020", name: "仕入先マスタ", status: "レビュー中" },
      { id: "C021", name: "仕入請求書", status: "レビュー中" }
    ]
  },
  {
    id: "CR-022",
    title: "買掛残高確認機能改善",
    description: "買掛残高確認画面のUIを改善し、フィルタ機能を追加する",
    businessIds: ["BIZ-002"],
    areas: ["AP"],
    status: "open",
    targetVersions: [],
    priority: "low",
    requestedBy: "経理担当",
    createdAt: "2024-03-28T00:00:00Z",
    updatedAt: "2024-03-28T00:00Z",
    background: "現在の買掛残高確認画面は、一覧表示のみでフィルタやソート機能が不十分である。仕入先別、期間別、金額帯別など様々な切り口で残高を分析できるように、UI改善とフィルタ機能の追加を行う。また、Excel出力機能も強化し、資料作成の手間を削減する。",
    impactRequirements: [
      {
        id: "BR-TASK-014-001",
        title: "仕入先別の買掛残高を確認し、支払計画を策定する",
        type: "業務要件"
      },
      {
        id: "SR-TASK-014-001",
        title: "買掛残高確認画面",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C016", name: "買掛金", status: "レビュー中" },
      { id: "C024", name: "買掛残高", status: "レビュー中" }
    ]
  },
  {
    id: "CR-025",
    title: "支払予定表自動作成",
    description: "買掛データから支払予定表を自動作成する機能を追加する",
    businessIds: ["BIZ-002"],
    areas: ["AP"],
    status: "approved",
    targetVersions: [],
    priority: "medium",
    requestedBy: "経理担当",
    createdAt: "2024-04-02T00:00:00Z",
    updatedAt: "2024-04-02T00:00Z",
    background: "現在、支払予定表はExcelで手作業で作成しており、毎月の作業に1日程度要している。買掛データから支払条件（サイト、締日など）を考慮し、自動的に支払予定を抽出・集計する機能を実装することで、業務効率化と支払計画の精度向上を図る。",
    impactRequirements: [
      {
        id: "BR-TASK-013-001",
        title: "仕入先への支払予定を管理し、支払を行う",
        type: "業務要件"
      },
      {
        id: "SR-TASK-016-001",
        title: "支払予定表作成機能",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C022", name: "支払予定", status: "レビュー中" }
    ]
  },
  {
    id: "CR-028",
    title: "外貨建支払対応",
    description: "外貨建ての支払に対応し、為替レート自動取得機能を追加する",
    businessIds: ["BIZ-002"],
    areas: ["AP"],
    status: "review",
    targetVersions: [],
    priority: "high",
    requestedBy: "経理部長",
    createdAt: "2024-04-08T00:00:00Z",
    updatedAt: "2024-04-08T00:00Z",
    background: "海外取引の拡大に伴い、USDやEUR建ての仕入請求書が増加している。現在は外貨建取引に対応しておらず、手作業で換算している。為替レートの自動取得と外貨建支払の処理機能を実装することで、グローバル業務の支援と為替差損益の正確な管理を実現する。",
    impactRequirements: [
      {
        id: "BR-TASK-011-001",
        title: "承認済支払データを銀行へ送信し、支払を実行する",
        type: "業務要件"
      },
      {
        id: "BR-TICKET-CR-028-001",
        title: "外国為替レートを自動取得し、換算を行う",
        type: "業務要件"
      },
      {
        id: "SR-TASK-011-001",
        title: "支払実行機能",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C023", name: "支払実行", status: "レビュー中" }
    ]
  },
  // GL関連（8件）
  {
    id: "CR-002",
    title: "電子帳簿保存法対応",
    description: "電子帳簿保存法の要件に対応したデータ保存機能を実装する",
    businessIds: ["BIZ-003"],
    areas: ["GL"],
    status: "approved",
    targetVersions: [],
    priority: "high",
    requestedBy: "経理部長",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
    background: "2022年1月より電子帳簿保存法が改正され、電子取引データの電子保存が義務化された。これにより、請求書や契約書等の電子データを一定期間保存する必要がある。現行システムでは紙への印刷保存が前提となっており、電子保存要件に対応するための改修が急務となっている。真偽確認性、可視性確保、検索機能の実装が必要。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-002-001",
        title: "電子取引データを法的要件に従って保存する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-002-001",
        title: "電子帳簿保存用データ保存機能を実装する",
        type: "システム要件"
      },
      {
        id: "SR-TICKET-CR-002-002",
        title: "タイムスタンプ付与および検索機能を実装する",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C003", name: "電子帳簿保存法", status: "承認済" },
      { id: "C026", name: "仕訳", status: "レビュー中" }
    ]
  },
  {
    id: "CR-005",
    title: "仕訳自動転換機能",
    description: "各業務データから自動的に仕訳データを生成する機能を改善する",
    businessIds: ["BIZ-003"],
    areas: ["GL"],
    status: "review",
    targetVersions: [],
    priority: "high",
    requestedBy: "経理担当",
    createdAt: "2024-02-20T00:00:00Z",
    updatedAt: "2024-02-20T00:00:00Z",
    background: "現在、売上・仕入などの各業務データから仕訳データへの自動転換機能があるが、ルールが硬直的であり例外対応ができない。また、転換ロジックの保守が難しく、新しい勘定科目や取引種別への対応に時間を要している。ルールベースエンジンを刷新し、柔軟な設定が可能な仕訳自動転換機能を再構築する。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-005-001",
        title: "業務データから仕訳データへ自動変換する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-005-001",
        title: "柔軟な仕訳転換ルールエンジンを実装する",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C026", name: "仕訳", status: "レビュー中" },
      { id: "C028", name: "総勘定元帳", status: "レビュー中" }
    ]
  },
  {
    id: "CR-008",
    title: "財務諸テンプレート変更",
    description: "財務諸表のテンプレートを変更し、セグメント情報を追加する",
    businessIds: ["BIZ-003"],
    areas: ["GL"],
    status: "open",
    targetVersions: [],
    priority: "low",
    requestedBy: "経理担当",
    createdAt: "2024-03-02T00:00:00Z",
    updatedAt: "2024-03-02T00:00:00Z",
    background: "事業拡大に伴い、単一の財務諸表からセグメント別（事業部・地域・製品カテゴリ等）の情報開示が求められている。現行の財務諸表テンプレートではセグメント情報の表示ができず、経営層からの要望に応えられていない。セグメント別の貸借対照表・損益計算書を作成できるよう、テンプレートの拡張とデータ抽出ロジックの改修を行う。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-008-001",
        title: "セグメント別財務諸表を作成する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-008-001",
        title: "セグメント情報集計機能を実装する",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C030", name: "貸借対照表", status: "レビュー中" },
      { id: "C031", name: "損益計算書", status: "レビュー中" }
    ]
  },
  {
    id: "CR-011",
    title: "固定資産償却自動計算",
    description: "固定資産の償却費を自動計算し、仕訳データを生成する",
    businessIds: ["BIZ-003"],
    areas: ["GL"],
    status: "approved",
    targetVersions: [],
    priority: "medium",
    requestedBy: "経理担当",
    createdAt: "2024-03-08T00:00:00Z",
    updatedAt: "2024-03-08T00:00:00Z",
    background: "現在、固定資産の減価償却計算はExcelで行っており、毎月の償却費計算と仕訳作成に手作業を要している。資産数が数百件に達しており、定率法・定額法などの償却方法の違いや、中古資産の耐用年数判定など複雑な計算を手作業で行うため、計算ミスのリスクも高い。償却計算ロジックをシステム化し、自動的に仕訳データを生成することで、業務効率化と精度向上を図る。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-011-001",
        title: "固定資産の償却費を自動計算する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-011-001",
        title: "減価償却計算エンジンを実装する",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C033", name: "固定資産", status: "レビュー中" },
      { id: "C034", name: "減価償却", status: "レビュー中" }
    ]
  },
  {
    id: "CR-014",
    title: "税申告データ自動作成",
    description: "消費税、法人税の申告データを自動作成する機能を追加する",
    businessIds: ["BIZ-003"],
    areas: ["GL"],
    status: "review",
    targetVersions: [],
    priority: "high",
    requestedBy: "税務担当",
    createdAt: "2024-03-14T00:00:00Z",
    updatedAt: "2024-03-14T00:00:00Z",
    background: "現在、税申告書の作成は会計システムから出力したデータを基に、税務ソフトで手作業で行っている。消費税申告では課税売上割合の計算や中間申告の判定、法人税申告では別表四・五の作成など、複雑な計算と税法への対応が必要である。毎期の申告作業に1週間以上を要しており、税務データの自動集計と申告書作成支援機能の実装が求められている。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-014-001",
        title: "消費税申告データを自動作成する",
        type: "業務要件"
      },
      {
        id: "BR-TICKET-CR-014-002",
        title: "法人税申告データを自動作成する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-014-001",
        title: "税申告データ集計機能を実装する",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C002", name: "消費税計算", status: "レビュー中" },
      { id: "C035", name: "税申告", status: "レビュー中" }
    ]
  },
  {
    id: "CR-017",
    title: "連結決算機能追加",
    description: "連結決算に対応する機能を追加する",
    businessIds: ["BIZ-003"],
    areas: ["GL"],
    status: "open",
    targetVersions: [],
    priority: "high",
    requestedBy: "経理部長",
    createdAt: "2024-03-19T00:00:00Z",
    updatedAt: "2024-03-19T00:00:00Z",
    background: "グループ経営の強化に伴い、連結決算業務の需要が高まっている。現在、連結財務諸表は個別社のデータをExcelで手作業で集計しており、連結消去・未実現利益消去などの複雑な調整処理を手計算で行っている。連結子会社が増加するにつれ集計作業が困難になっており、連結決算のシステム化と自動化が急務となっている。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-017-001",
        title: "連結財務諸表を作成する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-017-001",
        title: "連結決算集計機能を実装する",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C030", name: "貸借対照表", status: "レビュー中" },
      { id: "C031", name: "損益計算書", status: "レビュー中" }
    ]
  },
  {
    id: "CR-020",
    title: "予実管理機能",
    description: "予算実績管理機能を追加し、差異分析を可能にする",
    businessIds: ["BIZ-003"],
    areas: ["GL"],
    status: "open",
    targetVersions: [],
    priority: "medium",
    requestedBy: "経理部長",
    createdAt: "2024-03-26T00:00:00Z",
    updatedAt: "2024-03-26T00:00:00Z",
    background: "経営管理の高度化に伴い、予算実績管理のニーズが高まっている。現在、予実管理はExcelで行っており、予実差異の分析や部門別・プロジェクト別の集計に手作業を要している。月次報告の作成に数日要しており、経営層へのタイムリーな情報提供ができていない。予実比較機能、差異分析機能、ダッシュボード表示機能を実装することで、経営管理プロセスの効率化を図る。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-020-001",
        title: "予算と実績を比較し、差異を分析する",
        type: "業務要件"
      },
      {
        id: "BR-TICKET-CR-020-002",
        title: "部門別・プロジェクト別の予実集計を行う",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-020-001",
        title: "予実管理ダッシュボードを作成する",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C029", name: "試算表", status: "レビュー中" },
      { id: "C031", name: "損益計算書", status: "レビュー中" }
    ]
  },
  {
    id: "CR-023",
    title: "仕訳承認フロー追加",
    description: "仕訳データの承認フローを追加し、承認済のみ転記を可能にする",
    businessIds: ["BIZ-003"],
    areas: ["GL"],
    status: "review",
    targetVersions: [],
    priority: "medium",
    requestedBy: "経理担当",
    createdAt: "2024-04-03T00:00:00Z",
    updatedAt: "2024-04-03T00:00:00Z",
    background: "現在、仕訳データの承認プロセスが存在せず、入力後そのまま転記されてしまっている。金額の大きな仕訳や特殊な勘定科目への転記について、承認を必要とする内部統制上の要請がある。また、入力ミスや不正仕訳の防止のため、仕訳承認フローと承認済のみ転記可能な制御機能の実装が求められている。",
    impactRequirements: [
      {
        id: "BR-TICKET-CR-023-001",
        title: "仕訳データの承認フローを定義する",
        type: "業務要件"
      },
      {
        id: "SR-TICKET-CR-023-001",
        title: "仕訳承認機能を実装する",
        type: "システム要件"
      },
      {
        id: "SR-TICKET-CR-023-002",
        title: "承認済仕訳のみ転記可能な制御を実装する",
        type: "システム要件"
      }
    ],
    relatedConcepts: [
      { id: "C026", name: "仕訳", status: "レビュー中" },
      { id: "C028", name: "総勘定元帳", status: "レビュー中" }
    ]
  },
];

export const getTicketById = (id: string): Ticket | undefined => {
  return tickets.find(t => t.id === id);
};

export const getTicketsByArea = (area: string): Ticket[] => {
  return tickets.filter(t => t.areas.includes(area as any));
};

export const getTicketsByStatus = (status: string): Ticket[] => {
  return tickets.filter(t => t.status === status);
};
