#!/usr/bin/env -S bun run
/**
 * 業務要件とシステム要件の紐付けデータ修正スクリプト
 *
 * キーワードマッチングによって業務要件とシステム要件を自動紐付けする
 *
 * 使用方法:
 *   --dry-run    確認モード（デフォルト）
 *   --execute    実行モード
 *   --task=TASK-XXX  特定タスクのみ対象
 */

import { updateBusinessRequirement } from "@/lib/data/business-requirements";
import { updateSystemRequirement } from "@/lib/data/system-requirements";

// ============================================================================
// 型定義
// ============================================================================

type MatchLevel = "auto" | "review" | "none";

interface MatchingResult {
	businessReq: {
		id: string;
		title: string;
		summary: string;
		taskId: string;
	};
	systemReq: {
		id: string;
		title: string;
		summary: string;
		taskId: string;
		srfId: string | null;
	};
	score: number;
	matchedKeywords: string[];
	level: MatchLevel;
	skipReason?: string;
}

interface TaskMatchingSummary {
	taskId: string;
	autoMatches: number;
	reviewMatches: number;
	skippedBusiness: number;
	skippedSystem: number;
	results: MatchingResult[];
}

interface Summary {
	totalTasks: number;
	totalAutoMatches: number;
	totalReviewMatches: number;
	totalSkippedBusiness: number;
	totalSkippedSystem: number;
	taskSummaries: TaskMatchingSummary[];
}

// ============================================================================
// CLI引数パーサー
// ============================================================================

interface CliArgs {
	mode: "dry-run" | "execute";
	targetTask: string | null;
}

function parseArgs(): CliArgs {
	const args = process.argv.slice(2);
	let mode: "dry-run" | "execute" = "dry-run";
	let targetTask: string | null = null;

	for (const arg of args) {
		if (arg === "--execute") {
			mode = "execute";
		} else if (arg === "--dry-run") {
			mode = "dry-run";
		} else if (arg.startsWith("--task=")) {
			targetTask = arg.split("=")[1];
		} else if (arg === "--help" || arg === "-h") {
			console.log(`
使用方法:
  bun scripts/db/link-requirements-by-keyword-matching.ts [options]

オプション:
  --dry-run          確認モード（デフォルト）
  --execute          実行モード（データを更新）
  --task=TASK-XXX    特定タスクのみ対象
  --help, -h         ヘルプ表示

実行例:
  # すべてのタスクをドライラン
  bun scripts/db/link-requirements-by-keyword-matching.ts --dry-run

  # 特定タスクのみ実行
  bun scripts/db/link-requirements-by-keyword-matching.ts --execute --task=TASK-002
`);
			process.exit(0);
		}
	}

	return { mode, targetTask };
}

// ============================================================================
// キーワード抽出・スコア計算
// ============================================================================

/**
 * テキストからキーワードを抽出する
 *
 * Bigram（2文字連続）方式による日本語対応のキーワード抽出:
 * 1. 句読点と空白を除外
 * 2. 2文字連続（Bigram）を抽出
 * 3. 数字と記号のみのbigramを除外
 *
 * 例: "売掛金の計上" → ["売掛", "掛金", "の計", "計上"]
 */
function extractKeywords(text: string): string[] {
	// 句読点と空白を除外
	const cleaned = text.replace(/[、。，.\s\u3000\n\r\t]/g, "");

	const bigrams: string[] = [];
	for (let i = 0; i < cleaned.length - 1; i++) {
		const bigram = cleaned.substring(i, i + 2);
		// 数字と記号のみのbigramを除外
		if (!/^[0-9\-\/:;]+$/.test(bigram)) {
			bigrams.push(bigram);
		}
	}

	// 重複を排除して返す
	return Array.from(new Set(bigrams));
}

/**
 * タイトルとサマリーからキーワードを抽出
 */
