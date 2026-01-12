export type RequirementType = "業務要件" | "システム要件";

export type Requirement = {
	id: string;
	type: RequirementType;
	title: string;
	summary: string;
	concepts: { id: string; name: string }[];
	impacts: string[];
	acceptanceCriteria: string[];
	related: string[];
	srfId?: string;
};

export type DesignDoc = {
	id: string;
	title: string;
	category: "画面" | "データ" | "IF" | "業務ルール" | "その他";
	source: "内部" | "外部リンク";
	content: string;
	url?: string;
};

export type CodeRef = {
	paths: string[];
};

export type TaskKnowledge = {
	bizId: string;
	taskId: string;
	taskName: string;
	taskSummary: string;
	person?: string;
	input?: string;
	output?: string;
	businessRequirements: Requirement[];
	systemRequirements: Requirement[];
	designDocs: DesignDoc[];
	codeRefs: CodeRef[];
};

export const getDefaultTaskKnowledge = ({
	bizId,
	taskId,
}: {
	bizId: string;
	taskId: string;
}): TaskKnowledge => {
	// AR領域：TASK-001 与信管理
	if (taskId === "TASK-001") {
		return {
			bizId,
			taskId,
			taskName: "与信管理",
			taskSummary: "顧客の与信枠を管理し、限度超過時の対応を行う",
			person: "与信担当",
			input: "顧客情報、与信枠",
			output: "与信枠、限度超過アラート",
			businessRequirements: [
				{
					id: "BR-TASK-001-001",
					type: "業務要件",
					title: "顧客別与信枠を設定・管理する",
					summary: "各顧客に対して与信枠を設定し、定期的に見直しを行う。限度超過時はアラートを発報する。",
					concepts: [
						{ id: "C007", name: "与信管理" },
						{ id: "C012", name: "与信枠" },
					],
					impacts: ["SD_CUST", "FI_AR"],
					acceptanceCriteria: [
						"顧客マスタで与信枠を設定・変更できること",
						"与信枠超過時にアラートが表示されること",
						"与信枠履歴を参照できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-001-002",
					type: "業務要件",
					title: "与信枠超過時の対応フローを定義する",
					summary: "与信枠を超過した場合の対応手順を定義し、関係者へ通知する。",
					concepts: [{ id: "C007", name: "与信管理" }],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"超過時の通知メールが送信されること",
						"対応履歴を記録できること",
					],
					related: ["BR-TASK-001-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-001-001",
					type: "システム要件",
					title: "与信枠管理画面を提供する",
					summary: "顧客別の与信枠を参照・変更でき、超過アラートを表示する。",
					concepts: [{ id: "C012", name: "与信枠" }],
					impacts: ["SD_CUST", "FI_AR"],
					acceptanceCriteria: [
						"与信枠一覧画面が表示できること",
						"与信枠の登録・変更ができること",
						"超過顧客がハイライト表示されること",
					],
					related: ["BR-TASK-001-001"],
					srfId: "SRF-006",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-001-001",
					title: "与信管理画面設計",
					category: "画面",
					source: "内部",
					content: "- 顧客一覧、与信枠、使用率、残枠を表示\n- 超過顧客は赤字表示\n- 与信枠変更ダイアログ",
				},
			],
			codeRefs: [{ paths: ["apps/ar/src/credit"] }],
		};
	}

	// AR領域：TASK-002 売掛計上
	if (taskId === "TASK-002") {
		return {
			bizId,
			taskId,
			taskName: "売掛計上",
			taskSummary: "売上伝票から売掛金を計上し、債権台帳へ登録する",
			person: "経理担当",
			input: "売上伝票",
			output: "売掛金台帳",
			businessRequirements: [
				{
					id: "BR-TASK-002-001",
					type: "業務要件",
					title: "売上伝票をもとに売掛金を計上する",
					summary: "売上伝票から売掛金データを生成し、債権台帳へ登録する。",
					concepts: [
						{ id: "C004", name: "売掛金" },
						{ id: "C015", name: "売上伝票" },
					],
					impacts: ["FI_AR", "FI_GL"],
					acceptanceCriteria: [
						"売上伝票から自動的に売掛金が計上されること",
						"債権台帳へ即時反映されること",
						"計上元伝票を追跡できること",
					],
					related: [],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-002-001",
					type: "システム要件",
					title: "売掛金自動計上バッチ処理",
					summary: "売上伝票を定期的に取り込み、売掛金を計上する。",
					concepts: [{ id: "C004", name: "売掛金" }],
					impacts: ["FI_AR", "FI_GL"],
					acceptanceCriteria: [
						"バッチ処理が正常終了すること",
						"エラー時に通知されること",
						"再実行が可能であること",
					],
					related: ["BR-TASK-002-001"],
				},
			],
			designDocs: [
				{
					id: "DD-TASK-002-001",
					title: "売掛計上バッチ設計",
					category: "データ",
					source: "内部",
					content: "- 売上伝票を抽出・集計\n- 売掛金テーブルへINSERT\n- 仕訳データを生成",
				},
			],
			codeRefs: [{ paths: ["apps/ar/src/recording"] }],
		};
	}

	// AR領域：TASK-003 請求書発行
	if (taskId === "TASK-003") {
		return {
			bizId,
			taskId,
			taskName: "請求書発行",
			taskSummary: "請求対象を抽出し、請求書を生成・発行する（電子請求書送信を含む）",
			person: "経理担当",
			input: "請求対象データ、契約情報",
			output: "請求書（PDF/電子）、送信結果",
			businessRequirements: [
				{
					id: "BR-TASK-003-001",
					type: "業務要件",
					title: "適格請求書（インボイス）形式で請求書を発行する",
					summary: "登録番号、税率別の対価・税額等、法令要件を満たす請求書を発行する。",
					concepts: [
						{ id: "C001", name: "インボイス制度" },
						{ id: "C002", name: "消費税計算" },
						{ id: "C005", name: "請求書発行" },
					],
					impacts: ["FI_TAX", "SD_BILLING"],
					acceptanceCriteria: [
						"請求書PDFに登録番号が表示されること",
						"税率ごとの対価・税額が表示されること",
						"適格請求書保存要件を満たすこと",
					],
					related: [],
				},
				{
					id: "BR-TASK-003-002",
					type: "業務要件",
					title: "電子請求書を顧客ポータルへ送信する",
					summary: "PDF請求書を生成し、顧客ポータルへ自動送信する。",
					concepts: [{ id: "C010", name: "電子請求書" }],
					impacts: ["SD_BILLING"],
					acceptanceCriteria: [
						"電子請求書が自動送信されること",
						"送信結果がログされること",
						"再送機能が提供されること",
					],
					related: ["BR-TASK-003-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-003-001",
					type: "システム要件",
					title: "税率別内訳を集計し、帳票出力へ反映する",
					summary: "請求明細から税率別集計を生成し、帳票テンプレートに差し込む。",
					concepts: [{ id: "C001", name: "インボイス制度" }],
					impacts: ["SD_BILLING", "FI_GL"],
					acceptanceCriteria: [
						"帳票出力APIが税率別内訳を返すこと",
						"帳票テンプレートに税率別内訳が差し込まれること",
					],
					related: ["BR-TASK-003-001"],
					srfId: "SRF-001",
				},
				{
					id: "SR-TASK-003-002",
					type: "システム要件",
					title: "税率別内訳集計機能",
					summary: "請求明細から税率別の対価と税額を集計する。",
					concepts: [{ id: "C002", name: "消費税計算" }],
					impacts: ["SD_BILLING"],
					acceptanceCriteria: [
						"税率ごとの集計が正確であること",
						"軽減税率対応ができていること",
					],
					related: ["SR-TASK-003-001"],
					srfId: "SRF-002",
				},
				{
					id: "SR-TASK-003-003",
					type: "システム要件",
					title: "電子請求書送信機能",
					summary: "生成した請求書PDFを顧客ポータルへ送信する。",
					concepts: [{ id: "C010", name: "電子請求書" }],
					impacts: ["SD_BILLING"],
					acceptanceCriteria: [
						"顧客ポータルAPIが呼び出せること",
						"送信エラー時にリトライできること",
					],
					related: ["BR-TASK-003-002"],
					srfId: "SRF-007",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-003-001",
					title: "請求書発行：帳票出力",
					category: "画面",
					source: "内部",
					content:
						"- 出力形式: PDF/電子\n- 主要項目: 登録番号、税率別対価、税率別税額\n- レイアウト: 既存テンプレートのフッター部に登録番号を追加",
				},
				{
					id: "DD-TASK-003-002",
					title: "電子請求書送信IF",
					category: "IF",
					source: "内部",
					content: "- 顧客ポータルAPI連携\n- 送信ステータス管理\n- 再送バッチ処理",
				},
			],
			codeRefs: [{ paths: ["apps/billing/src/invoice"] }],
		};
	}

	// AR領域：TASK-004 入金消込
	if (taskId === "TASK-004") {
		return {
			bizId,
			taskId,
			taskName: "入金消込",
			taskSummary: "入金データを取り込み、請求と突合して消込処理を行う",
			person: "経理担当",
			input: "入金データ、請求データ",
			output: "消込結果、未消込一覧",
			businessRequirements: [
				{
					id: "BR-TASK-004-001",
					type: "業務要件",
					title: "銀行ファイルから入金データを取り込む",
					summary: "銀行から提供される入金ファイルをパースし、システムへ取り込む。",
					concepts: [{ id: "C006", name: "入金消込" }],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"主要銀行フォーマットに対応すること",
						"取り込みエラーを通知できること",
						"取り込み履歴を参照できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-004-002",
					type: "業務要件",
					title: "入金データと請求データを突合し、消込処理を行う",
					summary: "入金データと請求データをマッチングし、債権を消し込む。",
					concepts: [
						{ id: "C004", name: "売掛金" },
						{ id: "C006", name: "入金消込" },
					],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"自動マッチングができること",
						"手動消込ができること",
						"部分消込に対応できること",
					],
					related: ["BR-TASK-004-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-004-001",
					type: "システム要件",
					title: "入金データ取り込み機能",
					summary: "銀行ファイルをパースし、入金データテーブルへ登録する。",
					concepts: [{ id: "C006", name: "入金消込" }],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"全銀フォーマットに対応すること",
						"パースエラーをログできること",
					],
					related: ["BR-TASK-004-001"],
					srfId: "SRF-003",
				},
				{
					id: "SR-TASK-004-002",
					type: "システム要件",
					title: "入金消込エンジン",
					summary: "入金データと請求データを突合し、消込処理を実行する。",
					concepts: [{ id: "C006", name: "入金消込" }],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"顧客コード・金額でマッチングできること",
						"マッチングルールをカスタマイズできること",
					],
					related: ["BR-TASK-004-002"],
					srfId: "SRF-004",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-004-001",
					title: "入金データ取り込み",
					category: "データ",
					source: "内部",
					content: "- 全銀/CSVパーサー\n- 入金データテーブル登録\n- エラーログ出力",
				},
				{
					id: "DD-TASK-004-002",
					title: "入金消込処理",
					category: "業務ルール",
					source: "内部",
					content: "- 顧客コード優先マッチング\n- 金額一致確認\n- 部分消込対応",
				},
			],
			codeRefs: [{ paths: ["apps/payment/src/import", "apps/payment/src/matching"] }],
		};
	}

	// AR領域：TASK-005 債権管理
	if (taskId === "TASK-005") {
		return {
			bizId,
			taskId,
			taskName: "債権管理",
			taskSummary: "未回収債権を把握し、督促・与信見直し等の対応を行う",
			person: "回収担当",
			input: "債権残高、入金状況",
			output: "督促状況、回収計画",
			businessRequirements: [
				{
					id: "BR-TASK-005-001",
					type: "業務要件",
					title: "未回収債権の一覧を参照できる",
					summary: "顧客別の未回収債権残高、回収予定日を一覧表示する。",
					concepts: [
						{ id: "C004", name: "売掛金" },
						{ id: "C013", name: "未回収債権" },
					],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"未回収債権一覧が表示されること",
						"経過日数でソートできること",
						"回収担当者別にフィルタできること",
					],
					related: [],
				},
				{
					id: "BR-TASK-005-002",
					type: "業務要件",
					title: "延滞債権に対して督促状を発行する",
					summary: "支払期限を過ぎた債権について督促状を発行する。",
					concepts: [
						{ id: "C011", name: "督促状" },
						{ id: "C013", name: "未回収債権" },
					],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"督促状をPDF出力できること",
						"督促履歴を記録できること",
					],
					related: ["BR-TASK-005-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-005-001",
					type: "システム要件",
					title: "債権管理一覧画面",
					summary: "未回収債権の一覧表示、督促状況確認、回収計画作成機能を提供する。",
					concepts: [{ id: "C013", name: "未回収債権" }],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"債権一覧が表示できること",
						"督促状況を確認できること",
					],
					related: ["BR-TASK-005-001"],
					srfId: "SRF-005",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-005-001",
					title: "債権管理一覧画面",
					category: "画面",
					source: "内部",
					content: "- 未回収債権一覧\n- 経過日数表示\n- 催促状発行ボタン",
				},
			],
			codeRefs: [{ paths: ["apps/ar/src/collection"] }],
		};
	}

	// AR領域：TASK-006 債権回収
	if (taskId === "TASK-006") {
		return {
			bizId,
			taskId,
			taskName: "債権回収",
			taskSummary: "延滞債権の回収活動を行い、回収状況を管理する",
			person: "回収担当",
			input: "延滞債権データ",
			output: "回収計画、回収状況",
			businessRequirements: [
				{
					id: "BR-TASK-006-001",
					type: "業務要件",
					title: "延滞債権の回収計画を策定する",
					summary: "延滞債権について回収方法・スケジュールを策定する。",
					concepts: [
						{ id: "C008", name: "債権回収" },
						{ id: "C014", name: "回収計画" },
					],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"回収計画を登録できること",
						"進捗状況を更新できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-006-002",
					type: "業務要件",
					title: "延滞債権に対してアラートを発報する",
					summary: "延滞債権を検知し、関係者へ通知する。",
					concepts: [
						{ id: "C013", name: "未回収債権" },
						{ id: "C011", name: "督促状" },
					],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"延滞基準を設定できること",
						"アラート通知が送信されること",
					],
					related: ["BR-TASK-006-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-006-001",
					type: "システム要件",
					title: "延滞債権アラート機能",
					summary: "延滞債権を検知し、関係者へ通知する。",
					concepts: [{ id: "C013", name: "未回収債権" }],
					impacts: ["FI_AR"],
					acceptanceCriteria: [
						"延滞基準日を設定できること",
						"メール通知が送信されること",
					],
					related: ["BR-TASK-006-002"],
					srfId: "SRF-008",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-006-001",
					title: "延滞債権アラート",
					category: "データ",
					source: "内部",
					content: "- 延滞基準日管理\n- アラート通知バッチ\n- 通知履歴テーブル",
				},
			],
			codeRefs: [{ paths: ["apps/ar/src/collection"] }],
		};
	}

	// AP領域：TASK-007 仕入請求受領
	if (taskId === "TASK-007") {
		return {
			bizId: "BIZ-002",
			taskId,
			taskName: "仕入請求受領",
			taskSummary: "仕入先から請求書を受け取り、内容を確認してシステムへ取り込む",
			person: "経理担当",
			input: "仕入請求書（紙/PDF/電子）、受入検収データ",
			output: "仕入請求書データ、買掛計上データ",
			businessRequirements: [
				{
					id: "BR-TASK-007-001",
					type: "業務要件",
					title: "仕入請求書データを取り込む",
					summary: "仕入先から受け取った請求書データをシステムへ取り込む。",
					concepts: [
						{ id: "C021", name: "仕入請求書" },
						{ id: "C010", name: "電子請求書" },
					],
					impacts: ["SD_AP", "FI_AP"],
					acceptanceCriteria: [
						"OCRまたは手動入力で請求書データを取り込めること",
						"取り込みエラーを通知できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-007-002",
					type: "業務要件",
					title: "仕入請求書内容を確認する",
					summary: "取り込んだ請求書内容を検収・発注データと突合し、確認する。",
					concepts: [
						{ id: "C021", name: "仕入請求書" },
						{ id: "C016", name: "買掛金" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"受注・検収データとの突合ができること",
						"確認済み請求書を買掛計上へ連携できること",
					],
					related: ["BR-TASK-007-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-007-001",
					type: "システム要件",
					title: "仕入請求書データ取り込み機能",
					summary: "仕入請求書（紙/PDF/電子）からデータを取り込み、仕入請求書テーブルへ登録する。",
					concepts: [
						{ id: "C021", name: "仕入請求書" },
						{ id: "C010", name: "電子請求書" },
					],
					impacts: ["SD_AP", "FI_AP"],
					acceptanceCriteria: [
						"OCRまたは手動入力で請求書データを取り込めること",
						"仕入先マスタとの照合ができること",
						"取り込みエラーを通知できること",
					],
					related: ["BR-TASK-007-001"],
					srfId: "SRF-013",
				},
				{
					id: "SR-TASK-007-002",
					type: "システム要件",
					title: "仕入請求書内容確認機能",
					summary: "取り込んだ請求書内容を検収・発注データと突合し、確認する。",
					concepts: [
						{ id: "C021", name: "仕入請求書" },
						{ id: "C016", name: "買掛金" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"受注・検収データとの突合ができること",
						"単価・数量のチェックができること",
						"確認済み請求書を買掛計上へ連携できること",
					],
					related: ["BR-TASK-007-002"],
					srfId: "SRF-013",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-007-001",
					title: "仕入請求書取込",
					category: "データ",
					source: "内部",
					content: "- OCR連携\n- 手動入力画面\n- 請求内容バリデーション\n- 買掛計上連携バッチ",
				},
			],
			codeRefs: [{ paths: ["apps/ap/src/invoice"] }],
		};
	}

	// AP領域：TASK-008 買掛計上
	if (taskId === "TASK-008") {
		return {
			bizId: "BIZ-002",
			taskId,
			taskName: "買掛計上",
			taskSummary: "仕入伝票から買掛金を計上し、債務台帳へ登録する",
			person: "経理担当",
			input: "仕入伝票",
			output: "買掛金台帳",
			businessRequirements: [
				{
					id: "BR-TASK-008-001",
					type: "業務要件",
					title: "仕入伝票から買掛金を計上する",
					summary: "仕入伝票から買掛金データを生成し、債務台帳へ登録する。",
					concepts: [
						{ id: "C016", name: "買掛金" },
						{ id: "C025", name: "仕入伝票" },
					],
					impacts: ["FI_AP", "FI_GL"],
					acceptanceCriteria: [
						"仕入伝票から自動的に買掛金が計上されること",
						"債務台帳へ即時反映されること",
						"計上元伝票を追跡できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-008-002",
					type: "業務要件",
					title: "買掛残高を管理する",
					summary: "仕入先別の買掛残高を管理し、支払予定へ連携する。",
					concepts: [
						{ id: "C016", name: "買掛金" },
						{ id: "C024", name: "買掛残高" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"仕入先別の買掛残高を参照できること",
						"支払期日別の残高を集計できること",
						"支払予定表へデータを連携できること",
					],
					related: ["BR-TASK-008-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-008-001",
					type: "システム要件",
					title: "買掛金自動計上バッチ処理",
					summary: "仕入伝票を定期的に取り込み、買掛金を計上する。",
					concepts: [
						{ id: "C016", name: "買掛金" },
						{ id: "C025", name: "仕入伝票" },
					],
					impacts: ["FI_AP", "FI_GL"],
					acceptanceCriteria: [
						"仕入伝票から自動的に買掛金が計上されること",
						"債務台帳へ即時反映されること",
						"計上元伝票を追跡できること",
					],
					related: ["BR-TASK-008-001"],
					srfId: "SRF-025",
				},
				{
					id: "SR-TASK-008-002",
					type: "システム要件",
					title: "買掛金残高管理機能",
					summary: "仕入先別の買掛残高を管理し、支払予定へ連携する。",
					concepts: [
						{ id: "C016", name: "買掛金" },
						{ id: "C024", name: "買掛残高" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"仕入先別の買掛残高を参照できること",
						"支払期日別の残高を集計できること",
						"支払予定表へデータを連携できること",
					],
					related: ["BR-TASK-008-002"],
					srfId: "SRF-025",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-008-001",
					title: "買掛計上バッチ設計",
					category: "データ",
					source: "内部",
					content: "- 仕入伝票を抽出・集計\n- 買掛金テーブルへINSERT\n- 仕訳データを生成",
				},
			],
			codeRefs: [{ paths: ["apps/ap/src/recording"] }],
		};
	}

	// AP領域：TASK-009 支払依頼
	if (taskId === "TASK-009") {
		return {
			bizId: "BIZ-002",
			taskId,
			taskName: "支払依頼",
			taskSummary: "支払対象を抽出し、支払依頼データを作成する",
			person: "経理担当",
			input: "買掛データ、支払期日",
			output: "支払依頼データ",
			businessRequirements: [
				{
					id: "BR-TASK-009-001",
					type: "業務要件",
					title: "支払対象を抽出する",
					summary: "支払対象の仕入請求書を一覧表示し、支払依頼を作成する。",
					concepts: [
						{ id: "C017", name: "支払依頼" },
						{ id: "C022", name: "支払予定" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"支払対象の請求書を抽出・表示できること",
						"チェックボックスで支払対象を選択できること",
						"金額確認後、承認依頼を実行できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-009-002",
					type: "業務要件",
					title: "支払依頼データを作成する",
					summary: "選択した支払対象から支払依頼データを作成し、ワークフローへ登録する。",
					concepts: [
						{ id: "C017", name: "支払依頼" },
						{ id: "C018", name: "支払承認" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"支払依頼テーブルへ登録できること",
						"金額バリデーションができること",
						"承認者へ通知できること",
					],
					related: ["BR-TASK-009-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-009-001",
					type: "システム要件",
					title: "支払依頼画面機能",
					summary: "支払対象の仕入請求書を一覧表示し、支払依頼を作成する画面を提供する。",
					concepts: [
						{ id: "C017", name: "支払依頼" },
						{ id: "C022", name: "支払予定" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"支払対象の請求書を抽出・表示できること",
						"チェックボックスで支払対象を選択できること",
						"金額確認後、承認依頼を実行できること",
					],
					related: ["BR-TASK-009-001"],
					srfId: "SRF-009",
				},
				{
					id: "SR-TASK-009-002",
					type: "システム要件",
					title: "支払依頼データ作成機能",
					summary: "選択した支払対象から支払依頼データを作成し、ワークフローへ登録する。",
					concepts: [
						{ id: "C017", name: "支払依頼" },
						{ id: "C018", name: "支払承認" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"支払依頼テーブルへ登録できること",
						"金額バリデーションができること",
						"承認者へ通知できること",
					],
					related: ["BR-TASK-009-002"],
					srfId: "SRF-009",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-009-001",
					title: "支払依頼画面設計",
					category: "画面",
					source: "内部",
					content: "- 支払対象請求書一覧\n- チェックボックスで選択\n- 金額確認エリア\n- 承認依頼ボタン",
				},
			],
			codeRefs: [{ paths: ["apps/ap/src/payment/requestScreen"] }],
		};
	}

	// AP領域：TASK-010 支払承認
	if (taskId === "TASK-010") {
		return {
			bizId: "BIZ-002",
			taskId,
			taskName: "支払承認",
			taskSummary: "支払依頼を承認し、支払実行可否を判断する",
			person: "承認者",
			input: "支払依頼データ",
			output: "承認結果",
			businessRequirements: [
				{
					id: "BR-TASK-010-001",
					type: "業務要件",
					title: "支払依頼を承認する",
					summary: "承認待ちの支払依頼を一覧表示し、承認・却下を行う。",
					concepts: [
						{ id: "C018", name: "支払承認" },
						{ id: "C017", name: "支払依頼" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"承認待ち依頼の一覧を表示できること",
						"依頼詳細・請求書画像を確認できること",
						"承認・却下を選択できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-010-002",
					type: "業務要件",
					title: "承認権限を管理する",
					summary: "支払金額に応じた承認権限を管理し、承認フローを制御する。",
					concepts: [
						{ id: "C018", name: "支払承認" },
						{ id: "C017", name: "支払依頼" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"金額別承認権限を設定できること",
						"承認履歴を記録できること",
						"承認結果を依頼者へ通知できること",
					],
					related: ["BR-TASK-010-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-010-001",
					type: "システム要件",
					title: "支払承認画面機能",
					summary: "承認待ちの支払依頼を一覧表示し、承認・却下を行う画面を提供する。",
					concepts: [
						{ id: "C018", name: "支払承認" },
						{ id: "C017", name: "支払依頼" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"承認待ち依頼の一覧を表示できること",
						"依頼詳細・請求書画像を確認できること",
						"承認・却下を選択できること",
					],
					related: ["BR-TASK-010-001"],
					srfId: "SRF-010",
				},
				{
					id: "SR-TASK-010-002",
					type: "システム要件",
					title: "承認権限管理機能",
					summary: "支払金額に応じた承認権限を管理し、承認フローを制御する。",
					concepts: [
						{ id: "C018", name: "支払承認" },
						{ id: "C017", name: "支払依頼" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"金額別承認権限を設定できること",
						"承認履歴を記録できること",
						"承認結果を依頼者へ通知できること",
					],
					related: ["BR-TASK-010-002"],
					srfId: "SRF-010",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-010-001",
					title: "支払承認画面設計",
					category: "画面",
					source: "内部",
					content: "- 承認待ち依頼一覧\n- 依頼詳細・請求書画像表示\n- 承認・却下ボタン\n- 承認コメント入力",
				},
			],
			codeRefs: [{ paths: ["apps/ap/src/payment/approvalScreen"] }],
		};
	}

	// AP領域：TASK-011 支払実行
	if (taskId === "TASK-011") {
		return {
			bizId: "BIZ-002",
			taskId,
			taskName: "支払実行",
			taskSummary: "承認済支払データを銀行へ送信し、支払を実行する",
			person: "経理担当",
			input: "承認済み支払データ",
			output: "支払実行結果",
			businessRequirements: [
				{
					id: "BR-TASK-011-001",
					type: "業務要件",
					title: "銀行IFへ支払データを送信する",
					summary: "承認済み支払データを全銀フォーマットで作成し、銀行へ送信する。",
					concepts: [
						{ id: "C023", name: "支払実行" },
						{ id: "C022", name: "支払予定" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"全銀フォーマットで支払データを作成できること",
						"銀行IFへ送信できること",
						"支払実行結果を取得できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-011-002",
					type: "業務要件",
					title: "支払実行バッチ処理を行う",
					summary: "定時実行バッチで承認済み支払依頼を抽出し、銀行IF連携を実行する。",
					concepts: [
						{ id: "C023", name: "支払実行" },
						{ id: "C022", name: "支払予定" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"バッチ処理が正常終了すること",
						"エラー時に再送できること",
						"支払実行結果を記録できること",
					],
					related: ["BR-TASK-011-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-011-001",
					type: "システム要件",
					title: "銀行IF連携機能",
					summary: "承認済み支払データを全銀フォーマットで作成し、銀行へ送信する。",
					concepts: [
						{ id: "C023", name: "支払実行" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"全銀フォーマットで支払データを作成できること",
						"銀行IFへ送信できること",
						"支払実行結果を取得できること",
					],
					related: ["BR-TASK-011-001"],
					srfId: "SRF-011",
				},
				{
					id: "SR-TASK-011-002",
					type: "システム要件",
					title: "支払実行バッチ処理",
					summary: "定時実行バッチで承認済み支払依頼を抽出し、銀行IF連携を実行する。",
					concepts: [
						{ id: "C023", name: "支払実行" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"バッチ処理が正常終了すること",
						"エラー時に再送できること",
						"支払実行結果を記録できること",
					],
					related: ["BR-TASK-011-002"],
					srfId: "SRF-011",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-011-001",
					title: "支払実行バッチ設計",
					category: "データ",
					source: "内部",
					content: "- 全銀フォーマット変換\n- 銀行IF連携\n- エラー処理と再送\n- 支払実行結果記録",
				},
			],
			codeRefs: [{ paths: ["apps/ap/src/payment/executionService"] }],
		};
	}

	// AP領域：TASK-012 手形管理
	if (taskId === "TASK-012") {
		return {
			bizId: "BIZ-002",
			taskId,
			taskName: "手形管理",
			taskSummary: "支払手形の発行、管理、期日管理を行う",
			person: "経理担当",
			input: "支払手形データ",
			output: "手形台帳、期日管理表",
			businessRequirements: [
				{
					id: "BR-TASK-012-001",
					type: "業務要件",
					title: "手形を発行・管理する",
					summary: "支払手形の一覧表示、発行、期日管理を行う。",
					concepts: [
						{ id: "C019", name: "手形管理" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"手形一覧を表示できること",
						"手形発行依頼を登録できること",
						"期日順にソートできること",
					],
					related: [],
				},
				{
					id: "BR-TASK-012-002",
					type: "業務要件",
					title: "手形の期日を管理する",
					summary: "手形の期日を管理し、期日到来時に通知・支払実行のトリガーとする。",
					concepts: [
						{ id: "C019", name: "手形管理" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"期日到来時に通知できること",
						"期日管理表を作成できること",
						"支払実行バッチへ連携できること",
					],
					related: ["BR-TASK-012-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-012-001",
					type: "システム要件",
					title: "手形管理画面機能",
					summary: "支払手形の一覧表示、発行、期日管理を行う画面を提供する。",
					concepts: [
						{ id: "C019", name: "手形管理" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"手形一覧を表示できること",
						"手形発行依頼を登録できること",
						"期日順にソートできること",
					],
					related: ["BR-TASK-012-001"],
					srfId: "SRF-012",
				},
				{
					id: "SR-TASK-012-002",
					type: "システム要件",
					title: "手形期日管理機能",
					summary: "手形の期日を管理し、期日到来時に通知・支払実行のトリガーとする。",
					concepts: [
						{ id: "C019", name: "手形管理" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"期日到来時に通知できること",
						"期日管理表を作成できること",
						"支払実行バッチへ連携できること",
					],
					related: ["BR-TASK-012-002"],
					srfId: "SRF-012",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-012-001",
					title: "手形管理画面設計",
					category: "画面",
					source: "内部",
					content: "- 手形一覧表示\n- 手形発行依頼登録\n- 期日別表示・ソート\n- 期日管理表作成",
				},
			],
			codeRefs: [{ paths: ["apps/ap/src/note/noteManagementScreen"] }],
		};
	}

	// AP領域：TASK-013 仕入先支払
	if (taskId === "TASK-013") {
		return {
			bizId: "BIZ-002",
			taskId,
			taskName: "仕入先支払",
			taskSummary: "仕入先への支払予定を管理し、支払を行う",
			person: "経理担当",
			input: "買掛データ、支払条件",
			output: "支払予定表、支払実行結果",
			businessRequirements: [
				{
					id: "BR-TASK-013-001",
					type: "業務要件",
					title: "仕入先ポータルから請求書を取得する",
					summary: "仕入先ポータルから請求書データを取得し、システムへ取り込む。",
					concepts: [
						{ id: "C020", name: "仕入先マスタ" },
						{ id: "C010", name: "電子請求書" },
					],
					impacts: ["SD_AP", "FI_AP"],
					acceptanceCriteria: [
						"仕入先ポータルAPIを呼び出せること",
						"請求書データを取得できること",
						"取り込みエラー時にリトライできること",
					],
					related: [],
				},
				{
					id: "BR-TASK-013-002",
					type: "業務要件",
					title: "支払予定を自動作成する",
					summary: "買掛データと支払条件から支払予定を自動作成する。",
					concepts: [
						{ id: "C022", name: "支払予定" },
						{ id: "C016", name: "買掛金" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"支払予定日を計算できること",
						"支払予定テーブルへ登録できること",
						"月次バッチで自動作成できること",
					],
					related: ["BR-TASK-013-001"],
				},
				{
					id: "BR-TASK-013-003",
					type: "業務要件",
					title: "支払予定を調整する",
					summary: "自動作成された支払予定を手動で調整する。",
					concepts: [
						{ id: "C022", name: "支払予定" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"支払日の変更ができること",
						"金額の分割ができること",
						"調整履歴を記録できること",
					],
					related: ["BR-TASK-013-002"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-013-001",
					type: "システム要件",
					title: "仕入先ポータル連携機能",
					summary: "仕入先ポータルから請求書データを取得し、システムへ取り込む。",
					concepts: [
						{ id: "C020", name: "仕入先マスタ" },
						{ id: "C010", name: "電子請求書" },
					],
					impacts: ["SD_AP", "FI_AP"],
					acceptanceCriteria: [
						"仕入先ポータルAPIを呼び出せること",
						"請求書データを取得できること",
						"取り込みエラー時にリトライできること",
					],
					related: ["BR-TASK-013-001"],
					srfId: "SRF-015",
				},
				{
					id: "SR-TASK-013-002",
					type: "システム要件",
					title: "支払予定自動作成機能",
					summary: "買掛データと支払条件から支払予定を自動作成する。",
					concepts: [
						{ id: "C022", name: "支払予定" },
						{ id: "C016", name: "買掛金" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"支払予定日を計算できること",
						"支払予定テーブルへ登録できること",
						"月次バッチで自動作成できること",
					],
					related: ["BR-TASK-013-002"],
					srfId: "SRF-016",
				},
				{
					id: "SR-TASK-013-003",
					type: "システム要件",
					title: "支払予定調整機能",
					summary: "自動作成された支払予定を手動で調整する。",
					concepts: [
						{ id: "C022", name: "支払予定" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"支払日の変更ができること",
						"金額の分割ができること",
						"調整履歴を記録できること",
					],
					related: ["BR-TASK-013-003"],
					srfId: "SRF-016",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-013-001",
					title: "仕入先ポータル連携",
					category: "IF",
					source: "内部",
					content: "- 仕入先ポータルAPIクライアント\n- 請求書データ取得API\n- データ同期バッチ",
				},
			],
			codeRefs: [{ paths: ["apps/ap/src/portal/supplierPortalClient"] }],
		};
	}

	// AP領域：TASK-014 買掛残高確認
	if (taskId === "TASK-014") {
		return {
			bizId: "BIZ-002",
			taskId,
			taskName: "買掛残高確認",
			taskSummary: "仕入先別の買掛残高を確認し、支払計画を策定する",
			person: "経理担当",
			input: "買掛残高データ",
			output: "支払計画",
			businessRequirements: [
				{
					id: "BR-TASK-014-001",
					type: "業務要件",
					title: "買掛残高一覧を表示する",
					summary: "仕入先別の買掛残高を一覧表示し、支払計画を策定する。",
					concepts: [
						{ id: "C024", name: "買掛残高" },
						{ id: "C022", name: "支払予定" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"仕入先別の買掛残高を表示できること",
						"支払予定日を確認できること",
						"支払計画を作成できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-014-002",
					type: "業務要件",
					title: "支払計画を立案する",
					summary: "買掛残高と支払条件から支払計画を作成する。",
					concepts: [
						{ id: "C024", name: "買掛残高" },
						{ id: "C022", name: "支払予定" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"支払予測を作成できること",
						"キャッシュフロー予測へ連携できること",
						"仕入先別分析ができること",
					],
					related: ["BR-TASK-014-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-014-001",
					type: "システム要件",
					title: "買掛残高一覧画面機能",
					summary: "仕入先別の買掛残高を一覧表示し、支払計画を策定する画面を提供する。",
					concepts: [
						{ id: "C024", name: "買掛残高" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"仕入先別の買掛残高を表示できること",
						"支払予定日を確認できること",
						"支払計画を作成できること",
					],
					related: ["BR-TASK-014-001"],
					srfId: "SRF-014",
				},
				{
					id: "SR-TASK-014-002",
					type: "システム要件",
					title: "支払計画立案API",
					summary: "買掛残高と支払条件から支払計画を作成するAPIを提供する。",
					concepts: [
						{ id: "C024", name: "買掛残高" },
						{ id: "C022", name: "支払予定" },
					],
					impacts: ["FI_AP"],
					acceptanceCriteria: [
						"支払予測を作成できること",
						"キャッシュフロー予測へ連携できること",
						"仕入先別分析ができること",
					],
					related: ["BR-TASK-014-002"],
					srfId: "SRF-014",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-014-001",
					title: "買掛残高確認画面設計",
					category: "画面",
					source: "内部",
					content: "- 買掛残高一覧表示\n- 仕入先別分析\n- 支払計画立案API",
				},
			],
			codeRefs: [{ paths: ["apps/ap/src/apBalance/balanceScreen"] }],
		};
	}

	// GL領域：TASK-015 手動仕訳計上
	if (taskId === "TASK-015") {
		return {
			bizId: "BIZ-003",
			taskId,
			taskName: "手動仕訳計上",
			taskSummary: "手動で仕訳データを入力し、仕訳帳へ登録する",
			person: "経理担当",
			input: "仕訳データ",
			output: "仕訳帳",
			businessRequirements: [
				{
					id: "BR-TASK-015-001",
					type: "業務要件",
					title: "仕訳データを手動入力する",
					summary: "日付、勘定科目、金額、摘要を入力し、仕訳帳へ登録する。",
					concepts: [
						{ id: "C026", name: "仕訳" },
						{ id: "C027", name: "手動仕訳計上" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"借方勘定科目・貸方勘定科目を選択できること",
						"金額・摘要を入力できること",
						"貸借バリデーションができること",
					],
					related: [],
				},
				{
					id: "BR-TASK-015-002",
					type: "業務要件",
					title: "仕訳テンプレートを利用する",
					summary: "頻繁に使用する仕訳パターンをテンプレートとして保存し、再利用する。",
					concepts: [
						{ id: "C026", name: "仕訳" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"仕訳テンプレートを保存できること",
						"テンプレートを呼び出せること",
						"テンプレートの修正・削除ができること",
					],
					related: ["BR-TASK-015-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-015-001",
					type: "システム要件",
					title: "手動仕訳入力画面機能",
					summary: "仕訳データを手動入力し、仕訳帳へ登録する画面を提供する。",
					concepts: [
						{ id: "C026", name: "仕訳" },
						{ id: "C027", name: "手動仕訳計上" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"借方勘定科目・貸方勘定科目を選択できること",
						"金額・摘要を入力できること",
						"貸借バリデーションができること",
					],
					related: ["BR-TASK-015-001"],
					srfId: "SRF-017",
				},
				{
					id: "SR-TASK-015-002",
					type: "システム要件",
					title: "仕訳テンプレート機能",
					summary: "頻繁に使用する仕訳パターンをテンプレートとして保存し、再利用する。",
					concepts: [
						{ id: "C026", name: "仕訳" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"仕訳テンプレートを保存できること",
						"テンプレートを呼び出せること",
						"テンプレートの修正・削除ができること",
					],
					related: ["BR-TASK-015-002"],
					srfId: "SRF-017",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-015-001",
					title: "手動仕訳入力画面設計",
					category: "画面",
					source: "内部",
					content: "- 仕訳入力フォーム\n- 勘定科目選択UI\n- 貸借バリデーション\n- 仕訳テンプレート機能",
				},
			],
			codeRefs: [{ paths: ["apps/gl/src/journal/manualEntryScreen"] }],
		};
	}

	// GL領域：TASK-016 仕訳転記
	if (taskId === "TASK-016") {
		return {
			bizId: "BIZ-003",
			taskId,
			taskName: "仕訳転記",
			taskSummary: "各業務プロセスから自動生成される仕訳を転記する",
			person: "経理担当",
			input: "業務イベントデータ",
			output: "仕訳帳",
			businessRequirements: [
				{
					id: "BR-TASK-016-001",
					type: "業務要件",
					title: "自動仕訳を生成する",
					summary: "各業務プロセス（売上、買掛、決算等）から仕訳データを自動生成する。",
					concepts: [
						{ id: "C026", name: "仕訳" },
					],
					impacts: ["FI_AR", "FI_AP", "FI_GL"],
					acceptanceCriteria: [
						"業務イベントから仕訳パターンを適用できること",
						"仕訳ルールテーブルを参照できること",
						"仕訳データを生成できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-016-002",
					type: "業務要件",
					title: "仕訳を転記する",
					summary: "生成された仕訳データを仕訳帳テーブルへ転記する。",
					concepts: [
						{ id: "C026", name: "仕訳" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"バッチ処理が正常終了すること",
						"転記ステータスを管理できること",
						"エラー仕訳を再転記できること",
					],
					related: ["BR-TASK-016-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-016-001",
					type: "システム要件",
					title: "自動仕訳生成エンジン",
					summary: "各業務プロセス（売上、買掛、決算等）から仕訳データを自動生成する。",
					concepts: [
						{ id: "C026", name: "仕訳" },
					],
					impacts: ["FI_AR", "FI_AP", "FI_GL"],
					acceptanceCriteria: [
						"業務イベントから仕訳パターンを適用できること",
						"仕訳ルールテーブルを参照できること",
						"仕訳データを生成できること",
					],
					related: ["BR-TASK-016-001"],
					srfId: "SRF-018",
				},
				{
					id: "SR-TASK-016-002",
					type: "システム要件",
					title: "仕訳転記バッチ処理",
					summary: "生成された仕訳データを仕訳帳テーブルへ転記するバッチ処理。",
					concepts: [
						{ id: "C026", name: "仕訳" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"バッチ処理が正常終了すること",
						"転記ステータスを管理できること",
						"エラー仕訳を再転記できること",
					],
					related: ["BR-TASK-016-002"],
					srfId: "SRF-018",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-016-001",
					title: "仕訳転記バッチ設計",
					category: "データ",
					source: "内部",
					content: "- 自動仕訳生成エンジン\n- 仕訳ルールテーブル\n- 転記バッチ処理\n- 転記ステータス管理",
				},
			],
			codeRefs: [{ paths: ["apps/gl/src/journal/journalPostingService"] }],
		};
	}

	// GL領域：TASK-017 総勘定元帳作成
	if (taskId === "TASK-017") {
		return {
			bizId: "BIZ-003",
			taskId,
			taskName: "総勘定元帳作成",
			taskSummary: "仕訳データを集計し、総勘定元帳を作成する",
			person: "経理担当",
			input: "仕訳データ",
			output: "総勘定元帳",
			businessRequirements: [
				{
					id: "BR-TASK-017-001",
					type: "業務要件",
					title: "総勘定元帳を表示する",
					summary: "勘定科目別の取引明細を表示する。",
					concepts: [
						{ id: "C028", name: "総勘定元帳" },
						{ id: "C026", name: "仕訳" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"勘定科目を選択して明細を表示できること",
						"期間を指定して抽出できること",
						"借方合計・貸方合計・残高を表示できること",
					],
					related: [],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-017-001",
					type: "システム要件",
					title: "総勘定元帳画面機能",
					summary: "勘定科目別の取引明細を表示する画面を提供する。",
					concepts: [
						{ id: "C028", name: "総勘定元帳" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"勘定科目を選択して明細を表示できること",
						"期間を指定して抽出できること",
						"借方合計・貸方合計・残高を表示できること",
					],
					related: ["BR-TASK-017-001"],
					srfId: "SRF-019",
				},
				{
					id: "SR-TASK-017-002",
					type: "システム要件",
					title: "総勘定元帳生成ロジック",
					summary: "仕訳テーブルと勘定科目マスタを結合し、総勘定元帳データを生成する。",
					concepts: [
						{ id: "C028", name: "総勘定元帳" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"勘定科目別の取引明細を生成できること",
						"期間別の集計ができること",
						"PDF出力ができること",
					],
					related: ["BR-TASK-017-001"],
					srfId: "SRF-019",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-017-001",
					title: "総勘定元帳画面設計",
					category: "画面",
					source: "内部",
					content: "- 勘定科目別明細表示\n- 期間指定機能\n- PDF出力機能",
				},
			],
			codeRefs: [{ paths: ["apps/gl/src/ledger/generalLedgerScreen"] }],
		};
	}

	// GL領域：TASK-018 試算表作成
	if (taskId === "TASK-018") {
		return {
			bizId: "BIZ-003",
			taskId,
			taskName: "試算表作成",
			taskSummary: "総勘定元帳から試算表を作成し、貸借整合を確認する",
			person: "経理担当",
			input: "総勘定元帳データ",
			output: "試算表",
			businessRequirements: [
				{
					id: "BR-TASK-018-001",
					type: "業務要件",
					title: "試算表を表示する",
					summary: "試算表を表示し、貸借整合を確認する。",
					concepts: [
						{ id: "C029", name: "試算表" },
						{ id: "C028", name: "総勘定元帳" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"試算表を表示できること",
						"貸借整合をチェックできること",
						"期比較ができること",
					],
					related: [],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-018-001",
					type: "システム要件",
					title: "試算表画面機能",
					summary: "試算表を表示し、貸借整合を確認する画面を提供する。",
					concepts: [
						{ id: "C029", name: "試算表" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"試算表を表示できること",
						"貸借整合をチェックできること",
						"期比較ができること",
					],
					related: ["BR-TASK-018-001"],
					srfId: "SRF-020",
				},
				{
					id: "SR-TASK-018-002",
					type: "システム要件",
					title: "試算表生成ロジック",
					summary: "総勘定元帳から勘定科目別の借方合計・貸方合計を集計する。",
					concepts: [
						{ id: "C029", name: "試算表" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"勘定科目別の集計ができること",
						"貸借不一致を検出できること",
						"Excel出力ができること",
					],
					related: ["BR-TASK-018-001"],
					srfId: "SRF-020",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-018-001",
					title: "試算表画面設計",
					category: "画面",
					source: "内部",
					content: "- 試算表生成ロジック\n- 貸借整合チェック\n- 期比較機能\n- Excel出力機能",
				},
			],
			codeRefs: [{ paths: ["apps/gl/src/trialBalance/trialBalanceScreen"] }],
		};
	}

	// GL領域：TASK-019 財務諸表作成
	if (taskId === "TASK-019") {
		return {
			bizId: "BIZ-003",
			taskId,
			taskName: "財務諸表作成",
			taskSummary: "試算表をもとにB/S、P/Lを作成する",
			person: "経理担当",
			input: "試算表データ",
			output: "財務諸表（B/S、P/L）",
			businessRequirements: [
				{
					id: "BR-TASK-019-001",
					type: "業務要件",
					title: "財務諸表を表示する",
					summary: "B/S、P/Lを表示し、Excel出力を行う。",
					concepts: [
						{ id: "C030", name: "貸借対照表" },
						{ id: "C031", name: "損益計算書" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"B/Sを表示できること",
						"P/Lを表示できること",
						"Excel出力ができること",
					],
					related: [],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-019-001",
					type: "システム要件",
					title: "財務諸表画面機能",
					summary: "B/S、P/Lを表示し、Excel出力を行う画面を提供する。",
					concepts: [
						{ id: "C030", name: "貸借対照表" },
						{ id: "C031", name: "損益計算書" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"B/Sを表示できること",
						"P/Lを表示できること",
						"Excel出力ができること",
					],
					related: ["BR-TASK-019-001"],
					srfId: "SRF-021",
				},
				{
					id: "SR-TASK-019-002",
					type: "システム要件",
					title: "財務諸表生成エンジン",
					summary: "試算表データからB/S、P/Lを生成する。",
					concepts: [
						{ id: "C030", name: "貸借対照表" },
						{ id: "C031", name: "損益計算書" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"勘定科目の配賦ルールを適用できること",
						"セグメント別の表示ができること",
						"テンプレート通りに出力できること",
					],
					related: ["BR-TASK-019-001"],
					srfId: "SRF-021",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-019-001",
					title: "財務諸表画面設計",
					category: "画面",
					source: "内部",
					content: "- B/Sテンプレート設計\n- P/Lテンプレート設計\n- 財務諸表生成エンジン\n- Excel出力機能",
				},
			],
			codeRefs: [{ paths: ["apps/gl/src/financials/statementsScreen"] }],
		};
	}

	// GL領域：TASK-020 決算整理
	if (taskId === "TASK-020") {
		return {
			bizId: "BIZ-003",
			taskId,
			taskName: "決算整理",
			taskSummary: "決算時に必要な整理仕訳を計上し、決算資料を作成する",
			person: "経理担当",
			input: "総勘定元帳データ",
			output: "決算整理仕訳、決算資料",
			businessRequirements: [
				{
					id: "BR-TASK-020-001",
					type: "業務要件",
					title: "決算整理仕訳を計上する",
					summary: "決算時に必要な整理仕訳（減価償却、賞与引当等）を自動計上する。",
					concepts: [
						{ id: "C032", name: "決算整理" },
						{ id: "C034", name: "減価償却" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"減価償却費を計上できること",
						"賞与引当金を計上できること",
						"試算表締め処理ができること",
					],
					related: [],
				},
				{
					id: "BR-TASK-020-002",
					type: "業務要件",
					title: "繰越処理を行う",
					summary: "次期への繰越残高を計算し、次期の期首残高として設定する。",
					concepts: [
						{ id: "C032", name: "決算整理" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"繰越残高を計算できること",
						"次期へ繰り越せること",
						"繰越処理履歴を記録できること",
					],
					related: ["BR-TASK-020-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-020-001",
					type: "システム要件",
					title: "決算整理仕訳自動計上機能",
					summary: "決算時に必要な整理仕訳（減価償却、賞与引当等）を自動計上する。",
					concepts: [
						{ id: "C032", name: "決算整理" },
						{ id: "C034", name: "減価償却" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"減価償却費を計上できること",
						"賞与引当金を計上できること",
						"試算表締め処理ができること",
					],
					related: ["BR-TASK-020-001"],
					srfId: "SRF-022",
				},
				{
					id: "SR-TASK-020-002",
					type: "システム要件",
					title: "繰越処理機能",
					summary: "次期への繰越残高を計算し、次期の期首残高として設定する。",
					concepts: [
						{ id: "C032", name: "決算整理" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"繰越残高を計算できること",
						"次期へ繰り越せること",
						"繰越処理履歴を記録できること",
					],
					related: ["BR-TASK-020-002"],
					srfId: "SRF-022",
				},
				{
					id: "SR-TASK-020-003",
					type: "システム要件",
					title: "決算整理画面機能",
					summary: "決算整理仕訳の一覧表示、修正、削除を行う画面を提供する。",
					concepts: [
						{ id: "C032", name: "決算整理" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"決算整理仕訳を一覧表示できること",
						"修正・削除ができること",
						"整理後試算表を作成できること",
					],
					related: ["BR-TASK-020-001", "BR-TASK-020-002"],
					srfId: "SRF-022",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-020-001",
					title: "決算整理機能設計",
					category: "データ",
					source: "内部",
					content: "- 決算整理仕訳ルール\n- 減価償却費自動計上\n- 試算表締め処理\n- 繰越処理",
				},
			],
			codeRefs: [{ paths: ["apps/gl/src/closing/closingAdjustmentService"] }],
		};
	}

	// GL領域：TASK-021 固定資産管理
	if (taskId === "TASK-021") {
		return {
			bizId: "BIZ-003",
			taskId,
			taskName: "固定資産管理",
			taskSummary: "固定資産の取得、償却、廃棄を管理する",
			person: "経理担当",
			input: "固定資産データ",
			output: "固定資産台帳、償却スケジュール",
			businessRequirements: [
				{
					id: "BR-TASK-021-001",
					type: "業務要件",
					title: "固定資産償却を計算する",
					summary: "固定資産の償却費を自動計算し、仕訳データを生成する。",
					concepts: [
						{ id: "C033", name: "固定資産" },
						{ id: "C034", name: "減価償却" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"定額法・定率法で償却費を計算できること",
						"償却スケジュールを作成できること",
						"月次バッチで計上できること",
					],
					related: [],
				},
				{
					id: "BR-TASK-021-002",
					type: "業務要件",
					title: "固定資産マスタを管理する",
					summary: "固定資産マスタを管理し、償却計算の基礎データを提供する。",
					concepts: [
						{ id: "C033", name: "固定資産" },
					],
					impacts: ["SD_GL"],
					acceptanceCriteria: [
						"資産の取得・廃棄を登録できること",
						"償却方法を設定できること",
						"帳簿価額を参照できること",
					],
					related: ["BR-TASK-021-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-021-001",
					type: "システム要件",
					title: "固定資産償却計算機能",
					summary: "固定資産の償却費を自動計算し、仕訳データを生成する。",
					concepts: [
						{ id: "C033", name: "固定資産" },
						{ id: "C034", name: "減価償却" },
					],
					impacts: ["FI_GL"],
					acceptanceCriteria: [
						"定額法・定率法で償却費を計算できること",
						"償却スケジュールを作成できること",
						"月次バッチで計上できること",
					],
					related: ["BR-TASK-021-001"],
					srfId: "SRF-023",
				},
				{
					id: "SR-TASK-021-002",
					type: "システム要件",
					title: "固定資産マスタ管理機能",
					summary: "固定資産マスタを管理し、償却計算の基礎データを提供する。",
					concepts: [
						{ id: "C033", name: "固定資産" },
					],
					impacts: ["SD_GL"],
					acceptanceCriteria: [
						"資産の取得・廃棄を登録できること",
						"償却方法を設定できること",
						"帳簿価額を参照できること",
					],
					related: ["BR-TASK-021-002"],
					srfId: "SRF-023",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-021-001",
					title: "固定資産償却機能設計",
					category: "データ",
					source: "内部",
					content: "- 固定資産マスタ管理\n- 償却計算エンジン\n- 償却スケジュール作成\n- 償却費自動計上",
				},
			],
			codeRefs: [{ paths: ["apps/gl/assets/depreciationService"] }],
		};
	}

	// GL領域：TASK-022 税申告
	if (taskId === "TASK-022") {
		return {
			bizId: "BIZ-003",
			taskId,
			taskName: "税申告",
			taskSummary: "消費税、法人税等の税申告資料を作成する",
			person: "経理担当",
			input: "総勘定元帳データ",
			output: "税申告書",
			businessRequirements: [
				{
					id: "BR-TASK-022-001",
					type: "業務要件",
					title: "消費税申告データを作成する",
					summary: "総勘定元帳から課税売上、免税売上、課税仕入を集計し、消費税申告書データを作成する。",
					concepts: [
						{ id: "C035", name: "税申告" },
						{ id: "C002", name: "消費税計算" },
					],
					impacts: ["FI_TAX", "FI_GL"],
					acceptanceCriteria: [
						"税率別の集計ができること",
						"申告書データを作成できること",
						"PDF出力ができること",
					],
					related: [],
				},
				{
					id: "BR-TASK-022-002",
					type: "業務要件",
					title: "法人税申告データを作成する",
					summary: "損益計算書から所得金額を計算し、法人税申告書データを作成する。",
					concepts: [
						{ id: "C035", name: "税申告" },
					],
					impacts: ["FI_TAX", "FI_GL"],
					acceptanceCriteria: [
						"所得金額を計算できること",
						"申告書データを作成できること",
						"修正・調整ができること",
					],
					related: ["BR-TASK-022-001"],
				},
			],
			systemRequirements: [
				{
					id: "SR-TASK-022-001",
					type: "システム要件",
					title: "消費税申告データ作成機能",
					summary: "総勘定元帳から課税売上、免税売上、課税仕入を集計し、消費税申告書データを作成する。",
					concepts: [
						{ id: "C035", name: "税申告" },
						{ id: "C002", name: "消費税計算" },
					],
					impacts: ["FI_TAX", "FI_GL"],
					acceptanceCriteria: [
						"税率別の集計ができること",
						"申告書データを作成できること",
						"PDF出力ができること",
					],
					related: ["BR-TASK-022-001"],
					srfId: "SRF-024",
				},
				{
					id: "SR-TASK-022-002",
					type: "システム要件",
					title: "法人税申告データ作成機能",
					summary: "損益計算書から所得金額を計算し、法人税申告書データを作成する。",
					concepts: [
						{ id: "C035", name: "税申告" },
					],
					impacts: ["FI_TAX", "FI_GL"],
					acceptanceCriteria: [
						"所得金額を計算できること",
						"申告書データを作成できること",
						"修正・調整ができること",
					],
					related: ["BR-TASK-022-002"],
					srfId: "SRF-024",
				},
				{
					id: "SR-TASK-022-003",
					type: "システム要件",
					title: "税申告画面機能",
					summary: "消費税、法人税の申告データを表示し、修正・調整を行う画面を提供する。",
					concepts: [
						{ id: "C035", name: "税申告" },
					],
					impacts: ["FI_TAX"],
					acceptanceCriteria: [
						"申告データを表示できること",
						"修正・調整ができること",
						"e-Tax連携の準備ができること",
					],
					related: ["BR-TASK-022-001", "BR-TASK-022-002"],
					srfId: "SRF-024",
				},
			],
			designDocs: [
				{
					id: "DD-TASK-022-001",
					title: "税申告画面設計",
					category: "画面",
					source: "内部",
					content: "- 消費税申告データ作成\n- 法人税申告データ作成\n- 税申告画面\n- 税務报表出力",
				},
			],
			codeRefs: [{ paths: ["apps/gl/src/tax/taxFilingScreen"] }],
		};
	}

	return {
		bizId,
		taskId,
		taskName: "業務タスク",
		taskSummary: "（サンプル）この業務タスクの概要です。",
		businessRequirements: [],
		systemRequirements: [],
		designDocs: [],
		codeRefs: [],
	};
};

