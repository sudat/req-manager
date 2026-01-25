"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface FadeInProps {
	children: ReactNode;
	delay?: number;
}

export function FadeIn({ children, delay = 0 }: FadeInProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 60 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-100px" }}
			transition={{ duration: 0.6, delay, ease: "easeOut" }}
		>
			{children}
		</motion.div>
	);
}
