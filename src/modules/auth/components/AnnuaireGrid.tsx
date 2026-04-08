'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { ROLE_LABELS } from '../types';
import type { StudentProfile, TeacherProfile } from '../types';

type ClassInfo = { id: string; nom: string };

type AnnuaireEntry =
  | { type: 'eleve'; data: StudentProfile; classeNom?: string }
  | { type: 'professeur'; data: TeacherProfile };

interface AnnuaireGridProps {
  eleves: StudentProfile[];
  professeurs: TeacherProfile[];
  classes?: ClassInfo[];
}

const ROLE_SECONDAIRE_LABELS: Record<string, string> = {
  delegue: 'Délégué·e',
  ambassadeur: 'Ambassadeur·rice',
  bde: 'BDE',
  tuteur: 'Tuteur·rice',
};

const AVATAR_COLORS = [
  'bg-[#89aae6]/30 text-[#3685b5]',
  'bg-[#ac80a0]/30 text-[#ac80a0]',
  'bg-[#0471a6]/20 text-[#0471a6]',
  'bg-amber-100 text-amber-600',
  'bg-emerald-100 text-emerald-600',
  'bg-purple-100 text-purple-600',
];

function getInitials(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function AnnuaireGrid({ eleves, professeurs, classes = [] }: AnnuaireGridProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'tous' | 'eleve' | 'professeur'>('tous');
  const [classeFilter, setClasseFilter] = useState('');

  const entries: AnnuaireEntry[] = [
    ...eleves.map((e): AnnuaireEntry => {
      const classeNom = e.class_id ? classes.find((c) => c.id === e.class_id)?.nom : undefined;
      return { type: 'eleve', data: e, classeNom };
    }),
    ...professeurs.map((p): AnnuaireEntry => ({ type: 'professeur', data: p })),
  ];

  const filtered = entries.filter((entry) => {
    const name = `${entry.data.prenom} ${entry.data.nom}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchFilter = filter === 'tous' || entry.type === filter;
    const matchClasse =
      !classeFilter ||
      (entry.type === 'eleve' && (entry.data as StudentProfile).class_id === classeFilter);
    return matchSearch && matchFilter && matchClasse;
  });

  return (
    <div className="space-y-5">
      {/* Barre de recherche + filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm sm:max-w-xs">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un nom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Filtres rôles */}
        <div className="flex gap-2 flex-wrap">
          {(['tous', 'eleve', 'professeur'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setFilter(f); if (f !== 'eleve') setClasseFilter(''); }}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                filter === f
                  ? 'bg-[#0471a6] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {f === 'tous' ? 'Tous' : ROLE_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Filtre classe */}
        {(filter === 'tous' || filter === 'eleve') && classes.length > 0 && (
          <select
            value={classeFilter}
            onChange={(e) => setClasseFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 shadow-sm"
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        )}
      </div>

      {/* Résultats */}
      {filtered.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white">
          <p className="text-sm text-slate-500">Aucun résultat trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((entry) => {
            const { prenom, nom } = entry.data;
            const initials = getInitials(prenom, nom);
            const avatarColor = getAvatarColor(entry.data.id);

            const isAlternant = entry.type === 'eleve' && (entry.data as StudentProfile).type_parcours === 'alternant';
            const roleSecondaire = entry.type === 'eleve' ? (entry.data as StudentProfile).role_secondaire : undefined;
            const matieres = entry.type === 'professeur'
              ? (entry.data as TeacherProfile).matieres_enseignees.slice(0, 2).join(', ')
              : undefined;
            const classeNom = entry.type === 'eleve' ? (entry as { type: 'eleve'; data: StudentProfile; classeNom?: string }).classeNom : undefined;

            return (
              <div
                key={entry.data.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300/80"
              >
                <div className={['flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold', avatarColor].join(' ')}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#061826]">
                    {prenom} {nom}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className={['rounded-full px-2 py-px text-[10px] font-semibold', entry.type === 'eleve' ? 'bg-[#89aae6]/20 text-[#3685b5]' : 'bg-[#ac80a0]/20 text-[#ac80a0]'].join(' ')}>
                      {ROLE_LABELS[entry.type]}
                    </span>
                    {isAlternant && (
                      <span className="rounded-full bg-amber-100 px-2 py-px text-[10px] font-semibold text-amber-700">
                        Alternant
                      </span>
                    )}
                    {roleSecondaire && ROLE_SECONDAIRE_LABELS[roleSecondaire] && (
                      <span className="rounded-full bg-[#0471a6]/10 px-2 py-px text-[10px] font-semibold text-[#0471a6]">
                        {ROLE_SECONDAIRE_LABELS[roleSecondaire]}
                      </span>
                    )}
                  </div>
                  {(matieres || classeNom) && (
                    <p className="mt-1 truncate text-[11px] text-slate-400">
                      {matieres ?? classeNom}
                    </p>
                  )}
                  {entry.data.phone_mobile && (
                    <a
                      href={`tel:${entry.data.phone_mobile}`}
                      className="mt-0.5 block truncate text-[11px] text-[#0471a6] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {entry.data.phone_mobile}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400">
        {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
