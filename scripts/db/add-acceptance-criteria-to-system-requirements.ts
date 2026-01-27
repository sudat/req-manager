#!/usr/bin/env -S bun run
/**
 * システム要件へ受入条件（GWT形式）を一括追加するスクリプト
 *
 * 受入条件が未登録のシステム要件に対して、カテゴリに応じたGWT形式のテンプレートを自動生成して追加する
 *
 * 使用方法:
 *   --dry-run           確認モード（デフォルト）
 *   --execute           実行モード（データを更新）
 *   --category=function  特定カテゴリのみ対象
 *   --task=SRF-XXX      特定SRFのみ対象
 *   --limit=N           処理件数を制限（テスト用）
 *   --help, -h          ヘルプ表示
 */

import {
	listSystemRequirements,
	updateSystemRequirement,
	type SystemRequirement,
} from "@/lib/data/system-requirements";
import {
	generateAcceptanceCriteriaForRequirements,
	hasMeaningfulContent,
} from "@/lib/utils/system-functions/generate-acceptance-criteria";
import type { SystemRequirementCategory } from "@/lib/domain";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";

// ============================================================================
// 型定義
// ============================================================================

interface CliArgs {
	mode: "dry-run" | "execute";
	category: SystemRequirementCategory | null;
	targetSrfId: string | null;
	limit: number | null;
}

interface UpdateCandidate {
	requirement: SystemRequirement;
	generatedAc: AcceptanceCriterionJson;
	skipReason: string | null;
}

interface UpdateSummary {
	totalCandidates: number;
	skippedCount: number;
	willUpdateCount: number;
	updates: UpdateCandidate[];
	candidatesByCategory: Record<string, number>;
}

// ============================================================================
// CLI引数パーサー
// ============================================================================

function parseArgs(): CliArgs {
	const args = process.argv.slice(2);
	let mode: "dry-run" | "execute" = "dry-run";
	let category: SystemRequirementCategory | null = null;
	let targetSrfId: string | null = null;
	let limit: number | null = null;

	const validCategories: SystemRequirementCategory[] = ["function", "data", "exception", "non_functional"];

	for (const arg of args) {
		if (arg === "--execute") {
			mode = "execute";
		} else if (arg === "--dry-run") {
			mode = "dry-run";
		} else if (arg.startsWith("--category=")) {
			const catValue = arg.split("=")[1];
			if (validCategories.includes(catValue as SystemRequirementCategory)) {
				category = catValue as SystemRequirementCategory;
			} else {
				console.error(`エラー: 無効なカテゴリ "${catValue}"`);
				console.error(`有効なカテゴリ: ${validCategories.join(", ")}`);
				process.exit(1);
			}
		} else if (arg.startsWith("--task=")) {
			targetSrfId = arg.split("=")[1];
		} else if (arg.startsWith("--limit=")) {
			const limitValue = Number.parseInt(arg.split("=")[1], 10);
			if (Number.isNaN(limitValue) || limitValue <= 0) {
				console.error(`エラー: 無効なlimit値 "${arg.split("=")[1]}"`);
				process.exit(1);
			}
			limit = limitValue;
		} else if (arg === "--help" || arg === "-h") {
			console.log(`
使用方法:
  bun scripts/db/add-acceptance-criteria-to-system-requirements.ts [options]

オプション:
  --dry-run              確認モード（デフォルト）
  --execute              実行モード（データを更新）
  --category=CATEGORY    特定カテゴリのみ対象（function|data|exception|non_functional）
  --task=SRF-XXX         特定SRFのみ対象
  --limit=N              処理件数を制限（テスト用）
  --help, -h             ヘルプ表示

カテゴリ:
  function         機能要件
  data             データ要件
  exception        例外要件
  non_functional   非機能要件

実行例:
  # すべてのシステム要件をドライラン
  bun scripts/db/add-acceptance-criteria-to-system-requirements.ts --dry-run

  # 機能要件のみ実行
  bun scripts/db/add-acceptance-criteria-to-system-requirements.ts --execute --category=function

  # 特定SRFのみ対象（テスト用）
  bun scripts/db/add-acceptance-criteria-to-system-requirements.ts --execute --task=SRF-001 --limit=5

  # 非機能要件をドライラン
  bun scripts/db/add-acceptance-criteria-to-system-requirements.ts --dry-run --category=non_functional
`);
			process.exit(0);
		}
	}

	return { mode, category, targetSrfId, limit };
}

