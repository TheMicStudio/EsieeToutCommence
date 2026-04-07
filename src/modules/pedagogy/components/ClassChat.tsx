'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage } from '../actions';
import { MessageBubble } from './MessageBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ClassChannel, ClassMessage } from '../types';

interface ClassChatProps {
  channels: ClassChannel[];
  initialMessages: ClassMessage[];
  currentUserId: string;
  authorNames: Record<string, string>;
}

export function ClassChat({
  channels,
  initialMessages,
  currentUserId,
  authorNames,
}: ClassChatProps) {
  const [activeChannel, setActiveChannel] = useState<ClassChannel>(channels[0]);
  const [messages, setMessages] = useState<ClassMessage[]>(initialMessages);
  const [state, action, pending] = useActionState(sendMessage, null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Scroll au dernier message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Réinitialiser l'input après envoi
  useEffect(() => {
    if (state?.success && inputRef.current) {
      inputRef.current.value = '';
    }
  }, [state]);

  // Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${activeChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_messages',
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ClassMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel.id, supabase]);

  // Changer de canal
  const switchChannel = (ch: ClassChannel) => {
    setActiveChannel(ch);
    setMessages([]);
  };

  return (
    <div className="flex h-[600px] overflow-hidden rounded-xl border bg-card">
      {/* Sidebar canaux */}
      <div className="w-48 shrink-0 border-r p-3 space-y-1">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Canaux
        </p>
        {channels.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => switchChannel(ch)}
            className={[
              'w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
              activeChannel.id === ch.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            ].join(' ')}
          >
            # {ch.nom}
          </button>
        ))}
      </div>

      {/* Zone messages */}
      <div className="flex flex-1 flex-col">
        {/* Header canal */}
        <div className="flex h-12 items-center border-b px-4">
          <span className="font-medium"># {activeChannel.nom}</span>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground mt-8">
              Aucun message pour l&apos;instant. Soyez le premier à écrire !
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.author_id === currentUserId}
                  authorName={authorNames[msg.author_id] ?? 'Utilisateur'}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input envoi */}
        <form
          action={action}
          className="flex items-center gap-2 border-t p-3"
        >
          <input type="hidden" name="channel_id" value={activeChannel.id} />
          <Input
            ref={inputRef}
            name="contenu"
            placeholder={`Message dans #${activeChannel.nom}…`}
            autoComplete="off"
            className="flex-1"
          />
          <Button type="submit" disabled={pending}>
            Envoyer
          </Button>
        </form>
      </div>
    </div>
  );
}
