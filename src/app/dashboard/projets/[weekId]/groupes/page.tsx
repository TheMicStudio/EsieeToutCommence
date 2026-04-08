import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getGroups, createGroup } from '@/modules/projects/actions';
import { GroupCard } from '@/modules/projects/components/GroupCard';
import { createClient } from '@/lib/supabase/server';
import { Plus } from 'lucide-react';

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

  const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#061826]">Groupes</h1>

      {!isProf && (
        <form
          action={async (fd: FormData) => {
            'use server';
            const name = fd.get('group_name') as string;
            const cap = parseInt(fd.get('capacite') as string);
            await createGroup(weekId, name, cap);
          }}
          className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-700">Créer un nouveau groupe</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="group_name" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Nom du groupe
              </label>
              <input id="group_name" name="group_name" placeholder="ex: Team Alpha" required className={inputCls} />
            </div>
            <div className="w-28">
              <label htmlFor="capacite" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Capacité
              </label>
              <input id="capacite" name="capacite" type="number" min={2} max={8} defaultValue={4} required className={inputCls} />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Créer et rejoindre
          </button>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <p className="text-sm text-slate-400">Aucun groupe créé.</p>
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
