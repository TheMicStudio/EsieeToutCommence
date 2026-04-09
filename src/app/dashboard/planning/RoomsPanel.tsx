'use client';

import { useActionState, useState } from 'react';
import { Plus, Trash2, X, DoorOpen, Loader2, AlertCircle } from 'lucide-react';
import { createRoom, deleteRoom, type RoomRow } from '@/modules/admin/planning-actions';

const inputCls =
  'flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all';
const labelCls =
  'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

function CreateRoomForm({ onDone }: Readonly<{ onDone: () => void }>) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const res = await createRoom(formData);
      if (!res.error) onDone();
      return res;
    },
    null
  );

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-[#061826]">Ajouter une salle</p>
        <button onClick={onDone} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="room-nom" className={labelCls}>Nom de la salle</label>
          <input id="room-nom" name="nom" placeholder="Ex: Salle 201, Amphi A" required className={inputCls} />
        </div>
        <div className="w-32">
          <label htmlFor="room-capacite" className={labelCls}>Capacité</label>
          <input
            id="room-capacite"
            name="capacite"
            type="number"
            min={1}
            max={500}
            placeholder="30"
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Ajouter
        </button>
      </form>
      {state?.error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
    </div>
  );
}

export function RoomsPanel({ rooms: initialRooms }: Readonly<{ rooms: RoomRow[] }>) {
  const [rooms, setRooms] = useState(initialRooms);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteRoom(id);
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#061826]">
          {rooms.length} salle{rooms.length > 1 ? 's' : ''} configurée{rooms.length > 1 ? 's' : ''}
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </div>

      {showForm && (
        <CreateRoomForm
          onDone={() => {
            setShowForm(false);
            // refresh géré par revalidatePath côté server
          }}
        />
      )}

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <DoorOpen className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Aucune salle configurée</p>
          <p className="text-xs text-slate-400">Ajoutez des salles pour les affecter aux sessions.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Salle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Capacité</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#061826]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#89aae6]/20">
                        <DoorOpen className="h-3.5 w-3.5 text-[#3685b5]" />
                      </div>
                      {room.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {room.capacite ? `${room.capacite} places` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(room.id)}
                      disabled={deletingId === room.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-all"
                    >
                      {deletingId === room.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
