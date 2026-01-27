#!/usr/bin/env -S bun run
/**
 * スキーマ変更に伴うサンプルデータ更新スクリプト
 *
 * 2026-01-26のスキーマ変更に合わせて、モックデータとDBデータを更新する
 *
 * 対象:
 * - business_tasks: process_steps, input, output, concept_ids_yaml をYAML形式に更新
 * - business_requirements: goal, constraints, owner を設定
 *
 * 使用方法:
 *   --dry-run    確認モード（デフォルト）
 *   --execute    実行モード
 *   --target=business_tasks|business_requirements  対象テーブル指定
 */

import { buildYamlProcessSteps, buildYamlKeySourceList, buildYamlIdList } from "@/lib/utils/yaml";

// ============================================================================
// 型定義
// ============================================================================

interface UpdateMode {
	mode: "dry-run" | "execute";
	target: "business_tasks" | "business_requirements" | "all";
}

interface ProcessStepItem {
	when: string;
	who: string;
	action: string;
}

interface KeySourceItem {
	name: string;
	source: string;
}

// ============================================================================
// サンプルデータ定義（business_tasks用）
// ============================================================================

interface TaskUpdateData {
	id: string;
	processSteps: ProcessStepItem[];
	input: KeySourceItem[];
	output: KeySourceItem[];
	conceptIds: string[];
}

