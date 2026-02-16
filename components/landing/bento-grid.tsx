"use client";

import { motion } from "framer-motion";
import { Sparkles, GitBranch, FileCheck, Zap, Layers, Shield } from "lucide-react";

const features = [
	{
		icon: Sparkles,
		title: "AIによる影響調査",
		description:
			"変更要求から影響範囲を自動特定。コード依存関係を解析し、修正が必要なファイルを列挙します。",
		gradient: "from-violet-500 to-purple-600",
		size: "large",
	},
	{
		icon: GitBranch,
		title: "依存関係の可視化",
		description: "業務要件とシステム機能の紐付けをグラフで表示。変更の波及経路を一目で把握。",
		gradient: "from-blue-500 to-cyan-500",
		size: "medium",
	},
	{
		icon: FileCheck,
		title: "自動テスト生成",
		description: "受入基準からテストケースを生成。GWT形式で記述された条件を自動的に検証コードに変換。",
		gradient: "from-emerald-500 to-teal-500",
		size: "medium",
	},
	{
		icon: Zap,
		title: "高速検索",
		description: "sub-50msで要件を検索。リアルタイムにフィルタリング。",
		gradient: "from-orange-500 to-amber-500",
		size: "small",
	},
	{
		icon: Layers,
		title: "階層構造管理",
		description: "BD→BT→BR / SD→SF→SRの二階層構造で要件を整理。",
		gradient: "from-pink-500 to-rose-500",
		size: "small",
	},
	{
		icon: Shield,
		title: "品質担保",
		description: "Critic Loopで継続的に品質を検証。不完全な仕様を前提とした設計。",
		gradient: "from-indigo-500 to-violet-500",
		size: "small",
	},
];

export function BentoGrid() {
	return (
		<section id="platform" className="py-24 px-6">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-16"
				>
					<span className="text-sm font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
						[01] Powerful platform
					</span>
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-6 mb-4">
						開発を加速する機能
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						AI、自動化、可視化を統合した次世代の要件管理プラットフォーム
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{features.map((feature, index) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: index * 0.1 }}
							className={`
                group bg-white border border-gray-100 rounded-2xl p-6 
                hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200
                transition-all duration-300 cursor-pointer
                ${feature.size === "large" ? "md:col-span-2 md:row-span-2" : ""}
                ${feature.size === "medium" ? "md:col-span-1 lg:col-span-1" : ""}
              `}
						>
							<div
								className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
							>
								<feature.icon className="w-6 h-6 text-white" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
							<p
								className={`text-gray-600 leading-relaxed ${feature.size === "large" ? "text-base" : "text-sm"}`}
							>
								{feature.description}
							</p>

							{feature.size === "large" && (
								<div className="mt-6 pt-6 border-t border-gray-100">
									<div className="bg-gray-50 rounded-xl p-4">
										<div className="flex items-center gap-2 mb-3">
											<div className="w-2 h-2 rounded-full bg-green-500" />
											<span className="text-sm font-medium text-gray-700">影響調査を実行中...</span>
										</div>
										<div className="space-y-2">
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-500">対象ファイル</span>
												<span className="font-mono text-gray-900">12 files</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-500">影響範囲</span>
												<span className="font-mono text-gray-900">3 modules</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-500">推定工数</span>
												<span className="font-mono text-gray-900">4h 30m</span>
											</div>
										</div>
									</div>
								</div>
							)}
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
