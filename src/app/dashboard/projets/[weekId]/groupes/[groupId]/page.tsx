import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getGroups, getGroupMessages, getGroupWhiteboard } from '@/modules/projects/actions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GroupChat } from '@/modules/projects/components/GroupChat';
import { GroupWhiteboardView } from '@/modules/projects/components/GroupWhiteboardView';
import { GroupWorkspaceTabs } from '@/modules/projects/components/GroupWorkspaceTabs';
import { ArrowLeft, Star } from 'lucide-react';

interface GroupWorkspacePageProps {
  params: Promise<{ weekId: string; groupId: string }>;
}

export default async function GroupWorkspacePage({ params }: Readonly<GroupWorkspacePageProps>) {
  const { weekId, groupId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  await requirePermission('project_group.read');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';

  // Load week + group
  const { data: week } = await supabase.from('project_weeks').select().eq('id', weekId).single();
  if (!week) notFound();

  const groups = await getGroups(weekId);
  const group = groups.find((g) => g.id === groupId);
  if (!group) notFound();

  const members = group.members ?? [];
  const isMember = members.some((m) => m.student_id === currentUserId);
  const isProf = profile.role === 'professeur';

  // Only group members and profs can access the workspace
  if (!isMember && !isProf) redirect(`/dashboard/projets/${weekId}/groupes`);

  // Load messages and whiteboard data in parallel
  const [rawMessages, whiteboard] = await Promise.all([
    getGroupMessages(groupId),
    getGroupWhiteboard(groupId),
  ]);

  // Resolve author names for messages
  const authorIds = [...new Set(rawMessages.map((m) => m.author_id))];
  let memberNames: Record<string, string> = {};
  if (authorIds.length > 0) {
    const admin = createAdminClient();
    // Try student profiles first
    const { data: studentProfs } = await admin
      .from('student_profiles')
      .select('id, prenom, nom')
      .in('id', authorIds);
    (studentProfs ?? []).forEach((p: { id: string; prenom: string; nom: string }) => {
      memberNames[p.id] = `${p.prenom} ${p.nom}`;
    });
    // Fill remaining with admin profiles
    const missing = authorIds.filter((id) => !memberNames[id]);
    if (missing.length > 0) {
      const { data: adminProfs } = await admin
        .from('admin_profiles')
        .select('id, prenom, nom')
        .in('id', missing);
      (adminProfs ?? []).forEach((p: { id: string; prenom: string; nom: string }) => {
        memberNames[p.id] = `${p.prenom} ${p.nom}`;
      });
    }
  }

  // Résoudre le nom de l'utilisateur courant (pour broadcast)
  const admin2 = createAdminClient();
  let currentUserName = 'Moi';
  const { data: selfStudent } = await admin2.from('student_profiles').select('prenom, nom').eq('id', currentUserId).maybeSingle();
  if (selfStudent) currentUserName = `${selfStudent.prenom} ${selfStudent.nom}`;
  else {
    const { data: selfAdmin } = await admin2.from('admin_profiles').select('prenom, nom').eq('id', currentUserId).maybeSingle();
    if (selfAdmin) currentUserName = `${selfAdmin.prenom} ${selfAdmin.nom}`;
  }

  const messages = rawMessages.map((m) => ({
    ...m,
    author_name: memberNames[m.author_id],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href={`/dashboard/projets/${weekId}/groupes`}
          className="mt-1 rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[#061826] truncate">{group.group_name}</h1>
            {group.note !== undefined && group.note !== null && (
              <div className="flex items-center gap-1.5 rounded-xl bg-[#0471a6]/10 px-3 py-1 shrink-0">
                <Star className="h-3.5 w-3.5 text-[#0471a6]" />
                <span className="text-sm font-bold text-[#0471a6]">{group.note}/20</span>
              </div>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {week.title} ·{' '}
            <span className={members.length >= group.capacite_max ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'}>
              {members.length}/{group.capacite_max} membres
            </span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {members.map((m) => (
              <span
                key={m.student_id}
                className={[
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  m.student_id === currentUserId ? 'bg-[#0471a6]/15 text-[#0471a6]' : 'bg-slate-100 text-slate-600',
                ].join(' ')}
              >
                {m.prenom} {m.nom}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Chat | Tableau blanc */}
      <GroupWorkspaceTabs
        chatContent={
          <GroupChat
            groupId={groupId}
            initialMessages={messages}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            memberNames={memberNames}
          />
        }
        whiteboardContent={
          <GroupWhiteboardView
            groupId={groupId}
            initialData={whiteboard?.data ?? null}
          />
        }
      />
    </div>
  );
}
