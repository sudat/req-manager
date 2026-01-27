import type { TaskKnowledge } from "@/lib/domain";

export const createEmptyTaskKnowledge = (
	bizId: string,
	taskId: string
): TaskKnowledge => ({
	bizId,
	taskId,
	taskName: "",
	taskSummary: "",
	businessContext: "",
	processSteps: "",
	person: "",
	input: "",
	output: "",
	conceptIdsYaml: "",
	businessRequirements: [],
	systemRequirements: [],
	designDocs: [],
	codeRefs: [],
});
