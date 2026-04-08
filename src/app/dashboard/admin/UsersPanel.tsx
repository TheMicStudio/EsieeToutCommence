'use client';

import { useActionState, useTransition, useState } from 'react';
import { deleteUser, createUser, updateUserProfile } from '@/modules/admin/users-actions';
import type { UserRow } from '@/modules/admin/users-actions';
import { Trash2, Search, Plus, X, Pencil, ChevronDown, ChevronUp, Users } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  eleve: 'bg-[#89aae6]/20 text-[#3685b5]',
  professeur: 'bg-[#ac80a0]/20 text-[#ac80a0]',
  admin: 'bg-[#0471a6]/20 text-[#0471a6]',
  entreprise: 'bg-amber-100 text-amber-700',
};

const ROLE_LABELS: Record<string, string> = {
  eleve: 'Élève',
  professeur: 'Professeur',
  admin: 'Admin',
  entreprise: 'Entreprise',
};

const EXTRA_LABELS: Record<string, string> = {
  temps_plein: 'Temps plein',
  alternant: 'Alternant',
};

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

interface UsersPanelProps {
  users: UserRow[];
  subjects: string[];
  adminFunctions: string[];
  secondaryRoles: { value: string; label: string }[];
}

// ─── Formulaire création utilisateur ─────────────────────────────────────────

