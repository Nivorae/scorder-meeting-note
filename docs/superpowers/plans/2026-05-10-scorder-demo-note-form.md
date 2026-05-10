# Scorder Demo 紀錄表單 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 15 single-page form that lets Max capture all fields from the source doc's "即時紀錄模板" during a live Scorder demo, auto-saves to localStorage, supports JSON import/export, and exports a clean black-and-white PDF via the browser print dialog.

**Architecture:** Single Next.js App Router app with two routes: `/` (the form) and `/print` (the read-only B&W preview). State lives in `react-hook-form`; the Zod schema in `lib/schema.ts` is the single source of truth for all field shapes, validation, and the JSON wire format. localStorage holds one active draft synced via a debounced watcher. The print route reads the same draft and triggers `window.print()` after layout settles.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · react-hook-form · Zod · Vitest · Playwright · Noto Sans TC

**Spec:** `docs/superpowers/specs/2026-05-10-scorder-demo-note-form-design.md`

---

## File Structure (target)

```
scorder-meeting-note/
├── app/
│   ├── layout.tsx                       # Noto Sans TC font, Tailwind globals
│   ├── page.tsx                         # form page (RHF provider, autosave, layout)
│   ├── globals.css                      # Tailwind base + globals
│   └── print/
│       └── page.tsx                     # print preview route
├── components/
│   ├── form/
│   │   ├── SectionShell.tsx             # shared section wrapper (id anchor + heading)
│   │   ├── BasicInfoSection.tsx
│   │   ├── IcpSection.tsx
│   │   ├── ExistingSystemsSection.tsx
│   │   ├── PainPointsSection.tsx        # dynamic array
│   │   ├── DemoReactionSection.tsx
│   │   ├── QaTimelineSection.tsx        # dynamic array
│   │   ├── CommitmentsSection.tsx       # dynamic array
│   │   ├── BodySignalsSection.tsx       # 9 fixed checkboxes + per-signal notes
│   │   ├── LeadGradingSection.tsx       # willingness + grade + judgement
│   │   └── NotesSection.tsx
│   ├── StickyNav.tsx                    # scroll-spy nav
│   ├── Toolbar.tsx                      # autosave indicator + Import/Export/Clear/PDF
│   └── PrintView.tsx                    # the read-only print body
├── lib/
│   ├── schema.ts                        # Zod schema = single source of truth
│   ├── defaults.ts                      # initial form values
│   ├── storage.ts                       # localStorage read/write/clear
│   └── filename.ts                      # JSON download filename sanitiser
├── styles/
│   └── print.css                        # @page rules + monochrome overrides
├── tests/
│   ├── setup.ts                         # @testing-library/jest-dom matchers
│   ├── schema.test.ts                   # Vitest unit tests
│   ├── storage.test.ts
│   ├── filename.test.ts
│   ├── PrintView.test.tsx               # Vitest + Testing Library
│   └── e2e/
│       └── round-trip.spec.ts           # Playwright smoke tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── vitest.config.ts
├── playwright.config.ts
├── next.config.mjs
├── .gitignore
└── README.md
```

---

## Task 1: Bootstrap Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs` (or `.ts`), `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tailwind.config.ts`, `postcss.config.mjs`, `.gitignore`

> **Why scaffold-into-a-sibling-then-merge:** `create-next-app` refuses to scaffold into a non-empty directory unless every pre-existing entry is in its hard-coded "safe" list (essentially `.git`, `.gitignore`, `.DS_Store`, `LICENSE`, `README.md`, `docs`, plus a handful of CI/IDE dotfiles). The project root currently contains `.claude/` (project Claude Code config — must NOT be moved or it breaks the host environment) plus `scorder-meeting-note.md` and `docs/`. Stashing those files in place would still leave `.claude/` triggering the refusal. Scaffolding into a sibling temp dir and copying the new files in is the only safe option.

- [ ] **Step 1: Move the source doc into the project's `docs/source/` (no stashing required)**

```bash
cd /Users/kaoyihsin/Documents/Work/Company/Nivorae/scorder-meeting-note
mkdir -p docs/source
[ -e scorder-meeting-note.md ] && mv scorder-meeting-note.md docs/source/scorder-meeting-note.md
```

- [ ] **Step 2: Scaffold into a sibling temp directory**

```bash
cd ..
rm -rf scorder-scaffold-tmp
npx --yes create-next-app@latest scorder-scaffold-tmp \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias='@/*' \
  --use-npm \
  --yes
```

Flag notes:
- `--no-src-dir` (not `--src-dir=false`) keeps `app/` at the project root.
- We deliberately omit `--no-turbopack`; let `create-next-app` pick its default.

- [ ] **Step 3: Merge scaffolded files into the project, never overwriting an existing entry**

```bash
cd scorder-meeting-note
shopt -s dotglob
for entry in ../scorder-scaffold-tmp/*; do
  name=$(basename "$entry")
  if [ -e "$name" ]; then
    echo "skip (exists): $name"
  else
    mv "$entry" .
  fi
done
shopt -u dotglob
rm -rf ../scorder-scaffold-tmp
```

> If the loop reports `skip (exists): README.md` that's fine — `create-next-app`'s default README is not what we want anyway and Task 26 replaces it.

- [ ] **Step 4: Verify the scaffold landed**

```bash
test -f package.json && test -d app && test -f tsconfig.json && echo "scaffold OK"
```

Should print `scaffold OK`. If not, inspect what's missing and re-run Step 2-3.

---

## Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install RHF, Zod, and class-variance helpers**

```bash
npm install react-hook-form zod @hookform/resolvers clsx tailwind-merge
npm install -D @types/node
```

- [ ] **Step 2: Init shadcn/ui**

```bash
npx shadcn@latest init -d
```

Pick defaults: Style=`Default`, Base color=`Neutral`, CSS variables=`Yes`.

- [ ] **Step 3: Add the shadcn components we need**

```bash
npx shadcn@latest add button input textarea checkbox radio-group select label dialog
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add RHF, Zod, shadcn primitives"
```

---

## Task 3: Configure Noto Sans TC font + Tailwind print variant + globals

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`

> **Why not `next/font/google`:** `Noto_Sans_TC` loaded via `next/font/google` does not expose a `chinese-traditional` subset — only `latin` and `cyrillic`. Loading just the `latin` subset means every Chinese glyph in the app (which is ~100% of the visible text) silently falls back to the system font, defeating the purpose of choosing the typeface. We instead load the font through Google's stylesheet endpoint, whose CSS uses `unicode-range` per `@font-face` block so the browser only fetches the TC subset glyphs that actually appear on the page. `preconnect` mitigates the extra DNS hop.

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scorder Demo 紀錄",
  description: "Scorder live demo 紀錄表單",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: "Noto Sans TC", ui-sans-serif, system-ui, "PingFang TC",
      "Microsoft JhengHei", sans-serif;
  }
}

@import "../styles/print.css";
```

- [ ] **Step 3: Update `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Noto Sans TC"',
          "ui-sans-serif",
          "system-ui",
          '"PingFang TC"',
          '"Microsoft JhengHei"',
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Create empty placeholder `styles/print.css`** (filled in Task 24)

```bash
mkdir -p styles
printf '/* print styles — populated in Task 24 */\n' > styles/print.css
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Visit `http://localhost:3000` — it should render the create-next-app default page with Noto Sans TC. Stop the dev server (Ctrl-C).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: configure Noto Sans TC font and print stylesheet hook"
```

---

## Task 4: Install Vitest + write Zod schema with tests (TDD)

**Files:**
- Create: `vitest.config.ts`, `lib/schema.ts`, `tests/schema.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest + Testing Library**

