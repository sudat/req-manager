#!/usr/bin/env -S bun run
/**
 * 受入条件（GWT形式）の表示形式を統一するスクリプト
 *
 * YAML形式のテンプレートをシンプルなテキスト形式に変換する
 *
 * 問題:
 * - SR-TASK-003-001: 正本テーブルにデータがあり、シンプルなテキスト形式で表示される
 * - SR-TASK-003-002/009: 正本テーブルにデータがないため、acceptance_criteria_json のデータが表示される
 * - acceptance_criteria_json にYAML形式のプレースホルダーが含まれている
 *
 * 解決:
 * - acceptance_criteria_json の givenText, whenText, thenText をシンプルなテキスト形式に変換
 * - カテゴリに応じた適切なテキストを生成
 *
 * 使用方法:
 *   --dry-run      確認モード（デフォルト）
 *   --execute      実行モード（データを更新）
 *   --limit=N      処理件数を制限（テスト用）
 *   --help, -h     ヘルプ表示
 */

import { listSystemRequirements, updateSystemRequirement, type SystemRequirement } from "@/lib/data/system-requirements";
import { templateByCategory } from "@/lib/utils/system-functions/generate-acceptance-criteria";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";

// ============================================================================
// 型定義
// ============================================================================

interface CliArgs {
	mode: "dry-run" | "execute";
	limit: number | null;
}

interface UpdateCandidate {
	requirement: SystemRequirement;
	oldAc: AcceptanceCriterionJson;
	newAc: AcceptanceCriterionJson;
	needsUpdate: boolean;
	skipReason: string | null;
}

interface UpdateSummary {
	totalCandidates: number;
	skippedCount: number;
	willUpdateCount: number;
	updates: UpdateCandidate[];
}

// ============================================================================
// CLI引数パーサー
// ============================================================================

