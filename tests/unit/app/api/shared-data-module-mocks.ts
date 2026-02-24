import { mock } from "bun:test";

type AsyncDataResult<T> = Promise<{ data: T; error: string | null }>;

type SharedDataModuleMocks = {
  listTasksByBusinessAreaMock: ReturnType<
    typeof mock<(businessArea: string, projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  searchTasksMock: ReturnType<typeof mock<(query: string, projectId?: string) => AsyncDataResult<unknown[]>>>;
  getTaskByIdMock: ReturnType<typeof mock<(taskId: string, projectId?: string) => AsyncDataResult<unknown>>>;
  listBusinessRequirementsByTaskIdsMock: ReturnType<
    typeof mock<(taskIds: string[], projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  searchBusinessRequirementsMock: ReturnType<
    typeof mock<(query: string, projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  listBusinessRequirementsByTaskIdMock: ReturnType<
    typeof mock<(taskId: string, projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  listBusinessRequirementsByIdsMock: ReturnType<
    typeof mock<(ids: string[], projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  getDesignDocumentByIdMock: ReturnType<typeof mock<(ddId: string, projectId?: string) => AsyncDataResult<unknown>>>;
  listDesignDocumentsMock: ReturnType<typeof mock<(projectId?: string) => AsyncDataResult<unknown[]>>>;
  listSystemFunctionsByDomainMock: ReturnType<
    typeof mock<(systemDomainId: string, projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  listSystemFunctionsMock: ReturnType<typeof mock<(projectId?: string) => AsyncDataResult<unknown[]>>>;
  getSystemFunctionByIdMock: ReturnType<
    typeof mock<(srfId: string, projectId?: string) => AsyncDataResult<unknown>>
  >;
  searchSystemFunctionsMock: ReturnType<
    typeof mock<(query: string, projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  listSystemRequirementsBySrfIdMock: ReturnType<
    typeof mock<(srfId: string, projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  listSystemRequirementsByIdsMock: ReturnType<
    typeof mock<(ids: string[], projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  searchSystemRequirementsMock: ReturnType<
    typeof mock<(query: string, projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  listImpactScopesByChangeRequestIdMock: ReturnType<
    typeof mock<(changeRequestId: string, projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  deleteImpactScopesByChangeRequestIdMock: ReturnType<
    typeof mock<(changeRequestId: string, projectId?: string) => AsyncDataResult<boolean>>
  >;
  createImpactScopesMock: ReturnType<
    typeof mock<(rows: unknown[], projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  listRequirementLinksByNodeIdMock: ReturnType<
    typeof mock<(nodeType: string, nodeId: string, projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  listRequirementLinksBySourceIdsMock: ReturnType<
    typeof mock<(sourceType: string, sourceIds: string[], projectId?: string) => AsyncDataResult<unknown[]>>
  >;
  listSuspectLinksMock: ReturnType<typeof mock<(projectId?: string) => Promise<unknown[]>>>;
  getChangeRequestByIdMock: ReturnType<
    typeof mock<(changeRequestId: string, projectId?: string) => AsyncDataResult<unknown>>
  >;
  updateChangeRequestStatusMock: ReturnType<
    typeof mock<(changeRequestId: string, status: string, projectId?: string) => AsyncDataResult<unknown>>
  >;
};

const SHARED_KEY = "__appApiSharedDataModuleMocks__" as const;

const globalStore = globalThis as typeof globalThis & {
  [SHARED_KEY]?: SharedDataModuleMocks;
};

const createSharedDataModuleMocks = (): SharedDataModuleMocks => ({
  listTasksByBusinessAreaMock: mock(async () => ({
    data: [],
    error: null,
  })),
  searchTasksMock: mock(async () => ({
    data: [],
    error: null,
  })),
  getTaskByIdMock: mock(async () => ({
    data: null,
    error: null,
  })),
  listBusinessRequirementsByTaskIdsMock: mock(async () => ({
    data: [],
    error: null,
  })),
  searchBusinessRequirementsMock: mock(async () => ({
    data: [],
    error: null,
  })),
  listBusinessRequirementsByTaskIdMock: mock(async () => ({
    data: [],
    error: null,
  })),
  listBusinessRequirementsByIdsMock: mock(async () => ({
    data: [],
    error: null,
  })),
  getDesignDocumentByIdMock: mock(async () => ({
    data: null,
    error: null,
  })),
  listDesignDocumentsMock: mock(async () => ({
    data: [],
    error: null,
  })),
  listSystemFunctionsByDomainMock: mock(async () => ({
    data: [],
    error: null,
  })),
  listSystemFunctionsMock: mock(async () => ({
    data: [],
    error: null,
  })),
  getSystemFunctionByIdMock: mock(async () => ({
    data: null,
    error: null,
  })),
  searchSystemFunctionsMock: mock(async () => ({
    data: [],
    error: null,
  })),
  listSystemRequirementsBySrfIdMock: mock(async () => ({
    data: [],
    error: null,
  })),
  listSystemRequirementsByIdsMock: mock(async () => ({
    data: [],
    error: null,
  })),
  searchSystemRequirementsMock: mock(async () => ({
    data: [],
    error: null,
  })),
  listImpactScopesByChangeRequestIdMock: mock(async () => ({
    data: [],
    error: null,
  })),
  deleteImpactScopesByChangeRequestIdMock: mock(async () => ({
    data: true,
    error: null,
  })),
  createImpactScopesMock: mock(async () => ({
    data: [],
    error: null,
  })),
  listRequirementLinksByNodeIdMock: mock(async () => ({
    data: [],
    error: null,
  })),
  listRequirementLinksBySourceIdsMock: mock(async () => ({
    data: [],
    error: null,
  })),
  listSuspectLinksMock: mock(async () => []),
  getChangeRequestByIdMock: mock(async () => ({
    data: null,
    error: null,
  })),
  updateChangeRequestStatusMock: mock(async () => ({
    data: null,
    error: null,
  })),
});

export const sharedDataModuleMocks =
  globalStore[SHARED_KEY] ?? (globalStore[SHARED_KEY] = createSharedDataModuleMocks());

export const registerSharedDataModuleMocks = () => {
  mock.module("@/lib/data/tasks", () => ({
    listTasksByBusinessArea: sharedDataModuleMocks.listTasksByBusinessAreaMock,
    searchTasks: sharedDataModuleMocks.searchTasksMock,
    getTaskById: sharedDataModuleMocks.getTaskByIdMock,
  }));

  mock.module("@/lib/data/business-requirements", () => ({
    listBusinessRequirementsByTaskIds: sharedDataModuleMocks.listBusinessRequirementsByTaskIdsMock,
    searchBusinessRequirements: sharedDataModuleMocks.searchBusinessRequirementsMock,
    listBusinessRequirementsByTaskId: sharedDataModuleMocks.listBusinessRequirementsByTaskIdMock,
    listBusinessRequirementsByIds: sharedDataModuleMocks.listBusinessRequirementsByIdsMock,
  }));

  mock.module("@/lib/data/design-documents", () => ({
    getDesignDocumentById: sharedDataModuleMocks.getDesignDocumentByIdMock,
    listDesignDocuments: sharedDataModuleMocks.listDesignDocumentsMock,
  }));

  mock.module("@/lib/data/system-functions", () => ({
    listSystemFunctionsByDomain: sharedDataModuleMocks.listSystemFunctionsByDomainMock,
    listSystemFunctions: sharedDataModuleMocks.listSystemFunctionsMock,
    getSystemFunctionById: sharedDataModuleMocks.getSystemFunctionByIdMock,
    searchSystemFunctions: sharedDataModuleMocks.searchSystemFunctionsMock,
  }));

  mock.module("@/lib/data/system-requirements", () => ({
    listSystemRequirementsBySrfId: sharedDataModuleMocks.listSystemRequirementsBySrfIdMock,
    listSystemRequirementsByIds: sharedDataModuleMocks.listSystemRequirementsByIdsMock,
    searchSystemRequirements: sharedDataModuleMocks.searchSystemRequirementsMock,
  }));

  mock.module("@/lib/data/impact-scopes", () => ({
    listImpactScopesByChangeRequestId: sharedDataModuleMocks.listImpactScopesByChangeRequestIdMock,
    deleteImpactScopesByChangeRequestId:
      sharedDataModuleMocks.deleteImpactScopesByChangeRequestIdMock,
    createImpactScopes: sharedDataModuleMocks.createImpactScopesMock,
  }));

  mock.module("@/lib/data/requirement-links", () => ({
    listRequirementLinksByNodeId: sharedDataModuleMocks.listRequirementLinksByNodeIdMock,
    listRequirementLinksBySourceIds: sharedDataModuleMocks.listRequirementLinksBySourceIdsMock,
    listSuspectLinks: sharedDataModuleMocks.listSuspectLinksMock,
  }));

  mock.module("@/lib/data/change-requests", () => ({
    getChangeRequestById: sharedDataModuleMocks.getChangeRequestByIdMock,
    updateChangeRequestStatus: sharedDataModuleMocks.updateChangeRequestStatusMock,
  }));
};
