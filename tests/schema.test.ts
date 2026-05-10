import { describe, expect, it } from "vitest";
import { DemoNoteSchema } from "@/lib/schema";
import { defaultDemoNote } from "@/lib/defaults";

describe("DemoNoteSchema", () => {
  it("accepts a fully empty default note", () => {
    const result = DemoNoteSchema.safeParse(defaultDemoNote());
    expect(result.success).toBe(true);
  });

  it("accepts notMentioned for all radio fields", () => {
    const note = defaultDemoNote();
    expect(note.existingSystems.pos).toBe("notMentioned");
    expect(note.existingSystems.invoice).toBe("notMentioned");
    expect(note.existingSystems.orderingFlow).toBe("notMentioned");
    expect(note.nextStepWillingness).toBe("notMentioned");
    expect(note.leadGrade).toBe("notSet");
  });

  it("accepts a fully populated note", () => {
    const note = defaultDemoNote();
    note.basicInfo.restaurantName = "小龍麵店";
    note.basicInfo.ownerSurname = "王";
    note.painPoints = [{ id: "p1", quote: "外國客點錯太多次" }];
    note.qaTimeline = [{ id: "q1", question: "員工難學嗎？", answer: "30分鐘訓練", followUp: "滿意" }];
    note.commitments = [{ id: "c1", done: false, text: "寄合作說明", dueDate: "2026-05-11" }];
    note.existingSystems.pos = "iCHEF";
    note.existingSystems.payment = ["cash", "linePay"];
    note.nextStepWillingness = "strong";
    note.leadGrade = "hot";
    const result = DemoNoteSchema.safeParse(note);
    expect(result.success).toBe(true);
  });

  it("rejects an unknown POS enum value", () => {
    const note = defaultDemoNote() as unknown as Record<string, unknown>;
    (note.existingSystems as Record<string, unknown>).pos = "Square";
    expect(DemoNoteSchema.safeParse(note).success).toBe(false);
  });

  it("rejects a meta.version other than 1", () => {
    const note = defaultDemoNote() as unknown as Record<string, unknown>;
    (note.meta as Record<string, unknown>).version = 2;
    expect(DemoNoteSchema.safeParse(note).success).toBe(false);
  });
});
