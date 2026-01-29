"use client";

import { useState, useCallback } from "react";
import { nextSequentialId } from "@/lib/data/id";
import { getBrIdSpecForTask } from "@/lib/utils/id-rules";
import type { Requirement } from "@/lib/domain/forms";

type UseRequirementsResult = {
  requirements: Requirement[];
  addRequirement: (taskId: string) => void;
  updateRequirement: (reqId: string, patch: Partial<Requirement>) => void;
  removeRequirement: (reqId: string) => void;
};

export function useRequirements(): UseRequirementsResult {
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  const addRequirement = useCallback((taskId: string) => {
    setRequirements((prev) => {
      const existingIds = prev.map((r) => r.id);
      const spec = getBrIdSpecForTask(taskId, existingIds);
      const id = nextSequentialId(spec.prefix, existingIds, spec.padLength);

      const nextReq: Requirement = {
        id,
        type: "業務要件",
        title: "",
        summary: "",
        goal: "",
        constraints: "",
        owner: "",
        conceptIds: [],
        srfIds: [],
        systemDomainIds: [],
        acceptanceCriteria: [],
        acceptanceCriteriaJson: [],
        category: undefined,
        businessRequirementIds: [],
        relatedSystemRequirementIds: [],
      };

      return [...prev, nextReq];
    });
  }, []);

  const updateRequirement = useCallback(
    (reqId: string, patch: Partial<Requirement>) => {
      setRequirements((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, ...patch } : r))
      );
    },
    []
  );

  const removeRequirement = useCallback((reqId: string) => {
    setRequirements((prev) => prev.filter((r) => r.id !== reqId));
  }, []);

  return {
    requirements,
    addRequirement,
    updateRequirement,
    removeRequirement,
  };
}
