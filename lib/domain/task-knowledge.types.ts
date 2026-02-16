import type { Requirement, DesignDoc, CodeRef } from "./forms";

export type TaskKnowledge = {
	bizId: string;
	taskId: string;
	taskName: string;
	taskSummary: string;
	triggerDescription: string;
	triggerTaskIds: string[];
	frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular';
	frequencyDescription: string;
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
