import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/lex/Shell";
import { Panel, Eyebrow, Chip } from "@/components/lex/Panel";
import { formatDate } from "@/lib/session";

export const Route = createFileRoute("/pro-bono")({
  head: () => ({
    meta: [
      { title: "Pro-bono board · LexBridge" },
      {
        name: "description",
        content:
          "Open pro-bono matters waiting for counsel — browse by practice area and bench, and take one on.",
      },
      { property: "og:title", content: "Pro-bono board · LexBridge" },
      { property: "og:description", content: "Open pro-bono matters waiting for counsel." },
    ],
  }),
  component: ProBonoPage,
});

function ProBonoPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["pro-bono-board"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("pro_bono", true)
        .is("lawyer_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Shell>
      <section className="pt-12">
        <div className="mb-6 max-w-2xl">
          <Eyebrow>Access to justice</Eyebrow>
          <h1 className="mt-2 text-balance font-display text-3xl font-medium tracking-tight text-ink">
            Open pro-bono matters
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Every matter here was opened by someone who could not afford counsel. Signed-in counsel
            can take one on from the case command center.
          </p>
        </div>

        {isLoading && <p className="text-sm text-ink/60">Loading the board…</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <Panel innerClassName="p-6">
            <p className="text-sm text-ink/60">
              No open pro-bono matters right now. The board clears when counsel steps in.
            </p>
          </Panel>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((c) => (
            <Panel key={c.id} innerClassName="flex h-full flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-medium leading-tight tracking-tight text-ink">
                  {c.title}
                </h2>
                <Chip tone="brass">No fee</Chip>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                {c.practice_area} · {c.location || "Location not set"}
              </p>
              <p className="text-xs text-ink/65">{c.description || "No description provided."}</p>
              <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">
                  Opened {formatDate(c.created_at)}
                </span>
                <Link
                  to="/cases/$caseId"
                  params={{ caseId: c.id }}
                  className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-paper ring-1 ring-brand/40 transition-transform hover:-translate-y-px"
                >
                  Review matter
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      </section>
    </Shell>
  );
}