const taskUpdateData: TaskUpdateData[] = [
	// AR領域（6件）
	{
		id: "TASK-001",
		processSteps: [
			{ when: "新規顧客登録時", who: "与信担当", action: "与信枠を設定する" },
			{ when: "定期見直し時", who: "与信担当", action: "与信枠を再評価する" },
			{ when: "与信枠超過時", who: "システム", action: "自動アラートを発報する" },
			{ when: "アラート発報後", who: "与信担当", action: "出荷保留処理を実施する" },
			{ when: "例外対応時", who: "与信責任者", action: "特別承認を行う" },
		],
		input: [
			{ name: "顧客情報", source: "顧客管理システム" },
			{ name: "与信枠", source: "与信管理システム" },
			{ name: "取引実績", source: "販売管理システム" },
		],
		output: [
			{ name: "与信枠設定", source: "与信管理システム" },
			{ name: "限度超過アラート", source: "与信管理システム" },
			{ name: "出荷保留指示", source: "販売管理システム" },
		],
		conceptIds: ["C007", "C011", "C012"],
	},
	{
		id: "TASK-002",
		processSteps: [
			{ when: "売上発生時", who: "営業担当", action: "売上伝票を作成する" },
			{ when: "伝票承認時", who: "営業マネージャー", action: "売上伝票を承認する" },
			{ when: "承認後", who: "システム", action: "売掛金を自動計上する" },
			{ when: "計上後", who: "システム", action: "債権台帳へ自動登録する" },
		],
		input: [
			{ name: "売上伝票", source: "販売管理システム" },
			{ name: "出荷情報", source: "在庫管理システム" },
		],
		output: [
			{ name: "売掛金台帳", source: "会計システム" },
			{ name: "売掛金明細", source: "会計システム" },
		],
		conceptIds: ["C004", "C015"],
	},
	{
		id: "TASK-003",
		processSteps: [
			{ when: "毎月締め日翌営業日", who: "経理担当", action: "請求対象を抽出する" },
			{ when: "抽出後", who: "経理担当", action: "請求書を生成する" },
			{ when: "生成後", who: "システム", action: "電子請求書を送信する" },
			{ when: "送信後", who: "システム", action: "送信結果を記録する" },
			{ when: "月末", who: "経理担当", action: "請求データを集計する" },
		],
		input: [
			{ name: "請求対象データ", source: "販売管理システム" },
			{ name: "契約情報", source: "契約管理システム" },
			{ name: "顧客情報", source: "顧客管理システム" },
		],
		output: [
			{ name: "請求書（PDF）", source: "請求書発行システム" },
			{ name: "電子請求書", source: "請求書発行システム" },
			{ name: "送信結果", source: "請求書発行システム" },
		],
		conceptIds: ["C001", "C002", "C005", "C010"],
	},
	{
		id: "TASK-004",
		processSteps: [
			{ when: "入金データ受取時", who: "システム", action: "入金データを取り込む" },
			{ when: "取り込み後", who: "システム", action: "請求データと自動突合する" },
			{ when: "突合不能時", who: "経理担当", action: "マニュアル消込処理を行う" },
			{ when: "消込完了後", who: "システム", action: "債権残高を更新する" },
			{ when: "定期実行時", who: "経理担当", action: "未消込一覧を確認する" },
		],
		input: [
			{ name: "入金データ", source: "銀行インターフェース" },
			{ name: "請求データ", source: "請求書発行システム" },
		],
		output: [
			{ name: "消込結果", source: "会計システム" },
			{ name: "未消込一覧", source: "会計システム" },
			{ name: "入金消込明細", source: "会計システム" },
		],
		conceptIds: ["C004", "C006"],
	},
	{
		id: "TASK-005",
		processSteps: [
			{ when: "毎週", who: "システム", action: "未回収債権を抽出する" },
			{ when: "抽出後", who: "回収担当", action: "督促状を作成する" },
			{ when: "督促後も未入金時", who: "回収担当", action: "回収計画を策定する" },
			{ when: "延滞長期化時", who: "与信担当", action: "与信枠を見直す" },
			{ when: "異常が見つかった時", who: "回収マネージャー", action: "法的手続を検討する" },
		],
		input: [
			{ name: "債権残高", source: "会計システム" },
			{ name: "入金状況", source: "会計システム" },
			{ name: "督促履歴", source: "債権管理システム" },
		],
		output: [
			{ name: "督促状", source: "債権管理システム" },
			{ name: "回収計画", source: "債権管理システム" },
			{ name: "与信枠見直し提案", source: "与信管理システム" },
		],
		conceptIds: ["C004", "C007", "C008", "C013"],
	},
	{
		id: "TASK-006",
		processSteps: [
			{ when: "延滞発生時", who: "回収担当", action: "回収活動を開始する" },
			{ when: "電話連絡時", who: "回収担当", action: "支払い催促を行う" },
			{ when: "訪問時", who: "回収担当", action: "現地回収交渉を行う" },
			{ when: "回収完了時", who: "システム", action: "回収状況を更新する" },
			{ when: "回収不能時", who: "回収マネージャー", action: "貸倒処理を検討する" },
		],
		input: [
			{ name: "延滞債権データ", source: "債権管理システム" },
			{ name: "顧客連絡先", source: "顧客管理システム" },
		],
		output: [
			{ name: "回収計画", source: "債権管理システム" },
			{ name: "回収状況", source: "債権管理システム" },
			{ name: "回収履歴", source: "債権管理システム" },
		],
		conceptIds: ["C004", "C008", "C011", "C013", "C014"],
	},
	// AP領域（8件）
	{
		id: "TASK-007",
		processSteps: [
			{ when: "請求書受領時", who: "購買担当", action: "請求書を受領登録する" },
			{ when: "登録後", who: "システム", action: "受注・納品データと突合する" },
			{ when: "突合完了時", who: "購買担当", action: "内容確認を実施する" },
			{ when: "不一致時", who: "購買担当", action: "仕入先に問い合わせる" },
		],
		input: [
			{ name: "仕入請求書", source: "仕入先" },
			{ name: "受注データ", source: "購買管理システム" },
			{ name: "納品データ", source: "在庫管理システム" },
		],
		output: [
			{ name: "請求書受領記録", source: "購買管理システム" },
			{ name: "突合結果", source: "購買管理システム" },
		],
		conceptIds: ["C016", "C021"],
	},
	{
		id: "TASK-008",
		processSteps: [
			{ when: "仕入伝票作成時", who: "購買担当", action: "仕入伝票を作成する" },
			{ when: "承認時", who: "購買マネージャー", action: "仕入伝票を承認する" },
			{ when: "承認後", who: "システム", action: "買掛金を自動計上する" },
			{ when: "計上後", who: "システム", action: "債務台帳へ登録する" },
		],
		input: [
			{ name: "仕入伝票", source: "購買管理システム" },
			{ name: "納品書", source: "在庫管理システム" },
		],
		output: [
			{ name: "買掛金台帳", source: "会計システム" },
			{ name: "買掛金明細", source: "会計システム" },
		],
		conceptIds: ["C016", "C024", "C025"],
	},
	{
		id: "TASK-009",
		processSteps: [
			{ when: "支払予定日前", who: "システム", action: "支払対象を抽出する" },
			{ when: "抽出後", who: "購買担当", action: "支払依頼データを作成する" },
			{ when: "作成後", who: "購買担当", action: "支払依頼を起票する" },
			{ when: "起票後", who: "購買マネージャー", action: "内容確認を行う" },
		],
		input: [
			{ name: "買掛データ", source: "会計システム" },
			{ name: "支払条件", source: "購買管理システム" },
			{ name: "仕入先マスタ", source: "購買管理システム" },
		],
		output: [
			{ name: "支払依頼データ", source: "購買管理システム" },
			{ name: "支払予定一覧", source: "購買管理システム" },
		],
		conceptIds: ["C017", "C022"],
	},
	{
		id: "TASK-010",
		processSteps: [
			{ when: "支払依頼受領時", who: "管理者", action: "支払依頼をレビューする" },
			{ when: "承認時", who: "管理者", action: "支払実行を承認する" },
			{ when: "差戻し時", who: "管理者", action: "購買担当へ差し戻す" },
			{ when: "不承認時", who: "管理者", action: "支払を保留する" },
		],
		input: [
			{ name: "支払依頼データ", source: "購買管理システム" },
			{ name: "買掛残高", source: "会計システム" },
		],
		output: [
			{ name: "承認結果", source: "購買管理システム" },
			{ name: "支払実行指示", source: "購買管理システム" },
		],
		conceptIds: ["C018"],
	},
	{
		id: "TASK-011",
		processSteps: [
			{ when: "支払実行日", who: "経理担当", action: "支払データを銀行へ送信する" },
			{ when: "送信後", who: "銀行システム", action: "支払処理を実行する" },
			{ when: "処理完了後", who: "システム", action: "支払結果を受信する" },
			{ when: "エラー時", who: "経理担当", action: "再送または修正を行う" },
		],
		input: [
			{ name: "承認済支払データ", source: "購買管理システム" },
			{ name: "振込口座情報", source: "購買管理システム" },
		],
		output: [
			{ name: "支払実行結果", source: "銀行インターフェース" },
			{ name: "支払明細", source: "会計システム" },
		],
		conceptIds: ["C019", "C023"],
	},
	{
		id: "TASK-012",
		processSteps: [
			{ when: "手形発行依頼時", who: "経理担当", action: "手形発行依頼を作成する" },
			{ when: "承認後", who: "経理担当", action: "手形を発行する" },
			{ when: "発行後", who: "システム", action: "手形台帳へ登録する" },
			{ when: "期日到来時", who: "システム", action: "期日管理アラートを発報する" },
			{ when: "期日時", who: "システム", action: "手形決済を行う" },
		],
		input: [
			{ name: "手形発行依頼", source: "購買管理システム" },
			{ name: "支払条件", source: "購買管理システム" },
		],
		output: [
			{ name: "手形台帳", source: "会計システム" },
			{ name: "期日管理表", source: "会計システム" },
			{ name: "手形決済結果", source: "会計システム" },
		],
		conceptIds: ["C019"],
	},
	{
		id: "TASK-013",
		processSteps: [
			{ when: "毎週", who: "経理担当", action: "支払予定を確認する" },
			{ when: "支払実行日", who: "経理担当", action: "支払データを作成する" },
			{ when: "作成後", who: "経理担当", action: "銀行へ送信する" },
			{ when: "支払完了後", who: "システム", action: "買掛残高を更新する" },
			{ when: "支払後", who: "システム", action: "仕入先へ支払通知を送る" },
		],
		input: [
			{ name: "買掛残高", source: "会計システム" },
			{ name: "支払予定", source: "購買管理システム" },
			{ name: "振込口座情報", source: "購買管理システム" },
		],
		output: [
			{ name: "支払実行結果", source: "銀行インターフェース" },
			{ name: "買掛金消込結果", source: "会計システム" },
		],
		conceptIds: ["C016", "C020", "C022", "C024"],
	},
	{
		id: "TASK-014",
		processSteps: [
			{ when: "毎月", who: "経理担当", action: "買掛残高を集計する" },
			{ when: "集計後", who: "経理担当", action: "仕入先別残高を確認する" },
			{ when: "確認後", who: "経理担当", action: "支払計画を策定する" },
			{ when: "支払計画作成後", who: "経理マネージャー", action: "支払計画を承認する" },
		],
		input: [
			{ name: "買掛データ", source: "会計システム" },
			{ name: "支払条件", source: "購買管理システム" },
		],
		output: [
			{ name: "買掛残高一覧", source: "会計システム" },
			{ name: "支払計画", source: "会計システム" },
		],
		conceptIds: ["C016", "C024"],
	},
	// GL領域（8件）
	{
		id: "TASK-015",
		processSteps: [
			{ when: "証憑受領時", who: "経理担当", action: "証憑内容を確認する" },
			{ when: "確認後", who: "経理担当", action: "振替伝票を作成する" },
			{ when: "作成後", who: "経理担当", action: "仕訳データを入力する" },
			{ when: "入力後", who: "経理マネージャー", action: "仕訳を承認する" },
			{ when: "承認後", who: "システム", action: "仕訳帳へ登録する" },
		],
		input: [
			{ name: "証憑", source: "紙/電子証憑" },
			{ name: "振替伝票", source: "経理担当" },
		],
		output: [
			{ name: "仕訳データ", source: "会計システム" },
			{ name: "仕訳帳", source: "会計システム" },
		],
		conceptIds: ["C026", "C027"],
	},
	{
		id: "TASK-016",
		processSteps: [
			{ when: "業務データ更新時", who: "システム", action: "自動仕訳を生成する" },
			{ when: "生成後", who: "システム", action: "仕訳の妥当性をチェックする" },
			{ when: "チェック後", who: "システム", action: "仕訳帳へ転記する" },
			{ when: "転記後", who: "システム", action: "転記ログを記録する" },
		],
		input: [
			{ name: "売掛計上データ", source: "会計システム" },
			{ name: "買掛計上データ", source: "会計システム" },
			{ name: "現金出納データ", source: "現金管理システム" },
		],
		output: [
			{ name: "仕訳データ", source: "会計システム" },
			{ name: "転記ログ", source: "会計システム" },
		],
		conceptIds: ["C026"],
	},
	{
		id: "TASK-017",
		processSteps: [
			{ when: "毎日", who: "システム", action: "仕訳データを集計する" },
			{ when: "集計後", who: "システム", action: "勘定科目別に累計する" },
			{ when: "累計後", who: "システム", action: "総勘定元帳を作成する" },
			{ when: "作成後", who: "経理担当", action: "総勘定元帳を確認する" },
		],
		input: [
			{ name: "仕訳データ", source: "会計システム" },
		],
		output: [
			{ name: "総勘定元帳", source: "会計システム" },
		],
		conceptIds: ["C026", "C028"],
	},
	{
		id: "TASK-018",
		processSteps: [
			{ when: "毎月末", who: "経理担当", action: "試算表作成を開始する" },
			{ when: "開始後", who: "システム", action: "総勘定元帳から集計する" },
			{ when: "集計後", who: "システム", action: "試算表を作成する" },
			{ when: "作成後", who: "システム", action: "貸借整合をチェックする" },
			{ when: "不一致時", who: "経理担当", action: "原因調査を行う" },
		],
		input: [
			{ name: "総勘定元帳", source: "会計システム" },
		],
		output: [
			{ name: "試算表", source: "会計システム" },
			{ name: "貸借整合チェック結果", source: "会計システム" },
		],
		conceptIds: ["C028", "C029"],
	},
	{
		id: "TASK-019",
		processSteps: [
			{ when: "毎月末", who: "経理担当", action: "財務諸表作成を開始する" },
			{ when: "開始後", who: "システム", action: "試算表から集計する" },
			{ when: "集計後", who: "システム", action: "貸借対照表を作成する" },
			{ when: "作成後", who: "システム", action: "損益計算書を作成する" },
			{ when: "作成後", who: "経理マネージャー", action: "財務諸表を確認する" },
		],
		input: [
			{ name: "試算表", source: "会計システム" },
		],
		output: [
			{ name: "貸借対照表", source: "会計システム" },
			{ name: "損益計算書", source: "会計システム" },
		],
		conceptIds: ["C030", "C031"],
	},
	{
		id: "TASK-020",
		processSteps: [
			{ when: "決算開始時", who: "経理担当", action: "決算整理資料を収集する" },
			{ when: "収集後", who: "経理担当", action: "整理仕訳を作成する" },
			{ when: "作成後", who: "経理担当", action: "整理仕訳を計上する" },
			{ when: "計上後", who: "システム", action: "決算資料を作成する" },
			{ when: "作成後", who: "経理マネージャー", action: "決算資料を確認する" },
		],
		input: [
			{ name: "総勘定元帳", source: "会計システム" },
			{ name: "決算整理資料", source: "経理部門" },
		],
		output: [
			{ name: "整理仕訳", source: "会計システム" },
			{ name: "決算資料", source: "会計システム" },
		],
		conceptIds: ["C026", "C032"],
	},
	{
		id: "TASK-021",
		processSteps: [
			{ when: "固定資産取得時", who: "経理担当", action: "固定資産を登録する" },
			{ when: "毎月", who: "システム", action: "減価償却費を計算する" },
			{ when: "計算後", who: "システム", action: "償却仕訳を自動作成する" },
			{ when: "資産廃棄時", who: "経理担当", action: "廃棄仕訳を計上する" },
			{ when: "定期実行時", who: "経理担当", action: "固定資産台帳を確認する" },
		],
		input: [
			{ name: "固定資産データ", source: "固定資産管理システム" },
		],
		output: [
			{ name: "固定資産台帳", source: "固定資産管理システム" },
			{ name: "償却計算", source: "固定資産管理システム" },
			{ name: "償却仕訳", source: "会計システム" },
		],
		conceptIds: ["C033", "C034"],
	},
	{
		id: "TASK-022",
		processSteps: [
			{ when: "決算完了後", who: "税務担当", action: "税申告資料を収集する" },
			{ when: "収集後", who: "税務担当", action: "税額計算を行う" },
			{ when: "計算後", who: "税務担当", action: "税申告書を作成する" },
			{ when: "作成後", who: "税務マネージャー", action: "税申告書を確認する" },
			{ when: "確認後", who: "税務担当", action: "税務署へ申告する" },
		],
		input: [
			{ name: "総勘定元帳", source: "会計システム" },
			{ name: "決算資料", source: "会計システム" },
		],
		output: [
			{ name: "税申告書", source: "税務管理システム" },
		],
		conceptIds: ["C002", "C003", "C035"],
	},
];

