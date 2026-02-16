"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
	return (
		<section className="py-24 px-6 bg-gray-50">
			<div className="max-w-4xl mx-auto text-center">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
				>
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
						14日間無料で
						<br />
						お試しください
					</h2>
					<p className="text-xl text-gray-600 mb-10">
						クレジットカード不要。今すぐ要件管理を次のレベルへ。
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							href="/dashboard"
							className="group bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-lg shadow-gray-900/20"
						>
							Start for free
							<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
						</Link>
						<button
							type="button"
							className="text-gray-600 hover:text-gray-900 font-medium px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-white transition-all duration-200 cursor-pointer"
						>
							Send me a demo
						</button>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
