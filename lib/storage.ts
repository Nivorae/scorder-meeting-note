import { DemoNoteSchema, type DemoNote } from "@/lib/schema";

export const STORAGE_KEY = "scorder-demo-note:draft:v1";

export function loadDraft(): DemoNote | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = DemoNoteSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function saveDraft(note: DemoNote): void {
  if (typeof window === "undefined") return;
  const stamped: DemoNote = { ...note, meta: { ...note.meta, updatedAt: new Date().toISOString() } };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
