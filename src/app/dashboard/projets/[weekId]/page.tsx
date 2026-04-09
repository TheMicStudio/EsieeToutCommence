import { notFound } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import {
  getGroups, getSoutenanceSlots, getWeekCourseMaterials,
  getRetroBoard, getRetroPostits, getGroupMessages, getGroupWhiteboard,
} from '@/modules/projects/actions';
import { WeekDashboard } from '@/modules/projects/components/WeekDashboard';
import { createClient } from '@/lib/supabase/server';

interface WeekPageProps {
  params: Promise<{ weekId: string }>;
}

export default async function WeekPage({ params }: WeekPageProps) {
  const { weekId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  await requirePermission('project_week.read');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';
  const currentUserName = `${profile.profile.prenom} ${profile.profile.nom}`;
  const isProf = profile.role === 'professeur';

  const { data: week } = await supabase
    .from('project_weeks').select().eq('id', weekId).single();
  if (!week) notFound();

  const [groups, materials, slots] = await Promise.all([
    getGroups(weekId),
    getWeekCourseMaterials(weekId),
    getSoutenanceSlots(weekId),
  ]);

  const myGroup = !isProf
    ? (groups.find((g) => g.members?.some((m) => m.student_id === currentUserId)) ?? null)
    : null;

  const retroBoard = await getRetroBoard(weekId);
  const retroPostits = retroBoard ? await getRetroPostits(retroBoard.id) : [];

  const [messages, whiteboard] = myGroup
    ? await Promise.all([getGroupMessages(myGroup.id), getGroupWhiteboard(myGroup.id)])
    : [[], null];

  return (
    <WeekDashboard
      weekId={weekId}
      week={week}
      groups={groups}
      myGroup={myGroup}
      messages={messages}
      whiteboard={whiteboard}
      materials={materials}
      slots={slots}
      retroBoard={retroBoard}
      retroPostits={retroPostits}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      isProf={isProf}
    />
  );
}
