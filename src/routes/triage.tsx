import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Shell } from "@/components/lex/Shell";
import { Panel, Eyebrow, Chip } from "@/components/lex/Panel";
import { triageMatter, type TriageResult } from "@/lib/triage.functions";

export const Route = createFileRoute("/triage")({
  head: () => ({
    meta: [
      { title: "Matter triage · LexBridge" },
      {
        name: "description",
        content:
          "Describe your legal problem in plain language and get an instant practice-area classification, urgency read, document checklist and the questions counsel will ask.",
      },
      { property: "og:title", content: "Matter triage · LexBridge" },
      {
        property: "og:description",
        content: "Plain-language intake turned into a structured brief for counsel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TriagePage,
});

const SAMPLES = [
  "My landlord in Indore kept my ₹80,000 deposit after I moved out three months ago and stopped replying to messages.",
  "A competitor is selling t-shirts using our registered logo on an online marketplace.",
  "I was terminated without notice pay after four years and my full and final settlement is pending.",
];

function TriagePage() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const run = useServerFn(triageMatter);

  const triage = useMutation({
    mutationFn: async () => run({ data: { description } }),
    onSuccess: (data) => setResult(data),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Shell>
      <section className="pt-12">
        <Eyebrow>Matter triage</Eyebrow>
        <h1 className="mt-2 max-w-2xl text-balance font-display text-4xl font-medium tracking-tight text-ink">
          Describe it the way you'd tell a friend. We'll turn it into a brief.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ink/65">
          Triage classifies the practice area, reads the urgency and builds your document checklist
          before you spend a rupee on counsel. It is organisation, not legal advice.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Panel innerClassName="p-6">
              <Eyebrow>Your situation</Eyebrow>
              <textarea
                className="mt-3 h-48 w-full resize-none rounded-lg bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-brand/40"
                placeholder="What happened, when, who is involved, and what you want to achieve…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {SAMPLES.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setDescription(s)}
                    className="rounded-md bg-ink/5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60 ring-1 ring-black/5 hover:text-ink"
                  >
                    Example {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => triage.mutate()}
                disabled={description.trim().length < 20 || triage.isPending}
                className="mt-4 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-brand/40 disabled:opacity-60"
              >
                {triage.isPending ? "Reading the matter…" : "Run triage"}
              </button>
            </Panel>
          </div>

          <div className="lg:col-span-7">
            {!result && (
              <Panel innerClassName="p-6">
                <p className="text-sm text-ink/60">
                  Your structured brief will appear here: practice area, urgency, next steps,
                  documents to gather and the questions an advocate will open with.
                </p>
              </Panel>
            )}

            {result && (
              <div className="lex-rise space-y-6">
                <Panel innerClassName="p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip>{result.practice_area}</Chip>
                    <Chip tone="brass">{result.urgency} urgency</Chip>
                  </div>
                  <p className="mt-4 text-sm text-ink/75">{result.summary}</p>
                  {result.limitation_note && (
                    <p className="mt-3 border-t border-black/5 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                      {result.limitation_note}
                    </p>
                  )}
                  <Link
                    to="/lawyers"
                    className="mt-5 inline-block rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-ink/40"
                  >
                    Find {result.practice_area} counsel
                  </Link>
                </Panel>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Panel innerClassName="p-6">
                    <Eyebrow>Next steps</Eyebrow>
                    <ol className="mt-3 space-y-2">
                      {result.next_steps.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-ink/75">
                          <span className="font-mono text-[10px] text-mist">{i + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </Panel>
                  <Panel innerClassName="p-6">
                    <Eyebrow>Documents to gather</Eyebrow>
                    <ul className="mt-3 space-y-2">
                      {result.documents.map((d, i) => (
                        <li key={i} className="flex gap-2 text-sm text-ink/75">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </div>

                <Panel innerClassName="p-6">
                  <Eyebrow>What counsel will ask</Eyebrow>
                  <ul className="mt-3 space-y-2">
                    {result.questions.map((q, i) => (
                      <li key={i} className="text-sm text-ink/75">
                        “{q}”
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}
