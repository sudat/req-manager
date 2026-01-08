// 共通型定義
export * from './types';

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
export type { RelatedRequirementInfo } from './types';

// ユーティリティ関数：複数エンティティにまたがる検索
export const getTicketsByBusinessId = (businessId: string) => {
  const { tickets } = require('./tickets/tickets');
  return tickets.filter((t: any) => t.businessIds.includes(businessId));
};

export const getConceptsByTaskId = (taskId: string) => {
  const { tasks } = require('./tasks/tasks');
  const { concepts } = require('./concepts/concepts');
  const task = tasks.find((t: any) => t.id === taskId);
  if (!task) return [];
  return concepts.filter((c: any) => task.concepts.includes(c.id));
};