// ============================================================================
// 更新候補の収集
// ============================================================================

/**
 * 受入条件が未登録のシステム要件を収集
 */
async function collectUpdateCandidates(
	category: SystemRequirementCategory | null,
	targetSrfId: string | null,
	limit: number | null
): Promise<UpdateSummary> {
	// すべてのシステム要件を取得
	const result = await listSystemRequirements();
	if (result.error) {
		throw new Error(`システム要件の取得に失敗: ${result.error}`);
	}

	const allReqs = result.data ?? [];

	// フィルタリング条件を適用
	let filteredReqs = allReqs;

	if (category) {
		filteredReqs = filteredReqs.filter((req) => req.category === category);
	}

	if (targetSrfId) {
		filteredReqs = filteredReqs.filter((req) => req.srfId === targetSrfId);
	}

	// limitが指定されている場合は制限
	if (limit && limit > 0) {
		filteredReqs = filteredReqs.slice(0, limit);
	}

	// 受入条件を生成
	const generatedMap = generateAcceptanceCriteriaForRequirements(
		filteredReqs.map((req) => ({
			id: req.id,
			title: req.title,
			summary: req.summary,
			category: req.category,
		}))
	);

	// 更新候補を作成
	const updates: UpdateCandidate[] = [];
	let skippedCount = 0;

	for (const req of filteredReqs) {
		const generatedAc = generatedMap.get(req.id);
		if (!generatedAc) continue;

		// 既存のACをチェック
		const existingAc = req.acceptanceCriteriaJson ?? [];
		const hasMeaningful = existingAc.some(hasMeaningfulContent);

		if (hasMeaningful) {
			// 既に意味のあるACがある場合はスキップ
			updates.push({
				requirement: req,
				generatedAc,
				skipReason: "既に意味のある受入条件が登録されています",
			});
			skippedCount++;
		} else {
			// ACがない、または空のみの場合は更新対象
			updates.push({
				requirement: req,
				generatedAc,
				skipReason: null,
			});
		}
	}

	// カテゴリ別集計
	const candidatesByCategory: Record<string, number> = {};
	for (const update of updates) {
		if (update.skipReason) continue;
		const cat = update.requirement.category;
		candidatesByCategory[cat] = (candidatesByCategory[cat] ?? 0) + 1;
	}

	return {
		totalCandidates: updates.length,
		skippedCount,
		willUpdateCount: updates.filter((u) => !u.skipReason).length,
		updates,
		candidatesByCategory,
	};
}

// ============================================================================
// 結果表示
// ============================================================================

/**
 * 更新サマリーを表示
 */
