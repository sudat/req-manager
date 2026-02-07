"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { FileCode2, ChevronDown, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard, EmptyState, SectionLabel } from "./section-card";
import type { DesignDocument, DdType } from "@/lib/domain";
import { HierarchicalViewer } from "@/components/forms/hierarchical-editor/viewer";
import { jsonToHierarchical } from "@/lib/utils/hierarchical-editor";
import { parseStructuredDetails } from "@/lib/utils/design-documents/structured-compat";
import {
	DD_TYPE_LABELS,
	DD_TYPE_COLORS,
} from "@/lib/domain/enums";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const DD_DETAILS_KEY_LABELS: Record<string, string> = {
	version: "バージョン",
	ioType: "I/O種別",
	typeDetail: "種別詳細",
	inputSchema: "入力スキーマ",
	outputSchema: "出力スキーマ",
	inputFields: "入力項目",
	outputFields: "出力項目",
	sideEffects: "副作用",
	invariants: "不変条件",
	exceptions: "例外",
	nonFunctional: "非機能要件",
	boundaries: "境界",
	name: "名称",
	description: "説明",
	type: "種別",
	required: "必須",
	constraints: "制約",
	min: "最小値",
	max: "最大値",
	pattern: "パターン",
	default: "デフォルト",
	unique: "一意",
	errorMessage: "エラーメッセージ",
	method: "メソッド",
	path: "パス",
	route: "ルート",
	trigger: "トリガー",
	schedule: "スケジュール",
	source: "入力ソース",
	event: "イベント",
	protocol: "プロトコル",
	endpoint: "エンドポイント",
	entity: "エンティティ",
	table: "テーブル",
	format: "形式",
	outputPath: "出力先",
	query: "クエリ",
	body: "ボディ",
	elements: "要素",
	element: "要素",
	parameters: "パラメータ",
	payload: "ペイロード",
	success: "成功時",
	error: "エラー時",
	status: "ステータス",
	fields: "フィールド",
	transition: "遷移",
	messages: "メッセージ",
	summary: "サマリー",
	processedCount: "処理件数",
	successCount: "成功件数",
	errorCount: "失敗件数",
	executionTimeMs: "実行時間(ms)",
	nextBatch: "次バッチ",
	result: "結果",
	nextEvent: "次イベント",
	dbOperations: "DB操作",
	operation: "操作",
	condition: "条件",
	affectedColumns: "影響カラム",
	externalApiCalls: "外部API呼び出し",
	retryPolicy: "リトライポリシー",
	maxRetries: "最大リトライ回数",
	backoffMs: "バックオフ(ms)",
	events: "イベント発行",
	eventType: "イベント種別",
	destination: "送信先",
	delayMs: "遅延(ms)",
	fileOutputs: "ファイル出力",
	encoding: "文字コード",
	append: "追記",
	logs: "ログ",
	level: "ログレベル",
	message: "メッセージ",
	structuredData: "構造化データ",
	httpStatus: "HTTPステータス",
	errorCode: "エラーコード",
	userNotification: "ユーザー通知",
	logging: "ロギング",
	recovery: "復旧方式",
	performance: "性能",
	responseTime: "応答時間",
	p95: "P95",
	p99: "P99",
	throughput: "スループット",
	rps: "RPS",
	concurrency: "同時実行",
	maxUsers: "最大ユーザー数",
	availability: "可用性",
	uptime: "稼働率",
	monthlyDowntime: "月間停止時間",
	rto: "RTO",
	rpo: "RPO",
	security: "セキュリティ",
	auth: "認証",
	sessionTimeout: "セッションタイムアウト",
	encryption: "暗号化",
	inTransit: "通信時",
	atRest: "保存時",
	compliance: "コンプライアンス",
	observability: "可観測性",
	metrics: "メトリクス",
	collection: "収集方式",
	scrapeInterval: "収集間隔",
	includeFields: "対象項目",
	tracing: "トレーシング",
	enabled: "有効",
	samplingRate: "サンプリング率",
	alerting: "アラート",
	channels: "通知チャネル",
	responseTimeMs: "応答時間(ms)",
	checkPoint: "チェックポイント",
	keySource: "キーソース",
	deduplicationRule: "重複排除ルール",
	onDuplicate: "重複時処理",
	begin: "開始",
	commit: "コミット",
	rollback: "ロールバック",
	transaction: "トランザクション",
	authorization: "認可",
	idempotency: "冪等",
	allowPaths: "許可パス",
	denyPaths: "禁止パス",
};

interface DesignDocumentSectionProps {
	items: DesignDocument[];
	loading: boolean;
	error: string | null;
	srfId?: string;
	systemDomainId?: string;
}

