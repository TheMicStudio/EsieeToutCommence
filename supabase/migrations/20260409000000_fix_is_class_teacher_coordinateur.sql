-- Fix: is_class_teacher retourne true pour coordinateur et admin
-- Ces rôles ont accès global à toutes les classes sans être dans teacher_classes

CREATE OR REPLACE FUNCTION public.is_class_teacher(p_class_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_classes
    WHERE class_id = p_class_id AND teacher_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE id = auth.uid() AND role IN ('coordinateur', 'admin')
  );
$$;