function displaySummary(summary: UpdateSummary, mode: "dry-run" | "execute"): void {
	console.log("\n=== システム要件への受入条件（GWT形式）一括追加 ===\n");
	console.log(`モード: ${mode.toUpperCase()}`);
	console.log(`対象システム要件: ${summary.totalCandidates}件`);
	console.log(`スキップ: ${summary.skippedCount}件`);
	console.log(`追加対象: ${summary.willUpdateCount}件\n`);

	if (Object.keys(summary.candidatesByCategory).length > 0) {
		console.log("カテゴリ別内訳:");
		for (const [cat, count] of Object.entries(summary.candidatesByCategory)) {
			console.log(`  - ${cat}: ${count}件`);
		}
		console.log("");
	}

	// スキップされた件を表示
	const skipped = summary.updates.filter((u) => u.skipReason);
	if (skipped.length > 0) {
		console.log("--- スキップされた要件 ---");
		for (const item of skipped) {
			console.log(`  ⊘ ${item.requirement.id}: ${item.requirement.title}`);
			console.log(`    理由: ${item.skipReason}`);
		}
		console.log("");
	}

	// 追加対象を表示
	const willUpdate = summary.updates.filter((u) => !u.skipReason);
	if (willUpdate.length > 0) {
		console.log("--- 追加対象の要件 ---");
		for (const item of willUpdate) {
			const modePrefix = mode === "dry-run" ? "[DRY-RUN] " : "[UPDATE] ";
			console.log(`\n  ${modePrefix}${item.requirement.id}: ${item.requirement.title}`);
			console.log(`  カテゴリ: ${item.requirement.category}`);
			console.log(`  生成される受入条件:`);
			console.log(`    ID: ${item.generatedAc.id}`);
			console.log(`    説明: ${item.generatedAc.description}`);
			console.log(`    検証方法: ${item.generatedAc.verification_method}`);
			if (item.generatedAc.givenText) {
				console.log(`    Given:\n${item.generatedAc.givenText.split("\n").map((l) => `      ${l}`).join("\n")}`);
			}
			if (item.generatedAc.whenText) {
				console.log(`    When:\n${item.generatedAc.whenText.split("\n").map((l) => `      ${l}`).join("\n")}`);
			}
			if (item.generatedAc.thenText) {
				console.log(`    Then:\n${item.generatedAc.thenText.split("\n").map((l) => `      ${l}`).join("\n")}`);
			}
		}
		console.log("");
	}
}

// ============================================================================
// 更新処理
// ============================================================================

/**
 * 更新を適用
 */
async function applyUpdates(summary: UpdateSummary): Promise<void> {
	const willUpdate = summary.updates.filter((u) => !u.skipReason);

	console.log("--- データ更新開始 ---\n");

	let successCount = 0;
	let errorCount = 0;

	for (const item of willUpdate) {
		try {
			const result = await updateSystemRequirement(
				item.requirement.id,
				{
					taskId: item.requirement.taskId,
					srfId: item.requirement.srfId,
					title: item.requirement.title,
					summary: item.requirement.summary,
					conceptIds: item.requirement.conceptIds,
					impacts: item.requirement.impacts,
					category: item.requirement.category,
					businessRequirementIds: item.requirement.businessRequirementIds,
					relatedDeliverableIds: item.requirement.relatedDeliverableIds,
					acceptanceCriteriaJson: [item.generatedAc],
					acceptanceCriteria: [],
					systemDomainIds: item.requirement.systemDomainIds,
					sortOrder: item.requirement.sortOrder,
				},
			 undefined // projectIdは省略（全プロジェクト対象）
			);

			if (result.error) {
				console.error(`  ✗ 更新失敗: ${item.requirement.id} - ${result.error}`);
				errorCount++;
			} else {
				console.log(`  ✓ 更新成功: ${item.requirement.id} - ${item.requirement.title}`);
				successCount++;
			}
		} catch (e) {
			console.error(`  ✗ エラー: ${item.requirement.id} - ${e instanceof Error ? e.message : String(e)}`);
			errorCount++;
		}
	}

	console.log(`\n更新完了: ${successCount}件成功`);
	if (errorCount > 0) {
		console.log(`エラー: ${errorCount}件`);
	}
}

// ============================================================================
// エントリーポイント
// ============================================================================

async function main() {
	const args = parseArgs();

	try {
		const summary = await collectUpdateCandidates(args.category, args.targetSrfId, args.limit);

		displaySummary(summary, args.mode);

		if (args.mode === "execute" && summary.willUpdateCount > 0) {
			// 実行モードの場合は確認を求める
			console.log("⚠️  データベースを更新します。よろしいですか？ (y/N)");
			process.stdin.resume();
			process.stdin.setRawMode?.(true);

			const answer = await new Promise<string>((resolve) => {
				process.stdin.once("data", (data) => {
					resolve(data.toString().trim().toLowerCase());
				});
			});

			process.stdin.setRawMode?.(false);
			process.stdin.pause();

			if (answer === "y" || answer === "yes") {
				await applyUpdates(summary);
			} else {
				console.log("キャンセルしました");
			}
		} else if (args.mode === "execute") {
			console.log("更新対象がありません");
		}
	} catch (e) {
		console.error(`エラー: ${e instanceof Error ? e.message : String(e)}`);
		process.exit(1);
	}
}

main();
