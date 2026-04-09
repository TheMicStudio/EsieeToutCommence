'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { sendParentMessage } from '../actions';
import type { ParentMessage } from '../types';

interface ParentMessageThreadProps {
  linkId: string;
  initialMessages: ParentMessage[];
  currentUserId: string;
}

export function ParentMessageThread({ linkId, initialMessages, currentUserId }: Readonly<ParentMessageThreadProps>) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError('');
    const result = await sendParentMessage(linkId, content);
    setSending(false);
    if (result.error) { setError(result.error); return; }
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        link_id: linkId,
        author_id: currentUserId,
        author_name: 'Vous',
        content: content.trim(),
        created_at: new Date().toISOString(),
      },
    ]);
    setContent('');
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Messages */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
            <p className="text-sm text-slate-400">Aucun message. Commencez la conversation.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.author_id === currentUserId;
          return (
            <div key={msg.id} className={['flex flex-col', isOwn ? 'items-end' : 'items-start'].join(' ')}>
              <div className={[
                'max-w-[80%] rounded-2xl px-4 py-3',
                isOwn ? 'bg-[#0471a6] text-white' : 'bg-slate-100 text-[#061826]',
              ].join(' ')}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {!isOwn && <span className="font-medium">{msg.author_name}{msg.author_role ? ` · ${msg.author_role}` : ''} · </span>}
                {new Date(msg.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Formulaire d'envoi */}
      <form onSubmit={handleSend} className="flex gap-3 border-t border-slate-100 pt-4">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Votre message…"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89aae6]/40 focus:border-[#89aae6] focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0471a6]/90 disabled:opacity-50 transition-all"
        >
          <Send className="h-4 w-4" />
          {sending ? '…' : 'Envoyer'}
        </button>
      </form>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
