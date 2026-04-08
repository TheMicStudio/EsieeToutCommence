import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyClass, getMyTeacherClasses } from '@/modules/pedagogy/actions';

export const metadata = { title: 'Espace pédagogique — Hub École' };

export default async function PedagogiePage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const isProf = userProfile.role === 'professeur';
  const myClass = isProf ? null : await getMyClass();
  const teacherClasses = isProf ? await getMyTeacherClasses() : [];

  const classes = isProf
    ? teacherClasses
    : myClass ? [myClass] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">
          {isProf ? 'Mes classes' : 'Ma classe'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isProf
            ? `${teacherClasses.length} classe${teacherClasses.length > 1 ? 's' : ''} assignée${teacherClasses.length > 1 ? 's' : ''}`
            : myClass ? `${myClass.nom} — Promo ${myClass.annee}` : 'Aucune classe assignée'}
        </p>
      </div>

      {/* Alerte sans classe */}
      {classes.length === 0 && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">Aucune classe assignée</p>
          <p className="mt-1 text-xs text-amber-600">Contactez votre administration pour être affecté à une classe.</p>
        </div>
      )}

      {/* Liste des classes */}
      {classes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
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
