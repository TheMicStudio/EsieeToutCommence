'use client';

import { useState, useTransition } from 'react';
import { toggleRolePermission, resetRolePermissions } from '@/modules/admin/permissions-actions';
import type { PermissionRow, RolePermissionMap } from '@/modules/admin/permissions-actions';
import { Shield, RotateCcw, Loader2 } from 'lucide-react';

const ROLES = [
  { id: 'eleve',        label: 'Élève',                   color: 'text-blue-600' },
  { id: 'professeur',   label: 'Professeur',              color: 'text-purple-600' },
  { id: 'coordinateur', label: 'Resp. pédagogique',       color: 'text-violet-600' },
  { id: 'staff',        label: 'Secrétariat',             color: 'text-amber-600' },
  { id: 'admin',        label: 'Direction',               color: 'text-[#0471a6]' },
  { id: 'entreprise',   label: 'Tuteur professionnel',    color: 'text-emerald-600' },
  { id: 'parent',       label: "Parent d'élève",          color: 'text-rose-600' },
] as const;

const MODULE_LABELS: Record<string, string> = {
  news:           'Actualités',
  directory:      'Annuaire',
  class:          'Classes',
  course_material:'Supports de cours',
  grade:          'Notes & moyennes',
  project:        'Projets',
  attendance:     'Émargement',
  career:         'Carrière',
  alternance:     'Alternance',
  support:        'Support',
  messaging:      'Messagerie staff',
  profile:        'Profil',
  admin:          'Administration',
};

const LEVEL_BADGE: Record<string, string> = {
  read:       'bg-blue-50 text-blue-600',
  write:      'bg-purple-50 text-purple-600',
  manage:     'bg-rose-50 text-rose-600',
  participate:'bg-emerald-50 text-emerald-600',
};

interface Props {
  permissions: PermissionRow[];
  matrix: RolePermissionMap;
}

export function PermissionsPanel({ permissions, matrix: initialMatrix }: Readonly<Props>) {
  const [matrix, setMatrix] = useState<RolePermissionMap>(initialMatrix);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [resetting, startReset] = useTransition();

  const loadingKey = (role: string, key: string) => `${role}:${key}`;

  async function handleToggle(role: string, permKey: string, current: boolean) {
    const k = loadingKey(role, permKey);
    setLoading((p) => ({ ...p, [k]: true }));
    setError(null);

    // Optimistic update
    setMatrix((prev) => ({
      ...prev,
      [role]: { ...(prev[role] ?? {}), [permKey]: !current },
    }));

    const result = await toggleRolePermission(role, permKey, !current);

    if (result.error) {
      // Rollback
      setMatrix((prev) => ({
        ...prev,
        [role]: { ...(prev[role] ?? {}), [permKey]: current },
      }));
      setError(result.error);
    }

    setLoading((p) => ({ ...p, [k]: false }));
  }

  async function handleReset(role: string) {
    setError(null);
    startReset(async () => {
      const result = await resetRolePermissions(role);
      if (result.error) setError(result.error);
    });
  }

  // Grouper par module
  const byModule = permissions.reduce<Record<string, PermissionRow[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Configurez les accès de chaque rôle. Les modifications sont appliquées immédiatement.
          </p>
        </div>
        {error && (
          <p className="shrink-0 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs text-rose-600">
            {error}
          </p>
        )}
      </div>

      {/* Légende niveaux */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {Object.entries(LEVEL_BADGE).map(([level, cls]) => (
          <span key={level} className={`rounded-full px-2 py-0.5 font-semibold ${cls}`}>
            {level}
          </span>
        ))}
        <span className="text-slate-400 self-center">— niveau d&apos;accès de la permission</span>
      </div>

      {/* Matrice par module */}
      {Object.entries(byModule).map(([module, perms]) => (
        <div key={module} className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden">
          {/* Header module */}
          <div className="flex items-center gap-2 bg-slate-50/80 border-b border-slate-100 px-4 py-2.5">
            <Shield className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">
              {MODULE_LABELS[module] ?? module}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-[280px] min-w-[220px] px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Permission
                  </th>
                  {ROLES.map((r) => (
                    <th key={r.id} className={`w-20 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider ${r.color}`}>
                      {r.label}
                    </th>
                  ))}
                  <th className="w-20 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {perms.map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${LEVEL_BADGE[perm.level]}`}>
                          {perm.level}
                        </span>
                        <div>
                          <p className="font-medium text-slate-700 leading-tight">{perm.key.split('.')[1]}</p>
                          <p className="text-[11px] text-slate-400 leading-tight">{perm.description}</p>
                        </div>
                      </div>
                    </td>
                    {ROLES.map((role) => {
                      const enabled = matrix[role.id]?.[perm.key] ?? false;
                      const k = loadingKey(role.id, perm.key);
                      const isProtected = role.id === 'admin' && perm.key === 'permission.manage';
                      return (
                        <td key={role.id} className="px-2 py-2 text-center">
                          {loading[k] ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400 mx-auto" />
                          ) : (
                            <button
                              type="button"
                              disabled={isProtected}
                              onClick={() => handleToggle(role.id, perm.key, enabled)}
                              title={isProtected ? 'Permission protégée' : enabled ? 'Désactiver' : 'Activer'}
                              className={[
                                'mx-auto flex h-5 w-9 items-center rounded-full transition-colors duration-150',
                                enabled ? 'bg-[#0471a6]' : 'bg-slate-200',
                                isProtected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80',
                              ].join(' ')}
                            >
                              <span className={[
                                'h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150',
                                enabled ? 'translate-x-[18px]' : 'translate-x-[2px]',
                              ].join(' ')} />
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Réinitialisation par rôle */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Réinitialiser un rôle aux valeurs par défaut</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              disabled={resetting}
              onClick={() => handleReset(role.id)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              {resetting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              {role.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
