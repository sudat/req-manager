/**
 * プロダクト要件フィールドの設定
 *
 * 各フィールドのlabelとplaceholderを一元管理
 */

export const PRODUCT_REQUIREMENT_FIELD_CONFIGS = {
	targetUsers: {
		label: "ターゲットユーザー",
		placeholder:
			"ペルソナ、利用シーン、前提知識など\n\n例:\n- ペルソナ: 20代〜40代のビジネスパーソン\n- 利用シーン: 通勤中や休憩時間にスマートフォンで閲覧\n- 前提知識: 基本的なスマートフォン操作に習熟している",
	},
	experienceGoals: {
		label: "体験目標",
		placeholder:
			"ユーザーが得たい価値や行動変容\n\n例:\n- ストレスなくタスクを完遂できる\n- 次のアクションが明確にわかる\n- 操作に迷わない直感的なUI",
	},
	qualityGoals: {
		label: "品質目標",
		placeholder:
			"性能、可用性、セキュリティなど\n\n例:\n- ページ読み込み: 2秒以内\n- エラー率: 0.1%以下\n- データ保護: GDPR準拠",
	},
	uxGuidelines: {
		label: "UXガイドライン",
		placeholder:
			"操作性、フィードバック、エラー表示方針\n\n例:\n- 操作: 3クリック以内で目的を達成\n- フィードバック: 即座の視覚的フィードバック\n- エラー: エラー原因と解決策を明示",
	},
	designSystem: {
		label: "デザインシステム",
		placeholder:
			"カラー、タイポグラフィ、コンポーネント方針\n\n例:\n- カラー: ブルー系をプライマリカラー\n- タイポグラフィ: Noto Sans JP、基本14px\n- コンポーネント: shadcn/uiベース",
	},
} as const;

export type ProductRequirementFieldKey = keyof typeof PRODUCT_REQUIREMENT_FIELD_CONFIGS;
