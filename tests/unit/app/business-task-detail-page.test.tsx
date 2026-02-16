import { Window } from "happy-dom";
const window = new Window();
Object.assign(globalThis, {
  document: window.document,
  window,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
});

import { afterEach, describe, expect, it, jest } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";

// Mocks - よりシンプルに
const mockRouter = {
  replace: jest.fn(),
};

mock.module("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

mock.module("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => {
    return (
      <a href={href} data-href={href} className="mock-link">
        {children}
      </a>
    );
  },
}));

mock.module("@/hooks/use-business-by-key", () => ({
  useBusinessByKey: () => ({ businessArea: "AR" }),
}));

mock.module("./use-task-detail", () => ({
  useTaskDetail: () => ({
    task: {
      id: "BT-AR-0001",
      name: "売掛金計上（月次締め）",
      summary: "テスト用サマリー",
      businessArea: "AR",
      processSteps: null,
      input: null,
      output: null,
      conceptIdsYaml: null,
    },
    taskLoading: false,
    taskError: null,
    businessRequirements: [
      {
        id: "BR-AR-0001-0001",
        title: "確定売上の自動計上",
        goal: "テスト用ゴール",
        constraints: "制約条件",
        owner: "経理部長",
        conceptIds: [],
        systemDomainIds: [],
        srfIds: [],
        impacts: [],
        businessRequirementIds: [],
      },
    ],
    requirementsLoading: false,
    requirementsError: null,
    systemRequirements: [],
    systemRequirementsLoading: false,
    systemRequirementsError: null,
    optionsError: null,
    optionsLoading: false,
    knowledge: {
      bizId: "AR",
      taskName: "売掛金計上（月次締め）",
      taskSummary: "テスト用サマリー",
      processSteps: null,
      input: null,
      output: null,
      conceptIdsYaml: null,
    },
    concepts: [],
    conceptMap: new Map(),
    systemFunctionMap: new Map(),
    systemFunctionDomainMap: new Map(),
    systemDomainMap: new Map(),
    systemFunctions: [],
    systemFunctionsFull: [],
  }),
}));

mock.module("@/components/health-score/health-score-card", () => ({
  HealthScoreCard: () => <div data-testid="health-score-card">Health Score</div>,
}));

mock.module("@/components/layout/mobile-header", () => ({
  MobileHeader: () => <div data-testid="mobile-header">Mobile Header</div>,
}));

mock.module("@/components/ui/breadcrumb", () => ({
  Breadcrumb: ({ children }: { children: React.ReactNode }) => <nav>{children}</nav>,
  BreadcrumbItem: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  BreadcrumbLink: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  BreadcrumbList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  BreadcrumbSeparator: () => <span>/</span>,
}));

mock.module("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

mock.module("./components/TaskLoadingStatus", () => ({
  TaskLoadingStatus: () => null,
  TaskNotFound: () => <div>Not Found</div>,
}));

mock.module("./components/TaskSummaryCard", () => ({
  TaskSummaryCard: () => <div data-testid="task-summary-card">Task Summary</div>,
}));

mock.module("./components/BusinessRequirementsSection", () => ({
  BusinessRequirementsSection: () => <div data-testid="business-requirements-section">Business Requirements</div>,
}));

mock.module("lucide-react", () => ({
  Pencil: () => <span>Pencil</span>,
  Sparkles: () => <span>Sparkles</span>,
}));

// Import after mocks
import TaskDetailPage from "@/app/(with-sidebar)/business/[id]/[taskId]/page";
import React from "react";

afterEach(() => {
  cleanup();
});

describe("TaskDetailPage", () => {
  it("業務要件セクションの編集ボタンが/edit/requirementsを指している", async () => {
    const params = Promise.resolve({ id: "AR", taskId: "BT-AR-0001" });
    const { container } = render(<TaskDetailPage params={params} />);

    await waitFor(() => {
      // すべてのリンクを取得
      const links = container.querySelectorAll('a[data-href]');
      const hrefs = Array.from(links).map(link => link.getAttribute('data-href'));
      
      // /edit/requirementsへのリンクが存在することを確認
      const requirementsEditLink = hrefs.find(href => href?.includes('/edit/requirements'));
      expect(requirementsEditLink).toBe('/business/AR/BT-AR-0001/edit/requirements');
    });
  });

  it("編集ボタンが2つ存在する（ヘッダーと要件セクション）", async () => {
    const params = Promise.resolve({ id: "AR", taskId: "BT-AR-0001" });
    const { container } = render(<TaskDetailPage params={params} />);

    await waitFor(() => {
      const links = container.querySelectorAll('a[data-href*="/edit/requirements"]');
      // ヘッダーと要件セクションの2つ
      expect(links.length).toBe(2);
    });
  });
});
