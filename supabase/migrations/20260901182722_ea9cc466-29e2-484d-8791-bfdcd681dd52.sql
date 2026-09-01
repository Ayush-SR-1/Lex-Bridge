-- roles
CREATE TYPE public.app_role AS ENUM ('client','lawyer','admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  account_type TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, account_type)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.raw_user_meta_data->>'account_type','client'))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, (CASE WHEN COALESCE(NEW.raw_user_meta_data->>'account_type','client') = 'lawyer' THEN 'lawyer' ELSE 'client' END)::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- lawyers directory
CREATE TABLE public.lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  bench TEXT NOT NULL DEFAULT '',
  years_experience INT NOT NULL DEFAULT 0,
  practice_areas TEXT[] NOT NULL DEFAULT '{}',
  success_rate INT NOT NULL DEFAULT 0,
  fee_inr INT NOT NULL DEFAULT 0,
  pro_bono_matters INT NOT NULL DEFAULT 0,
  pro_bono_available BOOLEAN NOT NULL DEFAULT false,
  availability TEXT NOT NULL DEFAULT 'Available',
  response_time TEXT NOT NULL DEFAULT '~2h',
  bio TEXT NOT NULL DEFAULT '',
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lawyers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lawyers TO authenticated;
GRANT ALL ON public.lawyers TO service_role;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public directory" ON public.lawyers FOR SELECT USING (verified = true);
CREATE POLICY "lawyer manages own listing" ON public.lawyers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- cases
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  practice_area TEXT NOT NULL DEFAULT 'Corporate',
  location TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'Intake',
  pro_bono BOOLEAN NOT NULL DEFAULT false,
  next_hearing_at TIMESTAMPTZ,
  next_hearing_venue TEXT,
  status_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_view_case(_case_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cases c
    LEFT JOIN public.lawyers l ON l.id = c.lawyer_id
    WHERE c.id = _case_id
      AND (c.client_id = auth.uid() OR l.user_id = auth.uid()
           OR (c.pro_bono = true AND c.lawyer_id IS NULL))
  )
$$;

CREATE POLICY "client owns case" ON public.cases FOR ALL TO authenticated
  USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
CREATE POLICY "lawyer reads relevant cases" ON public.cases FOR SELECT TO authenticated
  USING (public.can_view_case(id));
CREATE POLICY "lawyer updates assigned or open pro bono" ON public.cases FOR UPDATE TO authenticated
  USING (public.can_view_case(id)) WITH CHECK (public.can_view_case(id));

-- milestones
CREATE TABLE public.case_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'upcoming',
  occurred_on DATE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_milestones TO authenticated;
GRANT ALL ON public.case_milestones TO service_role;
ALTER TABLE public.case_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case parties manage milestones" ON public.case_milestones FOR ALL TO authenticated
  USING (public.can_view_case(case_id)) WITH CHECK (public.can_view_case(case_id));

-- documents
CREATE TABLE public.case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'PDF',
  status TEXT NOT NULL DEFAULT 'pending',
  due_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_documents TO authenticated;
GRANT ALL ON public.case_documents TO service_role;
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case parties manage documents" ON public.case_documents FOR ALL TO authenticated
  USING (public.can_view_case(case_id)) WITH CHECK (public.can_view_case(case_id));

-- engagement requests
CREATE TABLE public.engagement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engagement_requests TO authenticated;
GRANT ALL ON public.engagement_requests TO service_role;
ALTER TABLE public.engagement_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client manages own requests" ON public.engagement_requests FOR ALL TO authenticated
  USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
CREATE POLICY "lawyer reads own requests" ON public.engagement_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lawyers l WHERE l.id = lawyer_id AND l.user_id = auth.uid()));
CREATE POLICY "lawyer responds to own requests" ON public.engagement_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lawyers l WHERE l.id = lawyer_id AND l.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.lawyers l WHERE l.id = lawyer_id AND l.user_id = auth.uid()));

-- seed directory
INSERT INTO public.lawyers (name, bench, years_experience, practice_areas, success_rate, fee_inr, pro_bono_matters, pro_bono_available, availability, response_time, bio) VALUES
('Adv. Meera Nair','Supreme Court, New Delhi',21,ARRAY['Corporate','IP'],82,500000,4,false,'Available','~2h','Two decades of commercial litigation and cross-border IP disputes.'),
('Adv. R. Kulkarni','High Court, Bombay',14,ARRAY['Family','Matrimonial'],76,300000,2,false,'In court · free after 6pm','~5h','Family and matrimonial matters with a mediation-first approach.'),
('Adv. S. Banerjee','Supreme Court, New Delhi',9,ARRAY['Tax','GST'],88,250000,6,true,'Pro-bono slot open','~1h','Indirect tax and GST appeals for SMEs and individuals.'),
('Adv. Aarti Deshmukh','High Court, Delhi',11,ARRAY['Criminal'],71,220000,5,true,'Available','~3h','Criminal defence and bail matters, including legal-aid referrals.'),
('Adv. Vikram Sethi','District Court, Pune',7,ARRAY['Property','Tenancy'],69,90000,3,true,'Available','~4h','Property titles, tenancy disputes and society conveyance.'),
('Adv. Nusrat Ali','High Court, Kolkata',16,ARRAY['Labour','Employment'],80,180000,7,true,'Available','~2h','Workplace disputes, wrongful termination and union matters.'),
('Adv. Karthik Iyer','High Court, Madras',5,ARRAY['Consumer','Family'],64,60000,9,true,'Building experience','~6h','Early-career advocate taking supervised and pro-bono matters.'),
('Adv. Priya Rathore','Supreme Court, New Delhi',18,ARRAY['Constitutional','Public Interest'],85,450000,12,true,'Limited capacity','~8h','Constitutional and PIL practice with a strong access-to-justice record.'),
('Adv. Devansh Gupta','High Court, Bombay',12,ARRAY['Corporate','Tax'],78,350000,1,false,'Available','~3h','M&A advisory, shareholder disputes and corporate tax litigation.');