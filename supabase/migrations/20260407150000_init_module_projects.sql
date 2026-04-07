-- ============================================================
-- MODULE 07 — Projets, Groupes & Rétro
-- ============================================================

-- -----------------------------------------------------------
-- TABLE : project_weeks
-- -----------------------------------------------------------
CREATE TABLE public.project_weeks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  class_id   UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  cree_par   UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : project_groups
-- -----------------------------------------------------------
CREATE TABLE public.project_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id       UUID NOT NULL REFERENCES public.project_weeks(id) ON DELETE CASCADE,
  group_name    TEXT NOT NULL,
  repo_url      TEXT,
  slides_url    TEXT,
  capacite_max  INT NOT NULL DEFAULT 4,
  note          NUMERIC(4,2),
  feedback_prof TEXT,
  note_par      UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- TABLE : group_members
-- -----------------------------------------------------------
CREATE TABLE public.group_members (
  group_id   UUID NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, student_id)
);

-- -----------------------------------------------------------
-- TABLE : soutenance_slots
-- -----------------------------------------------------------
CREATE TABLE public.soutenance_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id     UUID NOT NULL REFERENCES public.project_weeks(id) ON DELETE CASCADE,
  heure_debut TIMESTAMPTZ NOT NULL,
  heure_fin   TIMESTAMPTZ NOT NULL,
  group_id    UUID REFERENCES public.project_groups(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------
-- TABLE : retro_boards
-- -----------------------------------------------------------
CREATE TABLE public.retro_boards (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL UNIQUE REFERENCES public.project_weeks(id) ON DELETE CASCADE,
  is_open BOOLEAN NOT NULL DEFAULT false
);

-- -----------------------------------------------------------
-- TABLE : retro_postits
-- -----------------------------------------------------------
CREATE TABLE public.retro_postits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id     UUID NOT NULL REFERENCES public.retro_boards(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('POSITIVE', 'NEGATIVE', 'IDEA')),
  content      TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  author_id    UUID NOT NULL REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.retro_postits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.soutenance_slots;

-- -----------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------
ALTER TABLE public.project_weeks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soutenance_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retro_boards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retro_postits    ENABLE ROW LEVEL SECURITY;

-- project_weeks
CREATE POLICY "Voir semaines (membres/profs)" ON public.project_weeks
  FOR SELECT USING (
    public.is_class_member(class_id) OR public.is_class_teacher(class_id)
  );
CREATE POLICY "Prof crée une semaine" ON public.project_weeks
  FOR INSERT WITH CHECK (
    auth.uid() = cree_par AND public.is_class_teacher(class_id)
  );
CREATE POLICY "Créateur modifie" ON public.project_weeks
  FOR UPDATE USING (auth.uid() = cree_par);

-- project_groups
CREATE POLICY "Voir groupes (membres/profs)" ON public.project_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND (
        public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id)
      )
    )
  );
CREATE POLICY "Élève crée un groupe" ON public.project_groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND public.is_class_member(pw.class_id)
    )
  );
CREATE POLICY "Membre ou prof modifie groupe" ON public.project_groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = id AND gm.student_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND public.is_class_teacher(pw.class_id)
    )
  );

-- group_members
CREATE POLICY "Voir membres (membres/profs)" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_groups pg
      JOIN public.project_weeks pw ON pw.id = pg.week_id
      WHERE pg.id = group_id AND (
        public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id)
      )
    )
  );
CREATE POLICY "Élève rejoint" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Élève quitte" ON public.group_members
  FOR DELETE USING (auth.uid() = student_id);

-- soutenance_slots
CREATE POLICY "Voir créneaux (membres/profs)" ON public.soutenance_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND (
        public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id)
      )
    )
  );
CREATE POLICY "Prof crée créneaux" ON public.soutenance_slots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND public.is_class_teacher(pw.class_id)
    )
  );
CREATE POLICY "Groupe réserve créneau libre" ON public.soutenance_slots
  FOR UPDATE USING (group_id IS NULL);

-- retro_boards
CREATE POLICY "Voir boards (membres/profs)" ON public.retro_boards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND (
        public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id)
      )
    )
  );
CREATE POLICY "Prof ouvre/ferme board" ON public.retro_boards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND public.is_class_teacher(pw.class_id)
    )
  );

-- retro_postits
CREATE POLICY "Voir postits (membres/profs)" ON public.retro_postits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.retro_boards rb
      JOIN public.project_weeks pw ON pw.id = rb.week_id
      WHERE rb.id = board_id AND (
        public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id)
      )
    )
  );
CREATE POLICY "Élève ajoute postit si board ouvert" ON public.retro_postits
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.retro_boards rb
      WHERE rb.id = board_id AND rb.is_open = true
    )
  );
CREATE POLICY "Auteur supprime son postit" ON public.retro_postits
  FOR DELETE USING (auth.uid() = author_id);