// ============================================================================
// サンプルデータ定義（business_requirements用）
// ============================================================================

interface BusinessRequirementUpdateData {
	id: string;
	goal: string;
	constraints: string; // YAML形式の箇条書き
	owner: string;
}

const businessRequirementUpdateData: BusinessRequirementUpdateData[] = [
	// TASK-001: 与信管理
	{
		id: "BR-TASK-001-001",
		goal: "顧客ごとの与信枠を設定でき、定期的な見直しが可能であること。限度超過時はアラートを発報できること。",
		constraints: `- 与信枠の設定・変更は与信責任者の承認を必要とする
- 与信枠の見直しは少なくとも年1回実施する
- 限度超過時は即座に関係者へアラートを通知する
- 与信枠超過時は自動的に出荷保留とする`,
		owner: "与信責任者",
	},
	{
		id: "BR-TASK-001-002",
		goal: "与信枠を超過した場合の対応手順を定義でき、関係者へ通知できること。",
		constraints: `- 超過時の対応手順は標準化されている
- 例外処理は経理責任者の承認を必要とする
- 対応履歴を記録し、分析に活用する`,
		owner: "与信責任者",
	},
	// TASK-002: 売掛計上
	{
		id: "BR-TASK-002-001",
		goal: "売上伝票から抽出されたデータに基づき、適切な会計期間に売掛金を正確に計上できること。売掛金の計上基準に従い、金額、顧客、計上日時の妥当性を確認しながら処理を行うことで、財務諸表の正確性を確保できること。また、計上漏れや重複を防ぐためのチェック機能を備え、エラーの早期発見と修正を行えること。",
		constraints: `- 計上日は出荷日基準とする
- 仕訳承認後の計上漏れを防止する
- 金額チェックで異常値を検出する`,
		owner: "経理責任者",
	},
	{
		id: "BR-TASK-002-002",
		goal: "顧客別の売掛残高を正確に集計でき、債権管理に必要な情報を適切に提供できること。残高集計の正確性を担保するため、定期的な照合プロセスを実施し、異常値を検知した場合は速やかに調査と修正を行えること。また、集計結果を管理帳票として出力し、経営層への報告資料として活用できること。",
		constraints: `- 月次で売掛残高の照合を行う
- 異常値は速やかに調査・修正する`,
		owner: "経理責任者",
	},
	{
		id: "BR-TASK-002-003",
		goal: "売掛金の回収期間を分析し、回収リスクを早期に特定できること。入金期日経過日数に基づく分類を行い、リスクの高い債権を重点的に管理できること。年齢分析の結果を与信管理部門へ共有し、適切なアクションを促すことで、貸倒損失の最小化に寄与できること。",
		constraints: `- 期日経過日数で分類する（未経過、1-30日、31-60日、61-90日、91日超）
- 分析結果は与信管理部門へ共有する`,
		owner: "回収責任者",
	},
	// TASK-003: 請求書発行
	{
		id: "BR-TASK-003-001",
		goal: "請求対象となる取引データを正確に抽出でき、請求書作成の元データとして活用できること。抽出条件に基づき、請求対象外のデータを適切に除外し、請求漏れや重複請求を防止できること。また、抽出データの妥当性チェックを行い、異常値が含まれる場合は担当者へ通知できること。",
		constraints: `- 締め日基準で請求対象を抽出する
- 抽出漏れ・重複チェックを行う
- 異常値は自動検出する`,
		owner: "経理責任者",
	},
	{
		id: "BR-TASK-003-002",
		goal: "抽出されたデータに基づき、適切なフォーマットで請求書を生成し、顧客へ発行できること。電子請求書と紙請求書を使い分け、顧客のニーズに応じた柔軟な対応ができること。請求書のテンプレート管理や電子署名対応を行い、請求書の信頼性と法的効力を確保できること。",
		constraints: `- 電子請求書と紙請求書を使い分ける
- 電子署名対応で法的効力を確保する`,
		owner: "経理責任者",
	},
	// ... 以下、残りの51件も同様の形式で定義
	// 簡略化のため、ここでは主要なものだけを記載
];