```bash
npm install -D vitest @vitest/ui jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/dom
```

(Testing Library is needed by the `PrintView` tests in Task 22.5; bundling it here keeps the dependency installs in one commit.)

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["tests/e2e/**"],
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 2b: Create `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Write the failing schema test `tests/schema.test.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to confirm it fails**

```bash
npm test
```

Expected: failure with "Cannot find module '@/lib/schema'" or similar.

- [ ] **Step 5: Create `lib/schema.ts`**

```ts
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
```

- [ ] **Step 6: Run tests — should still fail because `defaults.ts` is missing**

```bash
npm test
```

Expected: failure on "Cannot find module '@/lib/defaults'". That's expected — Task 5 fixes it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(schema): add Zod schema for DemoNote"
```

---

## Task 5: Default form values

**Files:**
- Create: `lib/defaults.ts`

- [ ] **Step 1: Create `lib/defaults.ts`**

```ts
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
```

- [ ] **Step 2: Run tests — all 5 schema tests should pass**

```bash
npm test
```

Expected: 5 passing.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(defaults): add defaultDemoNote factory + newId helper"
```

---

## Task 6: localStorage helpers (TDD)

**Files:**
- Create: `lib/storage.ts`, `tests/storage.test.ts`

- [ ] **Step 1: Write the failing test `tests/storage.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — should fail with module-not-found**

```bash
npm test
```

- [ ] **Step 3: Create `lib/storage.ts`**

```ts
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
```

- [ ] **Step 4: Run tests — all should pass**

```bash
npm test
```

Expected: 10 total passing (5 schema + 5 storage).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(storage): add localStorage draft helpers with schema validation"
```

---

## Task 7: Filename sanitiser (TDD)

**Files:**
- Create: `lib/filename.ts`, `tests/filename.test.ts`

- [ ] **Step 1: Write `tests/filename.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { buildExportFilename } from "@/lib/filename";

describe("buildExportFilename", () => {
  it("uses 'untitled' when restaurant name is empty", () => {
    expect(buildExportFilename("", "2026-05-10")).toBe("scorder-demo_2026-05-10_untitled.json");
  });

  it("preserves Chinese characters", () => {
    expect(buildExportFilename("小龍麵店", "2026-05-10")).toBe(
      "scorder-demo_2026-05-10_小龍麵店.json"
    );
  });

  it("strips reserved filename characters", () => {
    expect(buildExportFilename('a/b\\c:d*e?f"g<h>i|j', "2026-05-10")).toBe(
      "scorder-demo_2026-05-10_abcdefghij.json"
    );
  });

  it("trims leading/trailing whitespace and dots", () => {
    expect(buildExportFilename("   .店家.   ", "2026-05-10")).toBe(
      "scorder-demo_2026-05-10_店家.json"
    );
  });
});
```

- [ ] **Step 2: Run — should fail**

```bash
npm test
```

- [ ] **Step 3: Create `lib/filename.ts`**

```ts
const RESERVED = /[\\/:*?"<>|]/g;

export function buildExportFilename(restaurantName: string, isoDate: string): string {
  const cleaned = restaurantName.replace(RESERVED, "").replace(/^[\s.]+|[\s.]+$/g, "");
  const name = cleaned.length > 0 ? cleaned : "untitled";
  return `scorder-demo_${isoDate}_${name}.json`;
}

export function todayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run — all tests pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(filename): add export filename sanitiser"
```

---

## Task 8: SectionShell component

**Files:**
- Create: `components/form/SectionShell.tsx`

- [ ] **Step 1: Create `components/form/SectionShell.tsx`**

```tsx
import * as React from "react";

interface SectionShellProps {
  id: string;
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SectionShell({ id, number, title, description, children }: SectionShellProps) {
  return (
    <section
      id={id}
      data-section-anchor={id}
      className="scroll-mt-24 border-b border-neutral-200 pb-10 pt-6"
    >
      <header className="mb-4">
        <h2 className="text-xl font-bold tracking-tight">
          <span className="mr-2 text-neutral-400">{number}.</span>
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add SectionShell wrapper for scroll-spy anchors"
```

---

## Task 9: BasicInfoSection

**Files:**
- Create: `components/form/BasicInfoSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import type { DemoNote } from "@/lib/schema";

const FIELDS: Array<{ key: keyof DemoNote["basicInfo"]; label: string; placeholder?: string }> = [
  { key: "restaurantName", label: "餐廳名稱" },
  { key: "ownerSurname", label: "老闆姓氏" },
  { key: "district", label: "所在區" },
  { key: "restaurantType", label: "餐廳類型", placeholder: "日料 / 咖啡廳 / 麵店…" },
  { key: "yearsOpen", label: "營業多久" },
  { key: "tableCount", label: "桌數" },
  { key: "staffCount", label: "員工人數（含老闆）" },
  { key: "averageTicket", label: "客單價（估）" },
  { key: "businessHours", label: "營業時段" },
];

export function BasicInfoSection() {
  const { register } = useFormContext<DemoNote>();
  return (
    <SectionShell id="basic" number={1} title="基本資料">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label htmlFor={`basic-${f.key}`}>{f.label}</Label>
            <Input
              id={`basic-${f.key}`}
              placeholder={f.placeholder ?? "（未提及則留空）"}
              {...register(`basicInfo.${f.key}`)}
            />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add BasicInfoSection"
```

---

## Task 10: IcpSection

**Files:**
- Create: `components/form/IcpSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import type { DemoNote } from "@/lib/schema";

const Q: Array<{ key: keyof DemoNote["icp"]; label: string }> = [
  { key: "foreignGuestsPerWeek", label: "1) 一週接待多少組外國觀光客？" },
  { key: "englishOrderingHandling", label: "2) 目前怎麼處理英文點餐？" },
  { key: "currentOrderingMethod", label: "3) 現在客人怎麼點餐？" },
];

export function IcpSection() {
  const { register } = useFormContext<DemoNote>();
  return (
    <SectionShell id="icp" number={2} title="ICP 三題" description="Juliana 在 demo 前段必問的三題，逐字記錄答案。">
      <div className="space-y-4">
        {Q.map((q) => (
          <div key={q.key}>
            <Label htmlFor={`icp-${q.key}`}>{q.label}</Label>
            <Textarea
              id={`icp-${q.key}`}
              rows={2}
              placeholder="（未提及則留空）"
              {...register(`icp.${q.key}`)}
            />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add IcpSection"
```

---

## Task 11: ExistingSystemsSection

