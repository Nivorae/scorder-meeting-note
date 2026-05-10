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
