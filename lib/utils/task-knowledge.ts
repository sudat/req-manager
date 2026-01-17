import type { TaskKnowledge } from "@/lib/domain";

export const createEmptyTaskKnowledge = (
	bizId: string,
	taskId: string
): TaskKnowledge => ({
	bizId,
	taskId,
	taskName: "",
	taskSummary: "",
	person: "",
	input: "",
	output: "",
	businessRequirements: [],
	systemRequirements: [],
	designDocs: [],
	codeRefs: [],
});
