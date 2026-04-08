'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send } from 'lucide-react';
import type { StaffMessage } from '../types';

interface StaffMessageThreadProps {
  channelId: string;
  channelName: string;
  initialMessages: StaffMessage[];
  currentUserId: string;
  authorNames: Record<string, string>;
}

export function StaffMessageThread({
  channelId, channelName, initialMessages, currentUserId, authorNames,
}: StaffMessageThreadProps) {
  const [messages, setMessages] = useState<StaffMessage[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  // Scroll en bas à chaque nouveau message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Realtime : écoute les messages des autres (les miens sont déjà ajoutés en optimiste)
  useEffect(() => {
    const channel = supabase
      .channel(`staff-${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'staff_messages', filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        const newMsg = payload.new as StaffMessage;
        if (newMsg.author_id === currentUserId) return; // déjà ajouté en optimiste
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [channelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recharger quand le canal change
  useEffect(() => {
    setMessages(initialMessages);
  }, [channelId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value || sending) return;

    // Vider l'input immédiatement
    if (inputRef.current) inputRef.current.value = '';
    setError('');

    // Ajout optimiste
    const optimistic: StaffMessage = {
      id: `opt-${Date.now()}`,
      channel_id: channelId,
      author_id: currentUserId,
      contenu: value,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    // Insert via browser client (RLS vérifie is_staff())
    setSending(true);
    const { data, error: err } = await supabase
      .from('staff_messages')
      .insert({ channel_id: channelId, author_id: currentUserId, contenu: value })
      .select()
      .single();
    setSending(false);

    if (err) {
      // Rollback
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError('Erreur d\'envoi.');
      return;
    }
    // Remplacer le message optimiste par le vrai
    setMessages((prev) => prev.map((m) => m.id === optimistic.id ? (data as StaffMessage) : m));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header canal */}
      <div className="flex h-12 shrink-0 items-center border-b border-slate-100 px-4">
        <span className="font-semibold text-[#061826]"># {channelName}</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-400">Aucun message. Commencez la discussion !</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.author_id === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <span className="px-1 text-xs font-medium text-slate-500">
                      {authorNames[msg.author_id] ?? 'Staff'}
                    </span>
                  )}
                  <div className={[
                    'max-w-sm rounded-2xl px-4 py-2.5 text-sm lg:max-w-lg',
                    isOwn
                      ? 'rounded-br-sm bg-[#0471a6] text-white'
                      : 'rounded-bl-sm bg-slate-100 text-[#061826]',
                  ].join(' ')}>
                    {msg.contenu}
                  </div>
                  <span className="px-1 text-xs text-slate-400">
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Zone de saisie */}
      {error && <p className="px-4 py-1 text-xs text-red-500">{error}</p>}
      <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-slate-100 p-3">
        <input
          ref={inputRef}
          placeholder={`Message dans #${channelName}…`}
          autoComplete="off"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={sending}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0471a6] text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
