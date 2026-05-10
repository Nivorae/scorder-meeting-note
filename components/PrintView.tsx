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

function Empty() {
  return <p className="italic text-neutral-500">本段無紀錄</p>;
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
