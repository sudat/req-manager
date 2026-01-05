export type SystemFunctionStatus = "未実装" | "実装中" | "実装済" | "テスト中";

export type Requirement = {
	id: string;
	type: string;
	title: string;
	summary: string;
	concepts: { id: string; name: string }[];
	impacts: string[];
	acceptanceCriteria: string[];
	related: string[];
	srfId?: string;
};

export type SystemFunction = {
	id: string;
	designDocNo: string;
	category: string;
	summary: string;
	status: SystemFunctionStatus;
	relatedRequirements: Requirement[];
	codeRefs: {
		githubUrl?: string;
		paths: string[];
		note?: string;
	}[];
};

export const srfData: SystemFunction[] = [
	{
		id: "SRF-001",
		designDocNo: "DD-TASK-001-001",
		category: "画面",
		summary: "請求書発行：帳票出力機能。登録番号、税率別対価、税率別税額を含む請求書PDFを生成する。",
		status: "実装済",
		relatedRequirements: [
			{
				id: "SR-TASK-001-001",
				type: "システム要件",
				title: "税率別内訳を保持し、帳票出力へ反映する",
				summary: "請求明細から税率別集計を生成し、帳票テンプレートに差し込めること。",
				concepts: [{ id: "C001", name: "インボイス制度" }],
				impacts: ["SD_BILLING", "FI_GL"],
				acceptanceCriteria: [
					"帳票出力APIが税率別内訳を返すこと",
					"帳票テンプレートに税率別内訳が差し込まれること",
				],
				related: ["BR-TASK-001-001"],
				srfId: "SRF-001",
			},
		],
		codeRefs: [
			{
				githubUrl: "https://github.com/example/billing",
				paths: [
					"apps/billing/src/invoice/generateInvoice.ts",
					"apps/billing/src/invoice/templates/invoice-template.html",
					"apps/billing/src/invoice/types.ts",
				],
				note: "請求書生成のメインロジックとテンプレート",
			},
		],
	},
	{
		id: "SRF-002",
		designDocNo: "DD-TASK-001-002",
		category: "内部",
		summary: "税率別内訳集計機能。請求明細から税率別の対価と税額を集計し、帳票出力APIへ提供する。",
		status: "実装済",
		codeRefs: [
			{
				githubUrl: "https://github.com/example/billing",
				paths: [
					"apps/billing/src/tax/calculateTax.ts",
					"apps/billing/src/tax/types.ts",
				],
				note: "税率計算と集計ロジック",
			},
		],
	},
	{
		id: "SRF-003",
		designDocNo: "DD-TASK-002-001",
		category: "内部",
		summary: "入金データ取り込み機能。銀行ファイルを取り込み、入金データを解析してデータベースへ登録する。",
		status: "実装中",
		codeRefs: [
			{
				githubUrl: "https://github.com/example/payment",
				paths: [
					"apps/payment/src/import/bankFileParser.ts",
					"apps/payment/src/import/paymentImportService.ts",
				],
				note: "銀行ファイルパーサーとインポートサービス",
			},
		],
	},
	{
		id: "SRF-004",
		designDocNo: "DD-TASK-002-002",
		category: "内部",
		summary: "入金消込機能。取り込んだ入金データと請求データを突合し、消込処理を実行する。",
		status: "テスト中",
		codeRefs: [
			{
				githubUrl: "https://github.com/example/payment",
				paths: [
					"apps/payment/src/matching/reconciliationService.ts",
					"apps/payment/src/matching/paymentMatchingEngine.ts",
				],
				note: "消込ロジックとマッチングエンジン",
			},
		],
	},
	{
		id: "SRF-005",
		designDocNo: "DD-TASK-003-001",
		category: "画面",
		summary: "債権管理一覧画面。未回収債権を一覧表示し、督促状況や回収計画を確認できる。",
		status: "未実装",
		codeRefs: [],
	},
];

export const getSystemFunctionById = (id: string): SystemFunction | undefined => {
	return srfData.find((srf) => srf.id === id);
};

export const getRequirementsBySrfId = (id: string): Requirement[] => {
	const srf = srfData.find((srf) => srf.id === id);
	return srf?.relatedRequirements ?? [];
};
