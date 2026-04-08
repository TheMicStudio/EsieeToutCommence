import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getMyTripartiteChat, getTripartiteMessages } from '@/modules/career/actions';
import { TripartiteChat } from '@/modules/career/components/TripartiteChat';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Espace tripartite — EsieeToutCommence' };

export default async function TripartitePage() {
  await requirePermission('alternance.access');
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  // Seuls élèves alternants, admins référents et entreprises maîtres peuvent accéder
  if (userProfile.role === 'eleve' && userProfile.profile.type_parcours !== 'alternant') {
    redirect('/dashboard/carriere');
  }
  if (userProfile.role === 'professeur') {
    redirect('/dashboard/carriere');
  }

  const chat = await getMyTripartiteChat();

  if (!chat) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
        <p className="text-center text-sm text-slate-400">
          Votre espace tripartite n&apos;a pas encore été créé.<br />
          Contactez l&apos;administration pour le configurer.
        </p>
      </div>
    );
  }

  const messages = await getTripartiteMessages(chat.id);

  // Résoudre les noms des 3 participants
  const supabase = await createClient();
  const participantIds = [chat.student_id, chat.referent_id, chat.maitre_id];

  const [{ data: students }, { data: admins }, { data: companies }] = await Promise.all([
    supabase.from('student_profiles').select('id, prenom, nom').in('id', participantIds),
    supabase.from('admin_profiles').select('id, prenom, nom').in('id', participantIds),
    supabase.from('company_profiles').select('id, prenom, nom').in('id', participantIds),
  ]);

  type Profile = { id: string; prenom: string; nom: string };
  const allProfiles: Profile[] = [
    ...((students as Profile[]) ?? []),
    ...((admins as Profile[]) ?? []),
    ...((companies as Profile[]) ?? []),
  ];

  const participantNames: Record<string, { nom: string; role: 'student' | 'referent' | 'maitre' }> = {};
  for (const p of allProfiles) {
    const role =
      p.id === chat.student_id ? 'student'
      : p.id === chat.referent_id ? 'referent'
      : 'maitre';
    participantNames[p.id] = { nom: `${p.prenom} ${p.nom}`, role };
  }

  return (
    <div
      className="flex overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm"
      style={{ height: 'calc(100vh - 9rem)' }}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <TripartiteChat
          chat={chat}
          initialMessages={messages}
          currentUserId={userProfile.profile.id}
          participantNames={participantNames}
        />
      </div>
    </div>
  );
}
