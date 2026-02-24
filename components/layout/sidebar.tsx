"use client";

import {
	BookOpen,
	Bot,
	Boxes,
	Briefcase,
	Database,
	Download,
	FileText,
	History,
	LayoutDashboard,
	Link2,
	ListChecks,
	Menu,
	PanelLeft,
	Settings,
	GitPullRequest,
	Table2,
	ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ProjectSwitcher } from "@/components/project/project-switcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

type MenuItem = {
	type: "item";
	key: string;
	label: string;
	href: string;
	icon: any;
};

type MenuSubGroup = {
	type: "subgroup";
	key: string;
	label: string;
	icon: any;
	children: MenuItem[];
};

type MenuGroup = {
	type: "group";
	key: string;
	label: string;
	icon: any;
	children: (MenuItem | MenuSubGroup)[];
};

type MenuConfig = MenuItem | MenuGroup;

const menuConfig: MenuConfig[] = [
	// グループ: メイン
	{
		type: "group" as const,
		key: "main",
		label: "メイン",
		icon: LayoutDashboard,
		children: [
			{
				type: "item" as const,
				key: "dashboard",
				label: "ダッシュボード",
				href: "/dashboard",
				icon: LayoutDashboard,
			},
			{
				type: "item" as const,
				key: "product-requirement",
				label: "プロダクト要件",
				href: "/product-requirement",
				icon: FileText,
			},
			{
				type: "item" as const,
				key: "chat",
				label: "AIチャット",
				href: "/chat",
				icon: Bot,
			},
		],
	},
	// グループ: 要件管理
	{
		type: "group" as const,
		key: "requirements",
		label: "要件管理",
		icon: Briefcase,
		children: [
			{
				type: "item" as const,
				key: "business",
				label: "業務一覧",
				href: "/business",
				icon: Briefcase,
			},
			{
				type: "item" as const,
				key: "system-domains",
				label: "システム領域一覧",
				href: "/system",
				icon: Boxes,
			},
			{
				type: "item" as const,
				key: "ideas",
				label: "概念辞書",
				href: "/ideas",
				icon: BookOpen,
			},
		],
	},
	// グループ: 分析・運用
	{
		type: "group" as const,
		key: "analysis",
		label: "分析・運用",
		icon: ListChecks,
		children: [
			{
				type: "subgroup" as const,
				key: "change-management",
				label: "変更管理",
				icon: GitPullRequest,
				children: [
					{
						type: "item" as const,
						key: "tickets",
						label: "変更要求一覧",
						href: "/tickets",
						icon: ListChecks,
					},
					{
						type: "item" as const,
						key: "baseline",
						label: "ベースライン履歴",
						href: "/baseline",
						icon: History,
					},
					{
						type: "item" as const,
						key: "links",
						label: "要件リンク",
						href: "/links",
						icon: Link2,
					},
				],
			},
			{
				type: "subgroup" as const,
				key: "schema",
				label: "スキーマ",
				icon: Table2,
				children: [
					{
						type: "item" as const,
						key: "schema-er",
						label: "ER図",
						href: "/schema/er",
						icon: Database,
					},
					{
						type: "item" as const,
						key: "schema-sequence",
						label: "シーケンス図",
						href: "/schema/sequence",
						icon: Database,
					},
				],
			},
			{
				type: "item" as const,
				key: "export",
				label: "エクスポート",
				href: "/export",
				icon: Download,
			},
		],
	},
	// 設定はグループなしでフラット
	{
		type: "item" as const,
		key: "settings",
		label: "設定",
		href: "/settings",
		icon: Settings,
	},
];

