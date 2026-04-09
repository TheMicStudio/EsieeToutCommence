'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSoutenanceSlots, clearSoutenanceSlots, randomizeSlots } from '../actions';
import { Clock, Shuffle, Trash2, Plus, Check } from 'lucide-react';

const inputCls = 'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

interface CreateSoutenanceSlotsFormProps {
  weekId: string;
  groupCount: number;
  hasSlots: boolean;
}

function generateSlots(date: string, startTime: string, durationMin: number, count: number) {
  const slots: { heure_debut: string; heure_fin: string; label: string }[] = [];
  if (!date || !startTime || durationMin <= 0 || count <= 0) return slots;

  const [h, m] = startTime.split(':').map(Number);
  let currentMinutes = h * 60 + m;

  for (let i = 0; i < count; i++) {
    const startH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
    const startM = (currentMinutes % 60).toString().padStart(2, '0');
    const endMinutes = currentMinutes + durationMin;
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');

    // new Date interprète la chaîne comme heure locale → .toISOString() la convertit en UTC pour la DB
    const debut = new Date(`${date}T${startH}:${startM}:00`);
    const fin = new Date(`${date}T${endH}:${endM}:00`);

    slots.push({
      heure_debut: debut.toISOString(),
      heure_fin: fin.toISOString(),
      label: `${startH}:${startM} → ${endH}:${endM}`,
    });
    currentMinutes = endMinutes;
  }
  return slots;
}

export function CreateSoutenanceSlotsForm({ weekId, groupCount, hasSlots }: Readonly<CreateSoutenanceSlotsFormProps>) {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(15);
  const [count, setCount] = useState(groupCount || 1);
  const [loading, setLoading] = useState(false);
  const [randomizing, setRandomizing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const preview = generateSlots(date, startTime, duration, count);

  async function handleGenerate() {
    if (!date || preview.length === 0) { setError('Remplissez la date et l\'heure'); return; }
    setLoading(true);
    setError('');
    setSuccess('');

    if (hasSlots) {
      const clear = await clearSoutenanceSlots(weekId);
      if (clear.error) { setError(clear.error); setLoading(false); return; }
    }

    const result = await createSoutenanceSlots(weekId, preview.map(({ heure_debut, heure_fin }) => ({ heure_debut, heure_fin })));
    setLoading(false);
    if (result.error) setError(result.error);
    else { setSuccess(`${preview.length} créneaux générés !`); setTimeout(() => setSuccess(''), 3000); router.refresh(); }
  }

  async function handleRandomize() {
    setRandomizing(true);
    setError('');
    setSuccess('');
    const result = await randomizeSlots(weekId);
    setRandomizing(false);
    if (result.error) setError(result.error);
    else { setSuccess('Ordre aléatoire appliqué !'); setTimeout(() => setSuccess(''), 3000); router.refresh(); }
  }

  async function handleClear() {
    setClearing(true);
    setError('');
    const result = await clearSoutenanceSlots(weekId);
    setClearing(false);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
        <p className="font-semibold text-[#061826]">Configurer les passages oraux</p>
        <p className="mt-0.5 text-xs text-slate-400">{groupCount} groupe{groupCount !== 1 ? 's' : ''} dans cette semaine</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Paramètres */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="ss-date" className={labelCls}>Date des oraux</label>
            <input id="ss-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ss-startTime" className={labelCls}>Début</label>
            <input id="ss-startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ss-duration" className={labelCls}>Durée / groupe</label>
            <select id="ss-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls}>
              <option value={5}>5 min</option>
              <option value={8}>8 min</option>
              <option value={10}>10 min</option>
              <option value={12}>12 min</option>
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={25}>25 min</option>
              <option value={30}>30 min</option>
              <option value={35}>35 min</option>
              <option value={40}>40 min</option>
              <option value={45}>45 min</option>
              <option value={50}>50 min</option>
              <option value={55}>55 min</option>
              <option value={60}>1 heure</option>
              <option value={75}>1h15</option>
              <option value={90}>1h30</option>
              <option value={105}>1h45</option>
              <option value={120}>2 heures</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className={labelCls + ' mb-0'}>Nombre de créneaux</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCount(Math.max(1, count - 1))} className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center font-bold">−</button>
            <span className="w-8 text-center text-sm font-semibold text-slate-700">{count}</span>
            <button type="button" onClick={() => setCount(count + 1)} className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center font-bold">+</button>
          </div>
          {groupCount > 0 && count !== groupCount && (
            <button type="button" onClick={() => setCount(groupCount)} className="text-xs text-[#0471a6] hover:underline">
              Mettre à {groupCount} (= nb groupes)
            </button>
          )}
        </div>

        {/* Aperçu */}
        {preview.length > 0 && date && (
          <div>
            <p className={labelCls}>Aperçu des créneaux</p>
            <div className="flex flex-wrap gap-2">
              {preview.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <Clock className="h-3 w-3" />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        {success && (
          <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 flex items-center gap-2">
            <Check className="h-4 w-4" />{success}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !date}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
          >
            <Plus className="h-4 w-4" />
            {loading ? 'Génération…' : hasSlots ? 'Regénérer les créneaux' : 'Générer les créneaux'}
          </button>

          {hasSlots && (
            <>
              <button
                type="button"
                onClick={handleRandomize}
                disabled={randomizing}
                className="inline-flex items-center gap-2 rounded-xl border border-[#89aae6]/50 bg-[#89aae6]/10 px-4 py-2.5 text-sm font-semibold text-[#0471a6] hover:bg-[#89aae6]/20 disabled:opacity-50 transition-all"
              >
                <Shuffle className="h-4 w-4" />
                {randomizing ? '…' : 'Ordre aléatoire'}
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={clearing}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors ml-auto"
              >
                <Trash2 className="h-4 w-4" />
                {clearing ? '…' : 'Supprimer tout'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
