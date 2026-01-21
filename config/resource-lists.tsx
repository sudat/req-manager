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
};

// ============================================================================
// Business 用設定
// ============================================================================

import type { Business } from "@/lib/domain";

const businessColumns: ColumnDef<Business>[] = [
	{
		id: "id",
		header: "ID",
		className: "px-4 py-3",
		cell: (biz) => (
			<span className="font-mono text-[12px] text-slate-400">{biz.id}</span>
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
		id: "area",
		header: "領域",
		className: "px-4 py-3",
		cell: (biz) => (
			<Badge variant="outline" className="font-mono text-[12px] font-medium border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5">
				{biz.area}
			</Badge>
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
	searchPlaceholder: "業務名、ID、領域で検索...",
	createHref: "/business/create",
	emptyMessage: "該当する業務がありません。",
	errorColSpan: 7,
	columns: businessColumns,
	actions: (biz) => [
		{
			icon: Eye,
			label: "照会",
			href: () => `/business/${biz.id}/tasks`,
		},
		{
			icon: Pencil,
			label: "編集",
			href: () => `/business/${biz.id}/edit`,
		},
	],
	getRowHref: (biz) => `/business/${biz.id}/tasks`,
	getSearchText: (biz) => [biz.id, biz.name, biz.area, biz.summary].join(" "),
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
		cell: (domain) => <span className="font-mono text-[13px] text-slate-700">{domain.functionCount ?? 0}</span>,
	},
];

export const systemDomainListConfig: ResourceListConfig<SystemDomain & { functionCount?: number }> = {
	title: "システム領域一覧",
	description: "システム領域ごとに機能を整理します",
	searchPlaceholder: "システム領域を検索...",
	createHref: "/system-domains/create",
	emptyMessage: "該当するシステム領域がありません。",
	errorColSpan: 5,
	columns: systemDomainColumns,
	actions: (domain) => [
		{
			icon: Eye,
			label: "照会",
			href: () => `/system-domains/${domain.id}`,
		},
		{
			icon: Pencil,
			label: "編集",
			href: () => `/system-domains/${domain.id}/edit`,
		},
	],
	getRowHref: (domain) => `/system-domains/${domain.id}`,
	getSearchText: (domain) => `${domain.id} ${domain.name} ${domain.description}`,
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
};
