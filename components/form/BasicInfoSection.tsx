"use client";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import type { DemoNote } from "@/lib/schema";

const FIELDS: Array<{ key: keyof DemoNote["basicInfo"]; label: string; placeholder?: string }> = [
  { key: "restaurantName", label: "餐廳名稱" },
  { key: "ownerSurname", label: "老闆姓氏" },
  { key: "district", label: "所在區" },
  { key: "restaurantType", label: "餐廳類型", placeholder: "日料 / 咖啡廳 / 麵店…" },
  { key: "yearsOpen", label: "營業多久" },
  { key: "tableCount", label: "桌數" },
  { key: "staffCount", label: "員工人數（含老闆）" },
  { key: "averageTicket", label: "客單價（估）" },
  { key: "businessHours", label: "營業時段" },
];

export function BasicInfoSection() {
  const { register } = useFormContext<DemoNote>();
  return (
    <SectionShell id="basic" number={1} title="基本資料">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label htmlFor={`basic-${f.key}`}>{f.label}</Label>
            <Input
              id={`basic-${f.key}`}
              placeholder={f.placeholder ?? "（未提及則留空）"}
              {...register(`basicInfo.${f.key}`)}
            />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
