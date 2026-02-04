"use client";

import { useState, useCallback } from "react";
import type {
	ConceptAction,
	ConceptApproval,
	ConceptCandidate,
} from "@/components/ai-chat/concept-suggestion";

// ---------------------------------------------------------------------------
// フック
// ---------------------------------------------------------------------------

type UseConceptManagementProps = {
	projectId: string;
};

export function useConceptManagement({ projectId }: UseConceptManagementProps) {
	const [candidates, setCandidates] = useState<ConceptCandidate[]>([]);
	const [activeFormTerm, setActiveFormTerm] = useState<string | null>(null);

	const handleAction = useCallback(
		(candidate: ConceptCandidate, action: ConceptAction) => {
			switch (action) {
				case "approve":
					if (candidate.isExisting) {
						// 既存概念の確認
						setCandidates((prev) =>
							prev.filter((c) => c.term !== candidate.term),
						);
					} else {
						// 新規概念の承認フォーム表示
						setActiveFormTerm(candidate.term);
					}
					break;

				case "reject":
					setCandidates((prev) =>
						prev.filter((c) => c.term !== candidate.term),
					);
					break;

				case "hold":
					// 保留（何もしない）
					break;
			}
		},
		[],
	);

	const handleApproval = useCallback(
		async (approval: ConceptApproval) => {
			try {
				console.log("Approve concept:", approval);

				if (!projectId) {
					console.error("No projectId available");
					// TODO: エラーをユーザーに通知
					return;
				}

				// 概念登録APIを呼び出し
				const response = await fetch("/api/concepts", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						projectId,
						term: approval.term,
						definition: approval.definition,
						aliases: approval.aliases || [],
						category: approval.category || "common",
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					console.error("Failed to create concept:", errorData);
					// TODO: エラーをユーザーに通知
					return;
				}

				const result = await response.json();
				console.log("Concept created successfully:", result);

				// 成功したら概念候補を削除
				setCandidates((prev) =>
					prev.filter((c) => c.term !== approval.term),
				);
				setActiveFormTerm(null);
			} catch (error) {
				console.error("Error approving concept:", error);
				// TODO: エラーをユーザーに通知
			}
		},
		[projectId],
	);

	return {
		candidates,
		setCandidates,
		activeFormTerm,
		setActiveFormTerm,
		handleAction,
		handleApproval,
	};
}
