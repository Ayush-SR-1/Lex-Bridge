import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/lex/Shell";
import { Panel, Eyebrow, Chip } from "@/components/lex/Panel";
import { CaseRoom } from "@/components/lex/CaseRoom";
import { formatDate, useSession } from "@/lib/session";

export const Route = createFileRoute("/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case command center · LexBridge" },
      {
        name: "description",
        content:
          "One timeline for a matter: milestones, next hearing, counsel and the document vault checklist.",
      },
      { property: "og:title", content: "Case command center · LexBridge" },
      {
        property: "og:description",
        content: "Milestones, hearings and documents for a single matter.",
      },
    ],
  }),
  component: CasePage,
});

function CasePage() {
  const { caseId } = Route.useParams();
  const { session } = useSession();
  const qc = useQueryClient();
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDetail, setMilestoneDetail] = useState("");
  const [docName, setDocName] = useState("");
  const [hearingAt, setHearingAt] = useState("");
  const [hearingVenue, setHearingVenue] = useState("");

  const matter = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*, lawyers(id, name, bench, user_id)")
        .eq("id", caseId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const milestones = useQuery({
    queryKey: ["case-milestones", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_milestones")
        .select("*")
        .eq("case_id", caseId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const documents = useQuery({
    queryKey: ["case-documents", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_documents")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["case", caseId] });
    qc.invalidateQueries({ queryKey: ["case-milestones", caseId] });
    qc.invalidateQueries({ queryKey: ["case-documents", caseId] });
  };

  const addMilestone = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("case_milestones").insert({
        case_id: caseId,
        title: milestoneTitle,
        detail: milestoneDetail,
        status: "done",
        occurred_on: new Date().toISOString().slice(0, 10),
        position: (milestones.data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMilestoneTitle("");
      setMilestoneDetail("");
      toast.success("Milestone recorded.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMilestone = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("case_milestones")
        .update({ status: status === "done" ? "upcoming" : "done" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const addDocument = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("case_documents")
        .insert({ case_id: caseId, name: docName });
      if (error) throw error;
    },
    onSuccess: () => {
      setDocName("");
      toast.success("Added to the vault checklist.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleDocument = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("case_documents")
        .update({ status: status === "received" ? "pending" : "received" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const setHearing = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("cases")
        .update({
          next_hearing_at: new Date(hearingAt).toISOString(),
          next_hearing_venue: hearingVenue,
          stage: "In court",
          status_note: "Hearing listed. Prepare filings before the date.",
        })
        .eq("id", caseId);
      if (error) throw error;
      await supabase.from("case_milestones").insert({
        case_id: caseId,
        title: "Hearing listed",
        detail: hearingVenue,
        status: "upcoming",
        occurred_on: hearingAt.slice(0, 10),
        position: (milestones.data?.length ?? 0) + 2,
      });
    },
    onSuccess: () => {
      toast.success("Hearing listed on the timeline.");
      setHearingAt("");
      setHearingVenue("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field =
    "w-full rounded-lg bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-brand/40";

  if (matter.isLoading) {
    return (
      <Shell>
        <p className="py-24 text-center text-sm text-ink/60">Opening the docket…</p>
      </Shell>
    );
  }

  if (!matter.data) {
    return (
      <Shell>
        <div className="py-24 text-center">
          <p className="text-sm text-ink/60">
            This matter isn't available to you, or it no longer exists.
          </p>
          <Link to="/dashboard" className="mt-3 inline-block text-sm font-medium text-brand">
            Back to your docket
          </Link>
        </div>
      </Shell>
    );
  }

  const c = matter.data;
  const canEdit = Boolean(session);

  return (
    <Shell>
      <section className="pt-12">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>Case command center</Eyebrow>
            <h1 className="mt-2 text-balance font-display text-3xl font-medium tracking-tight text-ink">
              {c.title}
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
              {c.practice_area} · {c.location || "Location not set"} ·{" "}
              {c.lawyers?.name ?? "Counsel not engaged"}
            </p>
          </div>
          <div className="flex gap-1.5">
            <Chip tone="brass">{c.stage}</Chip>
            {c.pro_bono && <Chip>Pro bono</Chip>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Panel innerClassName="p-6">
              <Eyebrow>Timeline — the single source of truth</Eyebrow>
              <ol className="mt-5 space-y-0">
                {(milestones.data ?? []).map((m, i, arr) => (
                  <li key={m.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < arr.length - 1 && (
                      <span className="absolute left-[7px] top-4 h-full w-px bg-ink/12" />
                    )}
                    <button
                      onClick={() => canEdit && toggleMilestone.mutate({ id: m.id, status: m.status })}
                      className={`lex-node relative z-10 mt-1 size-3.5 shrink-0 rounded-full ring-4 ring-paper ${
                        m.status === "done" ? "bg-brand" : "bg-ink/25"
                      }`}
                      aria-label="Toggle milestone status"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{m.title}</p>
                      {m.detail && <p className="mt-0.5 text-xs text-ink/60">{m.detail}</p>}
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                        {m.status === "done" ? "Completed" : "Upcoming"} ·{" "}
                        {formatDate(m.occurred_on)}
                      </p>
                    </div>
                  </li>
                ))}
                {(milestones.data ?? []).length === 0 && (
                  <p className="text-sm text-ink/60">No milestones recorded yet.</p>
                )}
              </ol>

              {canEdit && (
                <div className="mt-6 grid gap-3 border-t border-black/5 pt-5 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    className={field}
                    placeholder="Milestone, e.g. Notice replied"
                    value={milestoneTitle}
                    onChange={(e) => setMilestoneTitle(e.target.value)}
                  />
                  <input
                    className={field}
                    placeholder="Detail"
                    value={milestoneDetail}
                    onChange={(e) => setMilestoneDetail(e.target.value)}
                  />
                  <button
                    onClick={() => addMilestone.mutate()}
                    disabled={!milestoneTitle || addMilestone.isPending}
                    className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-ink/40 disabled:opacity-60"
                  >
                    Record
                  </button>
                </div>
              )}
            </Panel>

            <Panel innerClassName="p-6">
              <Eyebrow>Document vault</Eyebrow>
              <ul className="mt-4 divide-y divide-black/5">
                {(documents.data ?? []).map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <button
                      onClick={() => canEdit && toggleDocument.mutate({ id: d.id, status: d.status })}
                      className={`size-4 shrink-0 rounded-[5px] ring-1 transition-colors ${
                        d.status === "received" ? "bg-brand ring-brand/40" : "bg-ink/5 ring-black/10"
                      }`}
                      aria-label="Toggle document status"
                    />
                    <span className="text-sm text-ink">{d.name}</span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                      {d.kind} · {d.status}
                      {d.due_on ? ` · due ${formatDate(d.due_on)}` : ""}
                    </span>
                  </li>
                ))}
                {(documents.data ?? []).length === 0 && (
                  <p className="py-2 text-sm text-ink/60">Nothing filed yet.</p>
                )}
              </ul>
              {canEdit && (
                <div className="mt-4 flex gap-3 border-t border-black/5 pt-4">
                  <input
                    className={field}
                    placeholder="Document, e.g. Rent agreement"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                  <button
                    onClick={() => addDocument.mutate()}
                    disabled={!docName || addDocument.isPending}
                    className="shrink-0 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-ink/40 disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              )}
            </Panel>

            <CaseRoom caseId={caseId} />
          </div>

          <div className="space-y-6 lg:col-span-4">
            <Panel>
              <Eyebrow>Next hearing</Eyebrow>
              <p className="mt-3 font-display text-2xl font-medium tracking-tight text-ink">
                {formatDate(c.next_hearing_at)}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                {c.next_hearing_venue || "Venue not listed"}
              </p>
              {canEdit && (
                <div className="mt-4 space-y-3 border-t border-black/5 pt-4">
                  <input
                    className={field}
                    type="datetime-local"
                    value={hearingAt}
                    onChange={(e) => setHearingAt(e.target.value)}
                  />
                  <input
                    className={field}
                    placeholder="Venue / court hall"
                    value={hearingVenue}
                    onChange={(e) => setHearingVenue(e.target.value)}
                  />
                  <button
                    onClick={() => setHearing.mutate()}
                    disabled={!hearingAt || setHearing.isPending}
                    className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-brand/40 disabled:opacity-60"
                  >
                    List hearing
                  </button>
                </div>
              )}
            </Panel>

            <Panel>
              <Eyebrow>Status</Eyebrow>
              <p className="mt-3 text-sm text-ink/70">{c.status_note || "No update recorded."}</p>
              <p className="mt-4 border-t border-black/5 pt-3 text-xs text-ink/60">
                {c.description || "No description provided."}
              </p>
            </Panel>
          </div>
        </div>
      </section>
    </Shell>
  );
}