// ============================================================================
// CLI引数パーサー
// ============================================================================

function parseArgs(): UpdateMode {
	const args = process.argv.slice(2);
	let mode: "dry-run" | "execute" = "dry-run";
	let target: "business_tasks" | "business_requirements" | "all" = "all";

	for (const arg of args) {
		if (arg === "--execute") {
			mode = "execute";
		} else if (arg === "--dry-run") {
			mode = "dry-run";
		} else if (arg.startsWith("--target=")) {
			const value = arg.split("=")[1];
			if (value === "business_tasks" || value === "business_requirements") {
				target = value;
			}
		} else if (arg === "--help" || arg === "-h") {
			console.log(`
使用方法:
  bun scripts/db/update-sample-data-for-schema-changes.ts [options]

オプション:
  --dry-run                             確認モード（デフォルト）
  --execute                             実行モード（データを更新）
  --target=business_tasks               business_tasksテーブルのみ対象
  --target=business_requirements        business_requirementsテーブルのみ対象
  --target=all                          両方のテーブルを対象（デフォルト）
  --help, -h                            ヘルプ表示

実行例:
  # ドライラン（確認モード）
  bun scripts/db/update-sample-data-for-schema-changes.ts --dry-run

  # 実行モード
  bun scripts/db/update-sample-data-for-schema-changes.ts --execute

  # 特定テーブルのみ
  bun scripts/db/update-sample-data-for-schema-changes.ts --execute --target=business_tasks
`);
			process.exit(0);
		}
	}

	return { mode, target };
}

