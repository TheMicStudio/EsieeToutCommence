-- ============================================================
-- HUB ÉCOLE — Migration 036
-- teacher_classes devient une table dérivée de subject_requirements
--
-- Contexte : l'affectation prof→classe n'a plus qu'un seul endroit
-- de saisie : Planning > Matières (subject_requirements).
-- teacher_classes est maintenu automatiquement par trigger pour
-- ne pas casser les 35+ policies RLS qui dépendent de is_class_teacher().
-- ============================================================

-- ─── Fonction trigger ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_teacher_classes_from_requirements()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.teacher_classes (class_id, teacher_id, matiere)
    VALUES (NEW.class_id, NEW.teacher_id, NEW.subject_name)
    ON CONFLICT (class_id, teacher_id, matiere) DO NOTHING;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    DELETE FROM public.teacher_classes
    WHERE class_id  = OLD.class_id
      AND teacher_id = OLD.teacher_id
      AND matiere    = OLD.subject_name;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- ─── Triggers ────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_teacher_classes_on_req_insert ON public.subject_requirements;
CREATE TRIGGER trg_teacher_classes_on_req_insert
AFTER INSERT ON public.subject_requirements
FOR EACH ROW EXECUTE FUNCTION public.sync_teacher_classes_from_requirements();

DROP TRIGGER IF EXISTS trg_teacher_classes_on_req_delete ON public.subject_requirements;
CREATE TRIGGER trg_teacher_classes_on_req_delete
AFTER DELETE ON public.subject_requirements
FOR EACH ROW EXECUTE FUNCTION public.sync_teacher_classes_from_requirements();

-- ─── Sync données existantes ──────────────────────────────────
-- Crée les entrées teacher_classes manquantes depuis subject_requirements

INSERT INTO public.teacher_classes (class_id, teacher_id, matiere)
SELECT DISTINCT class_id, teacher_id, subject_name
FROM public.subject_requirements
ON CONFLICT (class_id, teacher_id, matiere) DO NOTHING;

-- Supprime les teacher_classes orphelins (sans subject_requirement correspondant)
-- Ces entrées avaient été créées via l'ancien panneau Admin > Classes

DELETE FROM public.teacher_classes tc
WHERE NOT EXISTS (
  SELECT 1 FROM public.subject_requirements sr
  WHERE sr.class_id   = tc.class_id
    AND sr.teacher_id = tc.teacher_id
    AND sr.subject_name = tc.matiere
);
