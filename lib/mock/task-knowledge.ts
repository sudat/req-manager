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
	if (taskId === "TASK-001") {
		return {
			bizId,
			taskId,
			taskName: "請求書発行",
			taskSummary: "請求対象を抽出し、請求書を生成して発行する。",
			person: "経理担当",
			input: "請求対象データ、契約情報",
			output: "請求書（PDF/電子）",
			businessRequirements: [
				{
					id: "BR-TASK-001-001",
					type: "業務要件",
					title: "適格請求書（インボイス）番号を請求書に表示する",
					summary: "請求書発行時に登録番号・税率別の対価等、法令要件を満たす項目を表示する。",
					concepts: [
						{ id: "C001", name: "インボイス制度" },
						{ id: "C002", name: "請求書発行" },
					],
					impacts: ["FI_TAX", "SD_BILLING"],
					acceptanceCriteria: [
						"請求書PDFに登録番号が表示されること",
						"税率ごとの対価・税額が表示されること",
					],
					related: [],
				},
			],
			systemRequirements: [
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
				},
			],
			designDocs: [
				{
					id: "DD-TASK-001-001",
					title: "請求書発行：帳票出力",
					category: "画面",
					source: "内部",
					content:
						"- 出力形式: PDF/電子（将来）\n- 主要項目: 登録番号、税率別対価、税率別税額\n- レイアウト: 既存テンプレートのフッター部に登録番号を追加\n",
				},
			],
			codeRefs: [
				{
					paths: ["apps/billing/src/invoice"],
				},
			],
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

