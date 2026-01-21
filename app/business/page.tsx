"use client";

import { listBusinessesWithRequirementCounts, deleteBusiness } from "@/lib/data/businesses";
import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { businessListConfig } from "@/config/resource-lists";

export default function BusinessPage() {
	return (
		<ResourceListPage
			config={businessListConfig}
			fetchData={listBusinessesWithRequirementCounts}
			deleteItem={deleteBusiness}
		/>
	);
}