**Files:**
- Create: `components/form/ExistingSystemsSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import type { DemoNote } from "@/lib/schema";

const POS = [
  { v: "notMentioned", l: "略過 / 未提及" },
  { v: "iCHEF", l: "iCHEF" },
  { v: "Eats365", l: "Eats365" },
  { v: "Dudoo", l: "Dudoo" },
  { v: "肚肚", l: "肚肚" },
  { v: "other", l: "其他" },
  { v: "none", l: "無 POS" },
] as const;

const PAYMENT = [
  { v: "cash", l: "現金" },
  { v: "card", l: "刷卡" },
  { v: "linePay", l: "LINE Pay" },
  { v: "jkoPay", l: "街口" },
  { v: "other", l: "其他" },
] as const;

const INVOICE = [
  { v: "notMentioned", l: "略過 / 未提及" },
  { v: "paper", l: "紙本" },
  { v: "electronic", l: "電子" },
  { v: "none", l: "無" },
] as const;

const ORDER_FLOW = [
  { v: "notMentioned", l: "略過 / 未提及" },
  { v: "staff", l: "員工接" },
  { v: "paper", l: "紙本" },
  { v: "qrcode", l: "QR Code" },
  { v: "mixed", l: "混合" },
] as const;

const DELIVERY = [
  { v: "foodpanda", l: "foodpanda" },
  { v: "uberEats", l: "Uber Eats" },
  { v: "lalamove", l: "Lalamove" },
  { v: "none", l: "無外送平台" },
] as const;

export function ExistingSystemsSection() {
  const { register, control, setValue } = useFormContext<DemoNote>();
  const pos = useWatch({ control, name: "existingSystems.pos" });
  const payment = useWatch({ control, name: "existingSystems.payment" });
  const delivery = useWatch({ control, name: "existingSystems.deliveryPlatforms" });

  const togglePayment = (v: (typeof PAYMENT)[number]["v"]) => {
    const set = new Set(payment ?? []);
    set.has(v) ? set.delete(v) : set.add(v);
    setValue("existingSystems.payment", Array.from(set), { shouldDirty: true });
  };
  const toggleDelivery = (v: (typeof DELIVERY)[number]["v"]) => {
    const set = new Set(delivery ?? []);
    set.has(v) ? set.delete(v) : set.add(v);
    setValue("existingSystems.deliveryPlatforms", Array.from(set), { shouldDirty: true });
  };

  return (
    <SectionShell id="systems" number={3} title="現有系統與工具">
      {/* POS */}
      <div>
        <Label>POS 廠牌</Label>
        <Controller
          control={control}
          name="existingSystems.pos"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {POS.map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={opt.v} id={`pos-${opt.v}`} />
                  <span className={opt.v === "notMentioned" ? "text-neutral-400" : ""}>{opt.l}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
        {pos === "other" && (
          <Input className="mt-2" placeholder="其他 POS 名稱" {...register("existingSystems.posOther")} />
        )}
      </div>

      {/* Payment */}
      <div>
        <Label>結帳方式（可多選）</Label>
        <p className="text-xs text-neutral-400">未提及此題：全部不勾選即可</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PAYMENT.map((opt) => (
            <label key={opt.v} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={(payment ?? []).includes(opt.v)}
                onCheckedChange={() => togglePayment(opt.v)}
              />
              <span>{opt.l}</span>
            </label>
          ))}
        </div>
        {(payment ?? []).includes("other") && (
          <Input className="mt-2" placeholder="其他付款方式" {...register("existingSystems.paymentOther")} />
        )}
      </div>

      {/* Invoice */}
      <div>
        <Label>發票處理</Label>
        <Controller
          control={control}
          name="existingSystems.invoice"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {INVOICE.map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={opt.v} id={`inv-${opt.v}`} />
                  <span className={opt.v === "notMentioned" ? "text-neutral-400" : ""}>{opt.l}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </div>

      {/* Ordering flow */}
      <div>
        <Label>點餐流程</Label>
        <Controller
          control={control}
          name="existingSystems.orderingFlow"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5"
            >
              {ORDER_FLOW.map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={opt.v} id={`order-${opt.v}`} />
                  <span className={opt.v === "notMentioned" ? "text-neutral-400" : ""}>{opt.l}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </div>

      {/* Delivery */}
      <div>
        <Label>外送平台合作（可多選）</Label>
        <p className="text-xs text-neutral-400">未提及此題：全部不勾選即可</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DELIVERY.map((opt) => (
            <label key={opt.v} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={(delivery ?? []).includes(opt.v)}
                onCheckedChange={() => toggleDelivery(opt.v)}
              />
              <span>{opt.l}</span>
            </label>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add ExistingSystemsSection with multi-select + conditional Other"
```

---

## Task 12: PainPointsSection (dynamic)

**Files:**
- Create: `components/form/PainPointsSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/form/SectionShell";
import { newId } from "@/lib/defaults";
import type { DemoNote } from "@/lib/schema";

export function PainPointsSection() {
  const { control, register } = useFormContext<DemoNote>();
  const { fields, append, remove } = useFieldArray({ control, name: "painPoints" });

  return (
    <SectionShell
      id="pain"
      number={4}
      title="痛點"
      description="記對方原話，引用越精確越好。具體故事 + 時間點 + 後果 = 黃金資料。"
    >
      <ul className="space-y-3">
        {fields.map((row, i) => (
          <li key={row.id} className="flex items-start gap-3">
            <span className="mt-2 w-6 text-right text-sm text-neutral-400">{i + 1}.</span>
            <Textarea
              rows={2}
              className="flex-1"
              placeholder="「對方原話…」"
              {...register(`painPoints.${i}.quote`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(i)}
              aria-label="刪除這條痛點"
            >
              ✕
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" onClick={() => append({ id: newId(), quote: "" })}>
        + 新增痛點
      </Button>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add PainPointsSection (dynamic)"
```

---

## Task 13: DemoReactionSection

**Files:**
- Create: `components/form/DemoReactionSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import type { DemoNote } from "@/lib/schema";

const SEGMENTS: Array<{ key: keyof DemoNote["demoReactions"]; label: string }> = [
  { key: "segment1_customer", label: "第 1 段（客人視角）" },
  { key: "segment2_kitchen", label: "第 2 段（廚房視角）" },
  { key: "segment3_owner", label: "第 3 段（老闆視角）" },
  { key: "segment4_future", label: "第 4 段（未來功能）" },
];

export function DemoReactionSection() {
  const { register } = useFormContext<DemoNote>();
  return (
    <SectionShell id="reaction" number={5} title="Demo 反應" description="每段 1-2 句即可，但要具體。">
      <div className="space-y-4">
        {SEGMENTS.map((s) => (
          <div key={s.key}>
            <Label htmlFor={`react-${s.key}`}>{s.label}</Label>
            <Textarea
              id={`react-${s.key}`}
              rows={2}
              placeholder="（未提及則留空）"
              {...register(`demoReactions.${s.key}`)}
            />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add DemoReactionSection"
```

---

## Task 14: QaTimelineSection (dynamic)

**Files:**
- Create: `components/form/QaTimelineSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import { newId } from "@/lib/defaults";
import type { DemoNote } from "@/lib/schema";

export function QaTimelineSection() {
  const { control, register } = useFormContext<DemoNote>();
  const { fields, append, remove } = useFieldArray({ control, name: "qaTimeline" });

  return (
    <SectionShell id="qa" number={6} title="老闆問題與 Juliana 回答">
      <ul className="space-y-4">
        {fields.map((row, i) => (
          <li key={row.id} className="rounded-md border border-neutral-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-500">#{i + 1}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} aria-label="刪除這條 Q&A">
                ✕
              </Button>
            </div>
            <div className="space-y-2">
              <div>
                <Label>問</Label>
                <Textarea rows={2} placeholder="「老闆原話」" {...register(`qaTimeline.${i}.question`)} />
              </div>
              <div>
                <Label>答</Label>
                <Textarea rows={2} placeholder="Juliana 怎麼回的（重點）" {...register(`qaTimeline.${i}.answer`)} />
              </div>
              <div>
                <Label>追問</Label>
                <Textarea
                  rows={2}
                  placeholder="老闆有沒有追問或滿意？"
                  {...register(`qaTimeline.${i}.followUp`)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ id: newId(), question: "", answer: "", followUp: "" })}
      >
        + 新增 Q&A
      </Button>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add QaTimelineSection (dynamic)"
```

