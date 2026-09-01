CREATE TABLE public.case_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name text NOT NULL DEFAULT '',
  sender_role text NOT NULL DEFAULT 'client',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_messages TO authenticated;
GRANT ALL ON public.case_messages TO service_role;

ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case parties read messages" ON public.case_messages
  FOR SELECT TO authenticated USING (public.can_view_case(case_id));

CREATE POLICY "case parties send messages" ON public.case_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.can_view_case(case_id) AND sender_id = auth.uid());

CREATE POLICY "sender edits own message" ON public.case_messages
  FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

CREATE POLICY "sender deletes own message" ON public.case_messages
  FOR DELETE TO authenticated USING (sender_id = auth.uid());

CREATE INDEX case_messages_case_id_created_at_idx ON public.case_messages (case_id, created_at);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_case_messages_updated_at
  BEFORE UPDATE ON public.case_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();