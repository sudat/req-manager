#!/usr/bin/env -S bun run
/**
 * 受入条件（AC）GWT文章充実化スクリプト
 *
 * テンプレート的なACを、システム要件の内容を踏まえた具体的なGWT形式の文章に更新する。
 *
 * 使用方法:
 *   # Dry-run（デフォルト）
 *   bun scripts/db/enrich-acceptance-criteria.ts --dry-run
 *
 *   # 特定の要件IDのみ
 *   bun scripts/db/enrich-acceptance-criteria.ts --id=SR-TASK-003-002 --dry-run
 *
 *   # テスト実行（5件）
 *   bun scripts/db/enrich-acceptance-criteria.ts --limit=5 --execute
 *
 *   # 本番実行（全件更新）
 *   bun scripts/db/enrich-acceptance-criteria.ts --execute
 */

import { supabase } from "@/lib/supabase/client";
import { listSystemRequirements } from "@/lib/data/system-requirements";
import { updateAcceptanceCriterion, listAcceptanceCriteriaBySystemRequirementIds } from "@/lib/data/acceptance-criteria";
import type { SystemRequirementCategory } from "@/lib/domain";

// ============================================================================
// CLI引数パース
// ============================================================================

interface CliArgs {
	mode: "dry-run" | "execute";
	targetId?: string;
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
		} else if (arg.startsWith("--id=")) {
			result.targetId = arg.split("=")[1];
		} else if (arg.startsWith("--limit=")) {
			const limit = Number.parseInt(arg.split("=")[1], 10);
			if (Number.isNaN(limit) || limit < 1) {
				console.error(`❌ 無効なlimit値: ${arg.split("=")[1]}`);
				process.exit(1);
			}
			result.limit = limit;
		} else if (arg === "--help" || arg === "-h") {
			console.log(`
受入条件GWT文章充実化スクリプト

使用方法:
  bun scripts/db/enrich-acceptance-criteria.ts [オプション]

オプション:
  --dry-run, -d       Dry-runモード（デフォルト）。実際には更新しない
  --execute, -e       実行モード。DBを更新する
  --id=<acId>         特定のAC IDのみ対象にする
  --limit=<n>         更新件数を制限する（テスト用）
  --help, -h          このヘルプを表示

例:
  # Dry-runで全件プレビュー
  bun scripts/db/enrich-acceptance-criteria.ts --dry-run

  # 特定のACのみ更新
  bun scripts/db/enrich-acceptance-criteria.ts --id=SR-TASK-003-002-001 --execute

  # 本番実行（全件更新）
  bun scripts/db/enrich-acceptance-criteria.ts --execute
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
// GWT生成ロジック（システム要件に応じた具体的なGWT）
// ============================================================================

interface GWTPattern {
	givenText: string;
	whenText: string;
	thenText: string;
}

/**
 * システム要件に応じた具体的なGWTを生成
 */
function generateDetailedGWT(
	requirement: { id: string; title: string; summary: string; category: SystemRequirementCategory }
): GWTPattern {
	const { id, title, summary, category } = requirement;

	// テンプレート的なACは、より具体的な内容に書き換える
	// 各要件IDに応じた具体的なGWTパターンを定義

	const patterns: Record<string, GWTPattern> = {
		"SR-GL-001": {
			givenText: "テストデータ生成画面が表示され、生成条件（件数、日付範囲）が入力可能である",
			whenText: "ランダムなテスト伝票生成を実行する",
			thenText: "指定された件数分のランダムな仕訳伝票が生成され、会計システムへ登録される",
		},
		"SR-TASK-001-002": {
			givenText: "与信枠変更依頼が登録され、承認権限を持つユーザーでログインしている",
			whenText: "与信枠変更承認プロセスを実行し、承認または却下の判定を行う",
			thenText: "承認結果が依頼者へ通知され、承認履歴が記録されて監査対応に必要な資料として管理される",
		},
		"SR-TASK-002-001": {
			givenText: "売上伝票が会計システムに登録され、バッチ処理の実行スケジュールが設定されている",
			whenText: "売掛金自動計上バッチ処理が定期的に実行される",
			thenText: "売上伝票から売掛金データが自動計上され、債権台帳へ反映される",
		},
		"SR-TASK-003-002": {
			givenText: "請求書発行処理が完了し、送信対象の顧客メールアドレスが登録されている",
			whenText: "電子請求書送信処理を実行する",
			thenText: "顧客へ請求書PDFが添付されたメールが送信され、送信履歴が記録される。送信失敗時にはエラーログが記録される",
		},
		"SR-TASK-003-003": {
			givenText: "請求明細データが登録され、各明細に税率区分が設定されている",
			whenText: "税率別内訳集計処理を実行する",
			thenText: "税率別の対価と税額が集計され、適格請求書（インボイス）の要件に対応した税率別内訳データが作成される",
		},
		"SR-TASK-003-004": {
			givenText: "請求書PDFが生成され、顧客ポータルとの連携設定が完了している",
			whenText: "顧客ポータルへ電子請求書を自動送信する",
			thenText: "請求書が顧客ポータルへ送信され、送信完了ログが記録される。送信失敗時にはエラーログが記録され、再送処理が支援される",
		},
		"SR-TASK-003-005": {
			givenText: "商品マスタ登録画面が表示され、税率区分を選択できる状態である",
			whenText: "商品の税率区分を登録または変更する",
			thenText: "適格請求書（インボイス）の要件に対応した税率が登録され、変更履歴が記録される",
		},
		"SR-TASK-003-006": {
			givenText: "請求書発行処理が完了し、通知対象の関係者が設定されている",
			whenText: "請求書発行完了通知を送信する",
			thenText: "関係者へ請求書発行完了の通知が送信され、通知履歴が記録される",
		},
		"SR-TASK-003-007": {
			givenText: "電子請求書送信処理が失敗し、エラー情報が記録されている",
			whenText: "送信失敗通知を関係者へ送信する",
			thenText: "エラー内容を含む通知が送信され、再送を促すアクションが通知に含まれる。通知履歴が記録され、トラブルシューティングに活用できる",
		},
		"SR-TASK-003-008": {
			givenText: "顧客ポータル連携設定画面が表示され、認証情報の入力が可能である",
			whenText: "顧客ポータルとの連携に必要な認証情報を登録・更新する",
			thenText: "認証情報が安全に保存され、定期的な更新に対応できる。認証エラー発生時にはアラートが発報される",
		},
		"SR-TASK-003-009": {
			givenText: "請求書発行スケジュール登録画面が表示され、スケジュール設定が可能である",
			whenText: "請求書発行のスケジュールを登録・管理し、定期実行設定を行う",
			thenText: "スケジュールに基づいて請求書発行が実行され、実行履歴が記録される",
		},
		"SR-TASK-004-001": {
			givenText: "銀行口座からダウンロードした入金データファイルが用意されている",
			whenText: "入金データファイルを取り込み、解析処理を実行する",
			thenText: "入金明細データが抽出され、データベースへ登録される。自動取込と手動入力の使い分けができ、データの整合性が担保される",
		},
		"SR-TASK-004-003": {
			givenText: "銀行マスタ管理画面が表示され、銀行情報の入力が可能である",
			whenText: "銀行コード、支店コード、口座情報等の銀行マスタを登録・更新する",
			thenText: "銀行マスタが登録され、入金データ取り込み時の銀行情報照合に利用できる。マスタデータの一覧表示や検索が可能である",
		},
		"SR-TASK-005-002": {
			givenText: "債権管理データが登録され、延滞期間が計算可能である",
			whenText: "延滞債権を自動検知し、延滞アラート通知を送信する",
			thenText: "延滞期間に応じて段階的な通知が関係者へ送信され、回収活動の開始が促される。通知履歴が記録される",
		},
		"SR-TASK-005-003": {
			givenText: "債権管理データが登録され、支払期日が設定されている",
			whenText: "支払期日が近づいた債権を検知し、期日到来通知を送信する",
			thenText: "期日までの残日数に応じて段階的な通知が関係者へ送信され、回収活動の開始が促される。通知履歴が記録される",
		},
		"SR-TASK-005-004": {
			givenText: "督促状発行スケジュール登録画面が表示され、スケジュール設定が可能である",
			whenText: "督促状発行のスケジュールを登録・管理し、定期実行設定を行う",
			thenText: "延滞期間に応じた督促状テンプレートが選択され、スケジュールに基づいて督促状が発行される。実行履歴が記録される",
		},
		"SR-TASK-006-001": {
			givenText: "債権管理データが登録され、延滞期間が計算可能である",
			whenText: "延滞債権を自動検知し、延滞債権アラート通知を送信する",
			thenText: "延滞期間に応じて段階的な通知が関係者へ送信され、回収活動の開始が促される。通知履歴が記録され、次回アクションの検討材料として活用される",
		},
		"SR-TASK-007-001": {
			givenText: "仕入先から請求書が届き、受領処理を実行できる状態である",
			whenText: "仕入請求書を受領し、統一的なプロセスで受領管理を行う",
			thenText: "請求書の受領方法（郵便、電子、メール添付など）に関わらず、受領した請求書の内容が確認され、次工程へ円滑に引き継がれる",
		},
		"SR-TASK-008-001": {
			givenText: "仕入伝票が登録され、買掛金計上画面が表示されている",
			whenText: "仕入伝票から抽出されたデータに基づき、買掛金を計上する",
			thenText: "仕入伝票の一覧表示、計上対象の選択、計上実行、計上結果の確認が行われる。計上漏れや重複を防ぐチェック機能が動作し、エラーの早期発見と修正が可能である",
		},
		"SR-TASK-008-002": {
			givenText: "債務台帳参照画面が表示され、仕入先が選択可能である",
			whenText: "仕入先別の買掛残高を参照する",
			thenText: "仕入先別、期間別の買掛残高一覧が表示され、残高の推移がグラフで可視化される。買掛明細のドリルダウン検索が可能である",
		},
		"SR-TASK-008-003": {
			givenText: "買掛金データが登録され、支払期日が設定されている",
			whenText: "買掛金の年齢分析を行い、分析表を出力する",
			thenText: "支払期日経過日数に基づき、買掛金が分類され、年齢分析表がCSVまたはPDF形式で出力される",
		},
		"SR-TASK-009-001": {
			givenText: "支払依頼画面が表示され、支払対象の仕入先請求書が選択可能である",
			whenText: "支払対象となる仕入先請求書を抽出し、支払依頼データを作成する",
			thenText: "支払先、支払金額、支払期日、支払方法等の情報を含む支払依頼が作成され、承認プロセスへ依頼が提出される。支払依頼のテンプレート機能が利用できる",
		},
		"SR-TASK-010-001": {
			givenText: "支払承認画面が表示され、承認権限を持つユーザーでログインしている",
			whenText: "支払依頼の一覧を表示し、承認・却下の判定を行う",
			thenText: "承認権限に基づいたワークフローが実現され、承認結果が依頼者へ通知される。承認済みの支払依頼が支払実行プロセスへ引き継がれ、承認履歴が記録される",
		},
		"SR-TASK-011-001": {
			givenText: "承認済みの支払データが作成され、銀行接口との連携が設定されている",
			whenText: "銀行接口を通じて支払データを送信し、支払を実行する",
			thenText: "銀行との通信プロトコルに従い、支払データが安全かつ確実に送信される。支払実行結果を受信し、成功・失敗の結果が確認される。会計システムへ反映され、債務台帳が更新される",
		},
		"SR-TASK-012-001": {
			givenText: "支払手形発行画面が表示され、手形発行条件が入力可能である",
			whenText: "支払手形の発行条件や手形サイトに基づき、手形発行を行う",
			thenText: "手形の発行承認プロセスが実現され、不正発行のリスクが低減される",
		},
		"SR-TASK-012-002": {
			givenText: "手形発行データが登録され、手形期日が設定されている",
			whenText: "手形の期日を管理し、期日管理台帳を作成する",
			thenText: "期日接近時にアラートが発報され、資金手当の準備が促される。期日到来時に手形決済が実行され、債務台帳が更新される",
		},
		"SR-TASK-013-001": {
			givenText: "買掛データが登録され、支払条件が設定されている",
			whenText: "買掛データから支払予定を自動作成し、最適な支払スケジュールを立案する",
			thenText: "支払期日、資金状況、仕入先との関係を考慮し、支払優先順位が決定される。支払予定表が作成され、資金繰り計画に活用される",
		},
		"SR-TASK-013-002": {
			givenText: "仕入先ポータルとの連携が設定され、請求書データや支払状況データが取得可能である",
			whenText: "仕入先ポータルと連携し、請求書データや支払状況データを取得する",
			thenText: "仕入先への支払予定が策定され、最適な支払スケジュールが作成される。支払実績が記録され、キャッシュフロー管理に活用される",
		},
		"SR-TASK-013-003": {
			givenText: "仕入先ポータルとの連携が設定され、同期設定が可能である",
			whenText: "仕入先ポータルから仕入先マスタ情報を同期する",
			thenText: "マスタデータが最新の状態に維持され、同期の頻度やタイミングを設定して自動的にデータ更新が行われる",
		},
		"SR-TASK-016-001": {
			givenText: "各業務プロセスから仕訳データが自動生成され、仕訳転記処理が実行可能である",
			whenText: "自動生成された仕訳を仕訳帳へ転記する",
			thenText: "業務データが仕訳データに変換され、正確な仕訳が生成される。転記処理が自動化され、転記された仕訳データの整合性が確認される",
		},
		"SR-TASK-016-002": {
			givenText: "仕訳転記処理が実行中であり、エラーが発生した状態である",
			whenText: "仕訳転記エラーが発生した際、関係者へ通知を送信する",
			thenText: "エラー内容を含む通知が送信され、エラーの詳細情報が通知に含まれる。通知履歴が記録され、トラブルシューティングに活用される",
		},
	};

	// 要件IDに一致するパターンがあれば使用
	if (patterns[id]) {
		return patterns[id];
	}

	// デフォルト：summaryからキーワードを抽出して動的生成
	return generateDefaultGWT(summary, category);
}

/**
 * summaryからキーワードを抽出してデフォルトGWTを生成
 */
function generateDefaultGWT(summary: string, category: SystemRequirementCategory): GWTPattern {
	// summaryの冒頭を抽出
	const mainAction = summary.split("。")[0].replace(/できること/g, "");

	// カテゴリに応じたデフォルトテンプレート
	const baseTemplate: Record<SystemRequirementCategory, GWTPattern> = {
		function: {
			givenText: `${mainAction}を実行するための前提条件が整っている`,
			whenText: `${mainAction}処理を実行する`,
			thenText: "処理が正常に完了し、期待される結果が得られる",
		},
		data: {
			givenText: "入力データが整合性を持ち、処理可能な形式である",
			whenText: "データ処理・変換を実行する",
			thenText: "出力データが正しく生成され、整合性が保たれている",
		},
		non_functional: {
			givenText: "想定される負荷・環境条件が整っている",
			whenText: "性能測定または処理を実行する",
			thenText: "指定された性能指標を満たしている",
		},
		exception: {
			givenText: "異常な状態・エラー条件が発生している",
			whenText: "通常の処理を実行する",
			thenText: "エラーが適切に検出され、エラーメッセージが表示される",
		},
	};

	return baseTemplate[category] ?? baseTemplate.function;
}

// ============================================================================
// 対象ACの収集
// ============================================================================

interface TargetAC {
	id: string;
	systemRequirementId: string;
	description: string;
	givenText: string | null;
	whenText: string | null;
	thenText: string | null;
	requirement: {
		id: string;
		title: string;
		summary: string;
		category: SystemRequirementCategory;
	};
}

async function collectTargetACs(args: CliArgs): Promise<TargetAC[]> {
	const { data: allRequirements, error } = await listSystemRequirements();

	if (error) {
		console.error("❌ システム要件の取得に失敗しました:", error);
		process.exit(1);
	}

	if (!allRequirements) {
		console.log("✅ システム要件が存在しないため、処理をスキップします");
		process.exit(0);
	}

	// テンプレート的なACを特定する条件
	// - givenTextに「処理対象データが存在し」「想定される負荷」「入力データが整合性」などが含まれる
	const isTemplateAC = (ac: { givenText: string | null }): boolean => {
		if (!ac.givenText) return false;
		const templateKeywords = [
			"処理対象データが存在し、システムが利用可能な状態である",
			"想定される負荷・環境条件が整っている",
			"入力データが整合性を持ち、処理可能な形式である",
			"異常な状態・エラー条件が発生している",
		];
		return templateKeywords.some((keyword) => ac.givenText?.includes(keyword));
	};

	const requirementIds = allRequirements.map((req) => req.id);
	const { data: allACs, error: acError } = await listAcceptanceCriteriaBySystemRequirementIds(requirementIds);

	if (acError) {
		console.error("❌ ACの取得に失敗しました:", acError);
		process.exit(1);
	}

	// テンプレート的なACを抽出
	const targetACs: TargetAC[] = [];

	for (const ac of allACs ?? []) {
		// 特定IDのみの場合
		if (args.targetId && ac.id !== args.targetId) continue;

		if (isTemplateAC(ac)) {
			const requirement = allRequirements.find((req) => req.id === ac.systemRequirementId);
			if (requirement) {
				targetACs.push({
					id: ac.id,
					systemRequirementId: ac.systemRequirementId,
					description: ac.description,
					givenText: ac.givenText,
					whenText: ac.whenText,
					thenText: ac.thenText,
					requirement: {
						id: requirement.id,
						title: requirement.title,
						summary: requirement.summary,
						category: requirement.category,
					},
				});
			}
		}
	}

	// limit指定
	if (args.limit) {
		return targetACs.slice(0, args.limit);
	}

	return targetACs;
}

// ============================================================================
// AC更新
// ============================================================================

async function updateAllACs(targetACs: TargetAC[]): Promise<{ success: number; error: number }> {
	if (targetACs.length === 0) {
		return { success: 0, error: 0 };
	}

	let success = 0;
	let error = 0;

	for (const ac of targetACs) {
		const newGWT = generateDetailedGWT(ac.requirement);

		const { data, error: err } = await updateAcceptanceCriterion(ac.id, {
			systemRequirementId: ac.systemRequirementId,
			description: ac.description,
			givenText: newGWT.givenText,
			whenText: newGWT.whenText,
			thenText: newGWT.thenText,
			verificationMethod: "手動テスト",
		});

		if (err) {
			console.error(`❌ ${ac.id} の更新に失敗しました:`, err);
			error++;
		} else {
			success++;
		}
	}

	return { success, error };
}

// ============================================================================
// 結果表示
// ============================================================================

function displayUpdatePreview(targetACs: TargetAC[], limit = 10) {
	console.log("\n📋 更新されるACのプレビュー:");
	console.log("=".repeat(80));

	const preview = targetACs.slice(0, limit);

	for (const ac of preview) {
		const newGWT = generateDetailedGWT(ac.requirement);
		console.log(`\nID: ${ac.id} (${ac.requirement.title})`);
		console.log(`  【Before】`);
		console.log(`    Given: ${ac.givenText ?? "-"}`);
		console.log(`    When:  ${ac.whenText ?? "-"}`);
		console.log(`    Then:  ${ac.thenText ?? "-"}`);
		console.log(`  【After】`);
		console.log(`    Given: ${newGWT.givenText}`);
		console.log(`    When:  ${newGWT.whenText}`);
		console.log(`    Then:  ${newGWT.thenText}`);
	}

	if (targetACs.length > limit) {
		console.log(`\n... 他 ${targetACs.length - limit} 件`);
	}

	console.log("=".repeat(80));
}

function displayResults(
	targetCount: number,
	updateResult: { success: number; error: number },
	mode: "dry-run" | "execute"
) {
	console.log("\n" + "=".repeat(80));
	console.log("📊 実行結果サマリー");
	console.log("=".repeat(80));
	console.log(`モード:        ${mode}`);
	console.log(`対象AC数:      ${targetCount}件`);

	if (mode === "execute") {
		console.log(`更新成功:      ${updateResult.success}件`);
		console.log(`更新失敗:      ${updateResult.error}件`);
	} else {
		console.log(`（Dry-run: 実際には更新していません）`);
	}

	console.log("=".repeat(80));
}

// ============================================================================
// エントリーポイント
// ============================================================================

async function main() {
	const args = parseArgs();
	console.log("🚀 受入条件GWT文章充実化スクリプト");
	console.log(`   モード: ${args.mode}`);

	if (args.targetId) {
		console.log(`   ターゲットAC ID: ${args.targetId}`);
	}
	if (args.limit) {
		console.log(`   件数制限: ${args.limit}件`);
	}

	// 対象ACを収集
	console.log("\n🔍 テンプレート的なACを検索中...");
	const targetACs = await collectTargetACs(args);
	console.log(`   ✓ ${targetACs.length}件のテンプレート的なACを検出`);

	if (targetACs.length === 0) {
		console.log("\n✅ 更新対象のACがありません");
		process.exit(0);
	}

	// プレビュー表示
	displayUpdatePreview(targetACs);

	if (args.mode === "dry-run") {
		displayResults(targetACs.length, { success: targetACs.length, error: 0 }, "dry-run");
		console.log("\n✅ Dry-run完了。実際に更新するには --execute を指定してください");
		process.exit(0);
	}

	// 確認プロンプト
	console.log("\n⚠️  上記の内容でacceptance_criteriaテーブルを更新します");
	console.log("   続行しますか？ (y/N)");

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

	// 更新実行
	console.log("\n💾 データベースを更新中...");
	const updateResult = await updateAllACs(targetACs);

	displayResults(targetACs.length, updateResult, "execute");

	if (updateResult.error > 0) {
		console.log("\n❌ 一部の更新に失敗しました");
		process.exit(1);
	} else {
		console.log("\n✅ 全ての更新が完了しました");
		process.exit(0);
	}
}

// エラーハンドリング
main().catch((err) => {
	console.error("❌ 予期しないエラーが発生しました:", err);
	process.exit(1);
});
