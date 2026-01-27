/**
 * 受入条件（GWT形式）生成ユーティリティ
 *
 * システム要件のカテゴリに応じて、GWT形式の受入条件テンプレートを生成する
 * PRD v1.3 Phase 2 準拠
 */

import type { AcceptanceCriterionJson } from "@/lib/data/structured";
import type { SystemRequirementCategory } from "@/lib/domain";

/**
 * カテゴリ別GWTテンプレート
 *
 * 各カテゴリの特徴に応じたGiven/When/Thenのテンプレートを定義
 */
/**
 * カテゴリ別GWTテンプレート（シンプルなテキスト形式）
 *
 * 各カテゴリの特徴に応じたGiven/When/Thenのテンプレートを定義
 * YAML形式のプレースホルダーではなく、シンプルで読みやすいテキスト形式を使用
 */
export const templateByCategory = (
	category: SystemRequirementCategory | undefined
): { givenText: string; whenText: string; thenText: string } => {
	switch (category) {
		case "non_functional":
			return {
				givenText: "想定される負荷・環境条件が整っている",
				whenText: "性能測定を実行する",
				thenText: "指定された性能指標を満たしている",
			};
		case "exception":
			return {
				givenText: "異常な状態・エラー条件が発生している",
				whenText: "通常の処理を実行する",
				thenText: "エラーが適切に検出され、エラーメッセージが表示される",
			};
		case "data":
			return {
				givenText: "入力データが整合性を持ち、処理可能な形式である",
				whenText: "データ処理・変換を実行する",
				thenText: "出力データが正しく生成され、整合性が保たれている",
			};
		default:
			// function
			return {
				givenText: "処理対象データが存在し、システムが利用可能な状態である",
				whenText: "処理を実行する",
				thenText: "正常に完了し、期待される結果が得られる",
			};
	}
};

/**
 * システム要件のタイトルから主要な操作名を抽出
 *
 * @param title - システム要件のタイトル（例: "電子請求書送信"）
 * @returns 操作名（例: "電子請求書送信"）
 */
function extractOperationName(title: string): string {
	return title.trim();
}

/**
 * システム要件のタイトルから自然なdescriptionを生成
 *
 * @param title - システム要件のタイトル
 * @returns 受入条件のdescription（例: "電子請求書送信が正常に完了すること"）
 */
function generateDescription(title: string): string {
	const operation = extractOperationName(title);
	return `${operation}が正常に完了すること`;
}

/**
 * システム要件に応じたGWT形式の受入条件を生成
 *
 * @param params - 生成パラメータ
 * @returns 生成された受入条件（GWT形式）
 */
export function generateAcceptanceCriteriaForRequirement(params: {
	id: string;
	title: string;
	summary: string;
	category: SystemRequirementCategory;
}): AcceptanceCriterionJson {
	const { id, title, category } = params;
	const template = templateByCategory(category);
	const description = generateDescription(title);

	return {
		id: `${id}-001`,
		description,
		verification_method: "手動テスト",
		givenText: template.givenText,
		whenText: template.whenText,
		thenText: template.thenText,
	};
}

/**
 * 複数のシステム要件に対して一括で受入条件を生成
 *
 * @param requirements - システム要件の配列
 * @returns 生成された受入条件の配列（要件IDをキーとしたマップ）
 */
export function generateAcceptanceCriteriaForRequirements(
	requirements: Array<{
		id: string;
		title: string;
		summary: string;
		category: SystemRequirementCategory;
	}>
): Map<string, AcceptanceCriterionJson> {
	const result = new Map<string, AcceptanceCriterionJson>();

	for (const req of requirements) {
		const ac = generateAcceptanceCriteriaForRequirement(req);
		result.set(req.id, ac);
	}

	return result;
}

/**
 * 受入条件が「意味のある内容」を持っているか判定
 *
 * 空のACやテンプレートのみのACを「無意味」とみなす
 *
 * @param ac - 受入条件
 * @returns 意味のある内容を持っている場合はtrue
 */
export function hasMeaningfulContent(ac: AcceptanceCriterionJson): boolean {
	// description が空の場合は無意味
	if (!ac.description || ac.description.trim().length === 0) {
		return false;
	}

	// verification_method がある場合は意味があるとみなす
	if (ac.verification_method && ac.verification_method.trim().length > 0) {
		return true;
	}

	// GWTフィールドのいずれかに具体的な内容がある場合は意味があるとみなす
	const hasContent =
		(ac.givenText && ac.givenText.trim().length > 0 && !ac.givenText.includes("[")) ||
		(ac.whenText && ac.whenText.trim().length > 0 && !ac.whenText.includes("[")) ||
		(ac.thenText && ac.thenText.trim().length > 0 && !ac.thenText.includes("["));

	return hasContent;
}
