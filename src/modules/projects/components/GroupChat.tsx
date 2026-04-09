'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { sendGroupMessage } from '../actions';
import { createClient } from '@/lib/supabase/client';
import type { GroupMessage } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Send } from 'lucide-react';

interface GroupChatProps {
  groupId: string;
  initialMessages: GroupMessage[];
  currentUserId: string;
  currentUserName: string;
  memberNames: Record<string, string>;
}

export function GroupChat({ groupId, initialMessages, currentUserId, currentUserName, memberNames }: Readonly<GroupChatProps>) {
  const [state, action, pending] = useActionState(sendGroupMessage, null);
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages ?? []);
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Abonnement Broadcast — reçoit les messages des autres membres
  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on('broadcast', { event: 'new-message' }, ({ payload }) => {
        const msg = payload as GroupMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [groupId]); // eslint-disable-line

  // Après envoi réussi : ajouter à l'état local + broadcaster aux autres
  useEffect(() => {
    if (!state?.success || !state.message) return;
    const msg: GroupMessage = { ...state.message, author_name: currentUserName };

    // Ajout local (dédup)
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });

    // Broadcast aux autres membres
    channelRef.current?.send({
      type: 'broadcast',
      event: 'new-message',
      payload: msg,
    });

    formRef.current?.reset();
  }, [state]); // eslint-disable-line

  // Scroll vers le bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">Pas encore de message. Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.author_id === currentUserId;
            const authorName = msg.author_name ?? memberNames[msg.author_id] ?? 'Utilisateur';
            return (
              <div key={msg.id} className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                <span className="px-1 text-xs font-medium text-slate-400">
                  {isOwn ? 'Moi' : authorName}
                </span>
                <div className={[
                  'max-w-xs rounded-2xl px-4 py-2.5 text-sm break-words sm:max-w-sm',
                  isOwn
                    ? 'rounded-br-sm bg-[#0471a6] text-white'
                    : 'rounded-bl-sm bg-slate-100 text-slate-700',
                ].join(' ')}>
                  {msg.contenu}
                </div>
                <span className="px-1 text-[11px] text-slate-300" suppressHydrationWarning>
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form ref={formRef} action={action} className="flex gap-2 border-t border-slate-100 p-3">
        <input type="hidden" name="group_id" value={groupId} />
        <input
          name="contenu"
          placeholder="Votre message…"
          required
          autoComplete="off"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#0471a6] p-2.5 text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {state?.error && (
        <p className="px-3 pb-2 text-xs text-destructive">{state.error}</p>
      )}
    </div>
  );
}
