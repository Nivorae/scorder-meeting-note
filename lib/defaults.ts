import { BodySignalKeys, type DemoNote } from "@/lib/schema";

const emptySignalBools = () =>
  Object.fromEntries(BodySignalKeys.map((k) => [k, false])) as DemoNote["bodySignals"]["checked"];

const emptySignalNotes = () =>
  Object.fromEntries(BodySignalKeys.map((k) => [k, ""])) as DemoNote["bodySignals"]["notes"];

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export function defaultDemoNote(): DemoNote {
  const now = new Date().toISOString();
  return {
    meta: { version: 1, createdAt: now, updatedAt: now },
    basicInfo: {
      restaurantName: "",
      ownerSurname: "",
      district: "",
      restaurantType: "",
      yearsOpen: "",
      tableCount: "",
      staffCount: "",
      averageTicket: "",
      businessHours: "",
    },
    icp: { foreignGuestsPerWeek: "", englishOrderingHandling: "", currentOrderingMethod: "" },
    existingSystems: {
      pos: "notMentioned",
      posOther: "",
      payment: [],
      paymentOther: "",
      invoice: "notMentioned",
      orderingFlow: "notMentioned",
      deliveryPlatforms: [],
    },
    painPoints: [
      { id: newId(), quote: "" },
      { id: newId(), quote: "" },
      { id: newId(), quote: "" },
    ],
    demoReactions: {
      segment1_customer: "",
      segment2_kitchen: "",
      segment3_owner: "",
      segment4_future: "",
    },
    qaTimeline: [{ id: newId(), question: "", answer: "", followUp: "" }],
    commitments: [
      { id: newId(), done: false, text: "", dueDate: "" },
      { id: newId(), done: false, text: "", dueDate: "" },
    ],
    bodySignals: { checked: emptySignalBools(), notes: emptySignalNotes(), other: "" },
    nextStepWillingness: "notMentioned",
    leadGrade: "notSet",
    judgement: "",
    notes: "",
  };
}

export { newId };
