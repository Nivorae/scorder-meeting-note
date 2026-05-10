import * as React from "react";

interface SectionShellProps {
  id: string;
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SectionShell({ id, number, title, description, children }: SectionShellProps) {
  return (
    <section
      id={id}
      data-section-anchor={id}
      className="scroll-mt-24 border-b border-neutral-200 pb-10 pt-6"
    >
      <header className="mb-4">
        <h2 className="text-xl font-bold tracking-tight">
          <span className="mr-2 text-neutral-400">{number}.</span>
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