export function Sidebar() {
	const { isCollapsed, isMobileOpen, setIsMobileOpen, toggleCollapsed } =
		useSidebar();
	const pathname = usePathname();
	const [openPopoverKey, setOpenPopoverKey] = useState<string | null>(null);

	// ページ遷移時にPopoverを閉じる
	useEffect(() => {
		setOpenPopoverKey(null);
	}, [pathname]);

	const isActive = (href: string) => {
		if (href === "/dashboard") {
			return pathname === "/" || pathname === "/dashboard";
		}
		return pathname.startsWith(href);
	};

	const handleLinkClick = () => {
		if (isMobileOpen) {
			setIsMobileOpen(false);
		}
	};

	const isSubGroupActive = (subGroup: MenuSubGroup) =>
		subGroup.children.some((child) => isActive(child.href));

	const isGroupActive = (group: MenuGroup) =>
		group.children.some((child) =>
			child.type === "item"
				? isActive(child.href)
				: isSubGroupActive(child),
		);

	const flattenGroupItems = (group: MenuGroup): MenuItem[] =>
		group.children.flatMap((child) =>
			child.type === "subgroup" ? child.children : [child],
		);

	const menuContent = (
		<div className="flex flex-col h-full">
			<div className="border-b border-slate-200 px-5 py-6">
				<h2 className="text-base font-semibold text-slate-900">
					要件管理ツール
				</h2>
			</div>
			<nav className="flex-1 py-2">
				<ul className="space-y-0">
					{menuConfig.map((item) => {
						if (item.type === "group") {
							const GroupIcon = item.icon;
							const activeGroup = isGroupActive(item);
							return (
								<li key={item.key}>
									<div className="px-5 py-2">
										<div className={cn(
											"flex items-center gap-3 text-sm font-medium",
											activeGroup ? "text-brand-700" : "text-slate-700"
										)}>
											<GroupIcon className="h-5 w-5" />
											<span>{item.label}</span>
										</div>
										<ul className="mt-1 ml-8 space-y-0 border-l-2 border-slate-200 pl-3">
											{item.children.map((child) => {
												if (child.type === "subgroup") {
													const SubGroupIcon = child.icon;
													const activeSubGroup = isSubGroupActive(child);
													return (
																	<li key={child.key}>
																		<Popover open={openPopoverKey === child.key} onOpenChange={(open) => setOpenPopoverKey(open ? child.key : null)}>
																			<PopoverTrigger asChild>
																				<button
																					type="button"
																					className={cn(
																						"w-full flex items-center justify-between gap-2 py-2 text-sm transition hover:text-slate-900 cursor-pointer",
																						activeSubGroup
																							? "text-brand-700 font-semibold"
																							: "text-slate-600",
																					)}
																				>
																					<span className="flex items-center gap-2">
																						<SubGroupIcon className="h-4 w-4" />
																						<span>{child.label}</span>
																					</span>
																					<ChevronRight className="h-3 w-3" />
																				</button>
																			</PopoverTrigger>
																			<PopoverContent side="right" align="start" className="w-56 p-2">
																	<div className="text-xs font-medium text-slate-500 mb-2 px-2">{child.label}</div>
																	<ul className="space-y-1">
																		{child.children.map((grandChild) => {
																			const grandChildActive = isActive(grandChild.href);
																			const GrandChildIcon = grandChild.icon;
																			return (
																				<li key={grandChild.key}>
																					<Link
																						href={grandChild.href}
																						onClick={handleLinkClick}
																						className={cn(
																							"flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition",
																							grandChildActive
																								? "bg-brand-50 text-brand-700 font-medium"
																								: "text-slate-600 hover:bg-slate-100",
																						)}
																					>
																						<GrandChildIcon className="h-4 w-4" />
																						<span>{grandChild.label}</span>
																					</Link>
																				</li>
																			);
																		})}
																	</ul>
																</PopoverContent>
															</Popover>
														</li>
													);
												}
												
												// MenuItem
													const menuItem = child as MenuItem;
													const childActive = isActive(menuItem.href);
													const ChildIcon = menuItem.icon;
													return (
														<li key={menuItem.key}>
															<Link
																href={menuItem.href}
																onClick={handleLinkClick}
																className={cn(
																	"flex items-center gap-2 py-2 text-sm transition hover:text-slate-900",
																	childActive
																		? "text-brand-700 font-semibold"
																		: "text-slate-600",
																)}
															>
																<ChildIcon className="h-4 w-4" />
																<span>{menuItem.label}</span>
															</Link>
														</li>
													);
											})}
										</ul>
									</div>
								</li>
							);
						}

						// MenuItem
						const active = isActive(item.href);
						const Icon = item.icon;
						return (
							<li key={item.key}>
								<Link
									href={item.href}
									onClick={handleLinkClick}
									className={cn(
										"flex items-center gap-3 px-5 py-3 text-sm transition",
										active
											? "bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-600"
											: "text-slate-600 hover:bg-slate-100",
									)}
								>
									<Icon className="h-5 w-5" />
									<span>{item.label}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
			<div className="border-t border-slate-200 p-3">
				<ProjectSwitcher />
			</div>
		</div>
	);

	return (
		<>
			<Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
				<SheetContent
					side="left"
					className="w-[80%] max-w-[300px] p-0 bg-white md:hidden"
					overlayClassName="md:hidden"
				>
					{menuContent}
				</SheetContent>
			</Sheet>
			<aside
				data-sidebar
				className={cn(
					"fixed left-0 top-0 hidden h-screen overflow-hidden border-r border-slate-200 bg-white/95 backdrop-blur transition-all duration-300 md:flex md:flex-col",
					isCollapsed ? "w-[64px]" : "w-[280px]",
				)}
			>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={toggleCollapsed}
								className="absolute right-3 top-5 z-10"
								aria-label={
									isCollapsed ? "サイドバーを開く" : "サイドバーを閉じる"
								}
							>
								{isCollapsed ? (
									<Menu className="h-5 w-5" />
								) : (
									<PanelLeft className="h-5 w-5" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="right">
							{isCollapsed ? "開く" : "閉じる"}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{!isCollapsed && (
					<div className="border-b border-slate-200 px-5 py-6">
						<h2 className="text-base font-semibold text-slate-900">
							要件管理ツール
						</h2>
					</div>
				)}
				<nav
					className={cn(
						"flex-1 overflow-y-auto hide-scrollbar py-2 pb-6",
						isCollapsed && "pt-[90px]",
					)}
				>
					<TooltipProvider>
						<ul
							className={cn(
								"flex flex-col space-y-0",
								isCollapsed && "space-y-1.5",
							)}
						>
						{menuConfig.map((item) => {
							if (item.type === "group") {
								// 折りたたみ時は子要素・孫要素をフラットに表示
								if (isCollapsed) {
									const flattenedItems = flattenGroupItems(item);
									
									return flattenedItems.map((flattedItem) => {
										const active = isActive(flattedItem.href);
										const Icon = flattedItem.icon;
										const linkContent = (
											<Link
												href={flattedItem.href}
												className={cn(
													"flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-100 hover:text-slate-900",
													"justify-center px-0 py-2.5",
													active
														? "bg-brand-50 text-brand-700 font-semibold"
														: "text-slate-600",
												)}
											>
												<Icon className="h-5 w-5 shrink-0" />
												<span className="sr-only">{flattedItem.label}</span>
											</Link>
										);

										return (
											<li key={flattedItem.key}>
												<Tooltip>
													<TooltipTrigger asChild>{linkContent}</TooltipTrigger>
													<TooltipContent side="right">
														{flattedItem.label}
													</TooltipContent>
												</Tooltip>
											</li>
										);
									});
								}
								
								// 展開時はグループ表示
								const GroupIcon = item.icon;
								const activeGroup = isGroupActive(item);
								return (
									<li key={item.key}>
										<div className="px-5 py-2">
											<div className={cn(
												"flex items-center gap-3 text-sm font-medium",
												activeGroup ? "text-brand-700" : "text-slate-700"
											)}>
												<GroupIcon className="h-5 w-5" />
												<span>{item.label}</span>
											</div>
											<ul className="mt-1 ml-8 space-y-0 border-l-2 border-slate-200 pl-3">
												{item.children.map((child) => {
													if (child.type === "subgroup") {
														const SubGroupIcon = child.icon;
														const activeSubGroup = isSubGroupActive(child);
														return (
																																														<li key={child.key}>
																																															<Popover open={openPopoverKey === child.key} onOpenChange={(open) => setOpenPopoverKey(open ? child.key : null)}>
																																																<PopoverTrigger asChild>
																																																	<button
																																																		type="button"
																																		className={cn(
																																			"w-full flex items-center justify-between gap-2 py-2 text-sm transition hover:text-slate-900 cursor-pointer",
																																			activeSubGroup
																																				? "text-brand-700 font-semibold"
																																				: "text-slate-600",
																																		)}
																																																		>
																																																			<span className="flex items-center gap-2">
																																																				<SubGroupIcon className="h-4 w-4" />
																																																				<span>{child.label}</span>
																																																			</span>
																																																			<ChevronRight className="h-3 w-3" />
																																																		</button>
																																																	</PopoverTrigger>
																																																<PopoverContent side="right" align="start" className="w-56 p-2">
																		<div className="text-xs font-medium text-slate-500 mb-2 px-2">{child.label}</div>
																		<ul className="space-y-1">
																			{child.children.map((grandChild) => {
																				const grandChildActive = isActive(grandChild.href);
																				const GrandChildIcon = grandChild.icon;
																				return (
																					<li key={grandChild.key}>
																						<Link
																							href={grandChild.href}
																							className={cn(
																								"flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition",
																								grandChildActive
																									? "bg-brand-50 text-brand-700 font-medium"
																									: "text-slate-600 hover:bg-slate-100",
																							)}
																						>
																							<GrandChildIcon className="h-4 w-4" />
																							<span>{grandChild.label}</span>
																						</Link>
																					</li>
																				);
																			})}
																		</ul>
																	</PopoverContent>
																</Popover>
															</li>
														);
												}
												
												// MenuItem
												const menuItem = child as MenuItem;
												const childActive = isActive(menuItem.href);
												const ChildIcon = menuItem.icon;
												return (
													<li key={menuItem.key}>
														<Link
															href={menuItem.href}
															className={cn(
																"flex items-center gap-2 py-2 text-sm transition hover:text-slate-900",
																childActive
																	? "text-brand-700 font-semibold"
																	: "text-slate-600",
															)}
														>
															<ChildIcon className="h-4 w-4" />
															<span>{menuItem.label}</span>
														</Link>
													</li>
												);
											})}
										</ul>
									</div>
								</li>
								);
							}
							
							// MenuItem
							const active = isActive(item.href);
							const Icon = item.icon;
							const linkContent = (
								<Link
									href={item.href}
									className={cn(
										"flex items-center gap-3 px-5 py-3 text-sm transition",
										isCollapsed && "justify-center px-0 py-2.5",
										active
											? "bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-600"
											: "text-slate-600 hover:bg-slate-100",
									)}
								>
									<Icon className="h-5 w-5 shrink-0" />
									<span
										className={cn(
											"transition-opacity duration-300",
											isCollapsed && "sr-only",
										)}
									>
										{item.label}
									</span>
								</Link>
							);

							return (
								<li key={item.key}>
									{isCollapsed ? (
										<Tooltip>
											<TooltipTrigger asChild>{linkContent}</TooltipTrigger>
											<TooltipContent side="right">
												{item.label}
											</TooltipContent>
										</Tooltip>
									) : (
										linkContent
									)}
								</li>
							);
						})}
						</ul>
					</TooltipProvider>
				</nav>
				<div
					className={cn(
						"border-t border-slate-200",
						isCollapsed ? "p-2" : "p-3",
					)}
				>
					<ProjectSwitcher />
				</div>
			</aside>
		</>
	);
}
