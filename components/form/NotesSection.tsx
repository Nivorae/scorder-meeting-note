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