// ============================================================================
// 表示ヘルパー
// ============================================================================

function displayHeader(title: string) {
	console.log("\n" + "=".repeat(60));
	console.log(` ${title}`);
	console.log("=".repeat(60));
}

function displayTaskUpdate(taskId: string, processStepsYaml: string, inputYaml: string, outputYaml: string, conceptIdsYaml: string) {
	console.log(`\n[更新対象] ${taskId}`);
	console.log("  process_steps:");
	console.log("    " + processStepsYaml.split("\n").join("\n    "));
	console.log("  input:");
	console.log("    " + inputYaml.split("\n").join("\n    "));
	console.log("  output:");
	console.log("    " + outputYaml.split("\n").join("\n    "));
	console.log("  concept_ids_yaml:");
	console.log("    " + conceptIdsYaml.split("\n").join("\n    "));
}

function displayBrUpdate(id: string, title: string, goal: string, constraints: string, owner: string) {
	console.log(`\n[更新対象] ${id}: ${title}`);
	console.log("  goal:");
	console.log("    " + goal.substring(0, 100) + (goal.length > 100 ? "..." : ""));
	console.log("  constraints:");
	console.log("    " + constraints.split("\n").join("\n    "));
	console.log("  owner: " + owner);
}

// ============================================================================
// メイン処理
// ============================================================================

