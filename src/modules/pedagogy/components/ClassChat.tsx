'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, getChannelMessages } from '../actions';
import { MessageBubble } from './MessageBubble';
import { Send } from 'lucide-react';
import type { ClassChannel, ClassMessage } from '../types';

interface ClassChatProps {
  channels: ClassChannel[];
  initialMessages: ClassMessage[];
  currentUserId: string;
  currentUserName: string;
  authorNames: Record<string, string>;
}

export function ClassChat({
  channels,
  initialMessages,
  currentUserId,
  currentUserName,
  authorNames,
}: Readonly<ClassChatProps>) {
  const [activeChannel, setActiveChannel] = useState<ClassChannel>(channels[0]);
  const [messages, setMessages] = useState<ClassMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Instance stable : ne pas recréer le client à chaque render
  const supabase = useMemo(() => createClient(), []);

  // Scroll vers le bas à chaque nouveau message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Changement de canal : recharger + Realtime
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setRealtimeStatus('connecting');
    getChannelMessages(activeChannel.id).then((msgs) => {
      if (!cancelled) {
        setMessages(msgs);
        setLoading(false);
      }
    });

    // Realtime : écoute INSERT des autres utilisateurs seulement
    // (les messages de l'utilisateur courant sont déjà ajoutés en optimiste)
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
          const newMsg = payload.new as ClassMessage;
          // Ignorer ses propres messages (déjà ajoutés en optimiste)
          if (newMsg.author_id === currentUserId) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error');
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeChannel.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value || sending) return;

    // Vider immédiatement l'input (UX réactive)
    if (inputRef.current) inputRef.current.value = '';

    // Ajouter le message optimiste dans la liste locale
    const optimisticMsg: ClassMessage = {
      id: `optimistic-${Date.now()}`,
      channel_id: activeChannel.id,
      author_id: currentUserId,
      contenu: value,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    setSending(true);
    const formData = new FormData();
    formData.set('channel_id', activeChannel.id);
    formData.set('contenu', value);
    await sendMessage(null, formData);
    setSending(false);
  }

  let realtimeTitle: string;
  if (realtimeStatus === 'connected') { realtimeTitle = 'Temps réel actif'; }
  else if (realtimeStatus === 'error') { realtimeTitle = 'Erreur Realtime — voir doc Supabase'; }
  else { realtimeTitle = 'Connexion…'; }
  let realtimeDotCls: string;
  if (realtimeStatus === 'connected') { realtimeDotCls = 'bg-emerald-400'; }
  else if (realtimeStatus === 'error') { realtimeDotCls = 'bg-red-400'; }
  else { realtimeDotCls = 'bg-amber-400 animate-pulse'; }

  let messagesContent: React.ReactNode;
  if (loading) {
    messagesContent = (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Chargement…</p>
      </div>
    );
  } else if (messages.length === 0) {
    messagesContent = (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <span className="text-3xl">💬</span>
        <p className="text-sm text-slate-500">Aucun message pour l&apos;instant.</p>
        <p className="text-xs text-slate-400">Soyez le premier à écrire !</p>
      </div>
    );
  } else {
    messagesContent = messages.map((msg) => (
      <MessageBubble
        key={msg.id}
        message={msg}
        isOwn={msg.author_id === currentUserId}
        authorName={
          msg.author_id === currentUserId
            ? currentUserName
            : (authorNames[msg.author_id] ?? 'Utilisateur')
        }
      />
    ));
  }

  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
      {/* Sidebar canaux */}
      <div className="w-44 shrink-0 border-r border-slate-100 bg-slate-50/60 p-3 space-y-0.5">
        <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Canaux
        </p>
        {channels.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => setActiveChannel(ch)}
            className={[
              'w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-all',
              activeChannel.id === ch.id
                ? 'bg-[#0471a6] text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900',
            ].join(' ')}
          >
            <span className="opacity-60">#</span> {ch.nom}
          </button>
        ))}
      </div>

      {/* Zone messages */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header canal */}
        <div className="flex h-12 shrink-0 items-center border-b border-slate-100 px-4 gap-2">
          <span className="text-slate-400 font-medium">#</span>
          <span className="font-semibold text-[#061826]">{activeChannel.nom}</span>
          <span className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            {messages.length} message{messages.length > 1 ? 's' : ''}
            <span
              title={realtimeTitle}
              className={['inline-flex h-2 w-2 rounded-full', realtimeDotCls].join(' ')}
            />
          </span>
        </div>

        {/* Messages — scroll interne */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {messagesContent}
        </div>

        {/* Input envoi */}
        <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-slate-100 p-3">
          <input
            ref={inputRef}
            name="contenu"
            placeholder={`Message dans #${activeChannel.nom}…`}
            autoComplete="off"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#89aae6] focus:bg-white focus:ring-2 focus:ring-[#89aae6]/20 transition-all"
          />
          <button
            type="submit"
            disabled={sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0471a6] text-white transition-all hover:bg-[#0471a6]/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
