-- ============================================================
-- HUB ÉCOLE — Migration 002
-- Module 2 : Pédagogie & Espace Classe
-- Ref: docs/features/02_module_pedagogie_classe.md — US24, US25
-- ============================================================

-- TABLE : classes
CREATE TABLE public.classes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom        TEXT NOT NULL,
  annee      INT  NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : class_members — élève <-> classe
CREATE TABLE public.class_members (
  class_id   UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);

-- TABLE : teacher_classes — prof <-> classe
CREATE TABLE public.teacher_classes (
  class_id   UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  matiere    TEXT NOT NULL,
  PRIMARY KEY (class_id, teacher_id, matiere)
);

-- TABLE : course_materials
CREATE TABLE public.course_materials (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id),
  titre      TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'lien')),
  url        TEXT NOT NULL,
  matiere    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : grades
CREATE TABLE public.grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES auth.users(id),
  class_id    UUID NOT NULL REFERENCES public.classes(id),
  matiere     TEXT NOT NULL,
  examen      TEXT NOT NULL,
  note        NUMERIC(5,2) NOT NULL CHECK (note BETWEEN 0 AND 20),
  coefficient NUMERIC(3,1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : class_channels
CREATE TABLE public.class_channels (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  nom        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : class_messages
CREATE TABLE public.class_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.class_channels(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id),
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.classes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_channels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_messages   ENABLE ROW LEVEL SECURITY;

-- Helpers RLS (utilisés aussi par le Module 7)
CREATE OR REPLACE FUNCTION public.is_class_member(p_class_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = p_class_id AND student_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_class_teacher(p_class_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_classes
    WHERE class_id = p_class_id AND teacher_id = auth.uid()
  );
$$;

-- Policies : classes
CREATE POLICY "Classe visible membres et profs" ON public.classes
  FOR SELECT USING (
    public.is_class_member(id) OR public.is_class_teacher(id)
  );

-- Policies : class_members
CREATE POLICY "Membres visibles dans sa classe" ON public.class_members
  FOR SELECT USING (
    public.is_class_member(class_id) OR public.is_class_teacher(class_id)
  );

-- Policies : teacher_classes
CREATE POLICY "Profs visibles dans sa classe" ON public.teacher_classes
  FOR SELECT USING (
    public.is_class_member(class_id) OR public.is_class_teacher(class_id)
  );

-- Policies : course_materials
CREATE POLICY "Cours visible classe" ON public.course_materials
  FOR SELECT USING (
    public.is_class_member(class_id) OR public.is_class_teacher(class_id)
  );

CREATE POLICY "Ajout cours par prof" ON public.course_materials
  FOR INSERT WITH CHECK (
    public.is_class_teacher(class_id) AND auth.uid() = teacher_id
  );

CREATE POLICY "Suppression cours par prof" ON public.course_materials
  FOR DELETE USING (auth.uid() = teacher_id);

-- Policies : grades
CREATE POLICY "Eleve voit ses notes" ON public.grades
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Prof gere notes de sa classe" ON public.grades
  FOR ALL USING (auth.uid() = teacher_id);

-- Policies : class_channels
CREATE POLICY "Canaux visibles classe" ON public.class_channels
  FOR SELECT USING (
    public.is_class_member(class_id) OR public.is_class_teacher(class_id)
  );

-- Policies : class_messages
CREATE POLICY "Messages visibles classe" ON public.class_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_channels cc
      WHERE cc.id = channel_id
      AND (public.is_class_member(cc.class_id) OR public.is_class_teacher(cc.class_id))
    )
  );

CREATE POLICY "Envoi message membres et profs" ON public.class_messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND EXISTS (
      SELECT 1 FROM public.class_channels cc
      WHERE cc.id = channel_id
      AND (public.is_class_member(cc.class_id) OR public.is_class_teacher(cc.class_id))
    )
  );

-- Trigger : crée 2 canaux par défaut à la création d'une classe
CREATE OR REPLACE FUNCTION public.create_default_channels()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.class_channels (class_id, nom) VALUES
    (NEW.id, 'Général'),
    (NEW.id, 'Entraide élèves');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_default_channels
  AFTER INSERT ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.create_default_channels();
