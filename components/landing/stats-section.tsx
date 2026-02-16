"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { Zap, Globe, Users, Shield } from "lucide-react";

const stats = [
	{ icon: Zap, value: 50, suffix: "ms", label: "平均検索速度", description: "sub-50ms latency" },
	{ icon: Globe, value: 10, suffix: "+", label: "対応国", description: "世界中で利用" },
	{ icon: Users, value: 1000, suffix: "+", label: "開発チーム", description: "信頼と実績" },
	{ icon: Shield, value: 99.9, suffix: "%", label: "稼働率", description: "SLA保証" },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
	const count = useMotionValue(0);
	const rounded = useTransform(count, (latest) => {
		if (value < 100) return latest.toFixed(value % 1 !== 0 ? 1 : 0);
		return Math.round(latest).toLocaleString();
	});
	const [displayValue, setDisplayValue] = useState("0");

	useEffect(() => {
		const controls = animate(count, value, { duration: 2, ease: "easeOut" });
		const unsubscribe = rounded.on("change", (latest) => {
			setDisplayValue(latest);
		});
		return () => {
			controls.stop();
			unsubscribe();
		};
	}, [count, value, rounded]);

	return (
		<span>
			{displayValue}
			{suffix}
		</span>
	);
}

export function StatsSection() {
	return (
		<section id="scale" className="py-24 px-6 bg-gray-900">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-16"
				>
					<span className="text-sm font-medium text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full">
						[04] Built for scale
					</span>
					<h2 className="text-4xl md:text-5xl font-bold text-white mt-6 mb-4">
						次世代のシステム構築のために
					</h2>
					<p className="text-xl text-gray-400 max-w-2xl mx-auto">
						何百万件のレコードを処理し、ミリ秒単位で応答します
					</p>
				</motion.div>

				<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
					{stats.map((stat, index) => (
						<motion.div
							key={stat.label}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: index * 0.1 }}
							className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center hover:bg-gray-800 transition-colors"
						>
							<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
								<stat.icon className="w-6 h-6 text-white" />
							</div>
							<p className="text-3xl md:text-4xl font-bold text-white mb-1">
								<AnimatedNumber value={stat.value} suffix={stat.suffix} />
							</p>
							<p className="text-gray-300 font-medium">{stat.label}</p>
							<p className="text-sm text-gray-500 mt-1">{stat.description}</p>
						</motion.div>
					))}
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="mt-12 text-center"
				>
					<p className="text-sm text-gray-500 mb-4">Scale with security</p>
					<div className="flex items-center justify-center gap-6">
						{["GDPR", "CCPA", "ISO"].map((cert) => (
							<div
								key={cert}
								className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg text-gray-300 font-mono text-sm"
							>
								{cert}
							</div>
						))}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