---

## Task 15: CommitmentsSection (dynamic)

**Files:**
- Create: `components/form/CommitmentsSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import { newId } from "@/lib/defaults";
import type { DemoNote } from "@/lib/schema";

export function CommitmentsSection() {
  const { control, register } = useFormContext<DemoNote>();
  const { fields, append, remove } = useFieldArray({ control, name: "commitments" });

  return (
    <SectionShell
      id="commit"
      number={7}
      title="Juliana 的承諾（必須履行的 to-do）"
      description="任何「我會 X」「下週 Y」「下次 Z」都要記下來。漏一個 = 失信。"
    >
      <ul className="space-y-3">
        {fields.map((row, i) => (
          <li key={row.id} className="flex items-start gap-3 rounded-md border border-neutral-200 p-3">
            <Controller
              control={control}
              name={`commitments.${i}.done`}
              render={({ field }) => (
                <Checkbox
                  className="mt-2"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  aria-label="標記為已完成"
                />
              )}
            />
            <div className="flex-1 space-y-2">
              <Input placeholder="承諾事項" {...register(`commitments.${i}.text`)} />
              <div className="flex items-center gap-2">
                <Label className="text-xs text-neutral-500">完成日期</Label>
                <Input type="date" className="w-44" {...register(`commitments.${i}.dueDate`)} />
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} aria-label="刪除這條承諾">
              ✕
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ id: newId(), done: false, text: "", dueDate: "" })}
      >
        + 新增承諾
      </Button>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add CommitmentsSection (dynamic with done + dueDate)"
```

---

## Task 16: BodySignalsSection

**Files:**
- Create: `components/form/BodySignalsSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import { BodySignalKeys, type BodySignalKey } from "@/lib/schema";
import type { DemoNote } from "@/lib/schema";

const SIGNAL_LABELS: Record<BodySignalKey, string> = {
  takingNotes: "主動拿筆記東西",
  askingPriceRepeatedly: "反覆追問價格",
  askingInstallSchedule: "詢問安裝時程",
  mentionsConsulting: "提到「我跟 X 商量看看」",
  lookingAtPhone: "看手機 / 視線飄走",
  sayingThinkAboutIt: "反覆說「我考慮看看」",
  politeNoQuestions: "微笑點頭但無具體問題",
  sayingWeAreSpecial: "講「我們店比較特別」",
  mentioningCompetitors: "主動講競品",
};

export function BodySignalsSection() {
  const { control, register } = useFormContext<DemoNote>();
  return (
    <SectionShell id="signals" number={8} title="肢體 / 語氣訊號">
      <ul className="space-y-2">
        {BodySignalKeys.map((key) => (
          <li key={key} className="rounded-md border border-neutral-200 p-3">
            <Controller
              control={control}
              name={`bodySignals.checked.${key}`}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  <span className="font-medium">{SIGNAL_LABELS[key]}</span>
                </label>
              )}
            />
            <Input
              className="mt-2"
              placeholder="補充說明（選填）"
              {...register(`bodySignals.notes.${key}`)}
            />
          </li>
        ))}
      </ul>
      <div>
        <Label htmlFor="signals-other">其他觀察</Label>
        <Textarea id="signals-other" rows={2} placeholder="（選填）" {...register("bodySignals.other")} />
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add BodySignalsSection with 9 fixed checkboxes + per-signal notes"
```

---

## Task 17: LeadGradingSection

**Files:**
- Create: `components/form/LeadGradingSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { Controller, useFormContext } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import type { DemoNote } from "@/lib/schema";

const WILLINGNESS = [
  { v: "notMentioned", l: "略過 / 未提及" },
  { v: "strong", l: "強烈" },
  { v: "medium", l: "中等" },
  { v: "weak", l: "弱" },
  { v: "none", l: "沒興趣" },
] as const;

const GRADE = [
  { v: "notSet", l: "尚未判斷" },
  { v: "hot", l: "Hot" },
  { v: "warm", l: "Warm" },
  { v: "cool", l: "Cool" },
  { v: "cold", l: "Cold" },
] as const;

export function LeadGradingSection() {
  const { control, register } = useFormContext<DemoNote>();
  return (
    <SectionShell id="grade" number={9} title="下一步意願 + Lead 分級 + 判斷">
      <div>
        <Label>老闆下一步意願</Label>
        <Controller
          control={control}
          name="nextStepWillingness"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5"
            >
              {WILLINGNESS.map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={opt.v} id={`will-${opt.v}`} />
                  <span className={opt.v === "notMentioned" ? "text-neutral-400" : ""}>{opt.l}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </div>

      <div>
        <Label>Lead 分級（你的判斷）</Label>
        <Controller
          control={control}
          name="leadGrade"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5"
            >
              {GRADE.map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={opt.v} id={`grade-${opt.v}`} />
                  <span className={opt.v === "notSet" ? "text-neutral-400" : ""}>{opt.l}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </div>

      <div>
        <Label htmlFor="judgement">判斷（一句話）</Label>
        <Textarea
          id="judgement"
          rows={2}
          placeholder="例：他主動問下週可以來看店。痛點清楚，Scorder 直接打到。"
          {...register("judgement")}
        />
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add LeadGradingSection (willingness + grade + judgement)"
```

---

## Task 18: NotesSection

**Files:**
- Create: `components/form/NotesSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import type { DemoNote } from "@/lib/schema";

export function NotesSection() {
  const { register } = useFormContext<DemoNote>();
  return (
    <SectionShell
      id="notes"
      number={10}
      title="備註"
      description="任何 Juliana 沒注意到、但你覺得重要的觀察。"
    >
      <Label htmlFor="notes-text" className="sr-only">
        備註
      </Label>
      <Textarea id="notes-text" rows={5} placeholder="（選填）" {...register("notes")} />
    </SectionShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(form): add NotesSection"
```

---

## Task 19: StickyNav with scroll-spy

**Files:**
- Create: `components/StickyNav.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS: Array<{ id: string; label: string }> = [
  { id: "basic", label: "基本資料" },
  { id: "icp", label: "ICP 三題" },
  { id: "systems", label: "現有系統" },
  { id: "pain", label: "痛點" },
  { id: "reaction", label: "Demo 反應" },
  { id: "qa", label: "Q&A" },
  { id: "commit", label: "承諾" },
  { id: "signals", label: "訊號" },
  { id: "grade", label: "分級" },
  { id: "notes", label: "備註" },
];

export function StickyNav() {
  const [active, setActive] = React.useState<string>("basic");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.5, 1] }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="表單章節"
      className="sticky top-20 hidden h-fit w-56 shrink-0 flex-col gap-1 text-sm md:flex"
    >
      {NAV_ITEMS.map((item, i) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            "rounded px-2 py-1 transition-colors hover:bg-neutral-100",
            active === item.id ? "font-semibold text-neutral-900" : "text-neutral-500"
          )}
        >
          <span className="mr-2 text-neutral-400">{i + 1}.</span>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(nav): add StickyNav with IntersectionObserver scroll-spy"
```

