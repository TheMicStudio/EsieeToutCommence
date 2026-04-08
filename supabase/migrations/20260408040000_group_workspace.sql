-- ============================================================
-- GROUP WORKSPACE : chat, tableau blanc, supports de cours semaine
-- ============================================================

-- -----------------------------------------------------------
-- TABLE : group_messages
-- -----------------------------------------------------------
CREATE TABLE public.group_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id),
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres lisent messages groupe" ON public.group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.student_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.project_groups pg
      JOIN public.project_weeks pw ON pw.id = pg.week_id
      WHERE pg.id = group_id AND public.is_class_teacher(pw.class_id)
    )
  );

CREATE POLICY "Membres envoient messages" ON public.group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (
        SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.student_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM public.project_groups pg
        JOIN public.project_weeks pw ON pw.id = pg.week_id
        WHERE pg.id = group_id AND public.is_class_teacher(pw.class_id)
      )
    )
  );

-- -----------------------------------------------------------
-- TABLE : group_whiteboard
-- -----------------------------------------------------------
CREATE TABLE public.group_whiteboard (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL UNIQUE REFERENCES public.project_groups(id) ON DELETE CASCADE,
  data        JSONB,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id)
);
ALTER TABLE public.group_whiteboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres lisent whiteboard" ON public.group_whiteboard
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.student_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.project_groups pg
      JOIN public.project_weeks pw ON pw.id = pg.week_id
      WHERE pg.id = group_id AND public.is_class_teacher(pw.class_id)
    )
  );

CREATE POLICY "Membres écrivent whiteboard" ON public.group_whiteboard
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.student_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.project_groups pg
      JOIN public.project_weeks pw ON pw.id = pg.week_id
      WHERE pg.id = group_id AND public.is_class_teacher(pw.class_id)
    )
  );

CREATE POLICY "Membres mettent à jour whiteboard" ON public.group_whiteboard
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.student_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.project_groups pg
      JOIN public.project_weeks pw ON pw.id = pg.week_id
      WHERE pg.id = group_id AND public.is_class_teacher(pw.class_id)
    )
  );

-- -----------------------------------------------------------
-- TABLE : week_course_materials
-- -----------------------------------------------------------
CREATE TABLE public.week_course_materials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id     UUID NOT NULL REFERENCES public.project_weeks(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  titre       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'lien')),
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.week_course_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres lisent supports semaine" ON public.week_course_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND (
        public.is_class_member(pw.class_id) OR public.is_class_teacher(pw.class_id)
      )
    )
  );

CREATE POLICY "Prof ajoute support semaine" ON public.week_course_materials
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND public.is_class_teacher(pw.class_id)
    )
  );

CREATE POLICY "Prof supprime support semaine" ON public.week_course_materials
  FOR DELETE USING (
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM public.project_weeks pw
      WHERE pw.id = week_id AND public.is_class_teacher(pw.class_id)
    )
  );

-- -----------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