function extractKeywordsFromTitleAndSummary(title: string, summary: string): Set<string> {
	const titleKeywords = extractKeywords(title);
	const summaryKeywords = extractKeywords(summary);
	return new Set([...titleKeywords, ...summaryKeywords]);
}

/**
 * 2つのテキスト間のキーワードマッチングスコアを計算
 *
 * @param businessTitle - 業務要件のタイトル
 * @param businessSummary - 業務要件のサマリー
 * @param systemTitle - システム要件のタイトル
 * @param systemSummary - システム要件のサマリー
 * @returns スコアとマッチしたキーワード
 */
function calculateMatchScore(
	businessTitle: string,
	businessSummary: string,
	systemTitle: string,
	systemSummary: string
): { score: number; matchedKeywords: string[] } {
	const businessKeywords = extractKeywordsFromTitleAndSummary(businessTitle, businessSummary);
	const systemKeywords = extractKeywordsFromTitleAndSummary(systemTitle, systemSummary);

	const matchedKeywords: string[] = [];
	for (const keyword of businessKeywords) {
		if (systemKeywords.has(keyword)) {
			matchedKeywords.push(keyword);
		}
	}

	return { score: matchedKeywords.length, matchedKeywords };
}

/**
 * スコアからマッチレベルを判定
 */
function determineMatchLevel(score: number): MatchLevel {
	if (score >= 2) return "auto";
	if (score === 1) return "review";
	return "none";
}

// ============================================================================
// マッチング実行
// ============================================================================

/**
 * タスク単位のマッチングを実行
 */
async function matchTaskRequirements(taskId: string): Promise<TaskMatchingSummary> {
	const [businessResult, systemResult] = await Promise.all([
		listBusinessRequirementsByTaskId(taskId),
		listSystemRequirementsByTaskId(taskId),
	]);

	if (businessResult.error) {
		throw new Error(`業務要件の取得に失敗: ${businessResult.error}`);
	}
	if (systemResult.error) {
		throw new Error(`システム要件の取得に失敗: ${systemResult.error}`);
	}

	const businessReqs = businessResult.data ?? [];
	const systemReqs = systemResult.data ?? [];

	const results: MatchingResult[] = [];
	let skippedBusiness = 0;
	let skippedSystem = 0;

	// 既に紐付け済みのシステム要件をカウント
	const alreadyLinkedSystemIds = new Set(
		systemReqs.filter((sr) => sr.businessRequirementIds.length > 0).map((sr) => sr.id)
	);
	skippedSystem = alreadyLinkedSystemIds.size;

	// 各業務要件についてマッチング
	for (const businessReq of businessReqs) {
		// 既に srfId が設定されている場合はスキップ
		if (businessReq.srfId) {
			skippedBusiness++;
			continue;
		}

		// 各システム要件とマッチング
		for (const systemReq of systemReqs) {
			// 既に紐付け済みのシステム要件はスキップ
			if (alreadyLinkedSystemIds.has(systemReq.id)) {
				continue;
			}

			const { score, matchedKeywords } = calculateMatchScore(
				businessReq.title,
				businessReq.summary,
				systemReq.title,
				systemReq.summary
			);

			const level = determineMatchLevel(score);

			results.push({
				businessReq: {
					id: businessReq.id,
					title: businessReq.title,
					summary: businessReq.summary,
					taskId: businessReq.taskId,
				},
				systemReq: {
					id: systemReq.id,
					title: systemReq.title,
					summary: systemReq.summary,
					taskId: systemReq.taskId,
					srfId: systemReq.srfId,
				},
				score,
				matchedKeywords,
				level,
			});
		}
	}

	// 自動紐付けと確認が必要なものを集計
	const autoMatches = results.filter((r) => r.level === "auto").length;
	const reviewMatches = results.filter((r) => r.level === "review").length;

	return {
		taskId,
		autoMatches,
		reviewMatches,
		skippedBusiness,
		skippedSystem,
		results,
	};
}

/**
 * すべてのタスクでマッチングを実行
 */
