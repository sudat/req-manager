"use client";

import { Badge } from "@/components/ui/badge";
import { SectionCard, EmptyState, SectionLabel } from "./section-card";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";

interface DeliverablesSectionProps {
	deliverables: Deliverable[];
}

const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
	screen: "画面",
	batch: "バッチ",
	api: "API",
	job: "ジョブ",
	template: "テンプレート",
	service: "サービス",
};

const PERSPECTIVE_LABELS: Record<string, string> = {
	function: "機能",
	data: "データ",
	exception: "例外",
	auth: "認証・認可",
	non_functional: "非機能",
};

/**
 * 成果物セクション表示コンポーネント
 * deliverables配列を受け取り、5観点（function, data, exception, auth, non_functional）で表示
 */
export function DeliverablesSection({ deliverables }: DeliverablesSectionProps): React.ReactNode {
	return (
		<SectionCard title="成果物" count={deliverables.length}>
			{deliverables.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-3">
					{deliverables.map((item) => (
						<DeliverableItem key={item.id} item={item} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

function DeliverableItem({ item }: { item: Deliverable }): React.ReactNode {
	const typeLabel = DELIVERABLE_TYPE_LABELS[item.type] || item.type;

	return (
		<div className="rounded-md border border-slate-200 bg-slate-50/50 p-4 space-y-3">
			{/* ヘッダー: 成果物名と種別 */}
			<div className="flex items-center gap-2 flex-wrap">
				<h3 className="text-[14px] font-semibold text-slate-900">{item.name}</h3>
				<Badge
					variant="outline"
					className="border-blue-200/60 bg-blue-50 text-blue-700 text-[12px] font-medium px-2.5 py-1"
				>
					{typeLabel}
				</Badge>
				{item.entryPoint && (
					<code className="text-[11px] text-slate-500 font-mono">{item.entryPoint}</code>
				)}
			</div>

			{/* 5観点の設計内容 */}
			{item.design.function && (
				<PerspectiveContent
					label={PERSPECTIVE_LABELS.function}
					content={item.design.function}
				/>
			)}
			{item.design.data && (
				<PerspectiveContent
					label={PERSPECTIVE_LABELS.data}
					content={item.design.data}
				/>
			)}
			{item.design.exception && (
				<PerspectiveContent
					label={PERSPECTIVE_LABELS.exception}
					content={item.design.exception}
				/>
			)}
			{item.design.auth && (
				<PerspectiveContent
					label={PERSPECTIVE_LABELS.auth}
					content={item.design.auth}
				/>
			)}
			{item.design.non_functional && (
				<PerspectiveContent
					label={PERSPECTIVE_LABELS.non_functional}
					content={item.design.non_functional}
				/>
			)}
		</div>
	);
}

interface PerspectiveContentProps {
	label: string;
	content: any;
}

function PerspectiveContent({ label, content }: PerspectiveContentProps): React.ReactNode {
	return (
		<div className="border-t border-slate-200/60 pt-2">
			<SectionLabel className="mb-1">{label}</SectionLabel>
			<div className="text-[13px] text-slate-600 leading-relaxed space-y-1">
				{content.input && <div><span className="font-medium text-slate-700">入力:</span> {content.input}</div>}
				{content.process && <div><span className="font-medium text-slate-700">処理:</span> {content.process}</div>}
				{content.output && <div><span className="font-medium text-slate-700">出力:</span> {content.output}</div>}
				{content.sideEffects && <div><span className="font-medium text-slate-700">副作用:</span> {content.sideEffects}</div>}

				{content.fields && <div><span className="font-medium text-slate-700">対象項目:</span> {content.fields}</div>}
				{content.tables && content.tables.length > 0 && (
					<div><span className="font-medium text-slate-700">テーブル:</span> {content.tables.join(", ")}</div>
				)}
				{content.constraints && <div><span className="font-medium text-slate-700">制約:</span> {content.constraints}</div>}
				{content.migration && <div><span className="font-medium text-slate-700">マイグレーション:</span> {content.migration}</div>}

				{content.errorCases && <div><span className="font-medium text-slate-700">エラーケース:</span> {content.errorCases}</div>}
				{content.userNotification && <div><span className="font-medium text-slate-700">ユーザー通知:</span> {content.userNotification}</div>}
				{content.logging && <div><span className="font-medium text-slate-700">ロギング:</span> {content.logging}</div>}
				{content.recovery && <div><span className="font-medium text-slate-700">リカバリー:</span> {content.recovery}</div>}

				{content.roles && <div><span className="font-medium text-slate-700">対象ロール:</span> {content.roles}</div>}
				{content.operations && <div><span className="font-medium text-slate-700">許可操作:</span> {content.operations}</div>}
				{content.boundary && <div><span className="font-medium text-slate-700">認可境界:</span> {content.boundary}</div>}

				{content.performance && <div><span className="font-medium text-slate-700">パフォーマンス:</span> {content.performance}</div>}
				{content.availability && <div><span className="font-medium text-slate-700">可用性:</span> {content.availability}</div>}
				{content.monitoring && <div><span className="font-medium text-slate-700">監視:</span> {content.monitoring}</div>}
				{content.security && <div><span className="font-medium text-slate-700">セキュリティ:</span> {content.security}</div>}
				{content.scalability && <div><span className="font-medium text-slate-700">スケーラビリティ:</span> {content.scalability}</div>}
			</div>
		</div>
	);
}
