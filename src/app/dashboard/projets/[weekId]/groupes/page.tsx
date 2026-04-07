import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getGroups } from '@/modules/projects/actions';
import { GroupCard } from '@/modules/projects/components/GroupCard';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Inline create group form (server action redirects)
import { createGroup } from '@/modules/projects/actions';

interface GroupesPageProps {
  params: Promise<{ weekId: string }>;
}

export default async function GroupesPage({ params }: GroupesPageProps) {
  const { weekId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  
  if (profile.role !== 'eleve' && profile.role !== 'professeur') redirect('/dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';

  const groups = await getGroups(weekId);
  const isProf = profile.role === 'professeur';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Groupes</h1>

      {!isProf && (
        <form
          action={async (fd: FormData) => {
            'use server';
            const name = fd.get('group_name') as string;
            const cap = parseInt(fd.get('capacite') as string);
            await createGroup(weekId, name, cap);
          }}
          className="rounded-xl border bg-card p-5 space-y-4"
        >
          <h2 className="font-semibold text-sm">Créer un nouveau groupe</h2>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="group_name" className="text-xs">Nom du groupe</Label>
              <Input id="group_name" name="group_name" placeholder="ex: Team Alpha" required />
            </div>
            <div className="w-24 space-y-1.5">
              <Label htmlFor="capacite" className="text-xs">Capacité</Label>
              <Input id="capacite" name="capacite" type="number" min={2} max={8} defaultValue={4} required />
            </div>
          </div>
          <Button type="submit" size="sm">Créer et rejoindre</Button>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Aucun groupe créé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              weekId={weekId}
              currentUserId={currentUserId}
              isProf={isProf}
            />
          ))}
        </div>
      )}
    </div>
  );
}
