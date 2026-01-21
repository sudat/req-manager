"use client";

import { listConcepts, deleteConcept } from "@/lib/data/concepts";
import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { conceptListConfig } from "@/config/resource-lists";

export default function IdeasPage() {
	return (
		<ResourceListPage
			config={conceptListConfig}
			fetchData={listConcepts}
			deleteItem={deleteConcept}
		/>
	);
}
