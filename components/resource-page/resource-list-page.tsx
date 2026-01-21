"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/skeleton";
import { confirmDelete } from "@/lib/ui/confirm";
import type { ResourceListConfig, ActionButton } from "@/config/resource-lists";

type ResourceListPageProps<T> = {
	config: ResourceListConfig<T>;
	fetchData: () => Promise<{ data: T[] | null; error: string | null }>;
	deleteItem?: (id: string) => Promise<{ data: null; error: string | null } | { data: boolean; error: null }>;
};

export function ResourceListPage<T extends { id: string }>({
	config,
	fetchData,
	deleteItem,
}: ResourceListPageProps<T>) {
	const router = useRouter();
	const [items, setItems] = useState<T[]>([]);
	const [query, setQuery] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// データフェッチ
	useEffect(() => {
		let active = true;
		const fetchDataInternal = async () => {
			setLoading(true);
			const { data, error: fetchError } = await fetchData();
			if (!active) return;
			if (fetchError) {
				setError(fetchError);
				setItems([]);
			} else {
				setError(null);
				setItems(data ?? []);
			}
			setLoading(false);
		};
		fetchDataInternal();
		return () => {
			active = false;
		};
	}, [fetchData]);

	// 検索フィルタ
	const filtered = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return items;
		return items.filter((item) => {
			const searchText = config.getSearchText(item);
			return searchText.toLowerCase().includes(normalized);
		});
	}, [items, query, config]);

	// 行クリック
	const handleRowClick = useCallback(
		(item: T) => {
			if (config.getRowHref) {
				router.push(config.getRowHref(item));
			}
		},
		[config, router],
	);

	// 削除処理
	const handleDelete = useCallback(
		async (item: T) => {
			if (!deleteItem) return;
			const itemLabel = config.getSearchText(item).split(" ")[0];
			if (!confirmDelete(itemLabel)) return;
			const { error: deleteError } = await deleteItem(item.id);
			if (deleteError) {
				alert(deleteError);
				return;
			}
			setItems((prev) => prev.filter((i) => i.id !== item.id));
		},
		[deleteItem, config],
	);

	// アクションボタンレンダリング
	const renderActions = useCallback(
		(item: T) => {
			const actions = config.actions?.(item) ?? [];
			const deleteAction = deleteItem
				? [
						{
							icon: require("lucide-react").Trash2,
							label: "削除",
							onClick: () => handleDelete(item),
							variant: "outline" as const,
						} as const,
				  ]
				: [];

			return [...actions, ...deleteAction].map((action, idx) => {
				const Icon = action.icon;
				const content = (
					<Button
						key={idx}
						size="icon"
						variant={action.variant ?? "outline"}
						title={action.label}
						className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
						onClick={(e) => {
							e.stopPropagation();
							if ("onClick" in action && action.onClick) {
								action.onClick(item);
							}
						}}
					>
						<Icon className="h-4 w-4" />
					</Button>
				);

				if ("href" in action && action.href) {
					return (
						<Link key={idx} href={action.href(item)} onClick={(e) => e.stopPropagation()}>
							{content}
						</Link>
					);
				}
				return content;
			});
		},
		[config, deleteItem, handleDelete],
	);

	return (
		<>
			<MobileHeader />
			<div className="flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-4">
					{/* Page Header */}
					<div className="mb-4">
						<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
							{config.title}
						</h1>
						<p className="text-[13px] text-slate-500">{config.description}</p>
					</div>

					{/* Search Bar */}
					<div className="mb-4 flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<input
								type="text"
								placeholder={config.searchPlaceholder}
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
							/>
						</div>
						<Link href={config.createHref}>
							<Button className="h-8 px-4 text-[14px] font-medium bg-slate-900 hover:bg-slate-800 gap-2">
								<Plus className="h-4 w-4" />
								新規作成
							</Button>
						</Link>
					</div>

					{/* Table */}
					<div className="rounded-md border border-slate-200 bg-white overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow className="border-b border-slate-200">
									{config.columns.map((col) => (
										<TableHead
											key={col.id}
											className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3"
										>
											{col.header}
										</TableHead>
									))}
									{(config.actions || deleteItem) && (
										<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
											操作
										</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableSkeleton cols={config.columns.length + (config.actions || deleteItem ? 1 : 0)} rows={5} />
								) : error ? (
									<TableRow>
										<TableCell colSpan={config.errorColSpan} className="px-4 py-10 text-center text-[14px] text-rose-600">
											{error}
										</TableCell>
									</TableRow>
								) : filtered.length === 0 ? (
									<TableRow>
										<TableCell colSpan={config.errorColSpan} className="px-4 py-10 text-center text-[14px] text-slate-500">
											{config.emptyMessage}
										</TableCell>
									</TableRow>
								) : (
									filtered.map((item) => (
										<TableRow
											key={item.id}
											className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
											onClick={() => handleRowClick(item)}
										>
											{config.columns.map((col) => (
												<TableCell key={col.id} className={col.className}>
													{col.cell(item)}
												</TableCell>
											))}
											{(config.actions || deleteItem) && (
												<TableCell className="px-4 py-3">
													<div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
														{renderActions(item)}
													</div>
												</TableCell>
											)}
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>
		</>
	);
}
