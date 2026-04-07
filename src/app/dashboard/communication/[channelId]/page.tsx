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
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden rounded-xl border">
      {/* Sidebar canaux */}
      <aside className="hidden w-56 shrink-0 flex-col border-r lg:flex">
        <div className="flex h-12 items-center border-b px-4">
          <span className="text-sm font-semibold">Canaux</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/dashboard/communication/${ch.id}`}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                ch.id === channelId
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <span># {ch.nom}</span>
            </Link>
          ))}
        </nav>
        {isAdmin && (
          <div className="border-t p-3">
            <CreateChannelForm />
          </div>
        )}
        <div className="border-t p-3">
          <Link
            href="/dashboard/communication/annuaire"
            className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
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
