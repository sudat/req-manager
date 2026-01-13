"use client";

export type Requirement = {
  id: string;
  type: "業務要件";
  title: string;
  summary: string;
  conceptIds: string[];
  srfId: string | null;
  systemDomainIds: string[];
  acceptanceCriteria: string[];
};

export type SelectionDialogType = "concepts" | "system" | "domain";

export type SelectionDialogState = {
  type: SelectionDialogType;
  reqId: string;
} | null;

export type SelectableItem = {
  id: string;
  name: string;
};
