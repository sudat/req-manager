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

