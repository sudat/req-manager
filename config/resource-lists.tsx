"use client";

import type { LucideIcon } from "lucide-react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { stripMarkdown } from "@/lib/utils";

/** セルのレンダリング関数 */
export type CellRenderer<T> = (item: T) => React.ReactNode;

/** アクションボタン */
export type ActionButton<T> = {
	icon: LucideIcon;
	label: string;
	href?: (item: T) => string;
	onClick?: (item: T) => void;
	variant?: "default" | "outline" | "ghost" | "link" | "destructive";
};

/** カラム定義 */
export type ColumnDef<T> = {
	id: string;
	header: string;
	className?: string;
	cell: CellRenderer<T>;
};

/** 並び替え用型 */
export type SortOrderUpdate = {
	id: string;
	sortOrder: number;
};

/** リスト設定 */
export type ResourceListConfig<T> = {
	/** ページタイトル */
	title: string;
	/** ページ説明 */
	description: string;
	/** 検索プレースホルダー */
	searchPlaceholder: string;
	/** 新規作成ボタンのリンク先 */
	createHref: string;
	/** 空状態メッセージ */
	emptyMessage: string;
	/** エラーメッセージ（エラー時のセルのcolSpan数を含む） */
	errorColSpan: number;
	/** カラム定義 */
	columns: ColumnDef<T>[];
	/** アクションボタン定義 */
	actions?: (item: T) => ActionButton<T>[];
	/** 行クリック時の遷移先 */
	getRowHref?: (item: T) => string;
	/** 検索用テキスト抽出 */
	getSearchText: (item: T) => string;
	/** 並び替え機能を有効にする */
	enableReorder?: boolean;
	/** 並び替え保存時のコールバック */
	onReorderSave?: (updates: SortOrderUpdate[]) => Promise<{ data: boolean | null; error: string | null }>;
};

// ============================================================================
// Business 用設定
// ============================================================================

import type { Business } from "@/lib/domain";

const businessColumns: ColumnDef<Business>[] = [
	{
		id: "area",
		header: "領域コード",
		className: "px-4 py-3",
		cell: (biz) => (
			<Badge variant="outline" className="font-mono text-[12px] font-medium border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5">
				{biz.area}
			</Badge>
		),
	},
	{
		id: "name",
		header: "業務名",
		className: "px-4 py-3",
		cell: (biz) => (
			<span className="text-[14px] font-medium text-slate-900">{biz.name}</span>
		),
	},
	{
		id: "summary",
		header: "業務概要",
		className: "px-4 py-3",
		cell: (biz) => (
			<div className="max-w-[300px] truncate text-[13px] text-slate-600" title={stripMarkdown(biz.summary)}>
				{stripMarkdown(biz.summary)}
			</div>
		),
	},
	{
		id: "businessReqCount",
		header: "業務要件数",
		className: "px-4 py-3",
		cell: (biz) => (
			<div className="flex items-baseline gap-1.5">
				<span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">{biz.businessReqCount}</span>
				<span className="text-[11px] text-slate-400">件</span>
			</div>
		),
	},
	{
		id: "systemReqCount",
		header: "システム要件数",
		className: "px-4 py-3",
		cell: (biz) => (
			<div className="flex items-baseline gap-1.5">
				<span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">{biz.systemReqCount}</span>
				<span className="text-[11px] text-slate-400">件</span>
			</div>
		),
	},
];

export const businessListConfig: ResourceListConfig<Business> = {
	title: "業務一覧",
	description: "業務体系の管理（ベースライン/仕様）",
	searchPlaceholder: "業務名、領域で検索...",
	createHref: "/business/create",
	emptyMessage: "該当する業務がありません。",
	errorColSpan: 6,
	columns: businessColumns,
	actions: (biz) => [
		{
			icon: Eye,
			label: "照会",
			href: () => `/business/${biz.area}`,
		},
		{
			icon: Pencil,
			label: "編集",
			href: () => `/business/${biz.area}/edit`,
		},
	],
	getRowHref: (biz) => `/business/${biz.area}`,
	getSearchText: (biz) => [biz.area, biz.name, biz.summary].join(" "),
	enableReorder: true,
	onReorderSave: async (updates) => {
		const { updateBusinessesSortOrder } = await import("@/lib/data/businesses");
		return await updateBusinessesSortOrder(updates);
	},
};

