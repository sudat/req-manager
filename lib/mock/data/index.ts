import { tickets } from "./tickets/tickets";
import { tasks } from "./tasks/tasks";
import { concepts } from "./concepts/concepts";

// 共通型定義
export type { RelatedRequirementInfo, DesignItemCategory } from '@/lib/domain';

// Businessデータ
export { businesses, getBusinessById, getBusinessesByArea } from './businesses/businesses';

// Taskデータ
export { tasks, getTaskById, getTasksByBusinessId, getTasksByArea } from './tasks/tasks';

// Ticketデータ
export { tickets, getTicketById, getTicketsByArea, getTicketsByStatus } from './tickets/tickets';

// Conceptデータ
export { concepts, getConceptById, getConceptsByArea, getConceptsByName, getRelatedRequirements } from './concepts/concepts';
export type { RequirementReference } from './concepts/concepts';

// SystemFunctionデータ
export { systemFunctions, getSystemFunctionById, getSystemFunctionsByStatus, getSystemFunctionsByTaskId, getRelatedRequirements as getSrfRelatedRequirements, getDesignCategoryLabel } from './srf/srf';

// ユーティリティ関数：複数エンティティにまたがる検索
export const getTicketsByBusinessId = (businessId: string) => {
  return tickets.filter((t) => t.businessIds.includes(businessId));
};

export const getConceptsByTaskId = (taskId: string) => {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return [];
  return concepts.filter((c) => task.concepts.includes(c.id));
};
