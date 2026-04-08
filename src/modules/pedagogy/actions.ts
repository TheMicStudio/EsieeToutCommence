'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import type {
  ActionState,
  AverageByMatiere,
  Class,
  ClassChannel,
  ClassMessage,
  CourseMaterial,
  Grade,
} from './types';

// ─── Classe de l'élève connecté ──────────────────────────────────────────────

export async function getMyClass(): Promise<Class | null> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'eleve') return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('class_members')
    .select('classes(*)')
    .eq('student_id', userProfile.profile.id)
    .single();

  return (data?.classes as unknown as Class) ?? null;
}

// ─── Classes du prof connecté ─────────────────────────────────────────────────

export async function getMyTeacherClasses(): Promise<Class[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('teacher_classes')
    .select('classes(*)')
    .eq('teacher_id', userProfile.profile.id);

  if (!data) return [];

  // Dédupliquer (un prof peut avoir plusieurs matières dans la même classe)
  const seen = new Set<string>();
  return data
    .map((d) => d.classes as unknown as Class)
    .filter((c) => c && !seen.has(c.id) && seen.add(c.id));
}

// ─── Supports de cours ────────────────────────────────────────────────────────

export async function getCourseMaterials(classId: string): Promise<CourseMaterial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('course_materials')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  return (data as CourseMaterial[]) ?? [];
}

export async function addCourseMaterial(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') {
    return { error: 'Accès refusé.' };
  }

  const classId = formData.get('class_id') as string;
  const titre = formData.get('titre') as string;
  const type = formData.get('type') as 'video' | 'pdf' | 'lien';
  const matiere = formData.get('matiere') as string;

  if (!classId || !titre || !type || !matiere) {
    return { error: 'Tous les champs sont requis.' };
  }

  const supabase = await createClient();
  let url: string;

  // Si un fichier est uploadé (type pdf avec fichier joint)
  const file = formData.get('fichier') as File | null;
  if (file && file.size > 0) {
    if (file.size > 20 * 1024 * 1024) {
      return { error: 'Le fichier ne doit pas dépasser 20 Mo.' };
    }
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${classId}/${Date.now()}-${titre.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('course_materials')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { error: 'Erreur lors de l\'upload du fichier.' };

    const { data: publicUrl } = supabase.storage.from('course_materials').getPublicUrl(path);
    url = publicUrl.publicUrl;
  } else {
    url = formData.get('url') as string;
    if (!url) return { error: 'Veuillez fournir une URL ou un fichier.' };
  }

  const { error } = await supabase.from('course_materials').insert({
    class_id: classId,
    teacher_id: userProfile.profile.id,
    titre,
    type,
    url,
    matiere,
  });

  if (error) return { error: 'Erreur lors de l\'ajout du support.' };
  return { success: true };
}

export async function deleteCourseMaterial(materialId: string): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') {
    return { error: 'Accès refusé.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('course_materials')
    .delete()
    .eq('id', materialId)
    .eq('teacher_id', userProfile.profile.id);

  if (error) return { error: 'Erreur lors de la suppression.' };
  return { success: true };
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function getMyGrades(): Promise<Grade[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'eleve') return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('grades')
    .select('*')
    .eq('student_id', userProfile.profile.id)
    .order('created_at', { ascending: false });

  return (data as Grade[]) ?? [];
}

export async function getClassGrades(classId: string): Promise<Grade[]> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('grades')
    .select('*')
    .eq('class_id', classId)
    .order('matiere')
    .order('created_at', { ascending: false });

  return (data as Grade[]) ?? [];
}

