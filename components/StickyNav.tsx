"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS: Array<{ id: string; label: string }> = [
  { id: "basic", label: "基本資料" },
  { id: "icp", label: "ICP 三題" },
  { id: "systems", label: "現有系統" },
  { id: "pain", label: "痛點" },
  { id: "reaction", label: "Demo 反應" },
  { id: "qa", label: "Q&A" },
  { id: "commit", label: "承諾" },
  { id: "signals", label: "訊號" },
  { id: "grade", label: "分級" },
  { id: "notes", label: "備註" },
];

export function StickyNav() {
  const [active, setActive] = React.useState<string>("basic");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.5, 1] }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="表單章節"
      className="sticky top-20 hidden h-fit w-56 shrink-0 flex-col gap-1 text-sm md:flex"
    >
      {NAV_ITEMS.map((item, i) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            "rounded px-2 py-1 transition-colors hover:bg-neutral-100",
            active === item.id ? "font-semibold text-neutral-900" : "text-neutral-500"
          )}
        >
          <span className="mr-2 text-neutral-400">{i + 1}.</span>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
