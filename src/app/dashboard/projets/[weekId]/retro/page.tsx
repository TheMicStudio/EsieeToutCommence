import { redirect, notFound } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getRetroBoard, getRetroPostits } from '@/modules/projects/actions';
import { RetroBoard } from '@/modules/projects/components/RetroBoard';
import { createClient } from '@/lib/supabase/server';

interface RetroPageProps {
  params: Promise<{ weekId: string }>;
}

export default async function RetroPage({ params }: RetroPageProps) {
  const { weekId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/login');
  if (profile.role !== 'eleve' && profile.role !== 'professeur') redirect('/dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';

  const board = await getRetroBoard(weekId);
  if (!board) notFound();

  const postits = await getRetroPostits(board.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mur de rétro</h1>
        <p className="text-muted-foreground">Partagez vos retours sur la semaine projet</p>
      </div>
      <RetroBoard
        board={board}
        initialPostits={postits}
        currentUserId={currentUserId}
        isProf={profile.role === 'professeur'}
      />
    </div>
  );
}