export async function addGrade(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') {
    return { error: 'Accès refusé.' };
  }

  const studentId = formData.get('student_id') as string;
  const classId = formData.get('class_id') as string;
  const matiere = formData.get('matiere') as string;
  const examen = formData.get('examen') as string;
  const note = parseFloat(formData.get('note') as string);
  const coefficient = parseFloat(formData.get('coefficient') as string) || 1;

  if (!studentId || !classId || !matiere || !examen || isNaN(note)) {
    return { error: 'Tous les champs sont requis.' };
  }

  if (note < 0 || note > 20) {
    return { error: 'La note doit être entre 0 et 20.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('grades').insert({
    student_id: studentId,
    teacher_id: userProfile.profile.id,
    class_id: classId,
    matiere,
    examen,
    note,
    coefficient,
  });

  if (error) return { error: 'Erreur lors de l\'ajout de la note.' };
  return { success: true };
}

export async function getClassStudents(classId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();
  const { data: members } = await admin
    .from('class_members')
    .select('student_id')
    .eq('class_id', classId);
  if (!members || members.length === 0) return [];
  const ids = members.map((m) => m.student_id as string);
  const { data: profiles } = await admin
    .from('student_profiles')
    .select('id, nom, prenom')
    .in('id', ids)
    .order('nom');
  return profiles ?? [];
}

export async function addBulkGrades(
  classId: string,
  matiere: string,
  examen: string,
  coefficient: number,
  grades: { studentId: string; note: number }[],
): Promise<{ error?: string; count?: number }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') return { error: 'Accès refusé.' };
  if (grades.length === 0) return { error: 'Aucune note à saisir.' };
  const supabase = await createClient();
  const rows = grades.map((g) => ({
    student_id: g.studentId,
    teacher_id: userProfile.profile.id,
    class_id: classId,
    matiere,
    examen,
    note: g.note,
    coefficient,
  }));
  const { error } = await supabase.from('grades').insert(rows);
  if (error) return { error: error.message };
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/dashboard/pedagogie/notes');
  return { count: rows.length };
}

export async function deleteGrade(gradeId: string): Promise<{ error?: string }> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile || userProfile.role !== 'professeur') return { error: 'Accès refusé.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('grades')
    .delete()
    .eq('id', gradeId)
    .eq('teacher_id', userProfile.profile.id);
  if (error) return { error: error.message };
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/dashboard/pedagogie/notes');
  return {};
}

export async function computeAverage(
  studentId: string,
  classId: string
): Promise<AverageByMatiere[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('grades')
    .select('matiere, note, coefficient')
    .eq('student_id', studentId)
    .eq('class_id', classId);

  if (!data || data.length === 0) return [];

  const grouped = data.reduce<Record<string, { sumProd: number; sumCoeff: number }>>(
    (acc, g) => {
      const key = g.matiere as string;
      if (!acc[key]) acc[key] = { sumProd: 0, sumCoeff: 0 };
      acc[key].sumProd += (g.note as number) * (g.coefficient as number);
      acc[key].sumCoeff += g.coefficient as number;
      return acc;
    },
    {}
  );

  return Object.entries(grouped).map(([matiere, { sumProd, sumCoeff }]) => ({
    matiere,
    moyenne: Math.round((sumProd / sumCoeff) * 100) / 100,
    total_coefficients: sumCoeff,
  }));
}

// ─── Chat de classe ───────────────────────────────────────────────────────────

export async function getClassChannels(classId: string): Promise<ClassChannel[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('class_channels')
    .select('*')
    .eq('class_id', classId)
    .order('created_at');

  return (data as ClassChannel[]) ?? [];
}

export async function getChannelMessages(channelId: string): Promise<ClassMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('class_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(100);

  return (data as ClassMessage[]) ?? [];
}

export async function sendMessage(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return { error: 'Non authentifié.' };

  const channelId = formData.get('channel_id') as string;
  const contenu = (formData.get('contenu') as string)?.trim();

  if (!contenu) return { error: 'Le message ne peut pas être vide.' };

  const supabase = await createClient();
  const { error } = await supabase.from('class_messages').insert({
    channel_id: channelId,
    author_id: userProfile.profile.id,
    contenu,
  });

  if (error) return { error: 'Erreur lors de l\'envoi du message.' };
  return { success: true };
}
