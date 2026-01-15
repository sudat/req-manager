import type { TicketStatus, TicketPriority } from "@/lib/domain";

export const statusLabels: Record<TicketStatus, string> = {
  open: "未対応",
  review: "レビュー中",
  approved: "承認済",
  applied: "適用済",
};

export const priorityLabels: Record<TicketPriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export const formatDate = (isoDate: string): string => {
  return isoDate.split("T")[0];
};
