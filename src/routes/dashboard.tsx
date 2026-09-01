import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/lex/Shell";
import { Panel, Eyebrow, Chip } from "@/components/lex/Panel";
import { PRACTICE_AREAS, accountTypeOf, formatDate, formatFee, useSession } from "@/lib/session";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>) => ({
    engage: typeof search['engage'] === "string" ? (search['engage'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your docket · LexBridge" },
      {
        name: "description",
        content:
          "Track your matters, engagement requests, hearings and milestones — or run your counsel pipeline — from one LexBridge docket.",
      },
      { property: "og:title", content: "Your docket · LexBridge" },
      { property: "og:description", content: "Matters, requests, hearings and milestones in one place." },
    ],
  }),
  component: Dashboard,
});

const STAGES = ["Intake", "Engaged", "In court", "Closed"] as const;

function Dashboard() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (!session) {
    return (
      <Shell>
        <p className="py-24 text-center text-sm text-ink/60">Loading your docket…</p>
      </Shell>
    );
  }

  return accountTypeOf(session) === "lawyer" ? (
    <LawyerDashboard userId={session.user.id} />
  ) : (
    <ClientDashboard userId={session.user.id} />
  );
}

/* ---------------- client ---------------- */

function ClientDashboard({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { engage } = Route.useSearch();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [practiceArea, setPracticeArea] = useState<string>(PRACTICE_AREAS[0]);
  const [location, setLocation] = useState("");
  const [proBono, setProBono] = useState(false);
  const [engageCaseId, setEngageCaseId] = useState("");
  const [engageMessage, setEngageMessage] = useState("");

  const cases = useQuery({
    queryKey: ["my-cases", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*, lawyers(name, bench)")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const requests = useQuery({
    queryKey: ["my-requests", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_requests")
        .select("*, lawyers(name), cases(title)")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const engageLawyer = useQuery({
    queryKey: ["engage-lawyer", engage],
    enabled: Boolean(engage),
    queryFn: async () => {
      const { data, error } = await supabase.from("lawyers").select("*").eq("id", engage!).single();
      if (error) throw error;
      return data;
    },
  });

  const createCase = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .insert({
          client_id: userId,
          title,
          description,
          practice_area: practiceArea,
          location,
          pro_bono: proBono,
          status_note: "Matter opened. Awaiting counsel.",
        })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("case_milestones").insert({
        case_id: data.id,
        title: "Matter opened on LexBridge",
        detail: "Indexed and ready for counsel matching.",
        status: "done",
        occurred_on: new Date().toISOString().slice(0, 10),
        position: 0,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Matter opened and indexed.");
      setTitle("");
      setDescription("");
      setLocation("");
      setProBono(false);
      qc.invalidateQueries({ queryKey: ["my-cases", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendRequest = useMutation({
    mutationFn: async () => {
      if (!engage || !engageCaseId) throw new Error("Pick a matter first");
      const { error } = await supabase.from("engagement_requests").insert({
        case_id: engageCaseId,
        lawyer_id: engage,
        client_id: userId,
        message: engageMessage,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Engagement request sent.");
      setEngageMessage("");
      qc.invalidateQueries({ queryKey: ["my-requests", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field =
    "w-full rounded-lg bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-brand/40";

  return (
    <Shell>
      <section className="pt-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
              Your matters
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              From "I need help" to "I know what happens next."
            </p>
          </div>
          <Link
            to="/lawyers"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand hover:underline"
          >
            Find counsel
          </Link>
        </div>

        {engage && engageLawyer.data && (
          <Panel className="mb-6">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <Eyebrow>Engage counsel</Eyebrow>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                {formatFee(engageLawyer.data.fee_inr)} / case
              </span>
            </div>
            <p className="mt-4 font-display text-lg text-ink">{engageLawyer.data.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
              {engageLawyer.data.bench}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                className={field}
                value={engageCaseId}
                onChange={(e) => setEngageCaseId(e.target.value)}
              >
                <option value="">Select a matter…</option>
                {(cases.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <input
                className={field}
                placeholder="Message to counsel"
                value={engageMessage}
                onChange={(e) => setEngageMessage(e.target.value)}
              />
            </div>
            <button
              onClick={() => sendRequest.mutate()}
              disabled={sendRequest.isPending}
              className="mt-4 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-brand/40 transition-transform hover:-translate-y-px disabled:opacity-60"
            >
              Send engagement request
            </button>
          </Panel>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {(cases.data ?? []).length === 0 && (
              <Panel innerClassName="p-6">
                <p className="text-sm text-ink/60">
                  No matters yet. Describe your legal issue on the right and we will index it.
                </p>
              </Panel>
            )}
            {(cases.data ?? []).map((c) => (
              <Panel key={c.id} innerClassName="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-medium tracking-tight text-ink">
                      {c.title}
                    </h2>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                      {c.practice_area} · {c.location || "Location not set"}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Chip tone="brass">{c.stage}</Chip>
                    {c.pro_bono && <Chip>Pro bono</Chip>}
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink/70">{c.status_note}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-black/5 pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">
                    Counsel: {c.lawyers?.name ?? "Not engaged"}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">
                    Next hearing: {formatDate(c.next_hearing_at)}
                  </span>
                  <Link
                    to="/cases/$caseId"
                    params={{ caseId: c.id }}
                    className="ml-auto rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-paper ring-1 ring-ink/40 transition-transform hover:-translate-y-px"
                  >
                    Open command center
                  </Link>
                </div>
              </Panel>
            ))}

            {(requests.data ?? []).length > 0 && (
              <Panel innerClassName="p-6">
                <Eyebrow>Engagement requests</Eyebrow>
                <ul className="mt-3 divide-y divide-black/5">
                  {(requests.data ?? []).map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-3 text-sm">
                      <span className="text-ink">{r.lawyers?.name}</span>
                      <span className="text-ink/50">· {r.cases?.title}</span>
                      <span className="ml-auto">
                        <Chip tone={r.status === "accepted" ? "brand" : "muted"}>{r.status}</Chip>
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          <div className="lg:col-span-4">
            <Panel>
              <Eyebrow>Open a matter</Eyebrow>
              <div className="mt-4 space-y-3">
                <input
                  className={field}
                  placeholder="Title, e.g. Tenancy eviction notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  className={`${field} min-h-24`}
                  placeholder="Describe what happened"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <select
                  className={field}
                  value={practiceArea}
                  onChange={(e) => setPracticeArea(e.target.value)}
                >
                  {PRACTICE_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <input
                  className={field}
                  placeholder="City / bench"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <button
                  onClick={() => setProBono(!proBono)}
                  className="flex w-full items-center justify-between"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    Request pro-bono
                  </span>
                  <span
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${proBono ? "bg-brand" : "bg-ink/15"}`}
                  >
                    <span
                      className={`absolute size-4 rounded-full bg-paper shadow-sm transition-all ${proBono ? "left-4.5" : "left-0.5"}`}
                    />
                  </span>
                </button>
                <button
                  onClick={() => createCase.mutate()}
                  disabled={!title || createCase.isPending}
                  className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-brand/40 transition-transform hover:-translate-y-px disabled:opacity-60"
                >
                  Open matter
                </button>
              </div>
            </Panel>
          </div>
        </div>
      </section>
    </Shell>
  );
}

/* ---------------- lawyer ---------------- */

function LawyerDashboard({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [bench, setBench] = useState("");
  const [years, setYears] = useState(1);
  const [fee, setFee] = useState(100000);
  const [areas, setAreas] = useState<string[]>([]);
  const [proBonoAvailable, setProBonoAvailable] = useState(true);

  const listing = useQuery({
    queryKey: ["my-listing", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const cases = useQuery({
    queryKey: ["lawyer-cases", listing.data?.id],
    enabled: Boolean(listing.data?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("lawyer_id", listing.data!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const requests = useQuery({
    queryKey: ["lawyer-requests", listing.data?.id],
    enabled: Boolean(listing.data?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_requests")
        .select("*, cases(title, practice_area, pro_bono)")
        .eq("lawyer_id", listing.data!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createListing = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lawyers").insert({
        user_id: userId,
        name,
        bench,
        years_experience: years,
        fee_inr: fee,
        practice_areas: areas,
        pro_bono_available: proBonoAvailable,
        bio: "Newly listed on LexBridge.",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile published to the directory.");
      qc.invalidateQueries({ queryKey: ["my-listing", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const respond = useMutation({
    mutationFn: async ({ id, caseId, accept }: { id: string; caseId: string; accept: boolean }) => {
      const { error } = await supabase
        .from("engagement_requests")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", id);
      if (error) throw error;
      if (accept) {
        const { error: caseError } = await supabase
          .from("cases")
          .update({
            lawyer_id: listing.data!.id,
            stage: "Engaged",
            status_note: "Counsel engaged. Preparing filings.",
          })
          .eq("id", caseId);
        if (caseError) throw caseError;
        await supabase.from("case_milestones").insert({
          case_id: caseId,
          title: "Counsel engaged",
          detail: `${listing.data!.name} accepted the matter.`,
          status: "done",
          occurred_on: new Date().toISOString().slice(0, 10),
          position: 1,
        });
      }
    },
    onSuccess: () => {
      toast.success("Request updated.");
      qc.invalidateQueries({ queryKey: ["lawyer-requests", listing.data?.id] });
      qc.invalidateQueries({ queryKey: ["lawyer-cases", listing.data?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field =
    "w-full rounded-lg bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-brand/40";

  if (listing.isLoading) {
    return (
      <Shell>
        <p className="py-24 text-center text-sm text-ink/60">Loading your pipeline…</p>
      </Shell>
    );
  }

  if (!listing.data) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg py-14">
          <Panel>
            <Eyebrow>Publish your counsel profile</Eyebrow>
            <div className="mt-4 space-y-3">
              <input
                className={field}
                placeholder="Adv. name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className={field}
                placeholder="Bench, e.g. High Court, Bombay"
                value={bench}
                onChange={(e) => setBench(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={field}
                  type="number"
                  min={0}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  placeholder="Years"
                />
                <input
                  className={field}
                  type="number"
                  min={0}
                  step={10000}
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  placeholder="Fee (INR)"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRACTICE_AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() =>
                      setAreas((prev) =>
                        prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
                      )
                    }
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 ${
                      areas.includes(a)
                        ? "bg-brand text-paper ring-brand/30"
                        : "bg-ink/5 text-ink/70 ring-black/5"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setProBonoAvailable(!proBonoAvailable)}
                className="flex w-full items-center justify-between"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                  Open to pro-bono matters
                </span>
                <span
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${proBonoAvailable ? "bg-brand" : "bg-ink/15"}`}
                >
                  <span
                    className={`absolute size-4 rounded-full bg-paper shadow-sm transition-all ${proBonoAvailable ? "left-4.5" : "left-0.5"}`}
                  />
                </span>
              </button>
              <button
                onClick={() => createListing.mutate()}
                disabled={!name || !bench || createListing.isPending}
                className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-brand/40 disabled:opacity-60"
              >
                Publish profile
              </button>
            </div>
          </Panel>
        </div>
      </Shell>
    );
  }

  const pending = (requests.data ?? []).filter((r) => r.status === "pending");

  return (
    <Shell>
      <section className="pt-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
              Counsel pipeline
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              {listing.data.name} · {listing.data.bench}
            </p>
          </div>
          <Link
            to="/pro-bono"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand hover:underline"
          >
            Pro-bono board
          </Link>
        </div>

        <Panel className="mb-6">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <Eyebrow>Incoming requests</Eyebrow>
            <span className="font-mono text-[11px] text-mist">{pending.length}</span>
          </div>
          {pending.length === 0 ? (
            <p className="mt-4 text-sm text-ink/60">No pending requests.</p>
          ) : (
            <ul className="mt-2 divide-y divide-black/5">
              {pending.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{r.cases?.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-mist">
                      {r.cases?.practice_area}
                      {r.cases?.pro_bono ? " · pro bono" : ""}
                    </p>
                    {r.message && <p className="mt-1 text-xs text-ink/60">“{r.message}”</p>}
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => respond.mutate({ id: r.id, caseId: r.case_id, accept: false })}
                      className="rounded-lg bg-ink/5 px-3 py-2 text-sm font-medium text-ink/70 ring-1 ring-black/5"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => respond.mutate({ id: r.id, caseId: r.case_id, accept: true })}
                      className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-paper ring-1 ring-brand/40"
                    >
                      Accept
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => {
            const items = (cases.data ?? []).filter((c) => c.stage === stage);
            return (
              <Panel key={stage} innerClassName="p-3">
                <div className="flex items-center justify-between px-1 pb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
                    {stage}
                  </span>
                  <span className="font-mono text-[11px] text-mist">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <Link
                      key={c.id}
                      to="/cases/$caseId"
                      params={{ caseId: c.id }}
                      className="block rounded-lg bg-paper p-3 ring-1 ring-black/5 transition-transform hover:-translate-y-px"
                    >
                      <p className="text-sm font-medium text-ink">{c.title}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-mist">
                        {c.practice_area}
                      </p>
                      <span className="mt-2 inline-block">
                        {c.next_hearing_at ? (
                          <Chip tone="brass">Hearing {formatDate(c.next_hearing_at)}</Chip>
                        ) : (
                          <Chip tone={c.pro_bono ? "brand" : "muted"}>
                            {c.pro_bono ? "No fee" : "No hearing set"}
                          </Chip>
                        )}
                      </span>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <p className="px-1 pb-2 text-xs text-ink/45">Nothing here yet.</p>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}
