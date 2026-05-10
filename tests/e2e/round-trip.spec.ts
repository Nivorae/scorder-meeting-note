import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

test("fill → export JSON → re-import → form state matches", async ({ page }) => {
  await page.goto("/");

  // Wait for HydratedForm to mount (the 載入中… placeholder goes away)
  await expect(page.getByRole("button", { name: "匯入 JSON" })).toBeVisible();

  // Fill a few representative fields
  await page.getByLabel("餐廳名稱").fill("小龍麵店");
  await page.getByLabel("老闆姓氏").fill("王");

  // Pick a POS — RadioGroupItem renders a button with role="radio"
  await page.getByRole("radio", { name: "iCHEF" }).click();

  // Add a pain point — scope to the pain section to avoid matching other textareas
  await page.locator("#pain textarea").first().fill("外國客點錯太多次了");

  // Trigger autosave debounce
  await page.waitForTimeout(800);
  await expect(page.getByText(/已儲存/)).toBeVisible();

  // Export JSON
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出 JSON" }).click();
  const download = await downloadPromise;
  const tmpPath = path.join(os.tmpdir(), `scorder-${Date.now()}.json`);
  await download.saveAs(tmpPath);

  const exportedRaw = await fs.readFile(tmpPath, "utf8");
  const exported = JSON.parse(exportedRaw);
  expect(exported.basicInfo.restaurantName).toBe("小龍麵店");
  expect(exported.basicInfo.ownerSurname).toBe("王");
  expect(exported.existingSystems.pos).toBe("iCHEF");
  expect(exported.painPoints.some((p: { quote: string }) => p.quote.includes("外國客點錯"))).toBe(true);

  // Clear form, then re-import
  await page.getByRole("button", { name: "清空表單" }).click();
  await page.getByRole("button", { name: "確定清空" }).click();
  await expect(page.getByLabel("餐廳名稱")).toHaveValue("");

  await page.setInputFiles('input[type="file"]', tmpPath);
  await page.getByRole("button", { name: "確定匯入" }).click();
  await expect(page.getByLabel("餐廳名稱")).toHaveValue("小龍麵店");
  await expect(page.getByLabel("老闆姓氏")).toHaveValue("王");

  await fs.unlink(tmpPath);
});

test("malformed JSON import surfaces the error dialog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "匯入 JSON" })).toBeVisible();

  // Write a JSON file with the wrong meta.version (caught by the version check
  // in Toolbar before zod even runs)
  const tmpPath = path.join(os.tmpdir(), `scorder-bad-${Date.now()}.json`);
  await fs.writeFile(tmpPath, JSON.stringify({ meta: { version: 99 } }), "utf8");

  await page.setInputFiles('input[type="file"]', tmpPath);
  await expect(page.getByRole("heading", { name: "匯入失敗" })).toBeVisible();
  await expect(page.getByText(/不支援的檔案版本/)).toBeVisible();

  // Confirm form state was not mutated
  await page.getByRole("button", { name: "關閉" }).click();
  await expect(page.getByLabel("餐廳名稱")).toHaveValue("");

  await fs.unlink(tmpPath);
});