async function matchAllRequirements(targetTask: string | null): Promise<Summary> {
	// すべての業務要件を取得してタスクIDを収集
	const businessResult = await listBusinessRequirements();
	if (businessResult.error) {
		throw new Error(`業務要件の取得に失敗: ${businessResult.error}`);
	}

	const allBusinessReqs = businessResult.data ?? [];
	const taskIds = Array.from(new Set(allBusinessReqs.map((br) => br.taskId)));

	// ターゲットタスクが指定されている場合はフィルタリング
	const targetTaskIds = targetTask ? [targetTask] : taskIds;

	const taskSummaries: TaskMatchingSummary[] = [];

	for (const taskId of targetTaskIds) {
		const summary = await matchTaskRequirements(taskId);
		taskSummaries.push(summary);
	}

	const totalTasks = taskSummaries.length;
	const totalAutoMatches = taskSummaries.reduce((sum, s) => sum + s.autoMatches, 0);
	const totalReviewMatches = taskSummaries.reduce((sum, s) => sum + s.reviewMatches, 0);
	const totalSkippedBusiness = taskSummaries.reduce((sum, s) => sum + s.skippedBusiness, 0);
	const totalSkippedSystem = taskSummaries.reduce((sum, s) => sum + s.skippedSystem, 0);

	return {
		totalTasks,
		totalAutoMatches,
		totalReviewMatches,
		totalSkippedBusiness,
		totalSkippedSystem,
		taskSummaries,
	};
}

// ============================================================================
// 結果表示
// ============================================================================

/**
 * マッチング結果を表示
 */
function displayResult(summary: Summary, mode: "dry-run" | "execute"): void {
	console.log("\n=== キーワードマッチングによる要件紐付け ===\n");
	console.log(`モード: ${mode.toUpperCase()}`);
	console.log(`対象タスク: ${summary.totalTasks}件\n`);

	for (const taskSummary of summary.taskSummaries) {
		// タスク名を取得
		const taskName = taskSummary.taskId;

		console.log(`--- ${taskName} ---`);
		console.log(`  ✓ 自動紐付け候補: ${taskSummary.autoMatches}件`);
		console.log(`  ? 確認が必要: ${taskSummary.reviewMatches}件`);
		console.log(`  ⊘ 既に紐付け済み: ${taskSummary.skippedSystem}件（システム要件）`);
		console.log(`  ⊘ 既に紐付け済み: ${taskSummary.skippedBusiness}件（業務要件）`);

		// 自動紐付け候補を表示
		const autoResults = taskSummary.results.filter((r) => r.level === "auto");
		for (const result of autoResults) {
			const modePrefix = mode === "dry-run" ? "[DRY-RUN] " : "";
			console.log(`\n  ${modePrefix}紐付け: ${result.businessReq.title} -> ${result.systemReq.title}`);
			console.log(`    スコア: ${result.score}`);
			console.log(`    マッチキーワード: ${result.matchedKeywords.join(", ")}`);
		}

		// 確認が必要なものを表示
		const reviewResults = taskSummary.results.filter((r) => r.level === "review");
		for (const result of reviewResults) {
			console.log(`\n  [REVIEW] 確認が必要: ${result.businessReq.title} -> ${result.systemReq.title}`);
			console.log(`    スコア: ${result.score}`);
			console.log(`    マッチキーワード: ${result.matchedKeywords.join(", ")}`);
		}

		console.log("");
	}

	// サマリー表示
	console.log("=== サマリー ===");
	console.log(`全タスク: ${summary.totalTasks}件`);
	console.log(`自動紐付け候補: ${summary.totalAutoMatches}件`);
	console.log(`確認が必要: ${summary.totalReviewMatches}件`);
	console.log(`既に紐付け済み: ${summary.totalSkippedBusiness + summary.totalSkippedSystem}件`);
	console.log("");
}

// ============================================================================
// 更新処理
// ============================================================================

/**
 * マッチング結果を適用
 */
