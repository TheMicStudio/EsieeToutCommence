import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getMyTripartiteChat, getTripartiteMessages } from '@/modules/career/actions';
import { TripartiteChat } from '@/modules/career/components/TripartiteChat';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, MessageSquareLock } from 'lucide-react';

export const metadata = { title: 'Espace tripartite — EsieeToutCommence' };

export default async function TripartitePage() {
  await requirePermission('alternance.access');
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  if (userProfile.role === 'eleve' && userProfile.profile.type_parcours !== 'alternant') {
    redirect('/dashboard/carriere');
  }
  if (userProfile.role === 'professeur') {
    redirect('/dashboard/carriere');
  }

  const chat = await getMyTripartiteChat();

  return (
    <div className="space-y-0">
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
          <Link
            href="/dashboard/carriere"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50">
              <MessageSquareLock className="h-5 w-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 leading-tight">
                Espace tripartite
              </h1>
              <p className="mt-0.5 text-[13px] font-medium text-slate-500">
                Canal de communication entre l&apos;alternant, le référent et le maître d&apos;apprentissage
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!chat ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
              <p className="text-center text-sm text-slate-400">
                Votre espace tripartite n&apos;a pas encore été créé.<br />
                Contactez l&apos;administration pour le configurer.
              </p>
            </div>
          ) : (
            <ChatWrapper chat={chat} userProfile={userProfile} />
          )}
        </div>
      </div>
    </div>
  );
}

// Composant séparé pour charger les messages quand le chat existe
async function ChatWrapper({
  chat,
  userProfile,
}: Readonly<{
  chat: Awaited<ReturnType<typeof getMyTripartiteChat>>;
  userProfile: NonNullable<Awaited<ReturnType<typeof getCurrentUserProfile>>>;
}>) {
  if (!chat) return null;

  const messages = await getTripartiteMessages(chat.id);

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
      className="flex overflow-hidden rounded-2xl border border-slate-200/60"
      style={{ height: 'calc(100vh - 18rem)' }}
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