export function DesignDocumentSection({
	items,
	loading,
	error,
	srfId,
	systemDomainId,
}: DesignDocumentSectionProps): ReactNode {
	const editButton = srfId && systemDomainId ? (
		<Link href={`/system/${systemDomainId}/${srfId}/edit/design-documents`}>
			<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[12px]">
				<Pencil className="h-3.5 w-3.5" />
				編集
			</Button>
		</Link>
	) : null;

	if (loading) {
		return (
			<SectionCard title="DD（Design Document）" action={editButton}>
				<div className="text-[13px] text-slate-400">読み込み中...</div>
			</SectionCard>
		);
	}

	if (error) {
		return (
			<SectionCard title="DD（Design Document）" action={editButton}>
				<div className="text-[13px] text-rose-600">{error}</div>
			</SectionCard>
		);
	}

	return (
		<SectionCard title="DD（Design Document）" count={items.length} action={editButton}>
			{items.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-4">
					{items.map((item) => (
						<DesignDocumentItem key={item.id} item={item} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

function DesignDocumentItem({ item }: { item: DesignDocument }): ReactNode {
	const [isOpen, setIsOpen] = useState(false);
	const typeLabel =
		DD_TYPE_LABELS[item.type as DdType] ?? item.type;
	const typeColor =
		DD_TYPE_COLORS[item.type as DdType] ??
		"border-slate-200 bg-slate-50 text-slate-700";
	const entryPoints = item.entryPoints ?? [];
	const { legacyDetails, parseError } = parseStructuredDetails(item.details);
	const hierarchicalValue =
		legacyDetails && Object.keys(legacyDetails).length > 0
			? jsonToHierarchical(legacyDetails)
			: null;

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div className="rounded-md border border-slate-200 bg-white shadow-sm">
				<CollapsibleTrigger className="w-full flex flex-wrap items-start justify-between gap-3 px-4 py-4 hover:bg-slate-50/50 cursor-pointer transition-colors">
					<div className="flex items-center gap-2 flex-wrap flex-1">
						<h3 className="text-[15px] font-semibold text-slate-900">
							{item.name || "名称未設定"}
						</h3>
						<Badge
							variant="outline"
							className={`${typeColor} text-[12px] font-medium px-2.5 py-1`}
						>
							{typeLabel}
						</Badge>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-[10px] text-slate-400 font-mono">{item.id}</span>
						<ChevronDown
							className={cn(
								"h-5 w-5 text-slate-400 transition-transform duration-200",
								isOpen ? "rotate-180" : ""
							)}
						/>
					</div>
				</CollapsibleTrigger>

				<CollapsibleContent className="p-5 space-y-4">
					{/* エントリポイントを名称直下に配置（最も重要な情報） */}
					<div className="space-y-2">
						<SectionLabel>エントリポイント</SectionLabel>
						{entryPoints.length === 0 ? (
							<div className="text-[12px] text-slate-400">未設定</div>
						) : (
							<div className="space-y-3">
								{entryPoints.map((entry, index) => (
									<div
										key={`${entry.path}-${index}`}
										className="flex items-start gap-2 text-[13px]"
									>
										<FileCode2 className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
										<div className="flex-1 space-y-3">
											<code className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
												{entry.path}
											</code>
											{(entry.type || entry.responsibility) && (
												<div className="text-[12px] text-slate-600 ml-1">
													{entry.type && (
														<span className="font-medium">({entry.type})</span>
													)}
													{entry.type && entry.responsibility && " "}
													{entry.responsibility && (
														<span className="text-slate-500">
															- {entry.responsibility}
														</span>
													)}
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* 概要を3番目に配置 */}
					<div className="space-y-2">
						<SectionLabel>概要</SectionLabel>
						<div className="text-[13px] text-slate-600">{item.summary}</div>
					</div>

					{item.designPolicy && (
						<div className="space-y-2">
							<SectionLabel>設計方針</SectionLabel>
							<div className="text-[12px] text-slate-600 whitespace-pre-wrap">
								{item.designPolicy}
							</div>
						</div>
					)}

					{parseError && (
						<div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
							構造化データの読み込みに失敗しました: {parseError}
						</div>
					)}

					<div className="space-y-2">
						<SectionLabel>details</SectionLabel>
						{hierarchicalValue ? (
							<div className="p-3 bg-slate-50 rounded-md border border-slate-200">
								<HierarchicalViewer
									value={hierarchicalValue}
									keyLabelMap={DD_DETAILS_KEY_LABELS}
								/>
							</div>
						) : (
							<div className="p-4 bg-slate-50 rounded-md border border-slate-200">
								<span className="text-slate-400 italic text-[13px]">未設定</span>
							</div>
						)}
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}
