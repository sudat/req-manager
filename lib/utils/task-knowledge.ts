import type { TaskKnowledge } from "@/lib/domain";

export const createEmptyTaskKnowledge = (
	bizId: string,
	taskId: string
): TaskKnowledge => ({
	bizId,
	taskId,
	taskName: "",
	taskSummary: "",
	triggerDescription: "",
	triggerTaskIds: [],
	frequency: 'daily',
	frequencyDescription: "",
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
