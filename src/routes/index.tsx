import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/lex/Shell";
import { Panel, Eyebrow, Chip } from "@/components/lex/Panel";
import { formatFee } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LexBridge — find counsel and track your case" },
      {
        name: "description",
        content:
          "LexBridge is the coordination layer around India's courts: compare verified lawyers, engage them, and follow every hearing, document and milestone on one docket.",
      },
      { property: "og:title", content: "LexBridge — find counsel and track your case" },
      {
        property: "og:description",
        content: "Compare verified lawyers, engage in one tap, and track every case milestone.",
      },
    ],
  }),
  component: Index,
});

const NATIONAL_DOCKET = [
  { value: "4.09Cr", label: "Pending cases, district & lower courts" },
  { value: "96,874", label: "Pending cases, Supreme Court" },
  { value: "2.72Cr", label: "People on trial in India" },
  { value: "13 yrs", label: "Cited duration of one hit-and-run case", brand: true },
];

function Index() {
  const { data: lawyers } = useQuery({
    queryKey: ["featured-lawyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .order("success_rate", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Shell>
      <section className="grid grid-cols-1 gap-10 pt-14 pb-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <div className="lex-rise mb-5 inline-flex items-center gap-2 rounded-full bg-ink/5 px-3 py-1 ring-1 ring-black/5">
            <span className="size-1.5 rounded-full bg-brass" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/70">
              Client · Counsel · One docket
            </span>
          </div>
          <h1
            className="lex-rise max-w-[48ch] text-balance font-display font-medium leading-tight tracking-tight text-ink"
            style={{ fontSize: "clamp(2.75rem, 5.5vw, 4.75rem)", animationDelay: "80ms" }}
          >
            Every case, one standing record — <span className="text-brand">stamped, dated, indexed.</span>
          </h1>
          <p
            className="lex-rise mt-6 max-w-[52ch] text-pretty text-base text-ink/70 sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            India's courts carry over four crore pending cases and years of waiting. LexBridge turns
            the docket into a legible bridge: find counsel, compare fees, and track each milestone
            from filing to order.
          </p>
          <div className="lex-rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
            <Link
              to="/lawyers"
              className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-paper ring-1 ring-brand/40 transition-transform hover:-translate-y-px"
            >
              Find a lawyer
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg bg-paper px-5 py-3 text-sm font-medium text-ink ring-1 ring-black/10 transition-transform hover:-translate-y-px"
            >
              Open case command center
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <Panel className="lex-rise" >
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <Eyebrow>National docket</Eyebrow>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">
                As of 1 Apr 2026
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 pt-5">
              {NATIONAL_DOCKET.map((stat) => (
                <div key={stat.label}>
                  <div
                    className={`font-display text-3xl font-semibold leading-none ${stat.brand ? "text-brand" : "text-ink"}`}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-2 max-w-[18ch] font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-lg bg-brand/8 px-3 py-2.5 ring-1 ring-brand/15">
              <span className="size-1.5 shrink-0 rounded-full bg-brand2" />
              <span className="text-xs text-ink/70">
                Next step: open a matter and we index it for you.
              </span>
            </div>
          </Panel>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-balance font-display text-2xl font-medium tracking-tight text-ink">
              Counsel, compared on one surface
            </h2>
            <p className="mt-1 text-sm text-ink/60">
              Filter by practice, bench, fee and pro-bono — then read them side by side.
            </p>
          </div>
          <Link
            to="/lawyers"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand hover:underline"
          >
            See all counsel
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(lawyers ?? []).map((l) => (
            <Panel key={l.id} innerClassName="flex h-full flex-col gap-4 p-5">
              <div>
                <h3 className="font-display text-lg font-medium leading-tight tracking-tight text-ink">
                  {l.name}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                  {l.bench} · {l.years_experience} yrs
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {l.practice_areas.map((area) => (
                  <Chip key={area}>{area}</Chip>
                ))}
              </div>
              <dl className="space-y-2 border-t border-black/5 pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ink/55">Success</dt>
                  <dd className="font-mono text-ink">{l.success_rate}%</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink/55">Engagement</dt>
                  <dd className="font-mono text-ink">{formatFee(l.fee_inr)} / case</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink/55">Pro bono</dt>
                  <dd className="font-mono text-ink/70">{l.pro_bono_matters} matters</dd>
                </div>
              </dl>
              <div className="mt-auto">
                <div className="flex items-center gap-2 rounded-lg bg-brand/8 px-3 py-2 ring-1 ring-brand/15">
                  <span className="size-1.5 shrink-0 rounded-full bg-brand2" />
                  <span className="text-xs text-ink/70">
                    {l.availability} · responds in {l.response_time}
                  </span>
                </div>
                <Link
                  to="/lawyers"
                  className="mt-3 block w-full rounded-lg bg-ink px-4 py-2.5 text-center text-sm font-medium text-paper ring-1 ring-ink/40 transition-transform hover:-translate-y-px"
                >
                  Compare
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-5">
          <h2 className="text-balance font-display text-2xl font-medium tracking-tight text-ink">
            One journey, two dashboards
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            The same docket, read from either side of the matter.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Panel innerClassName="p-5">
            <Eyebrow>Client</Eyebrow>
            <p className="mt-3 text-sm text-ink/75">
              Describe the issue, compare counsel, send an engagement request, then follow the
              timeline: filings, documents due, hearings and status updates.
            </p>
          </Panel>
          <Panel innerClassName="p-5">
            <Eyebrow>Counsel</Eyebrow>
            <p className="mt-3 text-sm text-ink/75">
              A pipeline by stage, incoming requests, hearing dates and a document checklist per
              matter — not a lead list.
            </p>
          </Panel>
          <Panel innerClassName="p-5">
            <Eyebrow>Pro bono</Eyebrow>
            <p className="mt-3 text-sm text-ink/75">
              Flagged matters surface on an open board so budding lawyers can build experience and
              people get representation.
            </p>
          </Panel>
        </div>
      </section>
    </Shell>
  );
}
