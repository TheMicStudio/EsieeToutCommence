import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getProjectWeeks, getGroups, getSoutenanceSlots } from '@/modules/projects/actions';
import { buttonVariants } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

interface WeekPageProps {
  params: Promise<{ weekId: string }>;
}

export default async function WeekPage({ params }: WeekPageProps) {
  const { weekId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/login');
  if (profile.role !== 'eleve' && profile.role !== 'professeur') redirect('/dashboard');

  const supabase = await createClient();
  const { data: week } = await supabase.from('project_weeks').select().eq('id', weekId).single();
  if (!week) notFound();

  const [groups, slots] = await Promise.all([
    getGroups(weekId),
    getSoutenanceSlots(weekId),
  ]);

  const start = new Date(week.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const end = new Date(week.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{week.title}</h1>
        <p className="text-muted-foreground">{start} → {end}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href={`/dashboard/projets/${weekId}/groupes`}
          className="flex flex-col items-center gap-1 rounded-xl border bg-card p-6 text-center transition-all hover:border-primary/40"
        >
          <span className="text-3xl font-bold">{groups.length}</span>
          <span className="text-sm text-muted-foreground">Groupes</span>
        </Link>
        <Link
          href={`/dashboard/projets/${weekId}/soutenances`}
          className="flex flex-col items-center gap-1 rounded-xl border bg-card p-6 text-center transition-all hover:border-primary/40"
        >
          <span className="text-3xl font-bold">{slots.length}</span>
          <span className="text-sm text-muted-foreground">Créneaux</span>
        </Link>
        <Link
          href={`/dashboard/projets/${weekId}/retro`}
          className="flex flex-col items-center gap-1 rounded-xl border bg-card p-6 text-center transition-all hover:border-primary/40"
        >
          <span className="text-3xl font-bold">🗒</span>
          <span className="text-sm text-muted-foreground">Rétro</span>
        </Link>
      </div>

      <div className="flex gap-3">
        <Link href={`/dashboard/projets/${weekId}/groupes`} className={buttonVariants({})}>
          Voir les groupes
        </Link>
        <Link href={`/dashboard/projets/${weekId}/retro`} className={buttonVariants({ variant: 'outline' })}>
          Mur de rétro
        </Link>
      </div>
    </div>
  );
}
