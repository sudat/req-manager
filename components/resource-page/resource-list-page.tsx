"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback, useEffect, Fragment } from "react";
import Link from "next/link";
import { Search, Plus, Loader2 } from "lucide-react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableResourceRow } from "./sortable-resource-row";
import type { ResourceListConfig, ActionButton, SortOrderUpdate } from "@/config/resource-lists";

type HeaderAction = {
	label: string;
	href?: string;
	onClick?: () => void;
	icon?: React.ComponentType<{ className?: string }>;
	variant?: "default" | "outline" | "ghost" | "ai";
	disabled?: boolean;
};

type BreadcrumbItem = {
	label: string;
	href?: string; // なしだら最後のアイテム（現在ページ）
};

type ResourceListPageProps<T> = {
	config: ResourceListConfig<T>;
	/** データフェッチ関数（items指定時は不要） */
	fetchData?: () => Promise<{ data: T[] | null; error: string | null }>;
	/** 直接データを渡す場合（fetchData指定時は無視される） */
	items?: T[];
	/** ローディング状態（items指定時に使用） */
	loading?: boolean;
	/** エラー（items指定時に使用） */
	error?: string | null;
	/** エラークリア（items指定時に使用） */
	onClearError?: () => void;
	/** 削除処理（itemsモードでは (item: T) => Promise<void>、fetchDataモードでは (id: string) => Promise<{...}> を想定） */
	deleteItem?: ((id: string) => Promise<{ data: null; error: string | null } | { data: boolean; error: null }>) | ((item: T) => Promise<void>);
	/** 削除処理（items指定時、onDelete優先） */
	onDelete?: (item: T) => Promise<void>;
	/** ヘッダータイトル（items指定時に使用） */
	headerTitle?: string;
	/** ヘッダー説明（items指定時に使用） */
	headerDescription?: string;
	/** 戻るリンク（items指定時に使用） */
	backHref?: string;
	/** 戻るリンクラベル（items指定時に使用） */
	backLabel?: string;
	/** パンくずリスト（breadcrumb指定時はbackHref/backLabelより優先） */
	breadcrumb?: BreadcrumbItem[];
	/** ヘッダーバッジ（タイトル横に表示するラベル） */
	headerBadge?: string;
	/** 追加のヘッダーアクション（検索バーのボタンエリアに追加される） */
	extraHeaderActions?: HeaderAction[];
	/** ヘッダーを非表示にする（ページ側でヘッダーを表示する場合） */
	hideHeader?: boolean;
	/** ヘッダーの上に表示する追加コンテンツ（フィルタ表示など） */
	headerAboveContent?: React.ReactNode;
};

