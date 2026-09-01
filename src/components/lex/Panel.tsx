import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn("rounded-2xl bg-ink/40 p-1 ring-1 ring-black/10", className)}>
      <div className={cn("h-full rounded-xl bg-paper/85 p-6 backdrop-blur-xl", innerClassName)}>
        {children}
      </div>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">{children}</span>
  );
}

export function Chip({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "brass" | "muted";
}) {
  const tones = {
    brand: "bg-brand/10 text-brand ring-brand/20",
    brass: "bg-brass/10 text-brass ring-brass/25",
    muted: "bg-ink/5 text-ink/60 ring-black/5",
  } as const;
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] ring-1",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
