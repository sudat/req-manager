import type { Business } from '@/lib/domain';

export const businesses: Business[] = [
  {
    id: "AR",
    name: "債権管理",
    area: "AR",
    summary: "売掛金の管理、請求書発行、入金消込、債権回収を行う",
    businessReqCount: 24,
    systemReqCount: 56,
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "AP",
    name: "債務管理",
    area: "AP",
    summary: "買掛金の管理、支払処理、仕入先管理を行う",
    businessReqCount: 20,
    systemReqCount: 48,
    sortOrder: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "GL",
    name: "一般会計",
    area: "GL",
    summary: "仕訳計上、総勘定元帳、財務諸表、決算処理を行う",
    businessReqCount: 28,
    systemReqCount: 64,
    sortOrder: 2,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

export const getBusinessByArea = (area: string): Business | undefined => {
  return businesses.find(b => b.area === area);
};

export const getBusinessesByArea = (area: string): Business[] => {
  return businesses.filter(b => b.area === area);
};