---

## Task 20: Toolbar (Import/Export/PDF/Clear + autosave indicator)

**Files:**
- Create: `components/Toolbar.tsx`
- Modify: `lib/storage.ts` (export STORAGE_KEY already done — confirm)

- [ ] **Step 1: Create `components/Toolbar.tsx`**

```tsx
"use client";
import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { DemoNoteSchema, type DemoNote } from "@/lib/schema";
import { defaultDemoNote } from "@/lib/defaults";
import { clearDraft, saveDraft } from "@/lib/storage";
import { buildExportFilename, todayIsoDate } from "@/lib/filename";

interface ToolbarProps {
  lastSavedAt: string | null;
}

export function Toolbar({ lastSavedAt }: ToolbarProps) {
  const { getValues, reset } = useFormContext<DemoNote>();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importPending, setImportPending] = React.useState<DemoNote | null>(null);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const handleExportJson = () => {
    const note = { ...getValues(), meta: { ...getValues().meta, updatedAt: new Date().toISOString() } };
    const blob = new Blob([JSON.stringify(note, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildExportFilename(note.basicInfo.restaurantName, todayIsoDate());
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    saveDraft(getValues());
    // ?auto=1 tells the print route to auto-trigger window.print().
    // Direct/bookmark visits to /print render the preview without prompting.
    window.open("/print?auto=1", "_blank");
  };

  const handlePickFile = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (json?.meta?.version !== 1) {
        setImportError(`不支援的檔案版本：${json?.meta?.version ?? "未知"}（目前只支援 v1）`);
        return;
      }
      const result = DemoNoteSchema.safeParse(json);
      if (!result.success) {
        setImportError(`檔案格式有誤：${result.error.issues[0]?.path.join(".")}：${result.error.issues[0]?.message}`);
        return;
      }
      setImportPending(result.data);
    } catch (err) {
      setImportError(`無法讀取檔案：${(err as Error).message}`);
    }
  };

  const confirmImport = () => {
    if (importPending) {
      reset(importPending);
      saveDraft(importPending);
    }
    setImportPending(null);
  };

  const confirmClear = () => {
    reset(defaultDemoNote());
    clearDraft();
    setShowClearConfirm(false);
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold">Scorder Demo 紀錄</h1>
        <span className="text-xs text-neutral-500">
          {lastSavedAt ? `已儲存 ${lastSavedAt}` : "未儲存"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFileChange} />
        <Button type="button" variant="outline" onClick={handlePickFile}>匯入 JSON</Button>
        <Button type="button" variant="outline" onClick={handleExportJson}>匯出 JSON</Button>
        <Button type="button" onClick={handleExportPdf}>匯出 PDF</Button>
        <Button type="button" variant="ghost" onClick={() => setShowClearConfirm(true)}>清空表單</Button>
      </div>

      {/* Import error dialog */}
      <Dialog open={importError !== null} onOpenChange={() => setImportError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>匯入失敗</DialogTitle>
            <DialogDescription>{importError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setImportError(null)}>關閉</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import confirm dialog */}
      <Dialog open={importPending !== null} onOpenChange={(o) => !o && setImportPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認匯入</DialogTitle>
            <DialogDescription>匯入後會覆蓋目前表單內容，確定要繼續嗎？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportPending(null)}>取消</Button>
            <Button onClick={confirmImport}>確定匯入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear confirm dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>清空表單？</DialogTitle>
            <DialogDescription>這會清除目前所有內容並重設為空白表單，無法復原。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>取消</Button>
            <Button onClick={confirmClear}>確定清空</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(toolbar): add Import/Export/PDF/Clear toolbar with confirm dialogs"
```

---

## Task 21: Wire up form page (RHF provider, autosave, layout)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

> **Why the two-component split:** `defaultDemoNote()` calls `new Date().toISOString()` and `crypto.randomUUID()` — non-deterministic. If `useForm({ defaultValues: defaultDemoNote() })` ran during SSR (Next.js still server-renders client components on first request), the server-rendered HTML would carry different timestamps and IDs than the client's first render → hydration mismatch. By keeping the outer `FormPage` deterministic ("載入中…" on both server and first client render), and only mounting `HydratedForm` inside a `useEffect`, we guarantee `useForm` only runs client-side with stable initial values.
>
> **Why `mode: "onBlur"`:** `mode: "onChange"` runs the full Zod resolver on every keystroke against the entire nested object. We have no real validation to surface (every field is `z.string()` with no constraints), so `"onBlur"` is cheaper and observably identical. Validation still runs at the boundary that matters: JSON import goes through `DemoNoteSchema.safeParse` in the toolbar.
>
> **Why `skipFirstRef` + `formState.isDirty`:** `useWatch` returns a value on the very first render, which would otherwise trigger an autosave write (and bump `meta.updatedAt`) immediately on page load even though the user hasn't typed anything. The ref skips run #1; the `isDirty` check is belt-and-suspenders against any RHF-internal re-render that re-fires the effect with an unchanged form.

```tsx
"use client";
import * as React from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DemoNoteSchema, type DemoNote } from "@/lib/schema";
import { defaultDemoNote } from "@/lib/defaults";
import { loadDraft, saveDraft } from "@/lib/storage";
import { Toolbar } from "@/components/Toolbar";
import { StickyNav } from "@/components/StickyNav";
import { BasicInfoSection } from "@/components/form/BasicInfoSection";
import { IcpSection } from "@/components/form/IcpSection";
import { ExistingSystemsSection } from "@/components/form/ExistingSystemsSection";
import { PainPointsSection } from "@/components/form/PainPointsSection";
import { DemoReactionSection } from "@/components/form/DemoReactionSection";
import { QaTimelineSection } from "@/components/form/QaTimelineSection";
import { CommitmentsSection } from "@/components/form/CommitmentsSection";
import { BodySignalsSection } from "@/components/form/BodySignalsSection";
import { LeadGradingSection } from "@/components/form/LeadGradingSection";
import { NotesSection } from "@/components/form/NotesSection";

const AUTOSAVE_DEBOUNCE_MS = 500;

function AutosaveAndIndicator({ onSaved }: { onSaved: (ts: string) => void }) {
  const watched = useWatch<DemoNote>();
  const { formState } = useFormContext<DemoNote>();
  const skipFirstRef = React.useRef(true);

  React.useEffect(() => {
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      return;
    }
    if (!formState.isDirty) return;
    const handle = window.setTimeout(() => {
      saveDraft(watched as DemoNote);
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      onSaved(`${hh}:${mm}`);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [watched, formState.isDirty, onSaved]);
  return null;
}

function HydratedForm({ initialValues }: { initialValues: DemoNote }) {
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);
  const methods = useForm<DemoNote>({
    resolver: zodResolver(DemoNoteSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  return (
    <FormProvider {...methods}>
      <div className="no-print">
        <Toolbar lastSavedAt={lastSavedAt} />
        <AutosaveAndIndicator onSaved={setLastSavedAt} />
        <main className="mx-auto flex max-w-6xl gap-8 px-4 py-6">
          <StickyNav />
          <form className="min-w-0 flex-1 space-y-2">
            <BasicInfoSection />
            <IcpSection />
            <ExistingSystemsSection />
            <PainPointsSection />
            <DemoReactionSection />
            <QaTimelineSection />
            <CommitmentsSection />
            <BodySignalsSection />
            <LeadGradingSection />
            <NotesSection />
          </form>
        </main>
      </div>
    </FormProvider>
  );
}

export default function FormPage() {
  const [initialValues, setInitialValues] = React.useState<DemoNote | null>(null);

  React.useEffect(() => {
    setInitialValues(loadDraft() ?? defaultDemoNote());
  }, []);

  if (!initialValues) {
    return <div className="p-8 text-sm text-neutral-500">載入中…</div>;
  }
  return <HydratedForm initialValues={initialValues} />;
}
```

