"use client";

import type { AcceptanceCriterionJson } from "@/lib/data/structured";

export type SystemRequirementCard = {
  id: string;
  title: string;
  summary: string;
  businessRequirementIds: string[];
  acceptanceCriteriaJson: AcceptanceCriterionJson[];
};

export type BusinessRequirementDialogState = {
  sysReqId: string;
} | null;
