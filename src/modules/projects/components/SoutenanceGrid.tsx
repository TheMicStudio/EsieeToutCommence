'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookSlot, releaseSlot, updateSlot } from '../actions';
import type { SoutenanceSlot } from '../types';
import { Clock, Check, X, CheckCircle2, Undo2 } from 'lucide-react';
import { SlotCard } from './SlotCard';

interface SoutenanceGridProps {
  slots: SoutenanceSlot[];
  weekId: string;
  myGroupId?: string;
  isProf?: boolean;
  canRelease?: boolean;
}

function toLocalTimeInput(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ':');
}

function toLocalDateInput(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function formatSlotDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

interface SlotRowProps {
  slot: SoutenanceSlot;
  weekId: string;
  myGroupId?: string;
  isProf: boolean;
  canRelease: boolean;
  onBooked: (slotId: string, groupId: string) => void;
  onReleased: (slotId: string) => void;
  onUpdated: (slotId: string, debut: string, fin: string) => void;
}

const inputCls = 'h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] transition-all';

function SlotRow({ slot, weekId, myGroupId, isProf, canRelease, onBooked, onReleased, onUpdated }: Readonly<SlotRowProps>) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(toLocalDateInput(slot.heure_debut));
  const [startTime, setStartTime] = useState(toLocalTimeInput(slot.heure_debut));
  const [endTime, setEndTime] = useState(toLocalTimeInput(slot.heure_fin));
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const isTaken = !!slot.group_id;
  const isMySlot = slot.group_id === myGroupId;

  async function handleSave() {
    setSaving(true);
    setError('');
    const result = await updateSlot(slot.id, buildIso(date, startTime), buildIso(date, endTime), weekId);
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onUpdated(slot.id, buildIso(date, startTime), buildIso(date, endTime));
    setEditing(false);
    router.refresh();
  }

  async function handleBook() {
    if (!myGroupId) return;
    setBooking(true);
    setError('');
    const result = await bookSlot(slot.id, myGroupId, weekId);
    setBooking(false);
    if (result.error) { setError(result.error); return; }
    onBooked(slot.id, myGroupId);
    router.refresh();
  }

  async function handleRelease() {
    if (!myGroupId) return;
    setReleasing(true);
    setError('');
    const result = await releaseSlot(slot.id, myGroupId, weekId);
    setReleasing(false);
    if (result.error) { setError(result.error); return; }
    onReleased(slot.id);
    router.refresh();
  }

  /* ── Edit mode ─────────────────────────────────────────────────── */
  if (editing) {
    return (
      <div className="rounded-3xl border border-[#89aae6]/40 bg-[#89aae6]/5 px-5 py-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Clock className="h-4 w-4 text-[#0471a6] shrink-0" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          <span className="text-xs text-slate-400">de</span>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
          <span className="text-xs text-slate-400">à</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0471a6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? '…' : 'Valider'}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setError(''); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  /* ── Derive SlotCard props from slot data ───────────────────────── */
  const timeRange = `${formatTime(slot.heure_debut)} → ${formatTime(slot.heure_fin)}`;
  const dateStr   = formatSlotDate(slot.heure_debut);

  let badge: { label: string; type: 'cyan' | 'slate' | 'emerald'; hasIcon?: boolean };
  if (isMySlot) {
    badge = { label: 'Votre créneau', type: 'cyan', hasIcon: true };
  } else if (isTaken) {
    badge = { label: 'Réservé', type: 'slate' };
  } else {
    badge = { label: 'Disponible', type: 'emerald' };
  }

  const description = isTaken
    ? (slot.group_name ?? 'Groupe réservé')
    : 'Créneau libre — Réserve pour assurer ton passage';

  let reserveActions: React.ReactNode;
  if (isProf) {
    reserveActions = (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
      >
        Modifier
      </button>
    );
  } else if (isMySlot) {
    reserveActions = (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0471a6]">
          <CheckCircle2 className="h-4 w-4" />
          Confirmé
        </span>
        {canRelease && (
          <button
            type="button"
            onClick={handleRelease}
            disabled={releasing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-colors"
          >
            <Undo2 className="h-3.5 w-3.5" />
            {releasing ? '…' : 'Se désinscrire'}
          </button>
        )}
      </div>
    );
  } else if (!isTaken && myGroupId) {
    reserveActions = undefined;
  } else if (isTaken) {
    reserveActions = <span className="text-[13px] font-semibold text-slate-400">Réservé</span>;
  } else {
    reserveActions = <span className="text-[13px] font-semibold text-emerald-600">Libre</span>;
  }

  return (
    <div>
      <SlotCard
        icon="lucide:calendar"
        title={timeRange}
        badge={badge}
        description={description}
        metadata={[
          { icon: 'lucide:clock', text: dateStr },
        ]}
        onReserve={!isTaken && myGroupId && !isProf ? handleBook : undefined}
        reserveDisabled={booking}
        reserveLabel={booking ? '…' : 'Réserver'}
        actions={reserveActions}
      />
      {error && <p className="mt-1 px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function SoutenanceGrid({ slots, weekId, myGroupId, isProf, canRelease = false }: SoutenanceGridProps) {
  const [localSlots, setLocalSlots] = useState(slots);

  function handleBooked(slotId: string, groupId: string) {
    setLocalSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, group_id: groupId } : s));
  }

  function handleReleased(slotId: string) {
    setLocalSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, group_id: undefined, group_name: undefined } : s));
  }

  function handleUpdated(slotId: string, debut: string, fin: string) {
    setLocalSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, heure_debut: debut, heure_fin: fin } : s));
  }

  if (localSlots.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white">
        <p className="text-sm text-slate-400">Aucun créneau défini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {localSlots.map((slot) => (
        <SlotRow
          key={slot.id}
          slot={slot}
          weekId={weekId}
          myGroupId={myGroupId}
          isProf={!!isProf}
          canRelease={canRelease}
          onBooked={handleBooked}
          onReleased={handleReleased}
          onUpdated={handleUpdated}
        />
      ))}
    </div>
  );
}
