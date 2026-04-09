'use client';

import { useState, useTransition } from 'react';
import {
  Clock, Plus, Trash2, ChevronDown, ChevronRight,
  Loader2, AlertCircle, CheckCircle2, User,
} from 'lucide-react';
import {
  upsertAvailabilitySlot,
  deleteAvailabilitySlot,
  type TeacherForPlanning,
  type AvailabilitySlot,
} from '@/modules/admin/planning-actions';

const inputCls =
  'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls =
  'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const DAY_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

// ─── Formulaire d'ajout de créneau ───────────────────────────────────────────

function AddSlotForm({
  teacherId,
  onAdded,
}: {
  teacherId: string;
  onAdded: (slot: AvailabilitySlot) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startAdd] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const day = parseInt(fd.get('day_of_week') as string);
    const start = fd.get('start_time') as string;
    const end = fd.get('end_time') as string;
    setError(null);
    startAdd(async () => {
      const res = await upsertAvailabilitySlot(teacherId, day, start, end, true);
      if (res.error) { setError(res.error); return; }
      setSuccess(true);
      // Créer un objet local pour l'optimistic update
      const fakeSlot: AvailabilitySlot = {
        id: `${teacherId}-${day}-${start}`,
        teacher_id: teacherId,
        day_of_week: day,
        start_time: start,
        end_time: end,
        is_available: true,
      };
      onAdded(fakeSlot);
      setTimeout(() => { setSuccess(false); setOpen(false); }, 600);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:border-[#89aae6] hover:text-[#3685b5] transition-all"
      >
        <Plus className="h-4 w-4" /> Ajouter un créneau
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Jour</label>
          <select name="day_of_week" required className={inputCls}>
            {DAYS.map((d, i) => (
              <option key={d} value={i + 1}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Début</label>
          <input name="start_time" type="time" defaultValue="08:00" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Fin</label>
          <input name="end_time" type="time" defaultValue="18:00" required className={inputCls} />
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button" onClick={() => setOpen(false)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit" disabled={pending || success}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          {success ? <><CheckCircle2 className="h-4 w-4" /> Ajouté</> :
           pending  ? <><Loader2 className="h-4 w-4 animate-spin" /> Ajout…</> :
                      <><Plus className="h-4 w-4" /> Ajouter</>}
        </button>
      </div>
    </form>
  );
}

// ─── Carte d'un professeur ────────────────────────────────────────────────────

function TeacherAvailabilityCard({
  teacher,
  initialSlots,
}: {
  teacher: TeacherForPlanning;
  initialSlots: AvailabilitySlot[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [slots, setSlots] = useState(initialSlots);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteAvailabilitySlot(id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
  }

  // Grouper par jour
  const byDay: Record<number, AvailabilitySlot[]> = {};
  for (const slot of slots) {
    if (!byDay[slot.day_of_week]) byDay[slot.day_of_week] = [];
    byDay[slot.day_of_week].push(slot);
  }

  const totalSlots = slots.length;
  const activeDays = Object.keys(byDay).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ac80a0]/20 text-[#ac80a0] text-sm font-bold">
          {teacher.prenom[0]}{teacher.nom[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#061826]">
            {teacher.prenom} {teacher.nom}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {teacher.matieres_enseignees.slice(0, 3).join(' · ') || 'Aucune matière'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalSlots > 0 ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              {activeDays}j · {totalSlots} créneau{totalSlots > 1 ? 'x' : ''}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
              Non configuré
            </span>
          )}
          {expanded
            ? <ChevronDown className="h-4 w-4 text-slate-400" />
            : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          {/* Créneaux par jour */}
          {[1, 2, 3, 4, 5].map((day) => {
            const daySlots = byDay[day] ?? [];
            if (daySlots.length === 0 && !expanded) return null;
            return (
              <div key={day}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={['rounded-full px-2.5 py-0.5 text-[11px] font-semibold', DAY_COLORS[day - 1]].join(' ')}>
                    {DAYS[day - 1]}
                  </span>
                  {daySlots.length === 0 && (
                    <span className="text-xs text-slate-400">Aucun créneau</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {daySlots
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5"
                      >
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-[#061826]">
                          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </span>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          disabled={deletingId === slot.id}
                          className="text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-50"
                        >
                          {deletingId === slot.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}

          <AddSlotForm
            teacherId={teacher.id}
            onAdded={(slot) => setSlots((prev) => [...prev, slot])}
          />
        </div>
      )}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function AvailabilityPanel({
  teachers,
  slotsByTeacher,
}: {
  teachers: TeacherForPlanning[];
  slotsByTeacher: Record<string, AvailabilitySlot[]>;
}) {
  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <User className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-500">Aucun professeur trouvé</p>
        <p className="text-xs text-slate-400 max-w-xs">
          Créez d&apos;abord des comptes professeurs depuis la page Administration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#061826]">
        {teachers.length} professeur{teachers.length > 1 ? 's' : ''} — cliquez pour configurer les disponibilités
      </p>
      {teachers.map((teacher) => (
        <TeacherAvailabilityCard
          key={teacher.id}
          teacher={teacher}
          initialSlots={slotsByTeacher[teacher.id] ?? []}
        />
      ))}
    </div>
  );
}
