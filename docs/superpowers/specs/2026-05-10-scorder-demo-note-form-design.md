# Scorder Demo 紀錄表單 — Design Spec

**Date:** 2026-05-10
**Owner:** Juliana (product), Max (primary user)
**Source doc:** `scorder-meeting-note.md` (Max｜Demo 紀錄與筆記手冊 v1.1)
**Status:** Approved design, ready for implementation planning

---

## 1. Goal

Build a single-page web form that lets Max capture every field defined in the source doc's "即時紀錄模板" (Section 3 of the source doc) during a live Scorder demo, then export the result as a clean black-and-white PDF that Juliana can review and act on within the 5-minute and 24-hour follow-up windows defined in Sections 4 and 5 of the source doc.

The form replaces the current workflow of filling the markdown template by hand. It does **not** replace the cross-demo tracking spreadsheet (Section 6 of the source doc) or the follow-up email drafting workflow (Section 5.1) — those remain manual.

---

## 2. Tech stack & project layout

**Stack**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS, with `print:` variant for the B&W stylesheet
- shadcn/ui primitives (Input, Textarea, Checkbox, RadioGroup, Select, Button, Label)
- react-hook-form + Zod (form state, dynamic arrays via `useFieldArray`, schema validation)
- Deploy target: Vercel

**File layout**
```
scorder-meeting-note/
├── app/
│   ├── layout.tsx                 # font (Noto Sans TC), Tailwind globals
│   ├── page.tsx                   # the form page (single route)
│   └── print/page.tsx             # printable preview (B&W, opens in new tab)
├── components/
│   ├── form/
│   │   ├── BasicInfoSection.tsx
│   │   ├── IcpSection.tsx
│   │   ├── ExistingSystemsSection.tsx
│   │   ├── PainPointsSection.tsx        # dynamic array
│   │   ├── DemoReactionSection.tsx
│   │   ├── QaTimelineSection.tsx        # dynamic array
│   │   ├── CommitmentsSection.tsx       # dynamic array
│   │   ├── BodySignalsSection.tsx       # 9 fixed checkboxes + per-signal note
│   │   ├── LeadGradingSection.tsx
│   │   └── NotesSection.tsx
│   ├── StickyNav.tsx              # section anchors, scroll-spy
│   ├── Toolbar.tsx                # Import JSON / Export JSON / Export PDF / Clear
│   └── PrintView.tsx              # consumed by /print page
├── lib/
│   ├── schema.ts                  # Zod schema = source of truth for shape
│   ├── storage.ts                 # localStorage read/write/clear
│   └── defaults.ts                # initial form values
└── styles/
    └── print.css                  # @page rules + monochrome overrides
```

One Next.js route for the form (`/`), one for the printable view (`/print`). The print route reads the same draft from `localStorage` so Cmd+P from there produces the PDF.

---

## 3. Data model (Zod schema)

`lib/schema.ts` is the source of truth. The form, localStorage payload, JSON import/export, and print view all derive from it.

```
DemoNote {
  meta:           { version: 1, createdAt: ISO, updatedAt: ISO }

  basicInfo: {
    restaurantName, ownerSurname, district, restaurantType,
    yearsOpen, tableCount, staffCount,
    averageTicket?, businessHours
  }

  icp: {
    foreignGuestsPerWeek,         // textarea — free response per the doc
    englishOrderingHandling,
    currentOrderingMethod
  }

  existingSystems: {
    pos:       'notMentioned' | 'iCHEF' | 'Eats365' | 'Dudoo' | '肚肚' | 'other' | 'none'
    posOther?: string                                     // shown if pos === 'other'
    payment:   ('cash'|'card'|'linePay'|'jkoPay'|'other')[]   // multi-select checkboxes
    paymentOther?: string
    invoice:   'notMentioned' | 'paper' | 'electronic' | 'none'
    orderingFlow: 'notMentioned' | 'staff' | 'paper' | 'qrcode' | 'mixed'
    deliveryPlatforms: ('foodpanda'|'uberEats'|'lalamove'|'none')[]   // multi-select
  }

  painPoints: Array<{ id, quote: string }>                // dynamic, min 0

  demoReactions: {
    segment1_customer: string
    segment2_kitchen:  string
    segment3_owner:    string
    segment4_future:   string
  }

  qaTimeline: Array<{
    id, question: string, answer: string, followUp: string
  }>                                                      // dynamic, no timestamps

  commitments: Array<{
    id, done: boolean, text: string, dueDate?: string     // ISO date or empty
  }>                                                      // dynamic, the to-do list

  bodySignals: {
    checked: {
      takingNotes, askingPriceRepeatedly, askingInstallSchedule,
      mentionsConsulting, lookingAtPhone, sayingThinkAboutIt,
      politeNoQuestions, sayingWeAreSpecial, mentioningCompetitors
    }                                                     // 9 booleans, fixed keys
    notes: { /* same 9 keys */ : string }                 // per-signal context
    other: string                                         // freeform additional observations
  }

  nextStepWillingness: 'notMentioned' | 'strong' | 'medium' | 'weak' | 'none'  // radio
  leadGrade:           'notSet' | 'hot' | 'warm' | 'cool' | 'cold'              // radio
  judgement: string                                       // 1-sentence reasoning per Section 4 of source doc

  notes: string                                           // 備註
}
```

