import { z } from "zod";

export const PosEnum = z.enum([
  "notMentioned", "iCHEF", "Eats365", "Dudoo", "肚肚", "other", "none",
]);
export const InvoiceEnum = z.enum(["notMentioned", "paper", "electronic", "none"]);
export const OrderingFlowEnum = z.enum(["notMentioned", "staff", "paper", "qrcode", "mixed"]);
export const PaymentMethodEnum = z.enum(["cash", "card", "linePay", "jkoPay", "other"]);
export const DeliveryPlatformEnum = z.enum(["foodpanda", "uberEats", "lalamove", "none"]);
export const NextStepEnum = z.enum(["notMentioned", "strong", "medium", "weak", "none"]);
export const LeadGradeEnum = z.enum(["notSet", "hot", "warm", "cool", "cold"]);

export const BodySignalKeys = [
  "takingNotes",
  "askingPriceRepeatedly",
  "askingInstallSchedule",
  "mentionsConsulting",
  "lookingAtPhone",
  "sayingThinkAboutIt",
  "politeNoQuestions",
  "sayingWeAreSpecial",
  "mentioningCompetitors",
] as const;
export type BodySignalKey = (typeof BodySignalKeys)[number];

const bodySignalBoolMap = z.object(
  Object.fromEntries(BodySignalKeys.map((k) => [k, z.boolean()])) as Record<BodySignalKey, z.ZodBoolean>
);
const bodySignalNoteMap = z.object(
  Object.fromEntries(BodySignalKeys.map((k) => [k, z.string()])) as Record<BodySignalKey, z.ZodString>
);

export const DemoNoteSchema = z.object({
  meta: z.object({
    version: z.literal(1),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  basicInfo: z.object({
    restaurantName: z.string(),
    ownerSurname: z.string(),
    district: z.string(),
    restaurantType: z.string(),
    yearsOpen: z.string(),
    tableCount: z.string(),
    staffCount: z.string(),
    averageTicket: z.string(),
    businessHours: z.string(),
  }),
  icp: z.object({
    foreignGuestsPerWeek: z.string(),
    englishOrderingHandling: z.string(),
    currentOrderingMethod: z.string(),
  }),
  existingSystems: z.object({
    pos: PosEnum,
    posOther: z.string(),
    payment: z.array(PaymentMethodEnum),
    paymentOther: z.string(),
    invoice: InvoiceEnum,
    orderingFlow: OrderingFlowEnum,
    deliveryPlatforms: z.array(DeliveryPlatformEnum),
  }),
  painPoints: z.array(z.object({ id: z.string(), quote: z.string() })),
  demoReactions: z.object({
    segment1_customer: z.string(),
    segment2_kitchen: z.string(),
    segment3_owner: z.string(),
    segment4_future: z.string(),
  }),
  qaTimeline: z.array(
    z.object({ id: z.string(), question: z.string(), answer: z.string(), followUp: z.string() })
  ),
  commitments: z.array(
    z.object({ id: z.string(), done: z.boolean(), text: z.string(), dueDate: z.string() })
  ),
  bodySignals: z.object({
    checked: bodySignalBoolMap,
    notes: bodySignalNoteMap,
    other: z.string(),
  }),
  nextStepWillingness: NextStepEnum,
  leadGrade: LeadGradeEnum,
  judgement: z.string(),
  notes: z.string(),
});

export type DemoNote = z.infer<typeof DemoNoteSchema>;
