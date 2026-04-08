import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Users, Star, GitBranch, Presentation, Lock, UserPlus } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getGroups, createGroup } from '@/modules/projects/actions';
import { JoinGroupButton } from '@/modules/projects/components/JoinGroupButton';
import { SubmitLinksForm } from '@/modules/projects/components/SubmitLinksForm';
import { GradeGroupForm } from '@/modules/projects/components/GradeGroupForm';
import { createClient } from '@/lib/supabase/server';

interface GroupesPageProps {
  params: Promise<{ weekId: string }>;
}

function getInitials(prenom?: string, nom?: string) {
  return `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?';
}

const AVATAR_COLORS = [
  'bg-[#89aae6]/20 text-[#3685b5]',
  'bg-[#ac80a0]/20 text-[#ac80a0]',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-violet-100 text-violet-600',
  'bg-rose-100 text-rose-600',
];

export default async function GroupesPage({ params }: GroupesPageProps) {
  const { weekId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  if (profile.role !== 'eleve' && profile.role !== 'professeur') redirect('/dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';

  const { data: week } = await supabase
    .from('project_weeks').select('title, start_date, end_date').eq('id', weekId).single();

  const groups = await getGroups(weekId);
  const isProf = profile.role === 'professeur';

  const myGroup = !isProf
    ? groups.find((g) => g.members?.some((m) => m.student_id === currentUserId)) ?? null
    : null;

  const otherGroups = myGroup ? groups.filter((g) => g.id !== myGroup.id) : groups;

  const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/projets/${weekId}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#061826] truncate">
            {week?.title ?? 'Groupes'}
          </h1>
          <p className="text-sm text-slate-400">
            {groups.length} groupe{groups.length !== 1 ? 's' : ''} · {groups.reduce((n, g) => n + (g.members?.length ?? 0), 0)} participant{groups.reduce((n, g) => n + (g.members?.length ?? 0), 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Mon groupe (élève membre) ─────────────────────────── */}
      {myGroup && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Mon groupe</p>
          <div className="rounded-3xl border border-[#0471a6]/20 bg-white shadow-card overflow-hidden">
            <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-[#0471a6]/5 to-[#89aae6]/5 px-6 py-5 border-b border-[#0471a6]/10">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <p className="font-bold text-[#061826] text-lg truncate">{myGroup.group_name}</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {myGroup.members?.length ?? 0} / {myGroup.capacite_max} membres
                </p>
              </div>
              {myGroup.note !== undefined && myGroup.note !== null && (
                <div className="flex items-center gap-1.5 rounded-xl bg-[#0471a6]/10 px-3 py-1.5 shrink-0">
                  <Star className="h-3.5 w-3.5 text-[#0471a6]" />
                  <span className="text-sm font-bold text-[#0471a6]">{myGroup.note}/20</span>
                </div>
              )}
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Membres */}
              <div className="flex flex-wrap gap-2">
                {(myGroup.members ?? []).map((m, i) => (
                  <div key={m.student_id} className="flex items-center gap-2">
                    <div className={['flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold', AVATAR_COLORS[i % AVATAR_COLORS.length]].join(' ')}>
                      {getInitials(m.prenom, m.nom)}
                    </div>
                    <span className={['text-sm font-medium', m.student_id === currentUserId ? 'text-[#0471a6]' : 'text-slate-700'].join(' ')}>
                      {m.prenom} {m.nom}
                      {m.student_id === currentUserId && <span className="ml-1 text-xs text-slate-400">(moi)</span>}
                    </span>
                  </div>
                ))}
              </div>

              {/* Livrables */}
              {(myGroup.repo_url || myGroup.slides_url) && (
                <div className="flex gap-2">
                  {myGroup.repo_url && (
                    <a href={myGroup.repo_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      <GitBranch className="h-3.5 w-3.5" />GitHub
                    </a>
                  )}
                  {myGroup.slides_url && (
                    <a href={myGroup.slides_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      <Presentation className="h-3.5 w-3.5" />Slides
                    </a>
                  )}
                </div>
              )}

              {/* Feedback */}
              {myGroup.feedback_prof && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm italic text-amber-800">
                  &ldquo;{myGroup.feedback_prof}&rdquo;
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
                <Link
                  href={`/dashboard/projets/${weekId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
                >
                  Ouvrir mon espace →
                </Link>
                <JoinGroupButton groupId={myGroup.id} weekId={weekId} isMember={true} isFull={false} />
                <SubmitLinksForm groupId={myGroup.id} initialRepo={myGroup.repo_url} initialSlides={myGroup.slides_url} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Créer un groupe (élève sans groupe) ──────────────── */}
      {!isProf && !myGroup && (
        <form
          action={async (fd: FormData) => {
            'use server';
            const name = fd.get('group_name') as string;
            const cap = parseInt(fd.get('capacite') as string);
            await createGroup(weekId, name, cap);
          }}
          className="rounded-3xl border border-slate-200/70 bg-white shadow-card p-6 space-y-4"
        >
          <div>
            <h2 className="font-semibold text-[#061826]">Créer un nouveau groupe</h2>
            <p className="mt-0.5 text-sm text-slate-400">Vous serez automatiquement inscrit dans ce groupe.</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="group_name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Nom du groupe
              </label>
              <input id="group_name" name="group_name" placeholder="ex: Team Alpha" required className={inputCls} />
            </div>
            <div className="w-28">
              <label htmlFor="capacite" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Capacité
              </label>
              <input id="capacite" name="capacite" type="number" min={2} max={8} defaultValue={4} required className={inputCls} />
            </div>
          </div>
          <button type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all">
            <Plus className="h-4 w-4" />
            Créer et rejoindre
          </button>
        </form>
      )}

      {/* ── Tous les groupes ──────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          {myGroup ? 'Autres groupes' : 'Groupes disponibles'}
        </p>

        {otherGroups.length === 0 && !myGroup && (
          <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50/60">
            <Users className="h-8 w-8 text-slate-200" />
            <p className="text-sm text-slate-400">Aucun groupe pour cette semaine.</p>
          </div>
        )}

        {otherGroups.length === 0 && myGroup && (
          <div className="flex h-24 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/40">
            <p className="text-sm text-slate-400">Vous êtes dans le seul groupe de cette semaine.</p>
          </div>
        )}

        {otherGroups.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {otherGroups.map((group) => {
              const members = group.members ?? [];
              const isMember = members.some((m) => m.student_id === currentUserId);
              const spots = group.capacite_max - members.length;
              const isFull = spots <= 0;

              return (
                <div key={group.id} className="rounded-3xl border border-slate-200/70 bg-white shadow-card overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#061826] truncate">{group.group_name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {isFull
                          ? <span className="text-red-500 font-medium flex items-center gap-1"><Lock className="h-3 w-3 inline" /> Complet</span>
                          : <span className="text-emerald-600 font-medium">{spots} place{spots > 1 ? 's' : ''} libre{spots > 1 ? 's' : ''}</span>
                        }
                      </p>
                    </div>
                    {group.note !== undefined && group.note !== null && (
                      <div className="flex items-center gap-1 rounded-xl bg-[#0471a6]/10 px-2.5 py-1 shrink-0">
                        <Star className="h-3 w-3 text-[#0471a6]" />
                        <span className="text-xs font-bold text-[#0471a6]">{group.note}/20</span>
                      </div>
                    )}
                  </div>

                  <div className="px-5 py-4 space-y-4">
                    {/* Membres avatars */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {members.map((m, i) => (
                        <div key={m.student_id} title={`${m.prenom} ${m.nom}`}
                          className={['flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold', AVATAR_COLORS[i % AVATAR_COLORS.length]].join(' ')}>
                          {getInitials(m.prenom, m.nom)}
                        </div>
                      ))}
                      {Array.from({ length: spots > 0 ? Math.min(spots, 3) : 0 }).map((_, i) => (
                        <div key={`empty-${i}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-slate-200">
                          <UserPlus className="h-3 w-3 text-slate-300" />
                        </div>
                      ))}
                      <span className="ml-1 text-xs text-slate-400">{members.length}/{group.capacite_max}</span>
                    </div>

                    {/* Livrables */}
                    {(group.repo_url || group.slides_url) && (
                      <div className="flex gap-2">
                        {group.repo_url && (
                          <a href={group.repo_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                            <GitBranch className="h-3.5 w-3.5" />GitHub
                          </a>
                        )}
                        {group.slides_url && (
                          <a href={group.slides_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                            <Presentation className="h-3.5 w-3.5" />Slides
                          </a>
                        )}
                      </div>
                    )}

                    {/* Feedback */}
                    {group.feedback_prof && (
                      <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs italic text-amber-700">
                        &ldquo;{group.feedback_prof}&rdquo;
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-1 border-t border-slate-100 space-y-2">
                      {!isProf && !myGroup && (
                        <JoinGroupButton groupId={group.id} weekId={weekId} isMember={isMember} isFull={isFull} />
                      )}
                      {isProf && (
                        <GradeGroupForm groupId={group.id} initialNote={group.note} initialFeedback={group.feedback_prof} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