async function applyMatching(summary: Summary): Promise<void> {
	let appliedCount = 0;
	let errorCount = 0;

	for (const taskSummary of summary.taskSummaries) {
		const autoResults = taskSummary.results.filter((r) => r.level === "auto");

		for (const result of autoResults) {
			try {
				// 業務要件を更新（srf_id を設定）
				const businessUpdateResult = await updateBusinessRequirement(result.businessReq.id, {
					taskId: result.businessReq.taskId,
					title: result.businessReq.title,
					summary: result.businessReq.summary,
					conceptIds: [],
					srfId: result.systemReq.srfId,
					systemDomainIds: [],
					impacts: [],
					relatedSystemRequirementIds: [],
					acceptanceCriteria: [],
					sortOrder: 0,
				});

				if (businessUpdateResult.error) {
					console.error(`  ✗ 業務要件の更新に失敗: ${result.businessReq.id} - ${businessUpdateResult.error}`);
					errorCount++;
					continue;
				}

				// システム要件を更新（business_requirement_ids を追加）
				// まず既存のデータを取得
				const systemReqs = await listSystemRequirementsByTaskId(result.systemReq.taskId);
				if (systemReqs.error) {
					console.error(`  ✗ システム要件の取得に失敗: ${result.systemReq.taskId} - ${systemReqs.error}`);
					errorCount++;
					continue;
				}

				const targetSystemReq = systemReqs.data?.find((sr) => sr.id === result.systemReq.id);
				if (!targetSystemReq) {
					console.error(`  ✗ システム要件が見つかりません: ${result.systemReq.id}`);
					errorCount++;
					continue;
				}

				const updatedBusinessRequirementIds = [
					...targetSystemReq.businessRequirementIds,
					result.businessReq.id,
				];

				const systemUpdateResult = await updateSystemRequirement(result.systemReq.id, {
					taskId: result.systemReq.taskId,
					srfId: result.systemReq.srfId,
					title: result.systemReq.title,
					summary: result.systemReq.summary,
					conceptIds: [],
					impacts: [],
					businessRequirementIds: updatedBusinessRequirementIds,
					acceptanceCriteria: [],
					systemDomainIds: [],
					sortOrder: 0,
				});

				if (systemUpdateResult.error) {
					console.error(`  ✗ システム要件の更新に失敗: ${result.systemReq.id} - ${systemUpdateResult.error}`);
					errorCount++;
					continue;
				}

				appliedCount++;
				console.log(`  ✓ 適用完了: ${result.businessReq.title} -> ${result.systemReq.title}`);
			} catch (e) {
				console.error(`  ✗ エラー: ${e instanceof Error ? e.message : String(e)}`);
				errorCount++;
			}
		}
	}

	console.log(`\n適用完了: ${appliedCount}件`);
	if (errorCount > 0) {
		console.log(`エラー: ${errorCount}件`);
	}
}

// ============================================================================
// エントリーポイント
// ============================================================================

async function listBusinessRequirementsByTaskId(taskId: string) {
	const { listBusinessRequirementsByTaskId: fn } = await import("@/lib/data/business-requirements");
	return fn(taskId);
}

async function listSystemRequirementsByTaskId(taskId: string) {
	const { listSystemRequirementsByTaskId: fn } = await import("@/lib/data/system-requirements");
	return fn(taskId);
}

async function listBusinessRequirements() {
	const { listBusinessRequirements: fn } = await import("@/lib/data/business-requirements");
	return fn();
}

async function main() {
	const args = parseArgs();

	try {
		const summary = await matchAllRequirements(args.targetTask);

		if (args.mode === "dry-run") {
			displayResult(summary, "dry-run");
		} else {
			displayResult(summary, "execute");
			console.log("--- データ更新開始 ---\n");
			await applyMatching(summary);
		}
	} catch (e) {
		console.error(`エラー: ${e instanceof Error ? e.message : String(e)}`);
		process.exit(1);
	}
}

main();