// ============================================================================
// SystemDomain 用設定
// ============================================================================

import type { SystemDomain } from "@/lib/data/system-domains";

const systemDomainColumns: ColumnDef<SystemDomain & { functionCount?: number }>[] = [
	{
		id: "id",
		header: "ID",
		className: "px-4 py-3",
		cell: (domain) => (
			<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 font-mono text-[12px] font-medium px-2 py-0.5">
				{domain.id}
			</Badge>
		),
	},
	{
		id: "name",
		header: "システム領域",
		className: "px-4 py-3",
		cell: (domain) => <span className="text-[14px] font-medium text-slate-900">{domain.name}</span>,
	},
	{
		id: "description",
		header: "説明",
		className: "px-4 py-3",
		cell: (domain) => <span className="text-[13px] text-slate-600">{domain.description}</span>,
	},
	{
		id: "functionCount",
		header: "機能数",
		className: "px-4 py-3",
		cell: (domain) => (
			<div className="flex items-baseline gap-1.5">
				<span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">{domain.functionCount ?? 0}</span>
				<span className="text-[11px] text-slate-400">件</span>
			</div>
		),
	},
];

export const systemDomainListConfig: ResourceListConfig<SystemDomain & { functionCount?: number }> = {
	title: "システム領域一覧",
	description: "システム領域ごとに機能を整理します",
	searchPlaceholder: "システム領域を検索...",
	createHref: "/system/create",
	emptyMessage: "該当するシステム領域がありません。",
	errorColSpan: 5,
	columns: systemDomainColumns,
	actions: (domain) => [
		{
			icon: Eye,
			label: "照会",
			href: () => `/system/${domain.id}`,
		},
		{
			icon: Pencil,
			label: "編集",
			href: () => `/system/${domain.id}/edit`,
		},
	],
	getRowHref: (domain) => `/system/${domain.id}`,
	getSearchText: (domain) => `${domain.id} ${domain.name} ${domain.description}`,
	enableReorder: true,
	onReorderSave: async (updates) => {
		const { updateSystemDomainsSortOrder } = await import("@/lib/data/system-domains");
		return await updateSystemDomainsSortOrder(updates);
	},
};

// ============================================================================
// Concept (Ideas) 用設定
// ============================================================================

import type { Concept } from "@/lib/domain";

const conceptColumns: ColumnDef<Concept>[] = [
	{
		id: "id",
		header: "概念ID",
		className: "px-4 py-3",
		cell: (concept) => (
			<span className="font-mono text-[12px] text-slate-400">{concept.id}</span>
		),
	},
	{
		id: "name",
		header: "概念名",
		className: "px-4 py-3",
		cell: (concept) => (
			<span className="text-[14px] font-medium text-slate-900">{concept.name}</span>
		),
	},
	{
		id: "synonyms",
		header: "同義語",
		className: "px-4 py-3",
		cell: (concept) => (
			<div className="flex flex-wrap gap-1.5">
				{concept.synonyms.map((s, i) => (
					<Badge
						key={i}
						variant="outline"
						className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
					>
						{s}
					</Badge>
				))}
			</div>
		),
	},
	{
		id: "areas",
		header: "影響領域",
		className: "px-4 py-3",
		cell: (concept) => (
			<div className="flex flex-wrap gap-1.5">
				{concept.areas.map((area, i) => (
					<Badge
						key={i}
						variant="outline"
						className="font-mono border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
					>
						{area}
					</Badge>
				))}
			</div>
		),
	},
	{
		id: "requirementCount",
		header: "使用要件数",
		className: "px-4 py-3",
		cell: (concept) => (
			<div className="flex items-baseline gap-1.5">
				<span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">{concept.requirementCount}</span>
				<span className="text-[11px] text-slate-400">件</span>
			</div>
		),
	},
];