function CreateUserForm({
  onClose,
  subjects,
  adminFunctions,
  secondaryRoles,
}: {
  onClose: () => void;
  subjects: string[];
  adminFunctions: string[];
  secondaryRoles: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(createUser, null);
  const [role, setRole] = useState('eleve');
  const [selectedMatieres, setSelectedMatieres] = useState<string[]>([]);
  const [matSearch, setMatSearch] = useState('');

  if (state?.success) {
    onClose();
    return null;
  }

  function toggleMatiere(m: string) {
    setSelectedMatieres((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  const filteredMatieres = subjects.filter((m) =>
    !matSearch || m.toLowerCase().includes(matSearch.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#061826]">Créer un compte</p>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="matieres_enseignees" value={selectedMatieres.join(',')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Prénom *</label>
            <input name="prenom" required placeholder="Jean" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nom *</label>
            <input name="nom" required placeholder="Dupont" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Email *</label>
            <input name="email" type="email" required placeholder="jean.dupont@ecole.fr" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Mot de passe * (8 car. min.)</label>
            <input name="password" type="password" required minLength={8} placeholder="••••••••" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Rôle *</label>
            <select
              name="role"
              value={role}
              onChange={(e) => { setRole(e.target.value); setSelectedMatieres([]); }}
              className={inputCls}
            >
              <option value="eleve">Élève</option>
              <option value="professeur">Professeur</option>
              <option value="admin">Administration</option>
              <option value="entreprise">Entreprise</option>
            </select>
          </div>
        </div>

        {role === 'eleve' && (
          <div>
            <label className={labelCls}>Type de parcours</label>
            <select name="type_parcours" className={inputCls}>
              <option value="temps_plein">Temps plein</option>
              <option value="alternant">Alternant</option>
            </select>
          </div>
        )}

        {role === 'professeur' && (
          <div>
            <label className={labelCls}>
              Matières enseignées ({selectedMatieres.length} sélectionnée{selectedMatieres.length !== 1 ? 's' : ''})
            </label>
            {subjects.length === 0 ? (
              <p className="text-xs text-amber-600 rounded-xl bg-amber-50 px-3 py-2">
                Aucune matière configurée. Ajoutez-en dans l&apos;onglet Configuration.
              </p>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer les matières…"
                    value={matSearch}
                    onChange={(e) => setMatSearch(e.target.value)}
                    className="flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:bg-white transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto rounded-xl border border-slate-200/60 bg-slate-50/60 p-2">
                  {filteredMatieres.map((m) => (
                    <label
                      key={m}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                        selectedMatieres.includes(m)
                          ? 'bg-[#0471a6]/10 text-[#0471a6] font-semibold'
                          : 'hover:bg-white text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMatieres.includes(m)}
                        onChange={() => toggleMatiere(m)}
                        className="accent-[#0471a6]"
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {role === 'admin' && (
          <div>
            <label className={labelCls}>Fonction</label>
            <select name="fonction" className={inputCls}>
              <option value="">— Sélectionner —</option>
              {adminFunctions.length > 0
                ? adminFunctions.map((f) => <option key={f} value={f}>{f}</option>)
                : <option disabled>Aucune fonction configurée</option>
              }
            </select>
          </div>
        )}

        {role === 'entreprise' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Entreprise *</label>
              <input name="entreprise" required placeholder="Acme Corp" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Poste</label>
              <input name="poste" placeholder="Maître d&apos;apprentissage" className={inputCls} />
            </div>
          </div>
        )}

        {state?.error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
          >
            {pending ? 'Création…' : 'Créer le compte'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Formulaire édition utilisateur ──────────────────────────────────────────

function EditUserForm({
  user,
  onClose,
  subjects,
  adminFunctions,
  secondaryRoles,
}: {
  user: UserRow;
  onClose: () => void;
  subjects: string[];
  adminFunctions: string[];
  secondaryRoles: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(updateUserProfile, null);
  const [selectedMatieres, setSelectedMatieres] = useState<string[]>(user.matieres ?? []);
  const [matSearch, setMatSearch] = useState('');

  if (state?.success) {
    onClose();
    return null;
  }

  function toggleMatiere(m: string) {
    setSelectedMatieres((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  const filteredMatieres = subjects.filter((m) =>
    !matSearch || m.toLowerCase().includes(matSearch.toLowerCase())
  );

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
      <form action={action} className="space-y-4">
        <input type="hidden" name="user_id" value={user.id} />
        <input type="hidden" name="role" value={user.role} />
        {user.role === 'professeur' && (
          <input type="hidden" name="matieres_enseignees" value={selectedMatieres.join(',')} />
        )}

        <p className={labelCls}>Éditer — {user.prenom} {user.nom}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelCls}>Prénom</label>
            <input name="prenom" defaultValue={user.prenom} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nom</label>
            <input name="nom" defaultValue={user.nom} required className={inputCls} />
          </div>

          {user.role === 'eleve' && (
            <>
              <div>
                <label className={labelCls}>Parcours</label>
                <select name="type_parcours" defaultValue={user.extra ?? 'temps_plein'} className={inputCls}>
                  <option value="temps_plein">Temps plein</option>
                  <option value="alternant">Alternant</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Rôle secondaire</label>
                <select name="role_secondaire" defaultValue={user.role_secondaire ?? ''} className={inputCls}>
                  <option value="">— Aucun —</option>
                  {secondaryRoles.length > 0
                    ? secondaryRoles.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))
                    : <option disabled>Aucun rôle configuré</option>
                  }
                </select>
              </div>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <div>
                <label className={labelCls}>Fonction</label>
                <select name="fonction" defaultValue={user.extra ?? ''} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {adminFunctions.length > 0
                    ? adminFunctions.map((f) => <option key={f} value={f}>{f}</option>)
                    : <option disabled>Aucune fonction configurée</option>
                  }
                </select>
              </div>
              <div>
                <label className={labelCls}>Rôle secondaire</label>
                <select name="role_secondaire" defaultValue={user.role_secondaire ?? ''} className={inputCls}>
                  <option value="">— Aucun —</option>
                  {secondaryRoles.length > 0
                    ? secondaryRoles.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))
                    : <option disabled>Aucun rôle configuré</option>
                  }
                </select>
              </div>
            </>
          )}

          {user.role === 'entreprise' && (
            <>
              <div>
                <label className={labelCls}>Entreprise</label>
                <input name="entreprise" defaultValue={user.extra ?? ''} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Poste</label>
                <input name="poste" className={inputCls} />
              </div>
            </>
          )}
        </div>

        {user.role === 'professeur' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>
                Matières enseignées ({selectedMatieres.length} sélectionnée{selectedMatieres.length !== 1 ? 's' : ''})
              </label>
              {subjects.length === 0 ? (
                <p className="text-xs text-amber-600 rounded-xl bg-amber-50 px-3 py-2">
                  Aucune matière configurée. Ajoutez-en dans l&apos;onglet Configuration.
                </p>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrer…"
                      value={matSearch}
                      onChange={(e) => setMatSearch(e.target.value)}
                      className="flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto rounded-xl border border-slate-200/60 bg-white p-2">
                    {filteredMatieres.map((m) => (
                      <label
                        key={m}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                          selectedMatieres.includes(m)
                            ? 'bg-[#0471a6]/10 text-[#0471a6] font-semibold'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMatieres.includes(m)}
                          onChange={() => toggleMatiere(m)}
                          className="accent-[#0471a6]"
                        />
                        {m}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div>
              <label className={labelCls}>Rôle secondaire</label>
              <select name="role_secondaire" defaultValue={user.role_secondaire ?? ''} className={inputCls}>
                <option value="">— Aucun —</option>
                {secondaryRoles.length > 0
                  ? secondaryRoles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))
                  : <option disabled>Aucun rôle configuré</option>
                }
              </select>
            </div>
          </div>
        )}

        {state?.error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
          >
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function UsersPanel({ users, subjects, adminFunctions, secondaryRoles }: UsersPanelProps) {
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = users.filter((u) => {
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchQuery =
      !query ||
      `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(query.toLowerCase());
    return matchRole && matchQuery;
  });

  function handleDelete(userId: string) {
    if (confirmDelete !== userId) {
      setConfirmDelete(userId);
      return;
    }
    setConfirmDelete(null);
    startTransition(async () => { await deleteUser(userId); });
  }

  const roleCounts = {
    eleve: users.filter((u) => u.role === 'eleve').length,
    professeur: users.filter((u) => u.role === 'professeur').length,
    admin: users.filter((u) => u.role === 'admin').length,
    entreprise: users.filter((u) => u.role === 'entreprise').length,
  };

  return (
    <div className="space-y-5">
      {/* Stats par rôle */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { role: 'eleve', label: 'Élèves', color: 'text-[#3685b5]', bg: 'bg-[#89aae6]/10' },
          { role: 'professeur', label: 'Professeurs', color: 'text-[#ac80a0]', bg: 'bg-[#ac80a0]/10' },
          { role: 'admin', label: 'Admins', color: 'text-[#0471a6]', bg: 'bg-[#0471a6]/10' },
          { role: 'entreprise', label: 'Entreprises', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s) => (
          <button
            key={s.role}
            onClick={() => setRoleFilter(roleFilter === s.role ? '' : s.role)}
            className={[
              'rounded-2xl border border-slate-200/60 p-4 text-center transition-all',
              s.bg,
              roleFilter === s.role ? 'ring-2 ring-[#0471a6]/30 border-[#0471a6]/40' : 'hover:border-slate-300',
            ].join(' ')}
          >
            <p className={['text-2xl font-bold', s.color].join(' ')}>{roleCounts[s.role as keyof typeof roleCounts]}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Créer un compte */}
      {showCreate ? (
        <CreateUserForm
          onClose={() => setShowCreate(false)}
          subjects={subjects}
          adminFunctions={adminFunctions}
          secondaryRoles={secondaryRoles}
        />
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Créer un compte
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 transition-all"
        >
          <option value="">Tous les rôles</option>
          <option value="eleve">Élèves</option>
          <option value="professeur">Professeurs</option>
          <option value="admin">Admins</option>
          <option value="entreprise">Entreprises</option>
        </select>
        <span className="flex items-center text-xs text-slate-400 px-1">
          {filtered.length}/{users.length} utilisateurs
        </span>
      </div>

      {/* Liste */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
        {/* En-tête */}
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-0 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span>Nom</span>
          <span>Email</span>
          <span className="w-24 text-center">Rôle</span>
          <span className="w-24 hidden sm:block">Info</span>
          <span className="w-16"></span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-8 w-8 text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <div key={u.id}>
                <div
                  className={`grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-0 px-4 py-3 transition-colors ${
                    editingUser === u.id ? 'bg-[#0471a6]/5' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <span className="text-sm font-medium text-[#061826] truncate pr-3">
                    {u.prenom} {u.nom}
                  </span>
                  <span className="text-xs text-slate-500 truncate pr-3">{u.email}</span>
                  <div className="w-24 flex justify-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-500'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </div>
                  <div className="w-24 hidden sm:block">
                    <span className="text-xs text-slate-400 truncate">
                      {u.extra ? (EXTRA_LABELS[u.extra] ?? u.extra) : '—'}
                    </span>
                  </div>
                  <div className="w-16 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                      className="text-slate-300 hover:text-[#0471a6] transition-colors"
                      title="Éditer"
                    >
                      {editingUser === u.id
                        ? <ChevronUp className="h-4 w-4" />
                        : <Pencil className="h-4 w-4" />
                      }
                    </button>

                    {confirmDelete === u.id ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-[11px] font-semibold text-red-500 hover:underline"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-[11px] text-slate-400 hover:underline"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {editingUser === u.id && (
                  <EditUserForm
                    user={u}
                    onClose={() => setEditingUser(null)}
                    subjects={subjects}
                    adminFunctions={adminFunctions}
                    secondaryRoles={secondaryRoles}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
