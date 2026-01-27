"use client";

import { useState, useCallback } from "react";
import { nextSequentialId } from "@/lib/data/id";
import type { SystemRequirementCard } from "../types";

type UseSystemRequirementsResult = {
  systemRequirements: SystemRequirementCard[];
  addSystemRequirement: (systemDomainId: string) => void;
  updateSystemRequirement: (sysReqId: string, patch: Partial<SystemRequirementCard>) => void;
  removeSystemRequirement: (sysReqId: string) => void;
};

export function useSystemRequirements(): UseSystemRequirementsResult {
  const [systemRequirements, setSystemRequirements] = useState<SystemRequirementCard[]>([]);

  const addSystemRequirement = useCallback((systemDomainId: string) => {
    setSystemRequirements((prev) => {
      const existingIds = prev.map((r) => r.id);
      const prefix = `SR-${systemDomainId}-`;
      const id = nextSequentialId(prefix, existingIds, 3);

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
