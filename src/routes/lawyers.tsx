import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/lex/Shell";
import { Panel, Eyebrow, Chip } from "@/components/lex/Panel";
import { PRACTICE_AREAS, formatFee, useSession } from "@/lib/session";

export const Route = createFileRoute("/lawyers")({
  head: () => ({
    meta: [
      { title: "Find and compare counsel · LexBridge" },
      {
        name: "description",
        content:
          "Browse verified advocates by practice area, bench, fee ceiling and pro-bono availability, then compare them side by side.",
      },
      { property: "og:title", content: "Find and compare counsel · LexBridge" },
      {
        property: "og:description",
        content: "Verified advocates filtered by practice, bench, fee and pro-bono availability.",
      },
    ],
  }),
  component: LawyersPage,
});

function LawyersPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [area, setArea] = useState<string | null>(null);
  const [bench, setBench] = useState("");
  const [maxFee, setMaxFee] = useState(500000);
  const [proBonoOnly, setProBonoOnly] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["lawyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .order("years_experience", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter((l) => {
      if (area && !l.practice_areas.includes(area)) return false;
      if (bench && !l.bench.toLowerCase().includes(bench.toLowerCase())) return false;
      if (l.fee_inr > maxFee) return false;
      if (proBonoOnly && !l.pro_bono_available) return false;
      return true;
    });
  }, [data, area, bench, maxFee, proBonoOnly]);

  const compared = (data ?? []).filter((l) => compare.includes(l.id));

  function toggleCompare(id: string) {
    setCompare((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    );
  }

  function engage(lawyerId: string) {
    if (!session) {
      toast.info("Sign in to send an engagement request.");
      navigate({ to: "/auth" });
      return;
    }
    navigate({ to: "/dashboard", search: { engage: lawyerId } });
  }

  return (
    <Shell>
      <section className="pt-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="text-balance font-display text-3xl font-medium tracking-tight text-ink">
              Counsel, compared on one surface
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Filter by practice, bench, fee and pro-bono — then read up to three side by side.
            </p>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
            Showing {filtered.length} of {data?.length ?? 0}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <Panel innerClassName="p-5">
              <div className="mb-4 flex items-center justify-between">
                <Eyebrow>Filters</Eyebrow>
                <button
                  onClick={() => {
                    setArea(null);
                    setBench("");
                    setMaxFee(500000);
                    setProBonoOnly(false);
                  }}
                  className="text-[11px] font-medium text-brand"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    Practice area
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRACTICE_AREAS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setArea(area === a ? null : a)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors ${
                          area === a
                            ? "bg-brand text-paper ring-brand/30"
                            : "bg-ink/5 text-ink/70 ring-black/5"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    Bench / location
                  </label>
                  <input
                    value={bench}
                    onChange={(e) => setBench(e.target.value)}
                    placeholder="Supreme Court, New Delhi"
                    className="w-full rounded-lg bg-ink/5 px-3 py-2 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-brand/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    Fee ceiling <span className="text-brand">{formatFee(maxFee)}</span>
                  </label>
                  <input
                    type="range"
                    min={50000}
                    max={500000}
                    step={10000}
                    value={maxFee}
                    onChange={(e) => setMaxFee(Number(e.target.value))}
                    className="w-full accent-brand"
                  />
                </div>

                <button
                  onClick={() => setProBonoOnly(!proBonoOnly)}
                  className="flex w-full items-center justify-between pt-1"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    Pro-bono only
                  </span>
                  <span
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${proBonoOnly ? "bg-brand" : "bg-ink/15"}`}
                  >
                    <span
                      className={`absolute size-4 rounded-full bg-paper shadow-sm transition-all ${proBonoOnly ? "left-4.5" : "left-0.5"}`}
                    />
                  </span>
                </button>
              </div>

              <div className="mt-5 rounded-lg bg-ink/5 px-3 py-2.5 ring-1 ring-black/5">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">
                  {compare.length} selected for comparison
                </span>
              </div>
            </Panel>
          </aside>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-9 xl:grid-cols-3">
            {isLoading && <p className="text-sm text-ink/60">Loading counsel…</p>}
            {filtered.map((l) => (
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
                  {l.practice_areas.map((a) => (
                    <Chip key={a}>{a}</Chip>
                  ))}
                  {l.pro_bono_available && <Chip tone="brass">Pro bono</Chip>}
                </div>
                <p className="text-xs text-ink/60">{l.bio}</p>
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
                <div className="mt-auto space-y-3">
                  <div className="flex items-center gap-2 rounded-lg bg-brand/8 px-3 py-2 ring-1 ring-brand/15">
                    <span className="size-1.5 shrink-0 rounded-full bg-brand2" />
                    <span className="text-xs text-ink/70">
                      {l.availability} · responds in {l.response_time}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleCompare(l.id)}
                      className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium ring-1 transition-transform hover:-translate-y-px ${
                        compare.includes(l.id)
                          ? "bg-ink text-paper ring-ink/40"
                          : "bg-ink/5 text-ink/70 ring-black/5"
                      }`}
                    >
                      {compare.includes(l.id) ? "Selected" : "Compare"}
                    </button>
                    <button
                      onClick={() => engage(l.id)}
                      className="flex-1 rounded-lg bg-brand px-3 py-2.5 text-sm font-medium text-paper ring-1 ring-brand/40 transition-transform hover:-translate-y-px"
                    >
                      Engage
                    </button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {compared.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
              Side by side
            </h2>
            <button onClick={() => setCompare([])} className="text-[11px] font-medium text-brand">
              Clear
            </button>
          </div>
          <Panel innerClassName="overflow-x-auto p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left">
                  <th className="pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    Criterion
                  </th>
                  {compared.map((l) => (
                    <th key={l.id} className="pb-3 font-display text-base font-medium text-ink">
                      {l.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {[
                  ["Bench", (l: (typeof compared)[number]) => l.bench],
                  ["Experience", (l: (typeof compared)[number]) => `${l.years_experience} yrs`],
                  ["Practice", (l: (typeof compared)[number]) => l.practice_areas.join(", ")],
                  ["Success rate", (l: (typeof compared)[number]) => `${l.success_rate}%`],
                  ["Fee", (l: (typeof compared)[number]) => `${formatFee(l.fee_inr)} / case`],
                  ["Response", (l: (typeof compared)[number]) => l.response_time],
                  [
                    "Pro bono",
                    (l: (typeof compared)[number]) =>
                      l.pro_bono_available ? `Open · ${l.pro_bono_matters} matters` : "Not open",
                  ],
                ].map(([label, get]) => (
                  <tr key={label as string}>
                    <td className="py-3 text-ink/55">{label as string}</td>
                    {compared.map((l) => (
                      <td key={l.id} className="py-3 text-ink">
                        {(get as (x: typeof l) => string)(l)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>
      )}
    </Shell>
  );
}
