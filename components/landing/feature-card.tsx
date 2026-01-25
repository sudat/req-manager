"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";

interface FeatureCardProps {
	children: ReactNode;
	index: number;
}

export function FeatureCard({ children, index }: FeatureCardProps) {
	const ref = useRef<HTMLDivElement>(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		if (!ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		x.set((e.clientX - centerX) / 20);
		y.set((e.clientY - centerY) / 20);
	}

	function handleMouseLeave() {
		x.set(0);
		y.set(0);
	}

	const rotateX = useTransform(y, [-10, 10], [5, -5]);
	const rotateY = useTransform(x, [-10, 10], [-5, 5]);

	return (
		<motion.div
			ref={ref}
			className="glass-card rounded-2xl p-8"
			initial={{ opacity: 0, y: 60 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-100px" }}
			whileHover={{
				y: -8,
				transition: { duration: 0.2 },
			}}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			style={{
				rotateX,
				rotateY,
				transformStyle: "preserve-3d",
			}}
			transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
		>
			{children}
		</motion.div>
	);
}
