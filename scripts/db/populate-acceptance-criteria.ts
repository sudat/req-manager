#!/usr/bin/env -S bun run
/**
 * 受入条件（AC）一括登録スクリプト
 *
 * 全システム要件のうち、ACが未登録の要件に対して、カテゴリ別のGWT形式受入条件を
 * 正本テーブル（acceptance_criteria）へ一括登録する。
 *
 * 使用方法:
 *   # Dry-run（デフォルト）
 *   bun scripts/db/populate-acceptance-criteria.ts --dry-run
 *
 *   # 特定カテゴリのみ
 *   bun scripts/db/populate-acceptance-criteria.ts --category=function --dry-run
 *
 *   # テスト実行（5件に制限）
 *   bun scripts/db/populate-acceptance-criteria.ts --limit=5 --execute
 *
 *   # 本番実行（全件一括登録）
 *   bun scripts/db/populate-acceptance-criteria.ts --execute
 */

import { supabase } from "@/lib/supabase/client";
import { listSystemRequirements } from "@/lib/data/system-requirements";
import { listAcceptanceCriteriaBySystemRequirementIds, createAcceptanceCriteria, type AcceptanceCriterionCreateInput } from "@/lib/data/acceptance-criteria";
import { generateAcceptanceCriteriaForRequirement } from "@/lib/utils/system-functions/generate-acceptance-criteria";
import type { SystemRequirementCategory } from "@/lib/domain";

// ============================================================================
// CLI引数パース
// ============================================================================

interface CliArgs {
	mode: "dry-run" | "execute";
	category?: SystemRequirementCategory;
	targetTask?: string;
	limit?: number;
}

function parseArgs(): CliArgs {
	const args = process.argv.slice(2);
	const result: CliArgs = { mode: "dry-run" };

	for (const arg of args) {
		if (arg === "--execute" || arg === "-e") {
			result.mode = "execute";
		} else if (arg === "--dry-run" || arg === "-d") {
			result.mode = "dry-run";
		} else if (arg.startsWith("--category=")) {
			const category = arg.split("=")[1];
			if (category === "function" || category === "data" || category === "exception" || category === "non_functional") {
				result.category = category;
			} else {
				console.error(`❌ 無効なカテゴリ: ${category}`);
				console.error("   有効な値: function, data, exception, non_functional");
				process.exit(1);
			}
		} else if (arg.startsWith("--task=")) {
			result.targetTask = arg.split("=")[1];
		} else if (arg.startsWith("--limit=")) {
			const limit = Number.parseInt(arg.split("=")[1], 10);
			if (Number.isNaN(limit) || limit < 1) {
				console.error(`❌ 無効なlimit値: ${arg.split("=")[1]}`);
				process.exit(1);
			}
			result.limit = limit;
		} else if (arg === "--help" || arg === "-h") {
			console.log(`
受入条件一括登録スクリプト

使用方法:
  bun scripts/db/populate-acceptance-criteria.ts [オプション]

オプション:
  --dry-run, -d       Dry-runモード（デフォルト）。実際には登録しない
  --execute, -e       実行モード。DBに登録する
  --category=<cat>    特定カテゴリのみ対象にする
                      (function|data|exception|non_functional)
  --task=<taskId>     特定タスクの要件のみ対象にする
  --limit=<n>         登録件数を制限する（テスト用）
  --help, -h          このヘルプを表示

例:
  # Dry-runで全件プレビュー
  bun scripts/db/populate-acceptance-criteria.ts --dry-run

  # functionカテゴリのみ5件テスト
  bun scripts/db/populate-acceptance-criteria.ts --category=function --limit=5 --execute

  # 本番実行（全件登録）
  bun scripts/db/populate-acceptance-criteria.ts --execute
			`);
			process.exit(0);
		} else {
			console.error(`❌ 不明な引数: ${arg}`);
			console.error("   --help を使用してヘルプを確認してください");
			process.exit(1);
		}
	}

	return result;
}

// ============================================================================
// 対象要件の収集
// ============================================================================

interface ProjectIdMap {
	[requirementId: string]: string;
}

