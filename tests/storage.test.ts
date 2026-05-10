import { afterEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, clearDraft, loadDraft, saveDraft } from "@/lib/storage";
import { defaultDemoNote } from "@/lib/defaults";

afterEach(() => localStorage.clear());

describe("storage", () => {
  it("returns null when no draft exists", () => {
    expect(loadDraft()).toBeNull();
  });

  it("round-trips a draft through save/load", () => {
    const note = defaultDemoNote();
    note.basicInfo.restaurantName = "小龍麵店";
    saveDraft(note);
    const loaded = loadDraft();
    expect(loaded?.basicInfo.restaurantName).toBe("小龍麵店");
  });

  it("returns null on corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadDraft()).toBeNull();
  });

  it("returns null when stored version mismatches", () => {
    const bad = { ...defaultDemoNote(), meta: { version: 99, createdAt: "", updatedAt: "" } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bad));
    expect(loadDraft()).toBeNull();
  });

  it("clearDraft removes the key", () => {
    saveDraft(defaultDemoNote());
    clearDraft();
    expect(loadDraft()).toBeNull();
  });
});
