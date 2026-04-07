-- ============================================================
-- HUB ÉCOLE — Migration 003
-- Module 3 : Carrière & Alternance
-- Ref: docs/features/03_module_carriere_alternance.md
-- ============================================================

-- TABLE : job_offers
CREATE TABLE public.job_offers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre            TEXT NOT NULL,
  entreprise       TEXT NOT NULL,
  description      TEXT,
  type_contrat     TEXT NOT NULL CHECK (type_contrat IN ('stage', 'alternance', 'cdi', 'cdd')),
  localisation     TEXT,
  lien_candidature TEXT,
  publie_par       UUID NOT NULL REFERENCES auth.users(id),
  actif            BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : career_events
CREATE TABLE public.career_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       TEXT NOT NULL,
  description TEXT,
  lieu        TEXT,
  date_debut  TIMESTAMPTZ NOT NULL,
  date_fin    TIMESTAMPTZ,
  publie_par  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : event_registrations
CREATE TABLE public.event_registrations (
  event_id   UUID REFERENCES public.career_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, student_id)
);

-- TABLE : tripartite_chats
CREATE TABLE public.tripartite_chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES auth.users(id),
  referent_id UUID NOT NULL REFERENCES auth.users(id),
  maitre_id   UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : tripartite_messages
CREATE TABLE public.tripartite_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID NOT NULL REFERENCES public.tripartite_chats(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id),
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : apprenticeship_entries
CREATE TABLE public.apprenticeship_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES auth.users(id),
  chat_id     UUID NOT NULL REFERENCES public.tripartite_chats(id),
  titre       TEXT NOT NULL,
  description TEXT,
  fichier_url TEXT NOT NULL,
  statut      TEXT NOT NULL DEFAULT 'soumis'
                CHECK (statut IN ('soumis', 'en_revision', 'valide', 'refuse')),
  note        NUMERIC(5,2) CHECK (note BETWEEN 0 AND 20),
  valide_par  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.job_offers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tripartite_chats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tripartite_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprenticeship_entries ENABLE ROW LEVEL SECURITY;

-- job_offers
CREATE POLICY "Offres visibles connectes" ON public.job_offers
  FOR SELECT USING (auth.uid() IS NOT NULL AND actif = TRUE);

CREATE POLICY "Admin publie offres" ON public.job_offers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admin gere ses offres" ON public.job_offers
  FOR UPDATE USING (auth.uid() = publie_par);

-- career_events
CREATE POLICY "Events visibles connectes" ON public.career_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin publie events" ON public.career_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- event_registrations
CREATE POLICY "Inscription propre" ON public.event_registrations
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Admin voit inscriptions" ON public.event_registrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- tripartite_chats
CREATE POLICY "Acces tripartite participants" ON public.tripartite_chats
  FOR SELECT USING (
    auth.uid() IN (student_id, referent_id, maitre_id)
  );

CREATE POLICY "Admin cree chat tripartite" ON public.tripartite_chats
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- tripartite_messages
CREATE POLICY "Messages tripartite participants" ON public.tripartite_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tripartite_chats tc
      WHERE tc.id = chat_id
      AND auth.uid() IN (tc.student_id, tc.referent_id, tc.maitre_id)
    )
  );

CREATE POLICY "Envoi message tripartite" ON public.tripartite_messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND EXISTS (
      SELECT 1 FROM public.tripartite_chats tc
      WHERE tc.id = chat_id
      AND auth.uid() IN (tc.student_id, tc.referent_id, tc.maitre_id)
    )
  );

-- apprenticeship_entries
CREATE POLICY "Lecture livret participants" ON public.apprenticeship_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tripartite_chats tc
      WHERE tc.id = chat_id
      AND auth.uid() IN (tc.student_id, tc.referent_id, tc.maitre_id)
    )
  );

CREATE POLICY "Upload livret eleve" ON public.apprenticeship_entries
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Validation livret referent maitre" ON public.apprenticeship_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tripartite_chats tc
      WHERE tc.id = chat_id
      AND auth.uid() IN (tc.referent_id, tc.maitre_id)
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_entry_updated_at
  BEFORE UPDATE ON public.apprenticeship_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bucket Storage apprenticeship-files (policy via Supabase dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('apprenticeship-files', 'apprenticeship-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Upload eleve" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'apprenticeship-files' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Lecture signataires" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'apprenticeship-files' AND auth.uid() IS NOT NULL
  );
