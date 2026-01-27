import type { BusinessRequirement } from "@/lib/data/business-requirements";
import type { SystemRequirement } from "@/lib/data/system-requirements";
import { RequirementsSection } from "./RequirementsSection";
import { BusinessRequirementCard } from "../business-requirement-card";

type BusinessRequirementsSectionProps = {
	requirements: BusinessRequirement[];
	loading: boolean;
	error: string | null;
	optionsError: string | null;
	conceptMap: Map<string, string>;
	systemFunctionMap: Map<string, string>;
	systemFunctionDomainMap: Map<string, string | null>;
	systemDomainMap: Map<string, string>;
	systemRequirementsByBizReq: Map<string, SystemRequirement[]>;
};

export function BusinessRequirementsSection({
	requirements,
	loading,
	error,
	optionsError,
	conceptMap,
	systemFunctionMap,
	systemFunctionDomainMap,
	systemDomainMap,
	systemRequirementsByBizReq,
}: BusinessRequirementsSectionProps) {
	return (
		<RequirementsSection
			title="業務要件"
			items={requirements}
			loading={loading}
			error={error}
			renderItem={(req) => (
				<BusinessRequirementCard
					key={req.id}
					requirement={req}
					conceptMap={conceptMap}
					systemFunctionMap={systemFunctionMap}
					systemFunctionDomainMap={systemFunctionDomainMap}
					systemDomainMap={systemDomainMap}
					optionsError={optionsError}
					relatedSystemRequirements={systemRequirementsByBizReq.get(req.id) ?? []}
				/>
			)}
		/>
	);
}