- [ ] **Step 2: Run dev server and verify**

```bash
npm run dev
```

Visit `http://localhost:3000`. Confirm:
- The `載入中…` placeholder appears briefly, then `HydratedForm` mounts.
- All 10 sections render with their headers.
- Sticky nav appears on the left at desktop widths.
- The autosave indicator stays at "未儲存" on a fresh page until the first keystroke (proves `skipFirstRef` + `isDirty` guards work — no spurious mount-time write).
- Typing in any input updates the autosave indicator within ~1s.
- Refreshing the page restores typed values (and the indicator is back at "未儲存" until the next edit).
- DevTools → Console is free of React hydration-mismatch warnings.

Stop the dev server (Ctrl-C).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(page): wire RHF provider, autosave, sticky nav, toolbar, and all 10 sections"
```

---

## Task 22: PrintView component

**Files:**
- Create: `components/PrintView.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import * as React from "react";
import { BodySignalKeys, type BodySignalKey, type DemoNote } from "@/lib/schema";

const POS_LABEL: Record<DemoNote["existingSystems"]["pos"], string> = {
  notMentioned: "— 未提及",
  iCHEF: "iCHEF",
  Eats365: "Eats365",
  Dudoo: "Dudoo",
  "肚肚": "肚肚",
  other: "其他",
  none: "無 POS",
};
const INVOICE_LABEL: Record<DemoNote["existingSystems"]["invoice"], string> = {
  notMentioned: "— 未提及",
  paper: "紙本",
  electronic: "電子",
  none: "無",
};
const ORDER_FLOW_LABEL: Record<DemoNote["existingSystems"]["orderingFlow"], string> = {
  notMentioned: "— 未提及",
  staff: "員工接",
  paper: "紙本",
  qrcode: "QR Code",
  mixed: "混合",
};
const PAYMENT_LABEL: Record<"cash" | "card" | "linePay" | "jkoPay" | "other", string> = {
  cash: "現金",
  card: "刷卡",
  linePay: "LINE Pay",
  jkoPay: "街口",
  other: "其他",
};
const DELIVERY_LABEL: Record<"foodpanda" | "uberEats" | "lalamove" | "none", string> = {
  foodpanda: "foodpanda",
  uberEats: "Uber Eats",
  lalamove: "Lalamove",
  none: "無",
};
const WILL_LABEL: Record<DemoNote["nextStepWillingness"], string> = {
  notMentioned: "未提及",
  strong: "強烈",
  medium: "中等",
  weak: "弱",
  none: "沒興趣",
};
const GRADE_LABEL: Record<DemoNote["leadGrade"], string> = {
  notSet: "未判斷",
  hot: "Hot",
  warm: "Warm",
  cool: "Cool",
  cold: "Cold",
};
const SIGNAL_LABEL: Record<BodySignalKey, string> = {
  takingNotes: "主動拿筆記東西",
  askingPriceRepeatedly: "反覆追問價格",
  askingInstallSchedule: "詢問安裝時程",
  mentionsConsulting: "提到「我跟 X 商量看看」",
  lookingAtPhone: "看手機 / 視線飄走",
  sayingThinkAboutIt: "反覆說「我考慮看看」",
  politeNoQuestions: "微笑點頭但無具體問題",
  sayingWeAreSpecial: "講「我們店比較特別」",
  mentioningCompetitors: "主動講競品",
};

const isBlank = (s: string | undefined) => !s || s.trim().length === 0;

function Field({ label, value }: { label: string; value: string }) {
  if (isBlank(value)) return null;
  return (
    <div className="flex gap-2">
      <span className="font-bold">{label}：</span>
      <span>{value}</span>
    </div>
  );
}

function RadioLine<T extends string>({
  label,
  value,
  options,
  notAnswered,
}: {
  label: string;
  value: T;
  options: Array<{ v: T; l: string }>;
  notAnswered: T;
}) {
  if (value === notAnswered) {
    return (
      <div>
        <span className="font-bold">{label}：</span>
        <span className="italic text-neutral-500">— 未提及</span>
      </div>
    );
  }
  return (
    <div>
      <span className="font-bold">{label}：</span>
      {options.map((o) => (
        <span key={o.v} className="ml-3">
          {o.v === value ? "●" : "○"} {o.l}
        </span>
      ))}
    </div>
  );
}

