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
