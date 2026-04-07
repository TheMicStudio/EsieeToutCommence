'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendStaffMessage } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [state, action, pending] = useActionState(sendStaffMessage, null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (state?.success && inputRef.current) inputRef.current.value = '';
  }, [state]);

  useEffect(() => {
    const channel = supabase
      .channel(`staff-${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'staff_messages', filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as StaffMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [channelId, supabase]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center border-b px-4">
        <span className="font-medium"># {channelName}</span>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">Aucun message. Commencez la discussion !</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.author_id === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <span className="px-1 text-xs font-medium text-muted-foreground">
                      {authorNames[msg.author_id] ?? 'Staff'}
                    </span>
                  )}
                  <div className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm lg:max-w-lg ${isOwn ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted'}`}>
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

      <form action={action} className="flex items-center gap-2 border-t p-3">
        <input type="hidden" name="channel_id" value={channelId} />
        <Input ref={inputRef} name="contenu" placeholder={`Message dans #${channelName}…`} autoComplete="off" className="flex-1" />
        <Button type="submit" disabled={pending}>Envoyer</Button>
      </form>
    </div>
  );
}
