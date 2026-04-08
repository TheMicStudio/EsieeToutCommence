'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendTripartiteMessage } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TripartiteChat as TChat, TripartiteMessage } from '../types';

// Couleurs par rôle de participant
const PARTICIPANT_COLORS: Record<string, string> = {
  student: 'bg-primary text-primary-foreground',
  referent: 'bg-secondary text-secondary-foreground',
  maitre: 'bg-accent text-accent-foreground',
};

interface TripartiteChatProps {
  chat: TChat;
  initialMessages: TripartiteMessage[];
  currentUserId: string;
  participantNames: Record<string, { nom: string; role: 'student' | 'referent' | 'maitre' }>;
}

export function TripartiteChat({
  chat, initialMessages, currentUserId, participantNames,
}: TripartiteChatProps) {
  const [messages, setMessages] = useState<TripartiteMessage[]>(initialMessages);
  const [state, action, pending] = useActionState(sendTripartiteMessage, null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
    <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border bg-card">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <span className="font-medium">Espace tripartite</span>
        <div className="flex gap-2">
          {Object.entries(participantNames).map(([id, p]) => (
            <span
              key={id}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${PARTICIPANT_COLORS[p.role]}`}
            >
              {p.nom}
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Démarrez la conversation…
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.author_id === currentUserId;
              const participant = participantNames[msg.author_id];
              const colorClass = participant
                ? PARTICIPANT_COLORS[participant.role]
                : 'bg-muted text-foreground';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}
                >
                  {!isOwn && participant && (
                    <span className="px-1 text-xs font-medium text-muted-foreground">
                      {participant.nom}
                    </span>
                  )}
                  <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm lg:max-w-md ${colorClass} ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                    {msg.contenu}
                  </div>
                  <span className="px-1 text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form action={action} className="flex items-center gap-2 border-t p-3">
        <input type="hidden" name="chat_id" value={chat.id} />
        <Input ref={inputRef} name="contenu" placeholder="Votre message…" autoComplete="off" className="flex-1" />
        <Button type="submit" disabled={pending}>Envoyer</Button>
      </form>
    </div>
  );
}
