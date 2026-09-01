import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/lex/Shell";
import { Panel, Eyebrow } from "@/components/lex/Panel";
import { useSession, type AccountType } from "@/lib/session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · LexBridge" },
      {
        name: "description",
        content:
          "Sign in or create a LexBridge account as a client or as counsel to open your docket.",
      },
      { property: "og:title", content: "Sign in · LexBridge" },
      { property: "og:description", content: "Open your LexBridge docket as a client or counsel." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [accountType, setAccountType] = useState<AccountType>("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, account_type: accountType },
          },
        });
        if (error) throw error;
        toast.success("Account created. Opening your docket.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 transition-colors focus:ring-brand/40";

  return (
    <Shell>
      <div className="mx-auto max-w-md py-16">
        <Panel>
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <Eyebrow>{mode === "signup" ? "Open an account" : "Return to your docket"}</Eyebrow>
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-[11px] font-medium text-brand hover:underline"
            >
              {mode === "signup" ? "I already have one" : "Create one"}
            </button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["client", "lawyer"] as AccountType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ring-1 transition-colors ${
                          accountType === type
                            ? "bg-brand text-paper ring-brand/40"
                            : "bg-ink/5 text-ink/70 ring-black/5"
                        }`}
                      >
                        {type === "client" ? "Client" : "Counsel"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    Full name
                  </label>
                  <input
                    className={field}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ayush Rathore"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                Email
              </label>
              <input
                className={field}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                Password
              </label>
              <input
                className={field}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button
              disabled={busy}
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-brand/40 transition-transform hover:-translate-y-px disabled:opacity-60"
            >
              {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/45">
            Counsel accounts are marked unverified until credentials are reviewed.
          </p>
        </Panel>
      </div>
    </Shell>
  );
}
