"use client";

import { Nav, Hero, LogoCloud, BentoGrid, StructureSection, WorkflowSection, StatsSection, CTASection, Footer } from "@/components/landing";

export default function Home() {
	return (
		<main className="min-h-screen bg-white">
			<Nav />
			<Hero />
			<LogoCloud />
			<BentoGrid />
			<StructureSection />
			<WorkflowSection />
			<StatsSection />
			<CTASection />
			<Footer />
		</main>
	);
}