export const conceptListConfig: ResourceListConfig<Concept> = {
	title: "概念辞書",
	description: "用語の同義語、影響領域、必読ドキュメントを管理",
	searchPlaceholder: "概念名、同義語、領域で検索...",
	createHref: "/ideas/create",
	emptyMessage: "該当する概念がありません。",
	errorColSpan: 6,
	columns: conceptColumns,
	actions: (concept) => [
		{
			icon: Eye,
			label: "照会",
			href: () => `/ideas/${concept.id}`,
		},
		{
			icon: Pencil,
			label: "編集",
			href: () => `/ideas/${concept.id}/edit`,
		},
	],
	getRowHref: (concept) => `/ideas/${concept.id}`,
	getSearchText: (concept) => [concept.id, concept.name, ...concept.synonyms, ...concept.areas].join(" "),
	enableReorder: true,
	onReorderSave: async (updates) => {
		const { updateConceptsSortOrder } = await import("@/lib/data/concepts");
		return await updateConceptsSortOrder(updates);
	},
};

// ============================================================================
// SystemFunction 用設定
// ============================================================================

import type { SystemFunction } from "@/lib/domain";

const systemFunctionColumns: ColumnDef<SystemFunction>[] = [
	{
		id: "id",
		header: "機能ID",
		className: "px-4 py-3",
		cell: (sf) => (
			<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 font-mono text-[12px] font-medium px-2 py-0.5">
				{sf.id}
			</Badge>
		),
	},
	{
		id: "title",
		header: "機能名",
		className: "px-4 py-3",
		cell: (sf) => <span className="text-[14px] font-medium text-slate-900">{sf.title}</span>,
	},
	{
		id: "category",
		header: "カテゴリ",
		className: "px-4 py-3",
		cell: (sf) => {
			const categoryLabels: Record<SystemFunction["category"], string> = {
				screen: "画面",
				internal: "内部処理",
				interface: "外部連携",
			};
			return (
				<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] px-2 py-0.5">
					{categoryLabels[sf.category]}
				</Badge>
			);
		},
	},
	{
		id: "status",
		header: "ステータス",
		className: "px-4 py-3",
		cell: (sf) => {
			const statusConfig: Record<
				SystemFunction["status"],
				{ label: string; className: string }
			> = {
				not_implemented: { label: "未実装", className: "border-slate-300 bg-slate-100 text-slate-600" },
				implementing: { label: "実装中", className: "border-blue-300 bg-blue-50 text-blue-700" },
				testing: { label: "テスト中", className: "border-amber-300 bg-amber-50 text-amber-700" },
				implemented: { label: "実装済", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
			};
			const config = statusConfig[sf.status];
			return (
				<Badge variant="outline" className={`text-[12px] px-2 py-0.5 ${config.className}`}>
					{config.label}
				</Badge>
			);
		},
	},
	{
		id: "summary",
		header: "概要",
		className: "px-4 py-3",
		cell: (sf) => (
			<div className="max-w-[300px] truncate text-[13px] text-slate-600" title={stripMarkdown(sf.summary)}>
				{stripMarkdown(sf.summary)}
			</div>
		),
	},
];