async function fetchProjectIdMap(): Promise<ProjectIdMap> {
	const { data, error } = await supabase
		.from("system_requirements")
		.select("id, project_id");

	if (error) {
		console.error("❌ project_idの取得に失敗しました:", error.message);
		process.exit(1);
	}

	const map: ProjectIdMap = {};
	for (const row of data ?? []) {
		map[row.id] = row.project_id;
	}
	return map;
}

async function collectTargetRequirements(args: CliArgs, projectIdMap: ProjectIdMap) {
	const { data: allRequirements, error } = await listSystemRequirements();

	if (error) {
		console.error("❌ システム要件の取得に失敗しました:", error);
		process.exit(1);
	}

	if (!allRequirements) {
		console.log("✅ システム要件が存在しないため、処理をスキップします");
		process.exit(0);
	}

	// フィルタリング
	let filtered = allRequirements;

	if (args.category) {
		filtered = filtered.filter((req) => req.category === args.category);
	}

	if (args.targetTask) {
		filtered = filtered.filter((req) => req.taskId === args.targetTask);
	}

	if (args.limit) {
		filtered = filtered.slice(0, args.limit);
	}

	// 既存ACがある要件を除外
	const requirementIds = filtered.map((req) => req.id);
	const { data: existingACs, error: acError } = await listAcceptanceCriteriaBySystemRequirementIds(requirementIds);

	if (acError) {
		console.error("❌ 既存ACの確認に失敗しました:", acError);
		process.exit(1);
	}

	const hasAC = new Set(existingACs?.map((ac) => ac.systemRequirementId) ?? []);
	const targetRequirements = filtered.filter((req) => !hasAC.has(req.id));

	return {
		total: allRequirements.length,
		filtered: filtered.length,
		hasExistingAC: hasAC.size,
		target: targetRequirements,
		projectIdMap,
	};
}

// ============================================================================
// AC生成
// ============================================================================

function generateACInputs(
	requirements: typeof collectTargetRequirements extends Promise<infer T> ? Awaited<T>["target"] : never,
	projectIdMap: ProjectIdMap
): AcceptanceCriterionCreateInput[] {
	const inputs: AcceptanceCriterionCreateInput[] = [];

	for (const req of requirements) {
		const projectId = projectIdMap[req.id];
		if (!projectId) {
			console.warn(`⚠️  警告: ${req.id} のproject_idが見つかりません。スキップします`);
			continue;
		}

		const acJson = generateAcceptanceCriteriaForRequirement({
			id: req.id,
			title: req.title,
			summary: req.summary,
			category: req.category,
		});

		inputs.push({
			id: acJson.id,
			systemRequirementId: req.id,
			projectId,
			description: acJson.description,
			givenText: acJson.givenText,
			whenText: acJson.whenText,
			thenText: acJson.thenText,
			verificationMethod: acJson.verification_method,
			sortOrder: 0,
		});
	}

	return inputs;
}

// ============================================================================
// 一括INSERT
// ============================================================================

async function insertAllAC(inputs: AcceptanceCriterionCreateInput[]): Promise<{ success: number; error: number }> {
	if (inputs.length === 0) {
		return { success: 0, error: 0 };
	}

	// 一括INSERT
	const { data, error } = await createAcceptanceCriteria(inputs);

	if (error) {
		console.error("❌ ACの一括登録に失敗しました:", error);
		return { success: 0, error: inputs.length };
	}

	return { success: data?.length ?? 0, error: 0 };
}

// ============================================================================
// 結果表示
// ============================================================================

function displayACPreview(inputs: AcceptanceCriterionCreateInput[], limit = 10) {
	console.log("\n📋 生成されるACのプレビュー:");
	console.log("=".repeat(80));

	const preview = inputs.slice(0, limit);

	for (const input of preview) {
		console.log(`\nID: ${input.id}`);
		console.log(`  要件ID: ${input.systemRequirementId}`);
		console.log(`  説明: ${input.description}`);
		console.log(`  Given: ${input.givenText ?? "-"}`);
		console.log(`  When: ${input.whenText ?? "-"}`);
		console.log(`  Then: ${input.thenText ?? "-"}`);
		console.log(`  検証方法: ${input.verificationMethod ?? "-"}`);
	}

	if (inputs.length > limit) {
		console.log(`\n... 他 ${inputs.length - limit} 件`);
	}

	console.log("=".repeat(80));
}

