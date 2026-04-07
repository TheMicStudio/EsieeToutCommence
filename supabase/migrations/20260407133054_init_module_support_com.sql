-- ============================================================
-- HUB ÉCOLE — Migration 004
-- Module 4 : Support & FAQ + Module 5 : Communication Interne
-- Ref: docs/features/04_module_support_faq.md
--      docs/features/05_module_com_interne.md
-- ============================================================

-- ── MODULE 4 : SUPPORT & FAQ ─────────────────────────────────

CREATE TABLE public.tickets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sujet            TEXT NOT NULL,
  description      TEXT NOT NULL,
  categorie        TEXT NOT NULL CHECK (categorie IN ('pedagogie', 'batiment', 'informatique', 'autre')),
  statut           TEXT NOT NULL DEFAULT 'ouvert'
                     CHECK (statut IN ('ouvert', 'en_cours', 'resolu', 'ferme')),
  auteur_id        UUID NOT NULL REFERENCES auth.users(id),
  au_nom_de_classe BOOLEAN DEFAULT FALSE,
  class_id         UUID,
  assigne_a        UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ticket_messages (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  contenu   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.faq_articles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question         TEXT NOT NULL,
  reponse          TEXT NOT NULL,
  categorie        TEXT NOT NULL CHECK (categorie IN ('pedagogie', 'batiment', 'informatique', 'autre')),
  publie           BOOLEAN DEFAULT TRUE,
  auteur_id        UUID NOT NULL REFERENCES auth.users(id),
  source_ticket_id UUID REFERENCES public.tickets(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RLS tickets
ALTER TABLE public.tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_articles    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voir ses tickets" ON public.tickets
  FOR SELECT USING (auth.uid() = auteur_id);

CREATE POLICY "Admin voit tous les tickets" ON public.tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Creer un ticket" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = auteur_id);

CREATE POLICY "Admin met a jour statut" ON public.tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Lire messages ticket" ON public.ticket_messages
  FOR SELECT USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.auteur_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Repondre a un ticket" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.id = ticket_id AND t.auteur_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "FAQ publique" ON public.faq_articles
  FOR SELECT USING (publie = TRUE);

CREATE POLICY "Admin voit toute la FAQ" ON public.faq_articles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admin gere la FAQ" ON public.faq_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Trigger updated_at tickets
CREATE TRIGGER trigger_ticket_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_faq_updated_at
  BEFORE UPDATE ON public.faq_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── MODULE 5 : COMMUNICATION INTERNE ────────────────────────

CREATE TABLE public.staff_channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL,
  description TEXT,
  cree_par    UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.staff_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.staff_channels(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id),
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper is_staff()
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT (
    EXISTS (SELECT 1 FROM public.teacher_profiles WHERE id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );
$$;

ALTER TABLE public.staff_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff lit les canaux" ON public.staff_channels
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Admin cree les canaux" ON public.staff_channels
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admin supprime les canaux" ON public.staff_channels
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff lit les messages" ON public.staff_messages
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff envoie des messages" ON public.staff_messages
  FOR INSERT WITH CHECK (
    public.is_staff() AND auth.uid() = author_id
  );

CREATE POLICY "Suppression message staff" ON public.staff_messages
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Canaux par défaut
INSERT INTO public.staff_channels (nom, description, cree_par)
SELECT 'Conseil de classe', 'Discussions relatives aux conseils de classe', id
FROM public.admin_profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.staff_channels (nom, description, cree_par)
SELECT 'Infos Direction', 'Informations et annonces de la direction', id
FROM public.admin_profiles LIMIT 1
ON CONFLICT DO NOTHING;
