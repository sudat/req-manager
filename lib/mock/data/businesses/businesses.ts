import { Business } from '../types';

export const businesses: Business[] = [
  {
    id: "BIZ-001",
    name: "債権管理",
    area: "AR",
    summary: "売掛金の管理、請求書発行、入金消込、債権回収を行う",
    businessReqCount: 24,
    systemReqCount: 56,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "BIZ-002",
    name: "債務管理",
    area: "AP",
    summary: "買掛金の管理、支払処理、仕入先管理を行う",
    businessReqCount: 20,
    systemReqCount: 48,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "BIZ-003",
    name: "一般会計",
    area: "GL",
    summary: "仕訳計上、総勘定元帳、財務諸表、決算処理を行う",
    businessReqCount: 28,
    systemReqCount: 64,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

export const getBusinessById = (id: string): Business | undefined => {
  return businesses.find(b => b.id === id);
};

export const getBusinessesByArea = (area: string): Business[] => {
  return businesses.filter(b => b.area === area);
};
