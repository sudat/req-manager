import { Window } from "happy-dom";
const window = new Window();
Object.assign(globalThis, {
  document: window.document,
  window,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
});

import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, within } from "@testing-library/react";
import { InputSchemaViewer } from "../../../../components/system-domains/structured-spec-viewer/InputSchemaViewer";

afterEach(() => {
  cleanup();
});

describe("InputSchemaViewer", () => {
  it("screenは入力フィールドを1表で表示し、UI属性列を表示する", () => {
    const view = render(
      <InputSchemaViewer
        ioType="screen"
        inputSchema={{
          trigger: "click",
          action: "請求書発行画面の表示・操作",
          targetElement: "請求書発行画面全体",
          precondition: "ユーザーが請求管理権限を持つこと",
          fields: [
            {
              name: "customerSelector",
              label: "請求先顧客選択",
              type: "object",
              required: true,
              description: "請求先顧客を検索・選択するコンポーネント",
              elementType: "select",
            },
            {
              name: "customerId",
              label: "請求先顧客ID",
              type: "string",
              required: true,
              description: "選択された顧客のID",
            },
          ],
        }}
      />
    );

    expect(view.getAllByRole("table").length).toBe(1);
    expect(view.queryByText("入力要素")).toBeNull();
    expect(view.queryByText("入力データ項目")).toBeNull();
    expect(view.getByText("入力フィールド")).toBeTruthy();

    const table = view.getByRole("table");
    expect(within(table).getByText("UI属性")).toBeTruthy();
    expect(within(table).getByText("select")).toBeTruthy();
    expect(within(table).getByText("—")).toBeTruthy();
  });

  it("apiは入力フィールドを1表で表示し、配置列を表示する", () => {
    const view = render(
      <InputSchemaViewer
        ioType="api"
        inputSchema={{
          method: "POST",
          path: "/api/invoices",
          fields: [
            {
              name: "customerId",
              label: "顧客ID",
              type: "string",
              required: true,
              description: "検索対象の顧客ID",
              location: "query",
            },
            {
              name: "lineItems",
              label: "明細行",
              type: "array",
              required: true,
              description: "請求対象明細",
              location: "body",
            },
          ],
        }}
      />
    );

    expect(view.getAllByRole("table").length).toBe(1);
    expect(view.queryByText("クエリパラメータ")).toBeNull();
    expect(view.queryByText("リクエストボディ")).toBeNull();

    const table = view.getByRole("table");
    expect(within(table).getByText("配置")).toBeTruthy();
    expect(within(table).getByText("query")).toBeTruthy();
    expect(within(table).getByText("body")).toBeTruthy();
  });

  it("batchは入力フィールドを1表で表示し、カテゴリ列を表示する", () => {
    const view = render(
      <InputSchemaViewer
        ioType="batch"
        inputSchema={{
          schedule: "0 0 * * *",
          source: "invoices.pending",
          fields: [
            {
              name: "retryCount",
              label: "再試行回数",
              type: "number",
              required: false,
              description: "最大再試行回数",
              category: "config",
            },
            {
              name: "invoiceIds",
              label: "請求ID一覧",
              type: "array",
              required: true,
              description: "発行対象ID",
              category: "data",
            },
          ],
        }}
      />
    );

    expect(view.getAllByRole("table").length).toBe(1);
    expect(view.queryByText("パラメータ")).toBeNull();
    expect(view.queryByText("入力データ項目")).toBeNull();

    const table = view.getByRole("table");
    expect(within(table).getByText("カテゴリ")).toBeTruthy();
    expect(within(table).getByText("config")).toBeTruthy();
    expect(within(table).getByText("data")).toBeTruthy();
  });
});