function displayResults(
	stats: { total: number; filtered: number; hasExistingAC: number; target: typeof collectTargetRequirements extends Promise<infer T> ? Awaited<T>["target"] : never },
	insertResult: { success: number; error: number },
	mode: "dry-run" | "execute"
) {
	console.log("\n" + "=".repeat(80));
	console.log("📊 実行結果サマリー");
	console.log("=".repeat(80));
	console.log(`モード:           ${mode}`);
	console.log(`全システム要件数: ${stats.total}件`);
	console.log(`フィルタ後:       ${stats.filtered}件`);
	console.log(`既存ACあり:       ${stats.hasExistingAC}件（スキップ）`);
	console.log(`対象要件数:       ${stats.target.length}件`);

	if (mode === "execute") {
		console.log(`登録成功:         ${insertResult.success}件`);
		console.log(`登録失敗:         ${insertResult.error}件`);
	} else {
		console.log(`（Dry-run: 実際には登録していません）`);
	}

	console.log("=".repeat(80));
}

// ============================================================================
// エントリーポイント
// ============================================================================

async function main() {
	const args = parseArgs();
	console.log("🚀 受入条件一括登録スクリプト");
	console.log(`   モード: ${args.mode}`);

	if (args.category) {
		console.log(`   カテゴリ: ${args.category}`);
	}
	if (args.targetTask) {
		console.log(`   ターゲットタスク: ${args.targetTask}`);
	}
	if (args.limit) {
		console.log(`   件数制限: ${args.limit}件`);
	}

	// projectIdマッピングを取得
	console.log("\n📡 project_idマッピングを取得中...");
	const projectIdMap = await fetchProjectIdMap();
	console.log(`   ✓ ${Object.keys(projectIdMap).length}件の要件のproject_idを取得`);

	// 対象要件を収集
	console.log("\n🔍 対象要件を収集中...");
	const stats = await collectTargetRequirements(args, projectIdMap);
	console.log(`   全要件: ${stats.total}件`);
	console.log(`   フィルタ後: ${stats.filtered}件`);
	console.log(`   既存ACあり（スキップ）: ${stats.hasExistingAC}件`);
	console.log(`   対象要件: ${stats.target.length}件`);

	if (stats.target.length === 0) {
		console.log("\n✅ 登録対象の要件がありません");
		process.exit(0);
	}

	// AC生成
	console.log("\n🔧 受入条件を生成中...");
	const inputs = generateACInputs(stats.target, projectIdMap);
	console.log(`   ✓ ${inputs.length}件のACを生成`);

	// プレビュー表示
	displayACPreview(inputs);

	if (args.mode === "dry-run") {
		displayResults(stats, { success: inputs.length, error: 0 }, "dry-run");
		console.log("\n✅ Dry-run完了。実際に登録するには --execute を指定してください");
		process.exit(0);
	}

	// 確認プロンプト
	console.log("\n⚠️  上記の内容でacceptance_criteriaテーブルに登録します");
	console.log("   続行しますか？ (y/N)");

	// 標準入力から確認
	const readline = require("node:readline");
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const answer = await new Promise<string>((resolve) => {
		rl.question(" ", (input: string) => {
			rl.close();
			resolve(input.trim().toLowerCase());
		});
	});

	if (answer !== "y" && answer !== "yes") {
		console.log("\n❌ キャンセルしました");
		process.exit(0);
	}

	// 一括INSERT実行
	console.log("\n💾 データベースに登録中...");
	const insertResult = await insertAllAC(inputs);

	displayResults(stats, insertResult, "execute");

	if (insertResult.error > 0) {
		console.log("\n❌ 一部の登録に失敗しました");
		process.exit(1);
	} else {
		console.log("\n✅ 全ての登録が完了しました");
		process.exit(0);
	}
}

// エラーハンドリング
main().catch((err) => {
	console.error("❌ 予期しないエラーが発生しました:", err);
	process.exit(1);
});
