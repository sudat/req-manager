"use client";

import { motion } from "framer-motion";

const logos = [
	"TechCorp",
	"DataFlow",
	"CloudBase",
	"DevStack",
	"CodeCraft",
	"BuildHub",
	"ScaleUp",
	"InfraLabs",
];

export function LogoCloud() {
	return (
		<section className="py-16 px-6 border-y border-gray-100">
			<div className="max-w-6xl mx-auto">
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					className="text-center text-sm text-gray-400 font-medium mb-8"
				>
					信頼される開発チームの選択
				</motion.p>
				<div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
					{logos.map((logo, index) => (
						<motion.div
							key={logo}
							initial={{ opacity: 0, y: 10 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4, delay: index * 0.05 }}
							className="text-gray-300 hover:text-gray-400 transition-colors"
						>
							<span className="text-xl font-bold tracking-tight">{logo}</span>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
