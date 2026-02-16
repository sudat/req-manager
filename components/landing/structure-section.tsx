"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronRight, Database, FileText, Layers, Settings, Users } from "lucide-react";

const tabs = [
	{ id: "scaleups", label: "Scale-ups" },
	{ id: "saas", label: "SaaS Startups" },
	{ id: "enterprise", label: "Enterprise" },
	{ id: "investors", label: "Investors" },
];

const structureData = {
	business: [
		{ type: "BD", name: "業務領域", color: "blue" },
		{ type: "BT", name: "業務タスク", color: "blue" },
		{ type: "BR", name: "業務要件", color: "blue" },
	],
	system: [
		{ type: "SD", name: "システム領域", color: "violet" },
		{ type: "SF", name: "システム機能", color: "violet" },
		{ type: "SR", name: "システム要件", color: "violet" },
	],
};

const ColorMap: Record<string, string> = {
	blue: "bg-blue-50 text-blue-600 border-blue-200",
	violet: "bg-violet-50 text-violet-600 border-violet-200",
};

export function StructureSection() {
	const [activeTab, setActiveTab] = useState("scaleups");

	return (
		<section id="structure" className="py-24 px-6 bg-gray-50">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-16"
				>
					<span className="text-sm font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
						[02] Adaptive model
					</span>
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-6 mb-4">
						柔軟な階層構造
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						業務とシステムの二つの視点から要件を整理。変更の影響範囲を正確に追跡できます。
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.1 }}
					className="flex justify-center gap-2 mb-8"
				>
					{tabs.map((tab) => (
						<button
							type="button"
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
								activeTab === tab.id
									? "bg-gray-900 text-white"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
							}`}
						>
							{tab.label}
						</button>
					))}
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.2 }}
					className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
				>
					<div className="grid md:grid-cols-2 gap-8">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<Users className="w-5 h-5 text-blue-500" />
								業務領域
							</h3>
							<div className="space-y-3">
								{structureData.business.map((item, index) => (
									<motion.div
										key={item.type}
										initial={{ opacity: 0, x: -20 }}
										whileInView={{ opacity: 1, x: 0 }}
										viewport={{ once: true }}
										transition={{ delay: 0.3 + index * 0.1 }}
										className={`flex items-center gap-3 p-4 rounded-xl border ${ColorMap[item.color]} cursor-pointer hover:shadow-md transition-all duration-200`}
									>
										<div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-mono text-sm font-bold">
											{item.type}
										</div>
										<div className="flex-1">
											<p className="font-medium text-gray-900">{item.name}</p>
											<p className="text-xs text-gray-500 mt-0.5">
												{index === 0 ? "連続性のある業務をまとめる" : index === 1 ? "いつ誰が何をして業務を進めるか" : "なぜ必要か、何を達成したいか"}
											</p>
										</div>
										<ChevronRight className="w-5 h-5 text-gray-400" />
									</motion.div>
								))}
							</div>
						</div>

						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<Settings className="w-5 h-5 text-violet-500" />
								システム領域
							</h3>
							<div className="space-y-3">
								{structureData.system.map((item, index) => (
									<motion.div
										key={item.type}
										initial={{ opacity: 0, x: 20 }}
										whileInView={{ opacity: 1, x: 0 }}
										viewport={{ once: true }}
										transition={{ delay: 0.3 + index * 0.1 }}
										className={`flex items-center gap-3 p-4 rounded-xl border ${ColorMap[item.color]} cursor-pointer hover:shadow-md transition-all duration-200`}
									>
										<div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-mono text-sm font-bold">
											{item.type}
										</div>
										<div className="flex-1">
											<p className="font-medium text-gray-900">{item.name}</p>
											<p className="text-xs text-gray-500 mt-0.5">
												{index === 0
													? "関連するシステム機能をまとめる"
													: index === 1
														? "どの機能単位で仕様を束ねるか"
														: "システムとして何を保証すべきか"}
											</p>
										</div>
										<ChevronRight className="w-5 h-5 text-gray-400" />
									</motion.div>
								))}
							</div>
						</div>
					</div>

					<div className="mt-8 pt-8 border-t border-gray-100">
						<div className="flex items-center justify-center gap-4 text-sm text-gray-500">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-blue-500" />
								<span>業務要件が</span>
							</div>
							<ChevronRight className="w-4 h-4" />
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-violet-500" />
								<span>システム機能を参照（realizes）</span>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
