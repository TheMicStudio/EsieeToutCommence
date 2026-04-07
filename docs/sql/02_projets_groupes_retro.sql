-- ============================================================
-- HUB ÉCOLE - Migration 02
-- Module 7 : Gestion des Projets, Groupes et Rétro
-- Ref: base.md / backlog.md - US22, US24
-- ============================================================

-- -----------------------------------------------------------
-- TABLE : ProjectWeek — une semaine projet liée à une classe
-- -----------------------------------------------------------
CREATE TABLE public.project_weeks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  cree_par    UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT dates_coherentes CHECK (end_date >= start_date)
);

-- -----------------------------------------------------------
-- TABLE : ProjectGroup — groupe d'élèves dans une semaine projet
-- -----------------------------------------------------------
CREATE TABLE public.project_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id     UUID NOT NULL REFERENCES public.project_weeks(id) ON DELETE CASCADE,
  group_name  TEXT NOT NULL,
  repo_url    TEXT,
  slides_url  TEXT,
  capacite_max INT NOT NULL DEFAULT 4,
  note        NUMERIC(5,2) CHECK (note BETWEEN 0 AND 20),
  feedback_prof TEXT,
  note_par    UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : GroupMember — appartenance d'un élève à un groupe
-- -----------------------------------------------------------
CREATE TABLE public.group_members (
  group_id   UUID REFERENCES public.project_groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, student_id)
);

-- -----------------------------------------------------------
-- TABLE : SoutenanceSlot — créneaux de passage (first come, first served)
-- -----------------------------------------------------------
CREATE TABLE public.soutenance_slots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id    UUID NOT NULL REFERENCES public.project_weeks(id) ON DELETE CASCADE,
  heure_debut TIMESTAMPTZ NOT NULL,
  heure_fin   TIMESTAMPTZ NOT NULL,
  group_id    UUID REFERENCES public.project_groups(id),  -- NULL = disponible
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (week_id, heure_debut)
);

-- -----------------------------------------------------------
-- TABLE : RetroBoard — tableau de rétro lié à une semaine
-- -----------------------------------------------------------
CREATE TABLE public.retro_boards (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id   UUID NOT NULL UNIQUE REFERENCES public.project_weeks(id) ON DELETE CASCADE,
  is_open   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : RetroPostit — post-its du mur de rétro
-- -----------------------------------------------------------
CREATE TABLE public.retro_postits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id     UUID NOT NULL REFERENCES public.retro_boards(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('POSITIVE', 'NEGATIVE', 'IDEA')),
  content      TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  author_id    UUID NOT NULL REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- RLS
-- -----------------------------------------------------------
ALTER TABLE public.project_weeks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soutenance_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retro_boards    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retro_postits   ENABLE ROW LEVEL SECURITY;

-- project_weeks : visibles par les membres de la classe
CREATE POLICY "Semaines visibles par la classe" ON public.project_weeks
  FOR SELECT USING (
    public.is_class_member(class_id) OR public.is_class_teacher(class_id)
  );

-- project_weeks : création par les profs de la classe
CREATE POLICY "Prof crée une semaine projet" ON public.project_weeks
  FOR INSERT WITH CHECK (
    public.is_class_teacher(class_id) AND auth.uid() = cree_par
  );

-- project_weeks : modification par le créateur
CREATE POLICY "Créateur modifie la semaine" ON public.project_weeks
  FOR UPDATE USING (auth.uid() = cree_par);

-- project_groups : visibles par les membres de la classe de la semaine
CREATE POLICY "Groupes visibles par la classe" ON public.project_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id
      AND (public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id))
    )
  );

-- project_groups : création par les élèves (auto-organisation)
CREATE POLICY "Eleve crée un groupe" ON public.project_groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND public.is_class_member(pw.class_id)
    )
  );

-- project_groups : mise à jour repo/slides par les membres du groupe
CREATE POLICY "Membres mettent à jour les liens" ON public.project_groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = id AND gm.student_id = auth.uid()
    )
  );

-- project_groups : notation réservée aux profs
CREATE POLICY "Prof note un groupe" ON public.project_groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND public.is_class_teacher(pw.class_id)
    )
  );

-- group_members : visibles par la classe
CREATE POLICY "Membres visibles" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_groups pg
      JOIN public.project_weeks pw ON pw.id = pg.week_id
      WHERE pg.id = group_id
      AND (public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id))
    )
  );

-- group_members : un élève rejoint un groupe si capacité non atteinte
CREATE POLICY "Rejoindre un groupe" ON public.group_members
  FOR INSERT WITH CHECK (
    auth.uid() = student_id AND
    -- Vérifier que la capacité max n'est pas atteinte
    (
      SELECT COUNT(*) FROM public.group_members gm WHERE gm.group_id = group_id
    ) < (
      SELECT pg.capacite_max FROM public.project_groups pg WHERE pg.id = group_id
    ) AND
    -- L'élève ne doit pas être dans un autre groupe de la même semaine
    NOT EXISTS (
      SELECT 1 FROM public.group_members gm2
      JOIN public.project_groups pg2 ON pg2.id = gm2.group_id
      JOIN public.project_groups pg3 ON pg3.id = group_id
      WHERE gm2.student_id = auth.uid() AND pg2.week_id = pg3.week_id
    )
  );

-- group_members : un élève peut quitter son groupe
CREATE POLICY "Quitter un groupe" ON public.group_members
  FOR DELETE USING (auth.uid() = student_id);

-- soutenance_slots : visibles par la classe
CREATE POLICY "Créneaux visibles" ON public.soutenance_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id
      AND (public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id))
    )
  );

-- soutenance_slots : création par les profs
CREATE POLICY "Prof crée les créneaux" ON public.soutenance_slots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND public.is_class_teacher(pw.class_id)
    )
  );

-- soutenance_slots : réservation par un groupe (first come, first served)
CREATE POLICY "Groupe réserve un créneau" ON public.soutenance_slots
  FOR UPDATE USING (
    group_id IS NULL AND  -- Créneau encore libre
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = soutenance_slots.group_id AND gm.student_id = auth.uid()
    )
  );

-- retro_boards : visibles par la classe
CREATE POLICY "RetroBoard visible par la classe" ON public.retro_boards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id
      AND (public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id))
    )
  );

-- retro_boards : ouverture/fermeture par les profs uniquement
CREATE POLICY "Prof ouvre/ferme le retro" ON public.retro_boards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND public.is_class_teacher(pw.class_id)
    )
  );

-- retro_postits : SELECT autorisé pour tous les élèves de la classe
CREATE POLICY "Post-its visibles par la classe" ON public.retro_postits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.retro_boards rb
      JOIN public.project_weeks pw ON pw.id = rb.week_id
      WHERE rb.id = board_id
      AND (public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id))
    )
  );

-- retro_postits : INSERT autorisé pour les élèves si le board est ouvert
CREATE POLICY "Eleve ajoute un post-it" ON public.retro_postits
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.retro_boards rb
      JOIN public.project_weeks pw ON pw.id = rb.week_id
      WHERE rb.id = board_id
        AND rb.is_open = TRUE
        AND public.is_class_member(pw.class_id)
    )
  );

-- retro_postits : UPDATE/DELETE uniquement par l'auteur
CREATE POLICY "Auteur modifie son post-it" ON public.retro_postits
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Auteur supprime son post-it" ON public.retro_postits
  FOR DELETE USING (auth.uid() = author_id);

-- -----------------------------------------------------------
-- Activer Realtime sur retro_postits (à faire aussi dans le dashboard)
-- -----------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.retro_postits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.soutenance_slots;