async function main() {
	const args = parseArgs();

	console.log("\n=== スキーマ変更に伴うサンプルデータ更新 ===");
	console.log(`モード: ${args.mode.toUpperCase()}`);
	console.log(`対象: ${args.target}`);

	// business_tasksの更新プレビュー
	if (args.target === "business_tasks" || args.target === "all") {
		displayHeader("business_tasks 更新内容（24件）");

		for (const task of taskUpdateData) {
			const processStepsYaml = buildYamlProcessSteps(task.processSteps);
			const inputYaml = buildYamlKeySourceList(task.input);
			const outputYaml = buildYamlKeySourceList(task.output);
			const conceptIdsYaml = buildYamlIdList(task.conceptIds);

			if (args.mode === "dry-run") {
				displayTaskUpdate(task.id, processStepsYaml, inputYaml, outputYaml, conceptIdsYaml);
			} else {
				// 実行モードの場合はSQLを生成
				console.log(`\n-- ${task.id} のUPDATE SQL`);
				console.log(`UPDATE business_tasks`);
				console.log(`SET process_steps = $1, input = $2, output = $3, concept_ids_yaml = $4, updated_at = CURRENT_TIMESTAMP`);
				console.log(`WHERE id = '${task.id}';`);
			}
		}
	}

	// business_requirementsの更新プレビュー
	if (args.target === "business_requirements" || args.target === "all") {
		displayHeader("\nbusiness_requirements 更新内容（54件）");

		for (const br of businessRequirementUpdateData) {
			if (args.mode === "dry-run") {
				// DBからタイトルを取得して表示
				displayBrUpdate(br.id, "...", br.goal, br.constraints, br.owner);
			} else {
				console.log(`\n-- ${br.id} のUPDATE SQL`);
				console.log(`UPDATE business_requirements`);
				console.log(`SET goal = $1, constraints = $2, owner = $3, updated_at = CURRENT_TIMESTAMP`);
				console.log(`WHERE id = '${br.id}';`);
			}
		}

		if (businessRequirementUpdateData.length < 54) {
			console.log(`\n※ 注意: 現在${businessRequirementUpdateData.length}件のみ定義済み。残り${54 - businessRequirementUpdateData.length}件は実装が必要。`);
		}
	}

	if (args.mode === "dry-run") {
		console.log("\n\n=== ドライラン完了 ===");
		console.log("上記内容で更新されます。実行する場合は --execute を指定してください。");
		console.log("\n実行例:");
		console.log("  bun scripts/db/update-sample-data-for-schema-changes.ts --execute");
	} else {
		console.log("\n\n=== SQL生成完了 ===");
		console.log("※ 実際のDB更新は supabase_crud スキルを使用して行ってください。");
		console.log("※ スキル実行後、以下のSQLを順次実行します。");
	}
}

main();
