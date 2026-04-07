'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { AttendanceSession, AttendanceRecord, AttendanceReport } from '../types';

// ── Professeur : créer une session ──────────────────────────
export async function createAttendanceSession(
  classId: string,
  durationMin: number,
): Promise<{ session?: AttendanceSession; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const expiration = new Date(Date.now() + durationMin * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert({ class_id: classId, teacher_id: user.id, expiration })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/dashboard/emargement');
  return { session: data };
}

// ── Professeur : fermer une session ─────────────────────────
export async function closeAttendanceSession(
  sessionId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('attendance_sessions')
    .update({ statut: 'ferme' })
    .eq('id', sessionId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/emargement');
  return {};
}

// ── Valider un code QR ───────────────────────────────────────
export async function getSessionByCode(
  codeUnique: string,
): Promise<AttendanceSession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('attendance_sessions')
    .select()
    .eq('code_unique', codeUnique)
    .eq('statut', 'ouvert')
    .gt('expiration', new Date().toISOString())
    .maybeSingle();
  return data ?? null;
}

// ── Élève : pointer sa présence ──────────────────────────────
export async function checkIn(
  codeUnique: string,
  deviceFingerprint: string,
): Promise<{ success?: boolean; statut?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const session = await getSessionByCode(codeUnique);
  if (!session) return { error: 'Session expirée ou introuvable' };

  const now = new Date();
  const expTime = new Date(session.expiration);
  const openTime = new Date(session.created_at);
  const totalMin = (expTime.getTime() - openTime.getTime()) / 60000;
  const elapsed = (now.getTime() - openTime.getTime()) / 60000;
  const statut_presence = elapsed > totalMin * 0.5 ? 'en_retard' : 'present';

  const { error } = await supabase.from('attendance_records').insert({
    session_id: session.id,
    student_id: user.id,
    device_fingerprint: deviceFingerprint,
    statut_presence,
  });

  if (error) {
    if (error.code === '23505') return { error: 'Déjà pointé pour cette session' };
    return { error: error.message };
  }

  return { success: true, statut: statut_presence };
}

// ── Prof/Admin : liste des présents ─────────────────────────
export async function getSessionRecords(
  sessionId: string,
): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('attendance_records')
    .select()
    .eq('session_id', sessionId)
    .order('heure_pointage');
  return data ?? [];
}

// ── Prof/Admin : liste des absents ──────────────────────────
export async function getAbsentees(
  sessionId: string,
): Promise<{ student_id: string; nom: string; prenom: string }[]> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('class_id')
    .eq('id', sessionId)
    .single();
  if (!session) return [];

  const { data: members } = await supabase
    .from('class_members')
    .select('student_id, student_profiles(nom, prenom)')
    .eq('class_id', session.class_id);
  if (!members) return [];

  const { data: records } = await supabase
    .from('attendance_records')
    .select('student_id')
    .eq('session_id', sessionId);

  const presentIds = new Set((records ?? []).map((r) => r.student_id));

  return members
    .filter((m) => !presentIds.has(m.student_id))
    .map((m) => {
      const profile = m.student_profiles as unknown as { nom: string; prenom: string } | null;
      return {
        student_id: m.student_id,
        nom: profile?.nom ?? '',
        prenom: profile?.prenom ?? '',
      };
    });
}

// ── Rapport complet ──────────────────────────────────────────
export async function getAttendanceReport(
  sessionId: string,
): Promise<AttendanceReport | null> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('attendance_sessions')
    .select()
    .eq('id', sessionId)
    .single();
  if (!session) return null;

  const [presents, absents] = await Promise.all([
    getSessionRecords(sessionId),
    getAbsentees(sessionId),
  ]);

  const total = presents.length + absents.length;
  const taux_presence = total > 0 ? Math.round((presents.length / total) * 100) : 0;

  return { session, presents, absents, taux_presence };
}

// ── Historique élève ─────────────────────────────────────────
export async function getMyAttendanceHistory(): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('attendance_records')
    .select()
    .eq('student_id', user.id)
    .order('heure_pointage', { ascending: false });
  return data ?? [];
}

// ── Sessions du prof ─────────────────────────────────────────
export async function getMyTeacherSessions(): Promise<AttendanceSession[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('attendance_sessions')
    .select()
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });
  return data ?? [];
}
