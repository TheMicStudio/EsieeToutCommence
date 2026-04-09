-- Fix : les dates de teacher_week_availabilities ont été stockées avec un décalage
-- de fuseau horaire (minuit heure locale → veille en UTC).
-- Ex : semaine du lundi 1er sept 2025 stockée comme "2025-08-31" au lieu de "2025-09-01".
-- On corrige en décalant d'un jour toutes les dates qui ne tombent pas un lundi.

UPDATE teacher_week_availabilities
SET week_start = week_start + INTERVAL '1 day'
WHERE EXTRACT(DOW FROM week_start) != 1; -- 1 = lundi en PostgreSQL (0=dim, 1=lun)
