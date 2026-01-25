"use client";

import { useEffect, useState } from "react";

interface Particle {
	id: number;
	size: "small" | "medium" | "large";
	left: string;
	delay: string;
	duration: string;
}

export function ParticleBackground() {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const particles = isMounted
		? Array.from({ length: 30 }, (_, i) => ({
				id: i,
				size: Math.random() > 0.6 ? "medium" : Math.random() > 0.3 ? "small" : "large",
				left: `${Math.random() * 100}%`,
				delay: `${Math.random() * 15}s`,
				duration: `${15 + Math.random() * 10}s`,
			}))
		: [];

	if (!isMounted) return null;

	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			{particles.map((particle) => (
				<div
					key={particle.id}
					className={`particle particle--${particle.size}`}
					style={{
						left: particle.left,
						bottom: "-10px",
						animationDelay: particle.delay,
						animationDuration: particle.duration,
					}}
				/>
			))}
		</div>
	);
}