export function PrintView({ note }: { note: DemoNote }) {
  const exportedAt = new Date(note.meta.updatedAt).toLocaleString("zh-Hant", { hour12: false });
  const willOptions = (Object.keys(WILL_LABEL) as Array<keyof typeof WILL_LABEL>)
    .filter((v) => v !== "notMentioned")
    .map((v) => ({ v: v as DemoNote["nextStepWillingness"], l: WILL_LABEL[v] }));
  const gradeOptions = (Object.keys(GRADE_LABEL) as Array<keyof typeof GRADE_LABEL>)
    .filter((v) => v !== "notSet")
    .map((v) => ({ v: v as DemoNote["leadGrade"], l: GRADE_LABEL[v] }));

  const sectionEmpty = {
    basic: Object.values(note.basicInfo).every(isBlank),
    icp: Object.values(note.icp).every(isBlank),
    systems:
      note.existingSystems.pos === "notMentioned" &&
      note.existingSystems.invoice === "notMentioned" &&
      note.existingSystems.orderingFlow === "notMentioned" &&
      note.existingSystems.payment.length === 0 &&
      note.existingSystems.deliveryPlatforms.length === 0,
    pain: note.painPoints.every((p) => isBlank(p.quote)),
    reaction: Object.values(note.demoReactions).every(isBlank),
    qa: note.qaTimeline.every((q) => isBlank(q.question) && isBlank(q.answer) && isBlank(q.followUp)),
    commit: note.commitments.every((c) => isBlank(c.text)),
    signals:
      BodySignalKeys.every((k) => !note.bodySignals.checked[k]) && isBlank(note.bodySignals.other),
    grade:
      note.nextStepWillingness === "notMentioned" &&
      note.leadGrade === "notSet" &&
      isBlank(note.judgement),
    notes: isBlank(note.notes),
  };

  const Empty = () => <p className="italic text-neutral-500">本段無紀錄</p>;

  return (
    <article className="mx-auto max-w-3xl px-6 py-8 text-[10.5pt] leading-[1.45] text-black">
      <header className="mb-6 border-b border-black pb-2">
        <h1 className="text-xl font-bold">
          Demo 紀錄｜{new Date(note.meta.updatedAt).toISOString().slice(0, 10)}｜
          {note.basicInfo.restaurantName || "（未填餐廳名稱）"}
        </h1>
        <p className="text-sm text-neutral-500">匯出時間 {exportedAt}</p>
      </header>

      <section className="print-section mb-5">
        <h2 className="mb-2 border-b border-black pb-0.5 text-[13pt] font-bold">1. 基本資料</h2>
        {sectionEmpty.basic ? (
          <Empty />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <Field label="餐廳名稱" value={note.basicInfo.restaurantName} />
            <Field label="老闆姓氏" value={note.basicInfo.ownerSurname} />
            <Field label="所在區" value={note.basicInfo.district} />
            <Field label="餐廳類型" value={note.basicInfo.restaurantType} />
            <Field label="營業多久" value={note.basicInfo.yearsOpen} />
            <Field label="桌數" value={note.basicInfo.tableCount} />
            <Field label="員工人數" value={note.basicInfo.staffCount} />
            <Field label="客單價" value={note.basicInfo.averageTicket} />
            <Field label="營業時段" value={note.basicInfo.businessHours} />
          </div>
        )}
      </section>

      <section className="print-section mb-5">
        <h2 className="mb-2 border-b border-black pb-0.5 text-[13pt] font-bold">2. ICP 三題</h2>
        {sectionEmpty.icp ? (
          <Empty />
        ) : (
          <ol className="space-y-1">
            {!isBlank(note.icp.foreignGuestsPerWeek) && (
              <li>
                1) 外國觀光客一週幾組
                <div className="pl-4">└ {note.icp.foreignGuestsPerWeek}</div>
              </li>
            )}
            {!isBlank(note.icp.englishOrderingHandling) && (
              <li>
                2) 英文點餐處理
                <div className="pl-4">└ {note.icp.englishOrderingHandling}</div>
              </li>
            )}
            {!isBlank(note.icp.currentOrderingMethod) && (
              <li>
                3) 現在點餐方式
                <div className="pl-4">└ {note.icp.currentOrderingMethod}</div>
              </li>
            )}
          </ol>
        )}
      </section>

      <section className="print-section mb-5">
        <h2 className="mb-2 border-b border-black pb-0.5 text-[13pt] font-bold">3. 現有系統</h2>
        {sectionEmpty.systems ? (
          <Empty />
        ) : (
          <div className="space-y-1">
            <div>
              <span className="font-bold">POS：</span>
              {note.existingSystems.pos === "notMentioned" ? (
                <span className="italic text-neutral-500">— 未提及</span>
              ) : note.existingSystems.pos === "other" ? (
                <span>其他 — {note.existingSystems.posOther || "（未填）"}</span>
              ) : (
                <span>{POS_LABEL[note.existingSystems.pos]}</span>
              )}
            </div>
            <div>
              <span className="font-bold">結帳方式：</span>
              {note.existingSystems.payment.length === 0 ? (
                <span className="italic text-neutral-500">— 未提及</span>
              ) : (
                <span>
                  {note.existingSystems.payment.map((p) => PAYMENT_LABEL[p]).join("、")}
                  {note.existingSystems.payment.includes("other") && note.existingSystems.paymentOther
                    ? `（${note.existingSystems.paymentOther}）`
                    : ""}
                </span>
              )}
            </div>
            <div>
              <span className="font-bold">發票：</span>
              {note.existingSystems.invoice === "notMentioned" ? (
                <span className="italic text-neutral-500">— 未提及</span>
              ) : (
                <span>{INVOICE_LABEL[note.existingSystems.invoice]}</span>
              )}
            </div>
            <div>
              <span className="font-bold">點餐流程：</span>
              {note.existingSystems.orderingFlow === "notMentioned" ? (
                <span className="italic text-neutral-500">— 未提及</span>
              ) : (
                <span>{ORDER_FLOW_LABEL[note.existingSystems.orderingFlow]}</span>
              )}
            </div>
            <div>
              <span className="font-bold">外送平台：</span>
              {note.existingSystems.deliveryPlatforms.length === 0 ? (
                <span className="italic text-neutral-500">— 未提及</span>
              ) : (
                <span>{note.existingSystems.deliveryPlatforms.map((d) => DELIVERY_LABEL[d]).join("、")}</span>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="print-section mb-5">
        <h2 className="mb-2 border-b border-black pb-0.5 text-[13pt] font-bold">4. 痛點</h2>
        {sectionEmpty.pain ? (
          <Empty />
        ) : (
          <ul className="space-y-1">
            {note.painPoints
              .filter((p) => !isBlank(p.quote))
              .map((p) => (
                <li key={p.id} className="pain-point break-inside-avoid border-l border-black pl-2 italic">
                  「{p.quote}」
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="print-section mb-5">
        <h2 className="mb-2 border-b border-black pb-0.5 text-[13pt] font-bold">5. Demo 反應</h2>
        {sectionEmpty.reaction ? (
          <Empty />
        ) : (
          <div className="space-y-1">
            <Field label="第 1 段（客人視角）" value={note.demoReactions.segment1_customer} />
            <Field label="第 2 段（廚房視角）" value={note.demoReactions.segment2_kitchen} />
            <Field label="第 3 段（老闆視角）" value={note.demoReactions.segment3_owner} />
            <Field label="第 4 段（未來功能）" value={note.demoReactions.segment4_future} />
          </div>
        )}
      </section>

      <section className="print-section mb-5">
        <h2 className="mb-2 border-b border-black pb-0.5 text-[13pt] font-bold">6. 老闆問題與 Juliana 回答</h2>
        {sectionEmpty.qa ? (
          <Empty />
        ) : (
          <ol className="space-y-3">
            {note.qaTimeline
              .filter((q) => !isBlank(q.question) || !isBlank(q.answer) || !isBlank(q.followUp))
              .map((q, i) => (
                <li key={q.id} className="qa-entry break-inside-avoid">
                  <div className="font-bold">#{i + 1}</div>
                  {!isBlank(q.question) && <div className="pl-3">問：{q.question}</div>}
                  {!isBlank(q.answer) && <div className="pl-3">答：{q.answer}</div>}
                  {!isBlank(q.followUp) && <div className="pl-3">追問：{q.followUp}</div>}
                </li>
              ))}
          </ol>
        )}
      </section>

      <section className="print-section mb-5">
        <h2 className="mb-2 border-b border-black pb-0.5 text-[13pt] font-bold">
          7. Juliana 的承諾（to-do）
        </h2>
        {sectionEmpty.commit ? (
          <Empty />
        ) : (
          <ul className="space-y-1">
            {note.commitments
              .filter((c) => !isBlank(c.text))
              .map((c) => (
                <li key={c.id} className="commitment break-inside-avoid">
                  {c.done ? "☑" : "☐"} {c.text}
                  {c.dueDate ? `   完成日期：${c.dueDate}` : ""}
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="print-section mb-5">
        <h2 className="mb-2 border-b border-black pb-0.5 text-[13pt] font-bold">8. 肢體 / 語氣訊號</h2>
        {sectionEmpty.signals ? (
          <Empty />
        ) : (
          <ul className="space-y-1">
            {BodySignalKeys.map((k) => (
              <li key={k}>
                {note.bodySignals.checked[k] ? "☑" : "☐"} {SIGNAL_LABEL[k]}
                {note.bodySignals.checked[k] && !isBlank(note.bodySignals.notes[k])
                  ? ` — ${note.bodySignals.notes[k]}`
                  : ""}
              </li>
            ))}
            {!isBlank(note.bodySignals.other) && (
              <li className="mt-2">
                <span className="font-bold">其他觀察：</span>
                {note.bodySignals.other}
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="print-section mb-5">
        <h2 className="mb-2 border-b border-black pb-0.5 text-[13pt] font-bold">
          9. 下一步意願 / Lead 分級
        </h2>
        {sectionEmpty.grade ? (
          <Empty />
        ) : (
          <div className="space-y-1">
            <RadioLine
              label="下一步意願"
              value={note.nextStepWillingness}
              options={willOptions}
              notAnswered={"notMentioned"}
            />
            <RadioLine
              label="Lead 分級"
              value={note.leadGrade}
              options={gradeOptions}
              notAnswered={"notSet"}
            />
            {!isBlank(note.judgement) && (
              <div>
                <span className="font-bold">判斷：</span>
                {note.judgement}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="print-section mb-5">
        <h2 className="mb-2 border-b border-black pb-0.5 text-[13pt] font-bold">10. 備註</h2>
        {sectionEmpty.notes ? <Empty /> : <p className="whitespace-pre-wrap">{note.notes}</p>}
      </section>

      <footer className="mt-8 border-t border-black pt-2 text-center text-xs text-neutral-500">
        Scorder Demo Note
      </footer>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(print): add PrintView with non-answer rendering rules"
```

---

## Task 22.5: PrintView component tests

`PrintView` is the highest-logic component in the app — every section has its own `sectionEmpty` predicate, the radio rendering has a `notAnswered` short-circuit, and per-signal notes only appear when the matching checkbox is on. We add focused tests now so future tweaks to the rendering rules don't silently regress.

**Files:**
- Create: `tests/PrintView.test.tsx`

- [ ] **Step 1: Create the test**

```tsx
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

    expect(screen.getByText(/小龍麵店/)).toBeInTheDocument();
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
    expect(screen.getByText(/小龍麵店/)).toBeInTheDocument();
    expect(screen.getByText(/iCHEF/)).toBeInTheDocument();
    expect(screen.getByText(/Hot lead/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: 18 passing total — 5 schema (Task 4) + 5 storage (Task 6) + 4 filename (Task 7) + 4 PrintView.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test(print): cover PrintView empty/partial/full rendering rules"
```

---

## Task 23: /print route

**Files:**
- Create: `app/print/page.tsx`

- [ ] **Step 1: Create the route**

> **Why `?auto=1` and Suspense:** Without the query gate, every visit to `/print` (refreshes, bookmarks, back-button) would trigger the print dialog. The toolbar passes `?auto=1`; direct visits render the preview without prompting. `useSearchParams` requires a `<Suspense>` boundary in the Next 15 App Router — omitting it makes `next build` fail.

```tsx
"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PrintView } from "@/components/PrintView";
import { loadDraft } from "@/lib/storage";
import type { DemoNote } from "@/lib/schema";

function PrintRouteContent() {
  const searchParams = useSearchParams();
  const auto = searchParams.get("auto") === "1";
  const [note, setNote] = React.useState<DemoNote | null>(null);
  const [empty, setEmpty] = React.useState(false);

  React.useEffect(() => {
    const draft = loadDraft();
    if (!draft) {
      setEmpty(true);
      return;
    }
    setNote(draft);
  }, []);

  React.useEffect(() => {
    if (!note || !auto) return;
    const id = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => window.print())
    );
    return () => window.cancelAnimationFrame(id);
  }, [note, auto]);

  if (empty) {
    return (
      <main className="mx-auto max-w-md p-12 text-center text-sm text-neutral-600">
        尚無資料，請先在主頁填寫表單。
      </main>
    );
  }
  if (!note) return null;
  return <PrintView note={note} />;
}

export default function PrintPage() {
  return (
    <React.Suspense fallback={null}>
      <PrintRouteContent />
    </React.Suspense>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(print): add /print route that auto-triggers window.print()"
```

---

## Task 24: print.css (B&W styling)

**Files:**
- Modify: `styles/print.css`

- [ ] **Step 1: Replace `styles/print.css`**

```css
@page {
  size: A4;
  margin: 18mm 16mm 18mm 16mm;
  @bottom-center {
    content: "Scorder Demo Note · Page " counter(page) " of " counter(pages);
    font-size: 9pt;
    color: #555;
  }
}

@media print {
  html,
  body {
    background: #fff !important;
    color: #000 !important;
  }

  .no-print {
    display: none !important;
  }

  .print-section {
    break-inside: avoid;
  }

  .qa-entry,
  .pain-point,
  .commitment {
    break-inside: avoid;
  }

  /* strip on-screen alternating tints */
  tr:nth-child(even),
  .bg-neutral-50,
  .bg-neutral-100 {
    background: transparent !important;
  }

  /* drop interactive chrome on the form route if it ever prints */
  button,
  input,
  textarea,
  select {
    box-shadow: none !important;
    background: transparent !important;
    color: #000 !important;
    border-color: #000 !important;
  }
}
```

> The `no-print` wrapper around the form chrome is already baked into `HydratedForm` in Task 21, so no additional page edit is required here. Cmd+P from `/` will hide the toolbar, nav, and inputs via the `.no-print { display: none !important; }` rule above.

- [ ] **Step 2: Manual smoke test**

```bash
npm run dev
```

In the browser:
1. Fill in `restaurantName = 小龍麵店`, a pain point, and tick a body signal.
2. Click `匯出 PDF`. The `/print` tab should open and the print dialog should appear.
3. Cancel the print dialog. The page should show the B&W layout (no colours, no buttons).
4. Open browser print preview from the `/print` tab — confirm everything is black on white.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(print): add print stylesheet"
```

---

## Task 25: Playwright round-trip smoke test

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/round-trip.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

Add to `package.json` scripts:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 3: Create `tests/e2e/round-trip.spec.ts`**

```ts
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
```

- [ ] **Step 4: Run the e2e tests**

```bash
npm run test:e2e
```

Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(e2e): add Playwright round-trip + malformed-import smoke tests"
```

---

## Task 26: README + final polish

**Files:**
- Create: `README.md`
- Modify: `package.json` (add `lint` if missing)

- [ ] **Step 1: Replace `README.md`**

```markdown
# Scorder Demo 紀錄

Live-demo note-taking form for the Scorder team. Max fills it during a Juliana-led restaurant demo, exports JSON for the archive, and prints a B&W PDF for follow-up review.

## Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Tests

- Unit: `npm test`
- E2E: `npm run test:e2e`

## Export PDF

Click `匯出 PDF` in the toolbar. A new tab opens at `/print` and the browser print dialog appears. Choose "Save as PDF".

## Deploy

Vercel: connect this repo and deploy. No environment variables required.

## Source doc

`docs/source/scorder-meeting-note.md` — the original Max｜Demo 紀錄與筆記手冊 v1.1.

## Spec & plan

- `docs/superpowers/specs/2026-05-10-scorder-demo-note-form-design.md`
- `docs/superpowers/plans/2026-05-10-scorder-demo-note-form.md`
```

- [ ] **Step 2: Run all checks one final time**

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

All four should pass.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "docs: add README with run/test/deploy instructions"
```

---

## Done

At this point:
- All 10 sections from the source doc's "即時紀錄模板" are captureable in the form.
- Auto-save round-trips through localStorage on refresh.
- JSON export/import round-trips losslessly (verified by the Playwright test).
- `/print` produces a clean B&W layout that respects the non-answer rendering rules.
- `npm run build` produces a deployable Vercel artifact.
