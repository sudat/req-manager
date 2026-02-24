import { Window } from "happy-dom";
const window = new Window();
Object.assign(globalThis, {
  document: window.document,
  window,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
});

import React from "react";
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";

const listTasksMock = mock(async () => ({ data: [], error: null }));
const listBusinessRequirementsMock = mock(async () => ({ data: [], error: null }));
const listSystemFunctionsMock = mock(async () => ({ data: [], error: null }));
const listSystemRequirementsMock = mock(async () => ({ data: [], error: null }));

mock.module("@/components/project/project-context", () => ({
  useProject: () => ({
    currentProjectId: "project-1",
    loading: false,
  }),
}));

mock.module("@/lib/data/tasks", () => ({
  listTasks: listTasksMock,
}));

mock.module("@/lib/data/business-requirements", () => ({
  listBusinessRequirements: listBusinessRequirementsMock,
}));

mock.module("@/lib/data/system-functions", () => ({
  listSystemFunctions: listSystemFunctionsMock,
}));

mock.module("@/lib/data/system-requirements", () => ({
  listSystemRequirements: listSystemRequirementsMock,
}));

// UIは挙動検証に不要なので最低限に置き換える
mock.module("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

mock.module("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

mock.module("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

mock.module("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

mock.module("@/components/tickets/impact-scope-selected-panel", () => ({
  ImpactScopeSelectedPanel: () => null,
}));

mock.module("lucide-react", () => ({
  Loader2: () => <span>loading</span>,
}));

// Import after mocks
import { ImpactScopeSelector } from "@/components/tickets/impact-scope-selector";

afterEach(() => {
  cleanup();
  mock.restore();
});

describe("ImpactScopeSelector", () => {
  it("初期ロード時に currentProjectId を使ってデータ層を呼ぶ", async () => {
    render(<ImpactScopeSelector />);

    await waitFor(() => {
      expect(listTasksMock).toHaveBeenCalledWith("project-1");
      expect(listBusinessRequirementsMock).toHaveBeenCalledWith("project-1");
      expect(listSystemFunctionsMock).toHaveBeenCalledWith("project-1");
      expect(listSystemRequirementsMock).toHaveBeenCalledWith("project-1");
    });
  });
});

