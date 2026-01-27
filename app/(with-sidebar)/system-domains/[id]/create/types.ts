"use client";

import type { AcceptanceCriterionJson } from "@/lib/data/structured";
import type { SystemRequirementCategory } from "@/lib/domain";

export type SystemRequirementCard = {
  id: string;
  title: string;
  summary: string;
  category: SystemRequirementCategory;
  businessRequirementIds: string[];
  relatedDeliverableIds: string[];
  acceptanceCriteriaJson: AcceptanceCriterionJson[];
};

export type BusinessRequirementDialogState = {
  sysReqId: string;
} | null;
