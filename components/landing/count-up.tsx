"use client";

import { motion } from "framer-motion";

interface CountUpProps {
	value: string | number;
	suffix?: string;
}

export function CountUp({ value, suffix = "" }: CountUpProps) {
	const numValue = typeof value === "number" ? value : parseInt(value) || 0;
	return (
		<motion.div
			className="stat-number text-gradient mb-2"
			initial={{ opacity: 0, scale: 0.5 }}
			whileInView={{ opacity: 1, scale: 1 }}
			viewport={{ once: true }}
			transition={{ duration: 0.5, ease: "easeOut" }}
		>
			{numValue}
			{suffix}
		</motion.div>
	);
}
