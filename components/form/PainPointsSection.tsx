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
