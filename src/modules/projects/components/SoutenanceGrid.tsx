'use client';

import { useState } from 'react';
import { bookSlot, updateSlot } from '../actions';
import type { SoutenanceSlot } from '../types';
import { Clock, CheckCircle2, Pencil, Check, X } from 'lucide-react';

interface SoutenanceGridProps {
  slots: SoutenanceSlot[];
  weekId: string;
  myGroupId?: string;
  isProf?: boolean;
}

function toLocalTimeInput(iso: string) {
  // Convertit un ISO UTC en heure locale HH:MM pour l'input time
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

interface SlotRowProps {
  slot: SoutenanceSlot;
  weekId: string;
  myGroupId?: string;
  isProf: boolean;
  onBooked: (slotId: string, groupId: string) => void;
  onUpdated: (slotId: string, debut: string, fin: string) => void;
}

function SlotRow({ slot, weekId, myGroupId, isProf, onBooked, onUpdated }: SlotRowProps) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(toLocalDateInput(slot.heure_debut));
  const [startTime, setStartTime] = useState(toLocalTimeInput(slot.heure_debut));
  const [endTime, setEndTime] = useState(toLocalTimeInput(slot.heure_fin));
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

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
  }

  async function handleBook() {
    if (!myGroupId) return;
    setBooking(true);
    setError('');
    const result = await bookSlot(slot.id, myGroupId, weekId);
    setBooking(false);
    if (result.error) { setError(result.error); return; }
    onBooked(slot.id, myGroupId);
  }

  const inputCls = 'h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] transition-all';

  if (editing) {
    return (
      <div className="rounded-2xl border border-[#89aae6]/40 bg-[#89aae6]/5 px-4 py-3 space-y-3">
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

  return (
    <div
      className={[
        'flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors',
        isMySlot
          ? 'border-[#89aae6]/40 bg-[#89aae6]/10'
          : isTaken
            ? 'border-slate-200 bg-slate-50'
            : 'border-emerald-200/60 bg-emerald-50/60',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <Clock className={`h-4 w-4 shrink-0 ${isMySlot ? 'text-[#0471a6]' : isTaken ? 'text-slate-400' : 'text-emerald-500'}`} />
        <div>
          <p className="text-sm font-medium text-slate-700">
            {new Date(slot.heure_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {' → '}
            {new Date(slot.heure_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {isTaken && (
            <p className="text-xs text-slate-400">
              {isMySlot ? 'Votre groupe — ' : ''}{slot.group_name ?? 'Réservé'}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isMySlot && <CheckCircle2 className="h-4 w-4 text-[#0471a6]" />}

        {!isTaken && myGroupId && !isProf && (
          <button
            type="button"
            onClick={handleBook}
            disabled={booking}
            className="rounded-xl bg-[#0471a6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0471a6]/90 transition-colors disabled:opacity-50"
          >
            {booking ? '…' : 'Réserver'}
          </button>
        )}

        {!isTaken && !myGroupId && !isProf && (
          <span className="text-xs font-medium text-emerald-600">Libre</span>
        )}

        {isProf && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Modifier ce créneau"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function SoutenanceGrid({ slots, weekId, myGroupId, isProf }: SoutenanceGridProps) {
  const [localSlots, setLocalSlots] = useState(slots);

  function handleBooked(slotId: string, groupId: string) {
    setLocalSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, group_id: groupId } : s));
  }

  function handleUpdated(slotId: string, debut: string, fin: string) {
    setLocalSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, heure_debut: debut, heure_fin: fin } : s));
  }

  if (localSlots.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
        <p className="text-sm text-slate-400">Aucun créneau défini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {localSlots.map((slot) => (
        <SlotRow
          key={slot.id}
          slot={slot}
          weekId={weekId}
          myGroupId={myGroupId}
          isProf={!!isProf}
          onBooked={handleBooked}
          onUpdated={handleUpdated}
        />
      ))}
    </div>
  );
}
