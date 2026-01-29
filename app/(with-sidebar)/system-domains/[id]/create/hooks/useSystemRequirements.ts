"use client";

import { useState, useCallback } from "react";
import { nextSequentialId } from "@/lib/data/id";
import { getSrIdSpecForSystemFunction } from "@/lib/utils/id-rules";
import type { SystemRequirementCard } from "../types";

type UseSystemRequirementsResult = {
  systemRequirements: SystemRequirementCard[];
  addSystemRequirement: (systemDomainId: string, systemFunctionId: string) => void;
  updateSystemRequirement: (sysReqId: string, patch: Partial<SystemRequirementCard>) => void;
  removeSystemRequirement: (sysReqId: string) => void;
};

export function useSystemRequirements(): UseSystemRequirementsResult {
  const [systemRequirements, setSystemRequirements] = useState<SystemRequirementCard[]>([]);

  const addSystemRequirement = useCallback((systemDomainId: string, systemFunctionId: string) => {
    setSystemRequirements((prev) => {
      const existingIds = prev.map((r) => r.id);
      const spec = getSrIdSpecForSystemFunction(systemDomainId, systemFunctionId, existingIds);
      const id = nextSequentialId(spec.prefix, existingIds, spec.padLength);

      const nextSysReq: SystemRequirementCard = {
        id,
        title: "",
        summary: "",
        category: "function",
        businessRequirementIds: [],
        relatedDeliverableIds: [],
        acceptanceCriteriaJson: [],
      };

      return [...prev, nextSysReq];
    });
  }, []);

  const updateSystemRequirement = useCallback(
    (sysReqId: string, patch: Partial<SystemRequirementCard>) => {
      setSystemRequirements((prev) =>
        prev.map((r) => (r.id === sysReqId ? { ...r, ...patch } : r))
      );
    },
    []
  );

  const removeSystemRequirement = useCallback((sysReqId: string) => {
    setSystemRequirements((prev) => prev.filter((r) => r.id !== sysReqId));
  }, []);

  return {
    systemRequirements,
    addSystemRequirement,
    updateSystemRequirement,
    removeSystemRequirement,
  };
}
