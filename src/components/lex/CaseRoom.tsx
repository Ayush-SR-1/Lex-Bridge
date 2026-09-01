import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, Eyebrow } from "@/components/lex/Panel";
import { accountTypeOf, useSession } from "@/lib/session";

export function CaseRoom({ caseId }: { caseId: string }) {
  const { session, user } = useSession();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const messages = useQuery({
    queryKey: ["case-messages", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_messages")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 8000,
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to post to the case room.");
      const meta = user.user_metadata as { full_name?: string } | undefined;
      const { error } = await supabase.from("case_messages").insert({
        case_id: caseId,
        sender_id: user.id,
        sender_name: meta?.full_name || user.email?.split("@")[0] || "Participant",
        sender_role: accountTypeOf(session),
        body,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["case-messages", caseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Panel innerClassName="p-6">
      <div className="flex items-center justify-between">
        <Eyebrow>Case room — privileged thread</Eyebrow>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
          {(messages.data ?? []).length} notes
        </span>
      </div>

      <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
        {(messages.data ?? []).map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ring-1 ${
                mine ? "ml-auto bg-brand/10 ring-brand/20" : "bg-ink/5 ring-black/5"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                {m.sender_name} · {m.sender_role} ·{" "}
                {new Date(m.created_at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{m.body}</p>
            </div>
          );
        })}
        {(messages.data ?? []).length === 0 && (
          <p className="text-sm text-ink/60">
            No notes yet. Client and counsel can talk here — everything stays attached to the matter.
          </p>
        )}
      </div>

      {session && (
        <div className="mt-4 flex gap-3 border-t border-black/5 pt-4">
          <input
            className="w-full rounded-lg bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-brand/40"
            placeholder="Write a note to the other side of this matter…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && body.trim()) send.mutate();
            }}
          />
          <button
            onClick={() => send.mutate()}
            disabled={!body.trim() || send.isPending}
            className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-brand/40 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      )}
    </Panel>
  );
}
