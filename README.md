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
