"use client";
import * as React from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DemoNoteSchema, type DemoNote } from "@/lib/schema";
import { defaultDemoNote } from "@/lib/defaults";
import { loadDraft, saveDraft } from "@/lib/storage";
import { Toolbar } from "@/components/Toolbar";
import { StickyNav } from "@/components/StickyNav";
import { BasicInfoSection } from "@/components/form/BasicInfoSection";
import { IcpSection } from "@/components/form/IcpSection";
import { ExistingSystemsSection } from "@/components/form/ExistingSystemsSection";
import { PainPointsSection } from "@/components/form/PainPointsSection";
import { DemoReactionSection } from "@/components/form/DemoReactionSection";
import { QaTimelineSection } from "@/components/form/QaTimelineSection";
import { CommitmentsSection } from "@/components/form/CommitmentsSection";
import { BodySignalsSection } from "@/components/form/BodySignalsSection";
import { LeadGradingSection } from "@/components/form/LeadGradingSection";
import { NotesSection } from "@/components/form/NotesSection";

const AUTOSAVE_DEBOUNCE_MS = 500;

function AutosaveAndIndicator({ onSaved }: { onSaved: (ts: string) => void }) {
  const watched = useWatch<DemoNote>();
  const { formState } = useFormContext<DemoNote>();
  const skipFirstRef = React.useRef(true);

  React.useEffect(() => {
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      return;
    }
    if (!formState.isDirty) return;
    const handle = window.setTimeout(() => {
      saveDraft(watched as DemoNote);
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      onSaved(`${hh}:${mm}`);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [watched, formState.isDirty, onSaved]);
  return null;
}

function HydratedForm({ initialValues }: { initialValues: DemoNote }) {
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);
  const methods = useForm<DemoNote>({
    resolver: zodResolver(DemoNoteSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  return (
    <FormProvider {...methods}>
      <div className="no-print">
        <Toolbar lastSavedAt={lastSavedAt} />
        <AutosaveAndIndicator onSaved={setLastSavedAt} />
        <main className="mx-auto flex max-w-6xl gap-8 px-4 py-6">
          <StickyNav />
          <form className="min-w-0 flex-1 space-y-2">
            <BasicInfoSection />
            <IcpSection />
            <ExistingSystemsSection />
            <PainPointsSection />
            <DemoReactionSection />
            <QaTimelineSection />
            <CommitmentsSection />
            <BodySignalsSection />
            <LeadGradingSection />
            <NotesSection />
          </form>
        </main>
      </div>
    </FormProvider>
  );
}

export default function FormPage() {
  const [initialValues, setInitialValues] = React.useState<DemoNote | null>(null);

  React.useEffect(() => {
    // Client-only hydration from localStorage; setState in effect is the
    // canonical pattern for this case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialValues(loadDraft() ?? defaultDemoNote());
  }, []);

  if (!initialValues) {
    return <div className="p-8 text-sm text-neutral-500">載入中…</div>;
  }
  return <HydratedForm initialValues={initialValues} />;
}
