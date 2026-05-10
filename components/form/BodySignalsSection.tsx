"use client";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import { BodySignalKeys, type BodySignalKey } from "@/lib/schema";
import type { DemoNote } from "@/lib/schema";

const SIGNAL_LABELS: Record<BodySignalKey, string> = {
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

export function BodySignalsSection() {
  const { control, register } = useFormContext<DemoNote>();
  return (
    <SectionShell id="signals" number={8} title="肢體 / 語氣訊號">
      <ul className="space-y-2">
        {BodySignalKeys.map((key) => (
          <li key={key} className="rounded-md border border-neutral-200 p-3">
            <Controller
              control={control}
              name={`bodySignals.checked.${key}`}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  <span className="font-medium">{SIGNAL_LABELS[key]}</span>
                </label>
              )}
            />
            <Input
              className="mt-2"
              placeholder="補充說明（選填）"
              {...register(`bodySignals.notes.${key}`)}
            />
          </li>
        ))}
      </ul>
      <div>
        <Label htmlFor="signals-other">其他觀察</Label>
        <Textarea id="signals-other" rows={2} placeholder="（選填）" {...register("bodySignals.other")} />
      </div>
    </SectionShell>
  );
}
