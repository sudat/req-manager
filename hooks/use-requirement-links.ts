import { useState, useEffect } from "react";
import {
	listRequirementLinksByProjectId,
	listSuspectLinks,
} from "@/lib/data/requirement-links";
import type { RequirementLink } from "@/lib/domain";

type FilterMode = "all" | "suspect";

export function useRequirementLinks(
	projectId: string | null,
	filterMode: FilterMode,
	projectLoading: boolean
) {
	const [links, setLinks] = useState<RequirementLink[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (projectLoading) return;
		if (!projectId) {
			setError("プロジェクトが選択されていません");
			setLoading(false);
			return;
		}

		let active = true;

		async function fetchLinks(): Promise<void> {
			setLoading(true);
			setError(null);

			try {
				let fetchedLinks: RequirementLink[];

				if (filterMode === "suspect") {
					fetchedLinks = await listSuspectLinks(projectId!);
				} else {
					const { data, error: fetchError } = await listRequirementLinksByProjectId(projectId!);
					if (fetchError) {
						setError(fetchError);
						setLoading(false);
						return;
					}
					fetchedLinks = data || [];
				}

				if (active) {
					setLinks(fetchedLinks);
					setLoading(false);
				}
			} catch (e) {
				if (active) {
					setError(e instanceof Error ? e.message : String(e));
					setLoading(false);
				}
			}
		}

		fetchLinks();

		return () => {
			active = false;
		};
	}, [projectId, projectLoading, filterMode]);

	return { links, setLinks, loading, error };
}