function parseArgs(): CliArgs {
	const args = process.argv.slice(2);
	let mode: "dry-run" | "execute" = "dry-run";
	let limit: number | null = null;

	for (const arg of args) {
		if (arg === "--execute") {
			mode = "execute";
		} else if (arg === "--dry-run") {
			mode = "dry-run";
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
  bun scripts/db/fix-acceptance-criteria-format.ts [options]

オプション:
  --dry-run         確認モード（デフォルト）
  --execute         実行モード（データを更新）
  --limit=N         処理件数を制限（テスト用）
  --help, -h        ヘルプ表示

実行例:
  # ドライランで確認
  bun scripts/db/fix-acceptance-criteria-format.ts --dry-run

  # すべて実行
  bun scripts/db/fix-acceptance-criteria-format.ts --execute

  # 最初の5件のみテスト
  bun scripts/db/fix-acceptance-criteria-format.ts --execute --limit=5
`);
			process.exit(0);
		}
	}

	return { mode, limit };
}

// ============================================================================
// YAML形式検出
// ============================================================================

/**
 * テキストがYAML形式のプレースホルダーを含んでいるか判定
 */
function isYamlFormat(text: string): boolean {
	// YAML形式の特徴を検出
	return (
		text.includes("description:") ||
		text.includes("preconditions:") ||
		text.includes("expected_outcomes:") ||
		text.includes("trigger:") ||
		text.includes("  - \"")
	);
}

/**
 * ACがYAML形式を含んでいるか判定
 */
function hasYamlFormat(ac: AcceptanceCriterionJson): boolean {
	const fields = [ac.givenText, ac.whenText, ac.thenText];
	return fields.some((field) => field && isYamlFormat(field));
}

// ============================================================================
// 更新候補の収集
// ============================================================================

/**
 * YAML形式のACを持つシステム要件を収集
 */
async function collectUpdateCandidates(limit: number | null): Promise<UpdateSummary> {
	// すべてのシステム要件を取得
	const result = await listSystemRequirements();
	if (result.error) {
		throw new Error(`システム要件の取得に失敗: ${result.error}`);
	}

	const allReqs = result.data ?? [];

	// ACを持つ要件のみを対象
	const reqsWithAc = allReqs.filter((req) => {
		const acArray = req.acceptanceCriteriaJson ?? [];
		return acArray.length > 0;
	});

	// limitが指定されている場合は制限
	const targetReqs = limit && limit > 0 ? reqsWithAc.slice(0, limit) : reqsWithAc;

	// 更新候補を作成
	const updates: UpdateCandidate[] = [];
	let skippedCount = 0;

	for (const req of targetReqs) {
		const acArray = req.acceptanceCriteriaJson ?? [];

		if (acArray.length === 0) {
			skippedCount++;
			updates.push({
				requirement: req,
				oldAc: acArray[0],
				newAc: acArray[0],
				needsUpdate: false,
				skipReason: "ACが未登録",
			});
			continue;
		}

		// 最初のACをチェック（通常は1件のみ）
		const oldAc = acArray[0];

		if (!hasYamlFormat(oldAc)) {
			// すでにシンプルなテキスト形式の場合はスキップ
			skippedCount++;
			updates.push({
				requirement: req,
				oldAc,
				newAc: oldAc,
				needsUpdate: false,
				skipReason: "すでにシンプルなテキスト形式",
			});
			continue;
		}

		// カテゴリに応じた新しいテキストを生成
		const template = templateByCategory(req.category);

		// 新しいACを作成（descriptionとverification_methodは維持）
		const newAc: AcceptanceCriterionJson = {
			id: oldAc.id,
			description: oldAc.description,
			verification_method: oldAc.verification_method,
			givenText: template.givenText,
			whenText: template.whenText,
			thenText: template.thenText,
		};

		updates.push({
			requirement: req,
			oldAc,
			newAc,
			needsUpdate: true,
			skipReason: null,
		});
	}

	return {
		totalCandidates: updates.length,
		skippedCount,
		willUpdateCount: updates.filter((u) => u.needsUpdate).length,
		updates,
	};
}

// ============================================================================
// 結果表示
// ============================================================================

/**
 * 更新サマリーを表示
 */
function displaySummary(summary: UpdateSummary, mode: "dry-run" | "execute"): void {
	console.log("\n=== 受入条件（GWT形式）の表示形式統一 ===\n");
	console.log(`モード: ${mode.toUpperCase()}`);
	console.log(`対象システム要件: ${summary.totalCandidates}件`);
	console.log(`スキップ: ${summary.skippedCount}件`);
	console.log(`更新対象: ${summary.willUpdateCount}件\n`);

	// スキップされた件を表示
	const skipped = summary.updates.filter((u) => u.skipReason);
	if (skipped.length > 0) {
		console.log("--- スキップされた要件 ---");
		for (const item of skipped.slice(0, 10)) {
			console.log(`  ⊘ ${item.requirement.id}: ${item.requirement.title}`);
			console.log(`    理由: ${item.skipReason}`);
		}
		if (skipped.length > 10) {
			console.log(`  ... 他 ${skipped.length - 10}件`);
		}
		console.log("");
	}

	// 更新対象を表示
	const willUpdate = summary.updates.filter((u) => u.needsUpdate);
	if (willUpdate.length > 0) {
		console.log("--- 更新対象の要件 ---");
		for (const item of willUpdate) {
			const modePrefix = mode === "dry-run" ? "[DRY-RUN] " : "[UPDATE] ";
			console.log(`\n  ${modePrefix}${item.requirement.id}: ${item.requirement.title}`);
			console.log(`  カテゴリ: ${item.requirement.category}`);
			console.log(`  変更前:`);
			if (item.oldAc.givenText) {
				const preview = item.oldAc.givenText.split("\n").slice(0, 3).join("\n");
				console.log(`    Given:\n      ${preview}${item.oldAc.givenText.split("\n").length > 3 ? "..." : ""}`);
			}
			console.log(`  変更後:`);
			console.log(`    Given: ${item.newAc.givenText}`);
			console.log(`    When:  ${item.newAc.whenText}`);
			console.log(`    Then:  ${item.newAc.thenText}`);
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
	const willUpdate = summary.updates.filter((u) => u.needsUpdate);

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
					acceptanceCriteriaJson: [item.newAc],
					acceptanceCriteria: item.requirement.acceptanceCriteria ?? [],
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
		const summary = await collectUpdateCandidates(args.limit);

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
