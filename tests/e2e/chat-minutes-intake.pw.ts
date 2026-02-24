import { expect, test } from "@playwright/test";

test("議事録から草案の導線でBT/BR草案カードが表示される", async ({ page }) => {
  await page.route("**/api/intake/minutes/extract", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        bdOptions: [
          { area: "AR", name: "債権管理" },
          { area: "GL", name: "一般会計" },
        ],
        items: [
          {
            id: "i1",
            title: "請求書発行",
            summary: "請求書を発行して送付する",
            evidence: "議事録: 請求書を毎月発行",
            draftInput: "毎月の請求書を発行し、メールで送付する業務を追加したい。",
            suggestedBdArea: "AR",
            systemNotes: ["PDF出力が必要"],
          },
          {
            id: "i2",
            title: "仕訳入力",
            summary: "月次の仕訳入力を標準化する",
            evidence: "議事録: 仕訳の入力ルールを統一",
            draftInput: "月次の仕訳入力を標準化し、入力チェックもしたい。",
            suggestedBdArea: null,
            systemNotes: [],
          },
        ],
      }),
    });
  });

  await page.route("**/api/intake/minutes/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            itemId: "i1",
            ok: true,
            btDraft: {
              code: "BT-AR-0006",
              name: "請求書発行",
              summary: "請求書を発行して顧客に送付する業務",
              processSteps: [],
              input: [],
              output: [],
              business_area: "AR",
              project_id: "project-1",
              concept_ids: [],
            },
            brDrafts: [
              {
                code: "BT-AR-0006-001",
                requirement: "請求書をPDFで出力できる",
                rationale: "送付のため",
                business_task_id: null,
              },
            ],
            conceptCandidates: [],
            uncertainties: [],
            previewAvailable: true,
          },
          {
            itemId: "i2",
            ok: true,
            btDraft: {
              code: "BT-GL-0001",
              name: "仕訳入力標準化",
              summary: "月次の仕訳入力ルールを標準化する業務",
              processSteps: [],
              input: [],
              output: [],
              business_area: "GL",
              project_id: "project-1",
              concept_ids: [],
            },
            brDrafts: [
              {
                code: "BT-GL-0001-001",
                requirement: "仕訳入力ルールを統一できる",
                rationale: "ミス削減のため",
                business_task_id: null,
              },
            ],
            conceptCandidates: [],
            uncertainties: [],
            previewAvailable: true,
          },
        ],
      }),
    });
  });

  await page.goto("/chat");

  await expect(page.getByRole("button", { name: "議事録から草案" })).toBeVisible();
  await page.getByRole("button", { name: "議事録から草案" }).click();

  const dialog = page.getByRole("dialog", { name: "議事録から草案" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("議事録テキスト").fill("議事録テキスト（ダミー）");
  await page.getByRole("button", { name: "抽出" }).click();

  await expect(dialog.getByText("請求書発行", { exact: true })).toBeVisible();
  await expect(dialog.getByText("仕訳入力", { exact: true })).toBeVisible();

  // 2件目のBDが未指定なので指定して生成可能にする
  await dialog
    .locator('[data-slot="select-trigger"]')
    .filter({ hasText: "業務領域を選択" })
    .click();
  await page.getByRole("option", { name: "GL: 一般会計" }).click();

  await page.getByRole("button", { name: "草案を生成" }).click();

  // ダイアログが閉じて、草案カードが表示される
  await expect(page.getByRole("dialog", { name: "議事録から草案" })).toBeHidden();
  await expect(page.locator("h3", { hasText: "業務タスク草案" })).toHaveCount(2);
  await expect(page.locator("h3", { hasText: "業務要件草案" })).toHaveCount(2);
});
