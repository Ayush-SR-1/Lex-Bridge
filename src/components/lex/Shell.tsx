import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession, accountTypeOf } from "@/lib/session";

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/70 transition-colors hover:text-ink"
      activeProps={{ className: "text-ink" }}
    >
      {children}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const navigate = useNavigate();
  const isLawyer = accountTypeOf(session) === "lawyer";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-24 size-[520px] rounded-full bg-brand2/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 size-[460px] rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 size-[420px] rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-paper via-paper to-secondary" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-black/5 bg-paper/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-brand text-paper ring-1 ring-brand/30">
                <span className="font-display text-lg font-semibold leading-none">L</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-[17px] font-semibold tracking-tight">
                  LexBridge
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
                  Docket · 2026
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 md:flex">
              <NavLink to="/lawyers">Discover</NavLink>
              <NavLink to="/triage">Triage</NavLink>
              <NavLink to="/dashboard">{isLawyer ? "Pipeline" : "My cases"}</NavLink>
              <NavLink to="/pro-bono">Pro bono</NavLink>
            </nav>

            <div className="flex items-center gap-2">
              {session ? (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink/70 ring-1 ring-black/5 transition-transform hover:-translate-y-px"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink/70 ring-1 ring-black/5 transition-transform hover:-translate-y-px"
                >
                  Sign in
                </Link>
              )}
              <Link
                to={session ? "/dashboard" : "/auth"}
                className="rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-paper ring-1 ring-brand/40 transition-transform hover:-translate-y-px"
              >
                {session ? "Open docket" : "Start a matter"}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-6 pb-24">{children}</main>

        <footer className="border-t border-black/5 bg-paper/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-display text-sm font-medium text-ink">
              LexBridge — the standing docket.
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
              LexBridge facilitates access and workflow · lawyers provide legal advice
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
