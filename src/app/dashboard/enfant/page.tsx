import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Star, UserPlus } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyLinks, getChildGrades, getChildAttendance } from '@/modules/parent/actions';
import { LinkChildForm } from '@/modules/parent/components/LinkChildForm';

export const metadata = { title: 'Mon enfant — Hub École' };

export default async function EnfantPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'parent') redirect('/dashboard');

  const links = await getMyLinks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Mon enfant</h1>
        <p className="mt-1 text-sm text-slate-500">Suivez les notes, présences et la scolarité de votre enfant.</p>
      </div>

      {/* Lier un enfant */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-[#0471a6]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Lier un enfant</p>
        </div>
        <LinkChildForm />
      </div>

      {/* Enfants liés */}
      {links.length > 0 && (
        <div className="space-y-4">
          {links.map((link) => (
            <ChildCard key={link.id} link={link} />
          ))}
        </div>
      )}

      {links.length === 0 && (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <p className="text-sm text-slate-400">Aucun enfant lié. Utilisez le formulaire ci-dessus.</p>
        </div>
      )}
    </div>
  );
}

async function ChildCard({ link }: { link: Awaited<ReturnType<typeof getMyLinks>>[number] }) {
  const [grades, attendance] = await Promise.all([
    link.student_class_id ? getChildGrades(link.student_id, link.student_class_id) : Promise.resolve([]),
    getChildAttendance(link.student_id),
  ]);

  // Calcul de la moyenne
  const avg = grades.length > 0
    ? (grades.reduce((sum, g) => sum + (g.note ?? 0), 0) / grades.length).toFixed(2)
    : null;

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      {/* Header enfant */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4">
        <div>
          <p className="font-semibold text-[#061826]">
            {link.student_prenom} {link.student_nom}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{link.student_class ?? 'Classe non assignée'}</p>
        </div>
        <Link
          href={`/dashboard/parent/messages?lien=${link.id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-[#89aae6]/50 bg-[#89aae6]/10 px-3 py-1.5 text-xs font-semibold text-[#0471a6] hover:bg-[#89aae6]/20 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Contacter l&apos;école
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-3">
        <div className="p-4">
          <p className="text-xs text-slate-400">Moyenne générale</p>
          <p className="mt-1 text-xl font-bold text-[#0471a6]">
            {avg !== null ? `${avg} / 20` : '—'}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{grades.length} note{grades.length > 1 ? 's' : ''}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-400">Présences</p>
          <p className="mt-1 text-xl font-bold text-[#061826]">{attendance.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">enregistrées</p>
        </div>
        <div className="hidden p-4 sm:block">
          <p className="text-xs text-slate-400">Matières notées</p>
          <p className="mt-1 text-xl font-bold text-[#061826]">
            {new Set(grades.map((g) => g.subject_id)).size}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">matière{new Set(grades.map((g) => g.subject_id)).size > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Dernières notes */}
      {grades.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Dernières notes</p>
          <div className="space-y-2">
            {grades.slice(0, 5).map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#89aae6]/20">
                    <Star className="h-4 w-4 text-[#3685b5]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#061826]">{g.subject_id ?? 'Matière'}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(g.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className={[
                  'text-base font-bold',
                  g.note >= 10 ? 'text-emerald-600' : 'text-red-500',
                ].join(' ')}>
                  {g.note} / {g.note_sur ?? 20}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
