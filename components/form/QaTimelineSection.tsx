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
