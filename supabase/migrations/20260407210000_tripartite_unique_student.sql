-- Ajoute une contrainte UNIQUE sur student_id dans tripartite_chats
-- pour éviter les entrées dupliquées et permettre l'upsert
ALTER TABLE public.tripartite_chats
  ADD CONSTRAINT tripartite_chats_student_id_unique UNIQUE (student_id);
