'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendTripartiteMessage } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TripartiteChat as TChat, TripartiteMessage } from '../types';

const ROLE_COLORS: Record<string, { bubble: string; badge: string; label: string }> = {
  student:  { bubble: 'bg-[#89aae6]/20 text-slate-800', badge: 'bg-[#89aae6]/30 text-[#3685b5]', label: 'Élève' },
  referent: { bubble: 'bg-[#ac80a0]/20 text-slate-800', badge: 'bg-[#ac80a0]/30 text-[#ac80a0]', label: 'Référent' },
  maitre:   { bubble: 'bg-emerald-50 text-slate-800',   badge: 'bg-emerald-100 text-emerald-700', label: "Maître d'app." },
};

interface TripartiteChatProps {
  chat: TChat;
  initialMessages: TripartiteMessage[];
  currentUserId: string;
  participantNames: Record<string, { nom: string; role: 'student' | 'referent' | 'maitre' }>;
}

export function TripartiteChat({
  chat, initialMessages, currentUserId, participantNames,
}: Readonly<TripartiteChatProps>) {
  const [messages, setMessages] = useState<TripartiteMessage[]>(initialMessages);
  const [state, action, pending] = useActionState(sendTripartiteMessage, null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (state?.success && inputRef.current) inputRef.current.value = '';
  }, [state]);

  useEffect(() => {
    const channel = supabase
      .channel(`tripartite-${chat.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'tripartite_messages',
        filter: `chat_id=eq.${chat.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as TripartiteMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chat.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <span className="text-sm font-semibold text-slate-700">Conversation tripartite</span>
        <div className="flex gap-1.5">
          {Object.entries(participantNames).map(([id, p]) => {
            const colors = ROLE_COLORS[p.role];
            return (
              <span key={id} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}>
                {p.nom}
              </span>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-400">Démarrez la conversation…</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.author_id === currentUserId;
              const participant = participantNames[msg.author_id];
              let bubbleClass: string;
              if (isOwn) { bubbleClass = 'bg-[#0471a6] text-white'; }
              else if (participant) { bubbleClass = ROLE_COLORS[participant.role].bubble; }
              else { bubbleClass = 'bg-slate-100 text-slate-800'; }

              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && participant && (
                    <span className="px-1 text-xs font-medium text-slate-500">{participant.nom}</span>
                  )}
                  <div className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm lg:max-w-lg ${bubbleClass} ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
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

      {/* Input */}
      <form action={action} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input type="hidden" name="chat_id" value={chat.id} />
        <Input
          ref={inputRef}
          name="contenu"
          placeholder="Votre message…"
          autoComplete="off"
          className="flex-1 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-[#0471a6]/30"
        />
        <Button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#0471a6] hover:bg-[#035a87] text-white"
        >
          Envoyer
        </Button>
      </form>
    </div>
  );
}
