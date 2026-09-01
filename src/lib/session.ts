import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AccountType = "client" | "lawyer";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function accountTypeOf(session: Session | null): AccountType {
  const meta = session?.user?.user_metadata as { account_type?: string } | undefined;
  return meta?.account_type === "lawyer" ? "lawyer" : "client";
}

export const PRACTICE_AREAS = [
  "Corporate",
  "Family",
  "Tax",
  "IP",
  "Criminal",
  "Property",
  "Labour",
  "Consumer",
  "Constitutional",
] as const;

export function formatFee(inr: number) {
  if (inr >= 10000000) return `₹${(inr / 10000000).toFixed(1)}Cr`;
  if (inr >= 100000) return `₹${(inr / 100000).toFixed(inr % 100000 === 0 ? 0 : 1)}L`;
  if (inr >= 1000) return `₹${Math.round(inr / 1000)}K`;
  return `₹${inr}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
