import { getCurrentUserProfile } from '@/modules/auth/actions';
import {
  getChannelMessages,
  getClassChannels,
  getMyClass,
  getMyTeacherClasses,
} from '@/modules/pedagogy/actions';
import { ClassChat } from '@/modules/pedagogy/components/ClassChat';
import { ClassSelector } from '@/modules/pedagogy/components/ClassSelector';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Chat de classe — Hub École' };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>;
}) {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const { classe: classeParam } = await searchParams;
  const isProf = userProfile.role === 'professeur';

  let classe = null;
  let teacherClasses: Awaited<ReturnType<typeof getMyTeacherClasses>> = [];

  if (isProf) {
    teacherClasses = await getMyTeacherClasses();
    classe = teacherClasses.find((c) => c.id === classeParam) ?? teacherClasses[0] ?? null;
  } else {
    classe = await getMyClass();
  }

  if (!classe) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#061826]">Chat de classe</h1>
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">
            {isProf ? "Aucune classe assignée. Contactez l'administration." : "Vous n'êtes assigné à aucune classe. Contactez l'administration."}
          </p>
        </div>
      </div>
    );
  }

  const channels = await getClassChannels(classe.id);
  if (channels.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#061826]">Chat de classe</h1>
        {isProf && (
          <ClassSelector
            classes={teacherClasses}
            activeClassId={classe.id}
            basePath="/dashboard/pedagogie/chat"
          />
        )}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">Aucun canal disponible pour l&apos;instant.</p>
        </div>
      </div>
    );
  }

  const initialMessages = await getChannelMessages(channels[0].id);

  const supabase = await createClient();

  // Fetcher TOUS les membres de la classe comme auteurs potentiels (pas seulement les auteurs des messages initiaux)
  const [{ data: classMembers }, { data: classTeachers }] = await Promise.all([
    supabase
      .from('class_members')
      .select('student_profiles(id, prenom, nom)')
      .eq('class_id', classe.id),
    supabase
      .from('teacher_classes')
      .select('teacher_profiles(id, prenom, nom)')
      .eq('class_id', classe.id),
  ]);

  const authorNames: Record<string, string> = {};

  for (const m of classMembers ?? []) {
    const p = m.student_profiles as unknown as { id: string; prenom: string; nom: string } | null;
    if (p) authorNames[p.id] = `${p.prenom} ${p.nom}`;
  }
  for (const t of classTeachers ?? []) {
    const p = t.teacher_profiles as unknown as { id: string; prenom: string; nom: string } | null;
    if (p) authorNames[p.id] = `${p.prenom} ${p.nom}`;
  }

  return (
    <div className="flex flex-col gap-3" style={{ height: 'calc(100vh - 9rem)' }}>
      <div className="flex shrink-0 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Chat de classe</h1>
          <p className="mt-1 text-sm text-slate-500">
            {classe.nom} — {channels.length} canal{channels.length > 1 ? 'x' : ''}
          </p>
        </div>
      </div>
      {isProf && (
        <div className="shrink-0">
          <ClassSelector
            classes={teacherClasses}
            activeClassId={classe.id}
            basePath="/dashboard/pedagogie/chat"
          />
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ClassChat
          channels={channels}
          initialMessages={initialMessages}
          currentUserId={userProfile.profile.id}
          currentUserName={`${userProfile.profile.prenom} ${userProfile.profile.nom}`}
          authorNames={authorNames}
        />
      </div>
    </div>
  );
}
