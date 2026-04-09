'use client';

import { useActionState, useEffect, useState } from 'react';
import { Settings, Trash2, X } from 'lucide-react';
import { ROLE_LABELS } from '@/modules/auth/types';
import {
  getFolderPermissions,
  getDocumentUsers,
  setFolderPermission,
  removeFolderPermission,
} from '../actions';
import type { DocFolder, DocPermission, DocUser } from '../types';

const LEVEL_LABELS: Record<string, string> = {
  read: 'Lecture',
  write: 'Écriture',
  admin: 'Administration',
};

interface PermissionsModalProps {
  folder: DocFolder;
  onClose: () => void;
}

export function PermissionsModal({ folder, onClose }: PermissionsModalProps) {
  const [permissions, setPermissions] = useState<DocPermission[]>([]);
  const [users, setUsers] = useState<DocUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [targetType, setTargetType] = useState<'role' | 'user'>('role');
  const [addState, addAction, addPending] = useActionState(setFolderPermission, null);

  useEffect(() => {
    Promise.all([
      getFolderPermissions(folder.id),
      getDocumentUsers(),
    ]).then(([perms, docUsers]) => {
      setPermissions(perms);
      setUsers(docUsers);
      setLoading(false);
    });
  }, [folder.id]);

  useEffect(() => {
    if (addState?.success) {
      getFolderPermissions(folder.id).then(setPermissions);
    }
  }, [addState?.success, folder.id]);

  async function handleRemove(permId: string) {
    const result = await removeFolderPermission(permId);
    if (!result.error) {
      setPermissions((prev) => prev.filter((p) => p.id !== permId));
    }
  }

  const availableRoles = ['eleve', 'professeur', 'coordinateur', 'staff', 'admin'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#0471a6]" />
            <h2 className="font-semibold text-slate-800">Permissions — {folder.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Info sur le comportement par défaut */}
          <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
            Par défaut, tous les utilisateurs du module ont accès en écriture.
            Les règles ci-dessous restreignent ou accordent des droits spécifiques.
          </p>

          {/* Liste des permissions actuelles */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Règles actives
            </h3>
            {loading && <p className="text-sm text-slate-400">Chargement…</p>}
            {!loading && permissions.length === 0 && (
              <p className="text-sm text-slate-400">Aucune règle — accès par défaut.</p>
            )}
            {permissions.map((perm) => (
              <div
                key={perm.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-slate-700">
                    {perm.role_target
                      ? ROLE_LABELS[perm.role_target as keyof typeof ROLE_LABELS] ?? perm.role_target
                      : users.find((u) => u.id === perm.user_target)
                          ? `${users.find((u) => u.id === perm.user_target)!.prenom} ${users.find((u) => u.id === perm.user_target)!.nom}`
                          : perm.user_target?.slice(0, 8) ?? '—'}
                  </span>
                  <span className="ml-2 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200">
                    {LEVEL_LABELS[perm.level]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(perm.id)}
                  className="ml-2 shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Formulaire d'ajout */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Ajouter une règle
            </h3>
            <form action={addAction} className="space-y-3">
              <input type="hidden" name="folder_id" value={folder.id} />

              {/* Type de cible */}
              <div className="flex rounded-xl border border-slate-200 p-1">
                <button
                  type="button"
                  onClick={() => setTargetType('role')}
                  className={[
                    'flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors',
                    targetType === 'role'
                      ? 'bg-[#0471a6] text-white'
                      : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  Par rôle
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('user')}
                  className={[
                    'flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors',
                    targetType === 'user'
                      ? 'bg-[#0471a6] text-white'
                      : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  Par utilisateur
                </button>
              </div>

              {targetType === 'role' ? (
                <select
                  name="role_target"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0471a6] focus:outline-none"
                >
                  <option value="">Choisir un rôle…</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  name="user_target"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0471a6] focus:outline-none"
                >
                  <option value="">Choisir un utilisateur…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.prenom} {u.nom} — {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                    </option>
                  ))}
                </select>
              )}

              <select
                name="level"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0471a6] focus:outline-none"
              >
                <option value="">Niveau d'accès…</option>
                <option value="read">Lecture</option>
                <option value="write">Écriture</option>
                <option value="admin">Administration</option>
              </select>

              {addState?.error && (
                <p className="text-xs text-red-600">{addState.error}</p>
              )}

              <button
                type="submit"
                disabled={addPending}
                className="w-full rounded-xl bg-[#0471a6] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#035a85] disabled:opacity-60"
              >
                {addPending ? 'Ajout…' : 'Ajouter la règle'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
