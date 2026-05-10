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
