import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getStaffChannels, getChannelMessages, getStaffDirectory } from '@/modules/communication/actions';
import { StaffMessageThread } from '@/modules/communication/components/StaffMessageThread';
import { CreateChannelForm } from '@/modules/communication/components/CreateChannelForm';
import { createClient } from '@/lib/supabase/server';

interface ChannelPageProps {
  params: Promise<{ channelId: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) return null;
  
  if (profile.role !== 'admin' && profile.role !== 'professeur') redirect('/dashboard');

  const [channels, messages, directory] = await Promise.all([
    getStaffChannels(),
    getChannelMessages(channelId),
    getStaffDirectory(),
  ]);

  const channel = channels.find((c) => c.id === channelId);
  if (!channel) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';

  const authorNames: Record<string, string> = {};
  for (const contact of directory) {
    authorNames[contact.id] = `${contact.prenom} ${contact.nom}`;
  }

  const isAdmin = profile.role === 'admin';

  return (
    <div
      className="flex overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm"
      style={{ height: 'calc(100vh - 9rem)' }}
    >
      {/* Sidebar canaux */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-100 bg-slate-50/60 lg:flex">
        <div className="flex h-12 shrink-0 items-center border-b border-slate-100 px-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Canaux</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/dashboard/communication/${ch.id}`}
              className={[
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                ch.id === channelId
                  ? 'bg-[#0471a6] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900',
              ].join(' ')}
            >
              <span className="opacity-60">#</span> {ch.nom}
            </Link>
          ))}
        </nav>
        {isAdmin && (
          <div className="border-t border-slate-100 p-3">
            <CreateChannelForm />
          </div>
        )}
        <div className="border-t border-slate-100 p-3">
          <Link
            href="/dashboard/communication/annuaire"
            className="block rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-white transition-colors"
          >
            Annuaire staff
          </Link>
        </div>
      </aside>

      {/* Thread */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <StaffMessageThread
          channelId={channelId}
          channelName={channel.nom}
          initialMessages={messages}
          currentUserId={currentUserId}
          authorNames={authorNames}
        />
      </div>
    </div>
  );
}