export const createSystemFunctionListConfig = (
	domainId: string
): ResourceListConfig<SystemFunction> => ({
	title: "システム機能一覧",
	description: "システム領域に属する機能の一覧",
	searchPlaceholder: "機能名、IDで検索...",
	createHref: `/system/${domainId}/create`,
	emptyMessage: "該当する機能がありません。",
	errorColSpan: 6,
	columns: systemFunctionColumns,
	actions: (sf) => [
		{
			icon: Eye,
			label: "照会",
			href: () => `/system/${domainId}/${sf.id}`,
		},
		{
			icon: Pencil,
			label: "編集",
			href: () => `/system/${domainId}/${sf.id}/edit`,
		},
	],
	getRowHref: (sf) => `/system/${domainId}/${sf.id}`,
	getSearchText: (sf) => [sf.id, sf.title, sf.summary].join(" "),
	enableReorder: true,
	onReorderSave: async (updates) => {
		const { updateSystemFunctionsSortOrder } = await import("@/lib/data/system-functions");
		return await updateSystemFunctionsSortOrder(updates);
	},
});

// ============================================================================
// BusinessTask 用設定
// ============================================================================

import type { Task } from "@/lib/domain";
import { parseYamlKeySourceList } from "@/lib/utils/yaml";

/** formatKeySource を共通関数として抽出（Task用） */
const formatTaskKeySource = (value: string): string => {
	const parsed = parseYamlKeySourceList(value);
	const items = parsed.value.filter((item) => item.name || item.source);
	if (items.length === 0) return value;
	return items
		.map((item) => {
			const name = item.name || "—";
			const source = item.source ? ` / ${item.source}` : "";
			return `${name}${source}`;
		})
		.join(" | ");
};

const businessTaskColumns: ColumnDef<Task>[] = [
	{
		id: "id",
		header: "業務タスクID",
		className: "px-4 py-3",
		cell: (task) => <span className="font-mono text-[12px] text-slate-400">{task.id}</span>,
	},
	{
		id: "name",
		header: "業務タスク",
		className: "px-4 py-3",
		cell: (task) => <span className="text-[14px] font-medium text-slate-900">{task.name}</span>,
	},
	{
		id: "summary",
		header: "業務概要",
		className: "px-4 py-3",
		cell: (task) => (
			<div className="max-w-[300px] truncate text-[13px] text-slate-600" title={stripMarkdown(task.summary)}>
				{stripMarkdown(task.summary)}
			</div>
		),
	},
	{
		id: "input",
		header: "インプット",
		className: "px-4 py-3",
		cell: (task) => {
			const label = formatTaskKeySource(task.input);
			return (
				<div className="max-w-[150px] truncate text-[13px] text-slate-600" title={label}>
					{label}
				</div>
			);
		},
	},
	{
		id: "output",
		header: "アウトプット",
		className: "px-4 py-3",
		cell: (task) => {
			const label = formatTaskKeySource(task.output);
			return (
				<div className="max-w-[150px] truncate text-[13px] text-slate-600" title={label}>
					{label}
				</div>
			);
		},
	},
];

export const createBusinessTaskListConfig = (
	businessArea: string
): ResourceListConfig<Task> => ({
	title: "業務一覧（詳細）",
	description: "業務領域内の業務タスク（業務プロセスの細分）",
	searchPlaceholder: "業務タスク名、ID、業務概要、inputs/outputsで検索...",
	createHref: `/business/${businessArea}/create`,
	emptyMessage: "該当する業務タスクがありません。",
	errorColSpan: 6,
	columns: businessTaskColumns,
	actions: (task) => [
		{
			icon: Eye,
			label: "照会",
			href: () => `/business/${businessArea}/${task.id}`,
		},
		{
			icon: Pencil,
			label: "編集",
			href: () => `/business/${businessArea}/${task.id}/edit`,
		},
	],
	getRowHref: (task) => `/business/${businessArea}/${task.id}`,
	getSearchText: (task) => [
		task.id,
		task.name,
		task.summary,
		task.businessContext,
		task.processSteps,
		task.input,
		task.output,
		task.conceptIdsYaml,
	].join(" "),
	enableReorder: true,
	onReorderSave: async (updates) => {
		const { updateTasksSortOrder } = await import("@/lib/data/tasks");
		return await updateTasksSortOrder(updates);
	},
});