**Notes on the model**
- `meta.version: 1` lets future schema changes migrate older JSON files cleanly on import.
- All dynamic arrays carry a stable `id` (for React keys + RHF `useFieldArray`), generated with `crypto.randomUUID()`.
- The source doc's "現有系統" lists are encoded as fixed enums where possible, with an `other` text fallback. Payment + delivery are arrays because the doc shows multi-select ("現金、刷卡、LINE Pay、街口、其他").
- All radio enums include an explicit `notMentioned` / `notSet` member so the PDF can distinguish "owner answered: none" from "question wasn't asked or answered".
- No `juliana_followup_due` or `lead_source` fields — keeping scope to what the form captures during the demo. The cross-demo spreadsheet is out of scope (see Section 8).

---

## 4. Validation policy

- **Nothing is required.** Every field in the Zod schema is `.optional()`. Owners often skip questions and Max ships whatever he has.
- No PDF-export confirm dialog for missing fields. Export proceeds silently regardless of completeness.
- The only validation that runs is the JSON-import schema check (Section 6 below) — that's about file integrity, not user-input completeness.

---

## 5. UI structure

**Page shell** (`app/page.tsx`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                          │
│  Scorder Demo 紀錄  ·  [autosave: 已儲存 14:23]                    │
│  [匯入 JSON]  [匯出 JSON]  [匯出 PDF]  [清空表單]                   │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  Sticky nav  │   Form sections (single scroll)                   │
│  (left,      │                                                   │
│   220px)     │   1. 基本資料                                       │
│              │   2. ICP 三題                                       │
│  ● 基本資料    │   3. 現有系統                                       │
│  ○ ICP 三題    │   4. 痛點                                          │
│  ○ 現有系統    │   5. Demo 反應                                      │
│  ○ 痛點        │   6. 老闆問題與 Juliana 回答                         │
│  ○ Demo 反應   │   7. Juliana 的承諾                                 │
│  ○ Q&A        │   8. 肢體 / 語氣訊號                                 │
│  ○ 承諾        │   9. 下一步意願 + Lead 分級 + 判斷                    │
│  ○ 訊號        │  10. 備註                                           │
│  ○ 分級        │                                                   │
│  ○ 備註        │                                                   │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

**Behavior**
- Sticky left nav, scroll-spy highlights the section currently in view (IntersectionObserver). Clicking a nav item smooth-scrolls to that section's anchor.
- Single `<form>` element wraps all sections — react-hook-form context spans the whole page.
- Each section is a self-contained component receiving form state via `useFormContext()`.
- Top toolbar is sticky too so Import/Export/Print are always reachable.
- Autosave indicator updates on every successful localStorage write ("已儲存 HH:MM"); shows "未儲存" briefly while debounce is pending.
- Mobile: nav collapses into a top hamburger; sections stack full-width. Laptop is the design target.

**Non-answer affordances**
- Every radio group includes a visible `略過 / 未提及` option as the **first** choice and the default selection. Visual treatment (lighter text color) hints "this is the no-answer state".
- Every text input shows placeholder text `（未提及則留空）`.
- Multi-select checkbox groups (payment, delivery platforms) have a small `未提及此題` hint under the group label — clicking it clears all checks and tags the group as "skipped" for the print view.

### 5.1 Dynamic sections

Three sections need add / remove. All three use react-hook-form's `useFieldArray`.

**Section 4 — 痛點**
- Default: 3 empty rows (matches the source doc's template).
- Each row: one multi-line textarea + a remove button (`✕`).
- "+ 新增痛點" appends a row.
- No reorder UI.

**Section 6 — 老闆問題與 Juliana 回答**
- Default: 1 empty row.
- Three textareas per entry: `問` / `答` / `追問` — matches the doc minus timestamps.
- "+ 新增 Q&A" appends.

**Section 7 — Juliana 的承諾**
- Default: 2 empty rows.
- Each row: completion checkbox + text input + optional due date.
- The checkbox means "已完成" — Max ticks it during the 24-hour follow-up window when Juliana actually completes the item. PDF renders ticked items as `☑` and unticked as `☐`.

**Empty-state handling**
- A section with zero rows renders only the section header + "+ 新增…" button.
- PDF skips empty arrays entirely (no "(無)" placeholders).
- Removing the last row is allowed.

---

## 6. Auto-save, import & export

**Auto-save (localStorage)**
- Storage key: `scorder-demo-note:draft:v1`
- `useEffect` subscribed to `form.watch()`, debounced 500ms, writes the full form value as JSON.
- On page load: read the key, if present, `form.reset(parsed)` to rehydrate. If parse fails or `meta.version` mismatches, ignore and start blank — never crash.
- Toolbar shows "已儲存 HH:MM" after each write.
- Single-draft model — there's only ever one active draft.

**Export JSON**
- `匯出 JSON` builds payload:
  ```
  { meta: { version: 1, createdAt, updatedAt }, ...currentFormValues }
  ```
- Downloads via Blob + `<a download>`. Filename:
  ```
  scorder-demo_{YYYY-MM-DD}_{餐廳名稱 || 'untitled'}.json
  ```
  Restaurant name sanitized (strip `/ \ : * ? " < > |`).

**Import JSON**
- `匯入 JSON` opens a hidden `<input type="file" accept=".json,application/json">`.
- On select: `JSON.parse` → validate against Zod → if valid, confirm dialog ("匯入後會覆蓋目前表單，確定？") → `form.reset(parsed)` and write to localStorage.
- If invalid: toast with the first Zod error. Form unchanged.
- Version mismatch (`meta.version !== 1`): blocked with a clear message — no migration code yet, just a forward-compat slot.

**Export PDF**
- `匯出 PDF` opens `/print` in a new tab.
- `/print` reads from localStorage (same key), renders the read-only B&W layout, then `window.print()` after a paint tick (`requestAnimationFrame` ×2) so layout stabilises before the print dialog.
- Browser's "Save as PDF" produces the file. We don't fight the browser print dialog.
- If localStorage is empty: print page shows "尚無資料，請先在主頁填寫表單" and skips `window.print()`.

**Clear form**
- `清空表單` confirm dialog ("這會清除目前所有內容並重設為空白表單，無法復原。確定？") → `form.reset(defaultValues)` + remove localStorage key.

---

## 7. Print / PDF layout

The `/print` route renders a read-only document optimized for paper. Tailwind classes use `print:` variants where they differ from screen.

**Page setup** (`styles/print.css`)
```css
@page {
  size: A4;
  margin: 18mm 16mm 18mm 16mm;
}
@media print {
  html, body { background: white; color: black; }
  .print-section { break-inside: avoid; }
  .print-section + .print-section { break-before: auto; }
  .no-print { display: none !important; }
}
```

**Typography rules (B&W, no color)**
- Body: Noto Sans TC, 10.5pt, line-height 1.45.
- Section headings: 13pt bold, with a 0.5pt rule below.
- Labels (e.g., `餐廳名稱：`): bold 10pt.
- Quoted pain points: 10.5pt italic, indented 6mm, with a thin 0.5pt left border.
- Checkboxes render as Unicode `☑` / `☐` glyphs.
- Radio selections render as `●` next to the chosen value, `○` next to the others.
- Tables: 0.5pt black borders. Alternating-row tints exist on screen only; `print:` variant strips them.

**Document structure (worked example)**
```
─────────────────────────────────────────────
   Demo 紀錄｜2026-05-10｜小龍麵店
   匯出時間 2026-05-10 16:42
─────────────────────────────────────────────

1. 基本資料
   餐廳名稱：小龍麵店          老闆姓氏：王
   所在區：永康街              餐廳類型：麵店
   ...

2. ICP 三題
   1) 外國觀光客一週幾組
      └ 大概每天 5-10 組，週末更多
   ...

4. 痛點
   ▎「外國客點錯太多次了…」
   ▎「外送單跟內用單混在一起…」

7. Juliana 的承諾
   ☐ 寄試營運合作說明 email   完成日期：2026-05-11
   ☑ 下週二 5/12 早上 11 點到店看空間

9. 下一步意願 / Lead 分級
   下一步意願：● 強烈   ○ 中等   ○ 弱   ○ 沒興趣
   Lead 分級：  ● Hot   ○ Warm   ○ Cool   ○ Cold
   判斷：他主動問下週可以來看店…

─────────────────────────────────────────────
        Scorder Demo Note · Page 1 of 2
```

**Non-answer rendering rules**
- Empty text fields: line suppressed entirely (no `（未填）` placeholder).
- Radio with `notMentioned` / `notSet`: rendered as `— 未提及` (italic, lighter weight) instead of `● ○ ○ ○`. This is the one explicit "no answer" marker, because otherwise a radio question would silently disappear and the reader couldn't tell whether it was asked.
- Multi-select with empty array: rendered as `— 未提及`.
- A section where **all** fields are empty / `notMentioned`: header still renders, with `本段無紀錄` underneath. Distinguishes "skipped section" from "section doesn't exist".

**Behavior details**
- Page footer: `Scorder Demo Note · Page X of Y` via CSS `@page { @bottom-center { content: counter(page) ... } }`. Browser support varies; if a browser ignores the counter, page numbers are absent — non-fatal.
- All form inputs render as static text — no input borders, no focus rings, no buttons.
- `break-inside: avoid` on `.qa-entry`, `.pain-point`, and `.commitment` keeps individual entries from splitting mid-row.
- Toolbar, autosave indicator, and sticky nav are `no-print`.

---

## 8. Out of scope / non-goals

1. No backend, no database, no auth. Pure client-side. Single user (Max) on a single browser at a time.
2. No multi-demo history view. localStorage holds one active draft. The "list past demos" experience is JSON files in a folder Max manages himself.
3. No cross-demo spreadsheet (Section 6 of the source doc). Aggregated tracker stays a separate Google Sheet / Notion workflow.
4. No follow-up email draft generator (Section 5.1 of the source doc).
5. No live PDF preview pane. The `/print` route is the preview.
6. No collaborative editing. Two open tabs → last-save wins.
7. No undo / version history beyond localStorage. `清空表單` is destructive; the dialog is the only safety.
8. No image / file attachments. Photographing handwritten notes (Section 4 of the source doc) stays manual.
9. No notifications / reminders for the 24-hour follow-up window.
10. No internationalization framework. Strings live inline as Traditional Chinese literals.
11. No analytics, no telemetry. Restaurant data is sensitive (Section 10 of the source doc).
12. Tests scope: Zod schema unit tests + one Playwright smoke test (load → fill key fields → export JSON → re-import → confirm round-trip). No comprehensive RTL component coverage.
13. No mobile-first polish. Tablet usable, phone tolerable, laptop is the design target.
14. No print-page-break optimization beyond CSS basics.

---

## 9. Acceptance criteria for v1

- Max can leave any field blank or marked `未提及` and still export a clean JSON and PDF without validation errors or empty placeholders.
- Every field in the source doc's "即時紀錄模板" (Section 3 of the source doc) has a corresponding form input.
- A completed JSON round-trips losslessly: export → re-import → identical form state.
- Cmd+P from `/print` produces a B&W PDF that matches the layout in Section 7 of this spec.
- Auto-save survives a full page refresh: re-opening the form within the same browser shows all fields populated with the last saved values.
- Dynamic sections (痛點, Q&A, 承諾) support add and remove; an empty section renders correctly in the PDF (header only, with `本段無紀錄`).

---

## 10. Open follow-ups (not in v1)

These are explicitly deferred. If they come up during implementation, defer rather than expanding scope:

- Importing past Markdown notes (the existing handwritten-template format) into the form.
- Multi-demo dashboard view fed by exported JSON files.
- Email-template generator that consumes the JSON.
- Partial localStorage drafts keyed by restaurant name (multi-draft).
- Optional cloud sync (Vercel KV / Supabase).
