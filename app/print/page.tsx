"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PrintView } from "@/components/PrintView";
import { loadDraft } from "@/lib/storage";
import type { DemoNote } from "@/lib/schema";

function PrintRouteContent() {
  const searchParams = useSearchParams();
  const auto = searchParams.get("auto") === "1";
  const [note, setNote] = React.useState<DemoNote | null>(null);
  const [empty, setEmpty] = React.useState(false);

  React.useEffect(() => {
    // Client-only hydration from localStorage; setState in effect is the
    // canonical pattern for this case.
    /* eslint-disable react-hooks/set-state-in-effect */
    const draft = loadDraft();
    if (!draft) {
      setEmpty(true);
      return;
    }
    setNote(draft);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  React.useEffect(() => {
    if (!note || !auto) return;
    const id = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => window.print())
    );
    return () => window.cancelAnimationFrame(id);
  }, [note, auto]);

  if (empty) {
    return (
      <main className="mx-auto max-w-md p-12 text-center text-sm text-neutral-600">
        尚無資料，請先在主頁填寫表單。
      </main>
    );
  }
  if (!note) return null;
  return <PrintView note={note} />;
}

export default function PrintPage() {
  return (
    <React.Suspense fallback={null}>
      <PrintRouteContent />
    </React.Suspense>
  );
}
