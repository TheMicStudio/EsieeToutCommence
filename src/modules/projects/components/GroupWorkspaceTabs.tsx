'use client';

import { useState, type ReactNode } from 'react';
import { MessageSquare, PenLine } from 'lucide-react';

interface GroupWorkspaceTabsProps {
  chatContent: ReactNode;
  whiteboardContent: ReactNode;
}

export function GroupWorkspaceTabs({ chatContent, whiteboardContent }: Readonly<GroupWorkspaceTabsProps>) {
  const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard'>('chat');

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-100">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={[
            'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'chat'
              ? 'border-[#0471a6] text-[#0471a6] bg-[#89aae6]/5'
              : 'border-transparent text-slate-400 hover:text-slate-600',
          ].join(' ')}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('whiteboard')}
          className={[
            'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'whiteboard'
              ? 'border-[#0471a6] text-[#0471a6] bg-[#89aae6]/5'
              : 'border-transparent text-slate-400 hover:text-slate-600',
          ].join(' ')}
        >
          <PenLine className="h-4 w-4" />
          Tableau blanc
        </button>
      </div>

      {/* Content */}
      <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
        {chatContent}
      </div>
      <div className={activeTab === 'whiteboard' ? 'block p-4' : 'hidden'}>
        {whiteboardContent}
      </div>
    </div>
  );
}
