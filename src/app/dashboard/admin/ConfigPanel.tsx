'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSubject, deleteSubject,
  createAdminFunction, deleteAdminFunction,
  createTicketCategory, deleteTicketCategory,
  createSecondaryRole, deleteSecondaryRole,
} from '@/modules/admin/config-actions';
import type { ConfigItem, CategoryItem, RoleItem } from '@/modules/admin/config-actions';
import { Plus, Trash2, BookOpen, Briefcase, Tag, Users, Info } from 'lucide-react';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';

// ─── Section générique ────────────────────────────────────────────────────────

function ConfigSection({
  title,
  description,
  icon: Icon,
  iconBg,
  items,
  displayKey,
  createAction,
  deleteAction,
  inputPlaceholder,
  inputName = 'nom',
  showSlug = false,
}: Readonly<{
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  items: (ConfigItem | CategoryItem | RoleItem)[];
  displayKey: 'nom' | 'label';
  createAction: (prev: { error?: string; success?: boolean } | null, fd: FormData) => Promise<{ error?: string; success?: boolean }>;
  deleteAction: (id: string) => Promise<void>;
  inputPlaceholder: string;
  inputName?: string;
  showSlug?: boolean;
}>) {
  const [state, action, pending] = useActionState(createAction, null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      {/* En-tête */}
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
        <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg].join(' ')}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[#061826]">{title}</p>
            <span className="rounded-full bg-white border border-slate-200/60 px-2.5 py-0.5 text-xs font-bold text-slate-500">
              {items.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Liste existante */}
        {items.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-400">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Aucun élément. Ajoutez-en ci-dessous.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
              >
                <span className="text-slate-700">
                  {displayKey === 'nom' ? (item as ConfigItem).nom : (item as CategoryItem).label}
                </span>
                {showSlug && (
                  <span className="text-[11px] text-slate-400">
                    ({(item as CategoryItem).slug})
                  </span>
                )}
                <button
                  onClick={() => startTransition(async () => { await deleteAction(item.id); router.refresh(); })}
                  className="ml-0.5 text-slate-300 hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire ajout */}
        <form action={action} className="flex gap-2">
          <input
            name={inputName}
            placeholder={inputPlaceholder}
            required
            className={inputCls}
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </form>
        {state?.error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{state.error}</p>
        )}
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

interface ConfigPanelProps {
  subjects: ConfigItem[];
  adminFunctions: ConfigItem[];
  ticketCategories: (CategoryItem | RoleItem)[];
  secondaryRoles: (RoleItem | CategoryItem)[];
}

export function ConfigPanel({ subjects, adminFunctions, ticketCategories, secondaryRoles }: Readonly<ConfigPanelProps>) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#89aae6]/30 bg-[#89aae6]/5 px-5 py-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-[#3685b5] mt-0.5 shrink-0" />
        <p className="text-sm text-[#3685b5]">
          Ces listes remplacent les valeurs codées en dur dans toute la plateforme.
          Matières, fonctions, catégories et rôles secondaires sont utilisés lors de la création et modification des profils.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConfigSection
          title="Matières enseignées"
          description="Utilisées dans les profils professeurs et les affectations de classes."
          icon={BookOpen}
          iconBg="bg-purple-100 text-purple-600"
          items={subjects}
          displayKey="nom"
          createAction={createSubject}
          deleteAction={deleteSubject}
          inputPlaceholder="Ex: Robotique, Marketing Digital…"
          inputName="nom"
        />

        <ConfigSection
          title="Fonctions administratives"
          description="Fonctions proposées lors de la création des comptes admin."
          icon={Briefcase}
          iconBg="bg-[#0471a6]/10 text-[#0471a6]"
          items={adminFunctions}
          displayKey="nom"
          createAction={createAdminFunction}
          deleteAction={deleteAdminFunction}
          inputPlaceholder="Ex: Chargé·e de relations entreprises…"
          inputName="nom"
        />

        <ConfigSection
          title="Catégories de tickets"
          description="Catégories disponibles lors de la création d'un ticket support."
          icon={Tag}
          iconBg="bg-amber-100 text-amber-600"
          items={ticketCategories}
          displayKey="label"
          createAction={createTicketCategory}
          deleteAction={deleteTicketCategory}
          inputPlaceholder="Ex: Vie associative"
          inputName="label"
          showSlug={true}
        />

        <ConfigSection
          title="Rôles secondaires élèves"
          description="Rôles optionnels attribuables aux élèves (délégué, BDE…)."
          icon={Users}
          iconBg="bg-emerald-100 text-emerald-600"
          items={secondaryRoles}
          displayKey="label"
          createAction={createSecondaryRole}
          deleteAction={deleteSecondaryRole}
          inputPlaceholder="Ex: Délégué·e de classe"
          inputName="label"
          showSlug={true}
        />
      </div>
    </div>
  );
}
