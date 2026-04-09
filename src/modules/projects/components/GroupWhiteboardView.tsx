'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveGroupWhiteboard } from '../actions';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Loader2, Maximize2, Minimize2, Save } from 'lucide-react';

// Excalidraw API shape (subset we need)
interface ExcalidrawAPI {
  updateScene: (opts: { elements: unknown[] }) => void;
  getSceneElements: () => unknown[];
}

// Dynamic import — Excalidraw ne supporte pas le SSR
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((m) => m.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    ),
  }
);

interface GroupWhiteboardViewProps {
  groupId: string;
  initialData: unknown;
}

export function GroupWhiteboardView({ groupId, initialData }: Readonly<GroupWhiteboardViewProps>) {
  const [api, setApi] = useState<ExcalidrawAPI | null>(null);
  const [saving, setSaving] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Injection CSS Excalidraw (fichier dans /public, non exposé dans les exports du package)
  useEffect(() => {
    if (document.getElementById('excalidraw-css')) return;
    const link = document.createElement('link');
    link.id = 'excalidraw-css';
    link.rel = 'stylesheet';
    link.href = '/excalidraw.css';
    document.head.appendChild(link);
  }, []);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteChange = useRef(false);
  const supabase = useMemo(() => createClient(), []);

  // Setup Realtime Broadcast for collaborative sync
  useEffect(() => {
    const channel = supabase
      .channel(`group-whiteboard-${groupId}`)
      .on('broadcast', { event: 'elements-update' }, ({ payload }) => {
        if (!api) return;
        isRemoteChange.current = true;
        const elements = (payload as { elements: unknown[] }).elements;
        api.updateScene({ elements });
        setTimeout(() => { isRemoteChange.current = false; }, 50);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [groupId, api]); // eslint-disable-line

  // Schedule auto-save to DB (10s after last change)
  const scheduleSave = useCallback((elements: unknown[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      await saveGroupWhiteboard(groupId, elements);
      setSaving(false);
      setLastSaved(new Date());
    }, 10000);
  }, [groupId]);

  const handleChange = useCallback((elements: unknown[]) => {
    if (isRemoteChange.current) return;
    // Debounced broadcast to peers (500ms)
    if (broadcastTimerRef.current) clearTimeout(broadcastTimerRef.current);
    broadcastTimerRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'elements-update',
        payload: { elements },
      });
    }, 500);
    scheduleSave(elements);
  }, [scheduleSave]);

  async function handleManualSave() {
    if (!api) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    await saveGroupWhiteboard(groupId, api.getSceneElements());
    setSaving(false);
    setLastSaved(new Date());
  }

  const toolbar = (
    <div className="flex items-center justify-between px-1">
      <p className="text-xs text-slate-400">
        {lastSaved
          ? `Sauvegardé à ${lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Les modifications sont sauvegardées automatiquement'}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleManualSave}
          disabled={saving || !api}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Sauvegarder
        </button>
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {fullscreen ? 'Réduire' : 'Plein écran'}
        </button>
      </div>
    </div>
  );

  const canvas = (
    <Excalidraw
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      excalidrawAPI={(apiInstance: any) => setApi(apiInstance)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange={(elements: any) => handleChange(elements)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialData={initialData ? { elements: initialData as any } : undefined}
      langCode="fr-FR"
    />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          <p className="text-sm font-semibold text-[#061826]">Tableau blanc</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400">
              {lastSaved
                ? `Sauvegardé à ${lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Sauvegarde automatique'}
            </p>
            <button
              type="button"
              onClick={handleManualSave}
              disabled={saving || !api}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Sauvegarder
            </button>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              Réduire
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {canvas}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {toolbar}
      <div className="h-[600px] rounded-2xl border border-slate-200 overflow-hidden">
        {canvas}
      </div>
    </div>
  );
}