export function ResourceListPage<T extends { id: string }>({
	config,
	fetchData,
	items: externalItems,
	loading: externalLoading,
	error: externalError,
	onClearError,
	deleteItem,
	onDelete,
	headerTitle,
	headerDescription,
	backHref,
	backLabel,
	breadcrumb,
	headerBadge,
	extraHeaderActions,
	hideHeader,
	headerAboveContent,
}: ResourceListPageProps<T>) {
	const router = useRouter();
	const [items, setItems] = useState<T[]>([]);
	const [query, setQuery] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isReorderMode, setIsReorderMode] = useState(false);
	const [reorderedItems, setReorderedItems] = useState<T[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	// 外部データモード（externalItems指定時）
	const isExternalMode = externalItems !== undefined;

	useEffect(() => {
		if (isExternalMode) {
			setItems(externalItems);
			setLoading(externalLoading ?? false);
			setError(externalError ?? null);
		}
	}, [isExternalMode, externalItems, externalLoading, externalError]);

	// データフェッチ（fetchData指定時のみ）
	useEffect(() => {
		if (isExternalMode || !fetchData) return;
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
	}, [fetchData, isExternalMode]);

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
			// onDelete優先（externalモード用）
			if (onDelete) {
				const itemLabel = config.getSearchText(item).split(" ")[0];
				if (!confirmDelete(itemLabel)) return;
				await onDelete(item);
				return;
			}
			// deleteItem（fetchDataモード用）
			if (!deleteItem) return;
			const itemLabel = config.getSearchText(item).split(" ")[0];
			if (!confirmDelete(itemLabel)) return;
			const result = await (deleteItem as (id: string) => Promise<{ data: null; error: string | null } | { data: boolean; error: null }>)(item.id);
			if (result.error) {
				alert(result.error);
				return;
			}
			setItems((prev) => prev.filter((i) => i.id !== item.id));
		},
		[onDelete, deleteItem, config],
	);

	// 並び替えモード開始
	const handleEnterReorderMode = useCallback(() => {
		setReorderedItems(filtered);
		setIsReorderMode(true);
		setQuery(""); // 検索フィルタをクリア
	}, [filtered]);

	// ドラッグ終了時の処理
	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		setReorderedItems((items) => {
			const oldIndex = items.findIndex((item) => item.id === active.id);
			const newIndex = items.findIndex((item) => item.id === over.id);
			return arrayMove(items, oldIndex, newIndex);
		});
	}, []);

	// 並び替え保存
	const handleSaveReorder = useCallback(async () => {
		if (!config.onReorderSave) return;
		setIsSaving(true);
		try {
			const updates = reorderedItems.map((item, index) => ({
				id: item.id,
				sortOrder: index,
			}));

			const { data, error } = await config.onReorderSave(updates);

			if (error) {
				alert(`保存に失敗しました: ${error}`);
				return;
			}

			// 成功：データを再読み込み
			if (fetchData) {
				const { data: newData, error: fetchError } = await fetchData();
				if (fetchError) {
					alert("保存しましたが、データの再読み込みに失敗しました");
				} else {
					setItems(newData ?? []);
				}
			} else {
				// externalモードの場合は並び順を反映
				setItems(reorderedItems);
			}
			setIsReorderMode(false);
		} catch (error) {
			alert(error instanceof Error ? error.message : "保存に失敗しました");
		} finally {
			setIsSaving(false);
		}
	}, [config, reorderedItems, fetchData]);

	// 並び替えキャンセル
	const handleCancelReorder = useCallback(() => {
		setReorderedItems([]);
		setIsReorderMode(false);
	}, []);

	// アクションボタンレンダリング
	const renderActions = useCallback(
		(item: T) => {
			const actions = config.actions?.(item) ?? [];
			const deleteAction = (deleteItem || onDelete)
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
		[config, deleteItem, onDelete, handleDelete],
	);

	return (
		<>
			<MobileHeader />
			<div className="flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-4">
					{/* ヘッダーの上に表示する追加コンテンツ */}
					{headerAboveContent}

					{/* Page Header - hideHeader が true の場合は非表示 */}
					{!hideHeader && (
						<div className="mb-4">
							{/* パンくずリスト（breadcrumb指定時は優先、なければbackHref/backLabel） */}
							{breadcrumb ? (
								<Breadcrumb className="mb-3">
									<BreadcrumbList>
										{breadcrumb.map((item, idx) => {
											const isLast = idx === breadcrumb.length - 1;
											return (
												<Fragment key={idx}>
													{item.href ? (
														<BreadcrumbItem>
															<BreadcrumbLink asChild>
																<Link href={item.href}>{item.label}</Link>
															</BreadcrumbLink>
														</BreadcrumbItem>
													) : (
														<BreadcrumbItem>
															<BreadcrumbPage>{item.label}</BreadcrumbPage>
														</BreadcrumbItem>
													)}
													{!isLast && <BreadcrumbSeparator />}
												</Fragment>
											);
										})}
									</BreadcrumbList>
								</Breadcrumb>
							) : backHref && backLabel ? (
								<Link
									href={backHref}
									className="inline-flex items-center gap-1 text-[13px] text-slate-600 hover:text-slate-900 mb-3"
								>
									← {backLabel}
								</Link>
							) : null}

							{/* タイトルとバッジ */}
							<div className="flex items-center gap-3 mb-2">
								<h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
									{headerTitle || config.title}
								</h1>
								{headerBadge && (
									<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-mono px-2 py-0.5">
										{headerBadge}
									</Badge>
								)}
							</div>
							<p className="text-[13px] text-slate-500">{headerDescription || config.description}</p>
						</div>
					)}

					{/* Search Bar */}
					<div className="mb-4 flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<input
								type="text"
								placeholder={config.searchPlaceholder}
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								disabled={isReorderMode}
								className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
							/>
						</div>
						{!isReorderMode ? (
							<>
								{/* extraHeaderActions を追加 */}
								{extraHeaderActions?.map((action, idx) => {
									const Icon = action.icon;
									const aiClass = action.variant === "ai"
										? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
										: "";
									if (action.href) {
										return (
											<Button
												key={`extra-${idx}`}
												asChild
												variant={action.variant === "ai" ? "default" : action.variant ?? "outline"}
												className={`h-8 px-4 text-[14px] font-medium gap-2 ${aiClass || "bg-slate-900 hover:bg-slate-800"}`}
											>
												<Link href={action.href}>
													{Icon && <Icon className="h-4 w-4" />}
													{action.label}
												</Link>
											</Button>
										);
									}
									return (
										<Button
											key={`extra-${idx}`}
											variant={action.variant === "ai" ? "default" : action.variant ?? "outline"}
											className={`h-8 px-4 text-[14px] font-medium gap-2 ${aiClass || "bg-slate-900 hover:bg-slate-800"}`}
											onClick={action.onClick}
											disabled={action.disabled}
										>
											{Icon && <Icon className="h-4 w-4" />}
											{action.label}
										</Button>
									);
								})}
								<Button asChild className="h-8 px-4 text-[14px] font-medium bg-slate-900 hover:bg-slate-800 gap-2">
									<Link href={config.createHref}>
										<Plus className="h-4 w-4" />
										新規作成
									</Link>
								</Button>
								{config.enableReorder && (
									<Button
										onClick={handleEnterReorderMode}
										disabled={filtered.length < 2}
										variant="outline"
										className="h-8 px-4 text-[14px] font-medium border-slate-200 hover:bg-slate-50"
									>
										並び替え
									</Button>
								)}
							</>
						) : (
							<>
								<Button
									onClick={handleSaveReorder}
									disabled={isSaving}
									className="h-8 px-4 text-[14px] font-medium bg-slate-900 hover:bg-slate-800 gap-2"
								>
									{isSaving ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											保存中...
										</>
									) : (
										"保存"
									)}
								</Button>
								<Button
									onClick={handleCancelReorder}
									disabled={isSaving}
									variant="outline"
									className="h-8 px-4 text-[14px] font-medium border-slate-200 hover:bg-slate-50"
								>
									キャンセル
								</Button>
							</>
						)}
					</div>

				{/* Error Display */}
				{error && !loading && (
					<div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm flex justify-between items-center">
						<span>{error}</span>
						{onClearError && (
							<button
								onClick={onClearError}
								className="text-rose-500 hover:text-rose-700 font-medium"
							>
								閉じる
							</button>
						)}
					</div>
				)}

					{/* Table */}
					<div className="rounded-md border border-slate-200 bg-white overflow-hidden">
						{isReorderMode ? (
							// 並び替えモードのテーブル
							<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
								<SortableContext items={reorderedItems.map(t => t.id)} strategy={verticalListSortingStrategy}>
									<Table>
										<TableHeader>
											<TableRow className="border-b border-slate-200">
												<TableHead className="w-10 px-2 py-3"></TableHead>
												{config.columns.map((col) => (
													<TableHead
														key={col.id}
														className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3"
													>
														{col.header}
													</TableHead>
												))}
												{(config.actions || deleteItem || onDelete) && (
													<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
														操作
													</TableHead>
												)}
											</TableRow>
										</TableHeader>
										<TableBody>
											{reorderedItems.map((item) => (
												<SortableResourceRow
													key={item.id}
													item={item}
													config={config}
													onRowClick={() => handleRowClick(item)}
													actions={renderActions(item)}
												/>
											))}
										</TableBody>
									</Table>
								</SortableContext>
							</DndContext>
						) : (
							// 通常のテーブル
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
										{(config.actions || deleteItem || onDelete) && (
											<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
												操作
											</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading ? (
										<TableSkeleton cols={config.columns.length + (config.actions || deleteItem || onDelete ? 1 : 0)} rows={5} />
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
												{(config.actions || deleteItem || onDelete) && (
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
						)}
					</div>
				</div>
			</div>
		</>
	);
}
