import type { Requirement, DesignDoc, CodeRef } from "./forms";

export type TaskKnowledge = {
	bizId: string;
	taskId: string;
	taskName: string;
	taskSummary: string;
	businessContext: string;
	processSteps: string;
	input: string;
	output: string;
	conceptIdsYaml: string;
	person?: string;
	businessRequirements: Requirement[];
	systemRequirements: Requirement[];
	designDocs: DesignDoc[];
	codeRefs: CodeRef[];
};
