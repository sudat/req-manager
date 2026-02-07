import type { DesignItemCategory } from "@/lib/domain";

export interface NewDesignItem {
	category: DesignItemCategory;
	title: string;
	description: string;
	priority: "high" | "medium" | "low";
}

export interface CodeRef {
	githubUrl: string;
	paths: string[];
	note: string;
}
