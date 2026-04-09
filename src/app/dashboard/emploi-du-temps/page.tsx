import { getCurrentUserProfile } from '@/modules/auth/actions';
import { redirect } from 'next/navigation';
import {
  getSessionsForStudent,
  getSessionsForTeacher,
} from '@/modules/admin/planning-actions';
import { createAdminClient } from '@/lib/supabase/admin';
import { WeekCalendar } from './WeekCalendar';
import { CalendarDays, GraduationCap, User } from 'lucide-react';
import type { StudentProfile, TeacherProfile } from '@/modules/auth/types';

export const metadata = { title: 'Emploi du temps — EsieeToutCommence' };

export default async function EmploiDuTempsPage() {
  const userProfile = await getCurrentUserProfile();

  if (!userProfile) redirect('/auth/login');
  if (userProfile.role !== 'eleve' && userProfile.role !== 'professeur') {
    redirect('/dashboard');
  }

  let sessions: Awaited<ReturnType<typeof getSessionsForStudent>> = [];
  let contextLabel = '';
  let contextIcon: 'student' | 'teacher' = 'student';

  if (userProfile.role === 'eleve') {
    const profile = userProfile.profile as StudentProfile;

    // class_id peut être null si l'élève a été assigné via class_members avant
    // la synchronisation du champ. On utilise class_members comme source de vérité.
    let classId = profile.class_id ?? null;
    if (!classId) {
      const admin = createAdminClient();
      const { data: membership } = await admin
        .from('class_members')
        .select('class_id')
        .eq('student_id', profile.id)
        .eq('is_current', true)
        .maybeSingle();
      if (membership?.class_id) {
        classId = membership.class_id as string;
        // Remettre à jour le profil pour les prochains appels
        await admin.from('student_profiles').update({ class_id: classId }).eq('id', profile.id);
      }
    }

    if (!classId) {
      // Élève sans classe assignée
      return (
        <div className="space-y-5">
          <Header />
          <EmptyState message="Vous n'êtes pas encore assigné(e) à une classe. Contactez votre administration." />
        </div>
      );
    }
    sessions = await getSessionsForStudent(classId);
    contextLabel = `Classe • ${sessions[0]?.class_nom ?? 'Ma classe'}`;
  } else {
    const profile = userProfile.profile as TeacherProfile;
    sessions = await getSessionsForTeacher(profile.id);
    contextLabel = `${profile.prenom} ${profile.nom}`;
    contextIcon = 'teacher';
  }

  const totalSessions = sessions.length;

  return (
    <div className="space-y-5">
      <Header />

      {/* Contexte */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-5 py-3.5 shadow-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0471a6]/10">
          {contextIcon === 'student'
            ? <GraduationCap className="h-5 w-5 text-[#0471a6]" />
            : <User className="h-5 w-5 text-[#0471a6]" />
          }
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#061826]">{contextLabel}</p>
          <p className="text-xs text-slate-400">{totalSessions} session{totalSessions === 1 ? '' : 's'} planifiée{totalSessions === 1 ? '' : 's'}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Planning publié
        </span>
      </div>

      {/* Calendrier */}
      {totalSessions === 0 ? (
        <EmptyState message="Aucun cours planifié pour le moment. Votre emploi du temps sera disponible dès que l'administration publiera le planning." />
      ) : (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card">
          <WeekCalendar sessions={sessions} showConflicts={false} showFilters={false} />
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0471a6]/10">
        <CalendarDays className="h-5 w-5 text-[#0471a6]" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Emploi du temps</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consultez vos cours planifiés semaine par semaine.
        </p>
      </div>
    </div>
  );
}

function EmptyState({ message }: Readonly<{ message: string }>) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-12 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <CalendarDays className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-500">Emploi du temps indisponible</p>
      <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">{message}</p>
    </div>
  );
}
