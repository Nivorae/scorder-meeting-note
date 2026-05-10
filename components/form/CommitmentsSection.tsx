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
