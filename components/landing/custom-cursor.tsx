"use client";

import { motion, useSpring, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";

export function CustomCursor() {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const [isHovering, setIsHovering] = useState(false);

	const cursorX = useSpring(mousePosition.x, { stiffness: 150, damping: 20 });
	const cursorY = useSpring(mousePosition.y, { stiffness: 150, damping: 20 });

	useEffect(() => {
		function handleMouseMove(e: MouseEvent) {
			setMousePosition({ x: e.clientX, y: e.clientY });
		}

		function handleMouseOver(e: MouseEvent) {
			const target = e.target as HTMLElement;
			if (
				target.tagName === "A" ||
				target.tagName === "BUTTON" ||
				target.closest("a") ||
				target.closest("button")
			) {
				setIsHovering(true);
			}
		}

		function handleMouseOut() {
			setIsHovering(false);
		}

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseover", handleMouseOver);
		window.addEventListener("mouseout", handleMouseOut);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseover", handleMouseOver);
			window.removeEventListener("mouseout", handleMouseOut);
		};
	}, []);

	return (
		<>
			<motion.div
				className={`custom-cursor ${isHovering ? "custom-cursor--hover" : ""}`}
				style={{
					x: cursorX,
					y: cursorY,
				}}
			/>
			<motion.div
				className="custom-cursor-dot"
				style={{
					x: mousePosition.x,
					y: mousePosition.y,
				}}
			/>
		</>
	);
}
