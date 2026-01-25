"use client";

import { Badge } from "@/components/ui/badge";
import { SectionCard, EmptyState } from "./section-card";
import type { SystemDesignItem } from "@/lib/domain";
import type { SystemDesignItemV2 } from "@/lib/domain/schemas/system-design";
import { getDesignCategoryLabel } from "@/lib/data/system-functions";
import { isV2Item } from "@/lib/domain/schemas/system-design";

interface SystemDesignSectionProps {
	systemDesign: (SystemDesignItem | SystemDesignItemV2)[];
}

const PERSPECTIVE_LABELS: Record<string, string> = {
	function: "機能",
	data: "データ",
	exception: "例外",
	auth: "認証・認可",
	non_functional: "非機能",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
	screen: "画面",
	batch: "バッチ",
	api: "API",
	job: "ジョブ",
	template: "テンプレート",
	service: "サービス",
};

export function SystemDesignSection({ systemDesign }: SystemDesignSectionProps): React.ReactNode {
	return (
		<SectionCard title="システム設計" count={systemDesign.length}>
			{systemDesign.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-3">
					{systemDesign.map((item) => (
						<DesignItem key={item.id} item={item} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

function DesignItem({ item }: { item: SystemDesignItem | SystemDesignItemV2 }): React.ReactNode {
	// V2形式か判定
	if (isV2Item(item)) {
		return <DesignItemV2 item={item} />;
	}
	return <DesignItemLegacy item={item} />;
}

function DesignItemV2({ item }: { item: SystemDesignItemV2 }): React.ReactNode {
	const content = item.content as any;
	const categoryLabel = PERSPECTIVE_LABELS[item.category] || item.category;
	const targetTypeLabel = TARGET_TYPE_LABELS[item.target.type] || item.target.type;

	return (
		<div className="rounded-md border border-slate-200 bg-slate-50/50 p-4">
			<div className="flex items-center gap-2 mb-3 flex-wrap">
				<Badge
					variant="outline"
					className="border-blue-200/60 bg-blue-50 text-blue-700 text-[12px] font-medium px-2.5 py-1"
				>
					{categoryLabel}
				</Badge>
				<Badge
					variant="outline"
					className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2.5 py-1"
				>
					{item.target.name} ({targetTypeLabel})
				</Badge>
				<span className="text-[11px] text-slate-400 font-mono">{item.id}</span>
				{item.priority === "high" && (
					<Badge className="border-red-200/60 bg-red-50 text-red-700 text-[11px] font-medium px-2.5 py-1">
						重要
					</Badge>
				)}
			</div>
			<div className="text-[14px] font-medium text-slate-900 mb-3">
				{item.title}
			</div>

			{/* 観点別のcontent表示 */}
			<div className="text-[13px] text-slate-600 leading-relaxed space-y-2">
				{item.category === "function" && (
					<>
						<div><span className="font-medium text-slate-700">入力:</span> {content.input}</div>
						<div><span className="font-medium text-slate-700">処理:</span> {content.process}</div>
						<div><span className="font-medium text-slate-700">出力:</span> {content.output}</div>
						{content.sideEffects && <div><span className="font-medium text-slate-700">副作用:</span> {content.sideEffects}</div>}
					</>
				)}
				{item.category === "data" && (
					<>
						<div><span className="font-medium text-slate-700">対象項目:</span> {content.fields}</div>
						{content.tables && content.tables.length > 0 && (
							<div><span className="font-medium text-slate-700">テーブル:</span> {content.tables.join(", ")}</div>
						)}
						{content.constraints && <div><span className="font-medium text-slate-700">制約:</span> {content.constraints}</div>}
						{content.migration && <div><span className="font-medium text-slate-700">マイグレーション:</span> {content.migration}</div>}
					</>
				)}
				{item.category === "exception" && (
					<>
						<div><span className="font-medium text-slate-700">エラーケース:</span> {content.errorCases}</div>
						{content.userNotification && <div><span className="font-medium text-slate-700">ユーザー通知:</span> {content.userNotification}</div>}
						{content.logging && <div><span className="font-medium text-slate-700">ロギング:</span> {content.logging}</div>}
						{content.recovery && <div><span className="font-medium text-slate-700">リカバリー:</span> {content.recovery}</div>}
					</>
				)}
				{item.category === "auth" && (
					<>
						<div><span className="font-medium text-slate-700">対象ロール:</span> {content.roles}</div>
						<div><span className="font-medium text-slate-700">許可操作:</span> {content.operations}</div>
						{content.boundary && <div><span className="font-medium text-slate-700">認可境界:</span> {content.boundary}</div>}
					</>
				)}
				{item.category === "non_functional" && (
					<>
						{content.performance && <div><span className="font-medium text-slate-700">パフォーマンス:</span> {content.performance}</div>}
						{content.availability && <div><span className="font-medium text-slate-700">可用性:</span> {content.availability}</div>}
						{content.monitoring && <div><span className="font-medium text-slate-700">監視:</span> {content.monitoring}</div>}
					</>
				)}
			</div>
		</div>
	);
}

function DesignItemLegacy({ item }: { item: SystemDesignItem }): React.ReactNode {
	return (
		<div className="rounded-md border border-slate-200 bg-slate-50/50 p-4">
			<div className="flex items-center gap-2 mb-2">
				<Badge
					variant="outline"
					className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2.5 py-1"
				>
					{getDesignCategoryLabel(item.category)}
				</Badge>
				<span className="text-[11px] text-slate-400 font-mono">{item.id}</span>
				{item.priority === "high" && (
					<Badge className="border-red-200/60 bg-red-50 text-red-700 text-[11px] font-medium px-2.5 py-1">
						重要
					</Badge>
				)}
			</div>
			<div className="text-[13px] font-medium text-slate-900 mb-1">
				{item.title}
			</div>
			<div className="text-[13px] text-slate-600 leading-relaxed">
				{item.description}
			</div>
		</div>
	);
}
