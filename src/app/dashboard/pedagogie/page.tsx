import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, GraduationCap, History } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getMyAllClasses, getMyTeacherClasses } from '@/modules/pedagogy/actions';

export const metadata = { title: 'Espace pédagogique — EsieeToutCommence' };

export default async function PedagogiePage() {
  await requirePermission('class.read');
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const isProf = userProfile.role === 'professeur';
  const teacherClasses = isProf ? await getMyTeacherClasses() : [];
  const allMyClasses = !isProf ? await getMyAllClasses() : [];

  const currentClass = allMyClasses.find((c) => c.is_current) ?? null;
  const pastClasses = allMyClasses.filter((c) => !c.is_current);

  // Élève sans historique → rediriger directement sur sa classe courante
  if (!isProf && currentClass && pastClasses.length === 0) {
    redirect(`/dashboard/pedagogie/classe/${currentClass.id}`);
  }

  const classes = isProf ? teacherClasses : allMyClasses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">
          {isProf ? 'Mes classes' : 'Espace pédagogique'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isProf
            ? `${teacherClasses.length} classe${teacherClasses.length > 1 ? 's' : ''} assignée${teacherClasses.length > 1 ? 's' : ''}`
            : currentClass
              ? `Classe actuelle : ${currentClass.nom} — Promo ${currentClass.annee}`
              : 'Aucune classe assignée'}
        </p>
      </div>

      {/* Alerte sans classe */}
      {classes.length === 0 && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">Aucune classe assignée</p>
          <p className="mt-1 text-xs text-amber-600">Contactez votre administration pour être affecté à une classe.</p>
        </div>
      )}

      {/* Classe courante (élève avec historique) */}
      {!isProf && currentClass && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Classe actuelle</p>
          <Link
            href={`/dashboard/pedagogie/classe/${currentClass.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-[#0471a6]/20 bg-white p-5 shadow-sm transition-all hover:border-[#0471a6]/40 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0471a6]/10 group-hover:bg-[#0471a6]/15 transition-colors">
              <GraduationCap className="h-6 w-6 text-[#0471a6] transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#061826] truncate group-hover:text-[#0471a6] transition-colors">
                {currentClass.nom}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">Promotion {currentClass.annee}</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              En cours
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-[#0471a6] transition-colors" />
          </Link>
        </div>
      )}

      {/* Années précédentes (élève) */}
      {!isProf && pastClasses.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Années précédentes</p>
          </div>
          <div className="space-y-3">
            {pastClasses.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/pedagogie/classe/${c.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-slate-50/60 p-5 shadow-sm transition-all hover:border-slate-300/80 hover:bg-white hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-slate-200/60 transition-colors">
                  <GraduationCap className="h-6 w-6 text-slate-400 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-600 truncate group-hover:text-[#061826] transition-colors">
                    {c.nom}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-400">Promotion {c.annee}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  Archivée
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-200 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Liste des classes (prof) */}
      {isProf && teacherClasses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teacherClasses.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/pedagogie/classe/${c.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:border-[#0471a6]/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#89aae6]/20 group-hover:bg-[#0471a6]/15 transition-colors">
                <GraduationCap className="h-6 w-6 text-[#3685b5] group-hover:text-[#0471a6] transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#061826] truncate group-hover:text-[#0471a6] transition-colors">
                  {c.nom}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">Promotion {c.annee}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-[#0471a6] transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
