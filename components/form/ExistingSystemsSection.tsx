"use client";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionShell } from "@/components/form/SectionShell";
import type { DemoNote } from "@/lib/schema";

const POS = [
  { v: "notMentioned", l: "略過 / 未提及" },
  { v: "iCHEF", l: "iCHEF" },
  { v: "Eats365", l: "Eats365" },
  { v: "Dudoo", l: "Dudoo" },
  { v: "肚肚", l: "肚肚" },
  { v: "other", l: "其他" },
  { v: "none", l: "無 POS" },
] as const;

const PAYMENT = [
  { v: "cash", l: "現金" },
  { v: "card", l: "刷卡" },
  { v: "linePay", l: "LINE Pay" },
  { v: "jkoPay", l: "街口" },
  { v: "other", l: "其他" },
] as const;

const INVOICE = [
  { v: "notMentioned", l: "略過 / 未提及" },
  { v: "paper", l: "紙本" },
  { v: "electronic", l: "電子" },
  { v: "none", l: "無" },
] as const;

const ORDER_FLOW = [
  { v: "notMentioned", l: "略過 / 未提及" },
  { v: "staff", l: "員工接" },
  { v: "paper", l: "紙本" },
  { v: "qrcode", l: "QR Code" },
  { v: "mixed", l: "混合" },
] as const;

const DELIVERY = [
  { v: "foodpanda", l: "foodpanda" },
  { v: "uberEats", l: "Uber Eats" },
  { v: "lalamove", l: "Lalamove" },
  { v: "none", l: "無外送平台" },
] as const;

export function ExistingSystemsSection() {
  const { register, control, setValue } = useFormContext<DemoNote>();
  const pos = useWatch({ control, name: "existingSystems.pos" });
  const payment = useWatch({ control, name: "existingSystems.payment" });
  const delivery = useWatch({ control, name: "existingSystems.deliveryPlatforms" });

  const togglePayment = (v: (typeof PAYMENT)[number]["v"]) => {
    const set = new Set(payment ?? []);
    if (set.has(v)) set.delete(v);
    else set.add(v);
    setValue("existingSystems.payment", Array.from(set), { shouldDirty: true });
  };
  const toggleDelivery = (v: (typeof DELIVERY)[number]["v"]) => {
    const set = new Set(delivery ?? []);
    if (set.has(v)) set.delete(v);
    else set.add(v);
    setValue("existingSystems.deliveryPlatforms", Array.from(set), { shouldDirty: true });
  };

  return (
    <SectionShell id="systems" number={3} title="現有系統與工具">
      {/* POS */}
      <div>
        <Label>POS 廠牌</Label>
        <Controller
          control={control}
          name="existingSystems.pos"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {POS.map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={opt.v} id={`pos-${opt.v}`} />
                  <span className={opt.v === "notMentioned" ? "text-neutral-400" : ""}>{opt.l}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
        {pos === "other" && (
          <Input className="mt-2" placeholder="其他 POS 名稱" {...register("existingSystems.posOther")} />
        )}
      </div>

      {/* Payment */}
      <div>
        <Label>結帳方式（可多選）</Label>
        <p className="text-xs text-neutral-400">未提及此題：全部不勾選即可</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PAYMENT.map((opt) => (
            <label key={opt.v} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={(payment ?? []).includes(opt.v)}
                onCheckedChange={() => togglePayment(opt.v)}
              />
              <span>{opt.l}</span>
            </label>
          ))}
        </div>
        {(payment ?? []).includes("other") && (
          <Input className="mt-2" placeholder="其他付款方式" {...register("existingSystems.paymentOther")} />
        )}
      </div>

      {/* Invoice */}
      <div>
        <Label>發票處理</Label>
        <Controller
          control={control}
          name="existingSystems.invoice"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {INVOICE.map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={opt.v} id={`inv-${opt.v}`} />
                  <span className={opt.v === "notMentioned" ? "text-neutral-400" : ""}>{opt.l}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </div>

      {/* Ordering flow */}
      <div>
        <Label>點餐流程</Label>
        <Controller
          control={control}
          name="existingSystems.orderingFlow"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5"
            >
              {ORDER_FLOW.map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={opt.v} id={`order-${opt.v}`} />
                  <span className={opt.v === "notMentioned" ? "text-neutral-400" : ""}>{opt.l}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </div>

      {/* Delivery */}
      <div>
        <Label>外送平台合作（可多選）</Label>
        <p className="text-xs text-neutral-400">未提及此題：全部不勾選即可</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DELIVERY.map((opt) => (
            <label key={opt.v} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={(delivery ?? []).includes(opt.v)}
                onCheckedChange={() => toggleDelivery(opt.v)}
              />
              <span>{opt.l}</span>
            </label>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
