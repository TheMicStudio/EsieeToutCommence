import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requirePermission } from '@/lib/permissions';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getRetroBoard, getRetroPostits } from '@/modules/projects/actions';
import { RetroBoard } from '@/modules/projects/components/RetroBoard';
import { createClient } from '@/lib/supabase/server';
import { ChevronLeft } from 'lucide-react';

interface RetroPageProps {
  params: Promise<{ weekId: string }>;
}

export default async function RetroPage({ params }: RetroPageProps) {
  const { weekId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  await requirePermission('retro.participate');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';
  const currentUserName = `${profile.profile.prenom} ${profile.profile.nom}`;

  const board = await getRetroBoard(weekId);
  if (!board) notFound();

  const postits = await getRetroPostits(board.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/pedagogie/projets/${weekId}`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Retour au projet
        </Link>
        <h1 className="text-2xl font-bold text-[#061826]">Mur de rétro</h1>
        <p className="text-sm text-slate-500">Partagez vos retours sur la semaine projet</p>
      </div>
      <RetroBoard
        board={board}
        initialPostits={postits}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        isProf={profile.role === 'professeur' || profile.role === 'coordinateur' || profile.role === 'admin'}
      />
    </div>
  );
}
