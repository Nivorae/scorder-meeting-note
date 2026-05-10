import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { PrintView } from "@/components/PrintView";
import { defaultDemoNote } from "@/lib/defaults";
import type { DemoNote } from "@/lib/schema";

function fullyFilled(): DemoNote {
  const note = defaultDemoNote();
  note.basicInfo.restaurantName = "小龍麵店";
  note.basicInfo.ownerSurname = "王";
  note.icp.foreignGuestsPerWeek = "5-10 組";
  note.existingSystems.pos = "iCHEF";
  note.existingSystems.payment = ["cash", "linePay"];
  note.existingSystems.invoice = "electronic";
  note.existingSystems.orderingFlow = "staff";
  note.existingSystems.deliveryPlatforms = ["foodpanda"];
  note.painPoints = [{ id: "p1", quote: "外國客點錯太多" }];
  note.demoReactions.segment1_customer = "客人很興奮";
  note.qaTimeline = [{ id: "q1", question: "員工難學嗎", answer: "30 分鐘", followUp: "滿意" }];
  note.commitments = [{ id: "c1", done: false, text: "寄合作說明", dueDate: "2026-05-11" }];
  note.bodySignals.checked.takingNotes = true;
  note.bodySignals.notes.takingNotes = "寫了三頁";
  note.nextStepWillingness = "strong";
  note.leadGrade = "hot";
  note.judgement = "Hot lead，下週簽約";
  note.notes = "整體氛圍很好";
  return note;
}

describe("PrintView", () => {
  it("renders 本段無紀錄 for every section when the note is empty", () => {
    render(<PrintView note={defaultDemoNote()} />);
    // 10 sections, all empty
    expect(screen.getAllByText("本段無紀錄")).toHaveLength(10);
  });

  it("renders only filled fields and falls back to 本段無紀錄 for blank sections", () => {
    const note = defaultDemoNote();
    note.basicInfo.restaurantName = "小龍麵店";
    note.painPoints = [{ id: "p1", quote: "外國客點錯太多" }];
    render(<PrintView note={note} />);

    expect(screen.getAllByText(/小龍麵店/).length).toBeGreaterThan(0);
    expect(screen.getByText(/外國客點錯太多/)).toBeInTheDocument();

    const icp = screen.getByRole("heading", { name: /ICP 三題/ }).closest("section");
    expect(icp).not.toBeNull();
    expect(within(icp as HTMLElement).getByText("本段無紀錄")).toBeInTheDocument();
  });

  it("hides per-signal notes when the matching checkbox is unchecked", () => {
    const note = defaultDemoNote();
    note.bodySignals.checked.takingNotes = false;
    note.bodySignals.notes.takingNotes = "this should not appear";
    // Force the section to render (otherwise it shows 本段無紀錄)
    note.bodySignals.other = "其他觀察占位";
    render(<PrintView note={note} />);
    expect(screen.queryByText(/this should not appear/)).not.toBeInTheDocument();
  });

  it("renders every section without 本段無紀錄 when fully filled", () => {
    render(<PrintView note={fullyFilled()} />);
    expect(screen.queryByText("本段無紀錄")).not.toBeInTheDocument();
    expect(screen.getAllByText(/小龍麵店/).length).toBeGreaterThan(0);
    expect(screen.getByText(/iCHEF/)).toBeInTheDocument();
    expect(screen.getByText(/Hot lead/)).toBeInTheDocument();
  });
});
