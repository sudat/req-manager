"use client";

export type SystemRequirementCard = {
  id: string;
  title: string;
  summary: string;
  businessRequirementIds: string[];
};

export type BusinessRequirementDialogState = {
  sysReqId: string;
} | null;
