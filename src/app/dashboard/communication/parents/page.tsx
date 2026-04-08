import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getAllParentThreads, getParentMessages } from '@/modules/parent/actions';
import { ParentMessageThread } from '@/modules/parent/components/ParentMessageThread';
import { createClient } from '@/lib/supabase/server';
import { UserRound } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Messages parents — EsieeToutCommence' };

interface ParentsPageProps {
  searchParams: Promise<{ lien?: string }>;
}

export default async function ParentsCommunicationPage({ searchParams }: ParentsPageProps) {
  const { lien: lienParam } = await searchParams;
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/login');
  await requirePermission('staff_channel.participate');

  const threads = await getAllParentThreads();
  const activeThread = threads.find((t) => t.id === lienParam) ?? threads[0] ?? null;
  const messages = activeThread ? await getParentMessages(activeThread.id) : [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Messages parents</h1>
        <p className="mt-1 text-sm text-slate-500">Échanges avec les parents d&apos;élèves</p>
      </div>

      {threads.length === 0 && (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <p className="text-sm text-slate-400">Aucun parent n&apos;a encore envoyé de message.</p>
        </div>
      )}

      {threads.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Liste des threads */}
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Conversations</p>
            </div>
            <div className="divide-y divide-slate-100">
              {threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/dashboard/communication/parents?lien=${t.id}`}
                  className={[
                    'flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50',
                    activeThread?.id === t.id ? 'bg-[#89aae6]/10 border-l-2 border-l-[#0471a6]' : '',
                  ].join(' ')}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#89aae6]/20">
                    <UserRound className="h-4 w-4 text-[#3685b5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#061826] truncate">{t.parent_name}</p>
                    <p className="text-xs text-slate-500 truncate">Enfant : {t.student_name}</p>
                    {t.last_message && (
                      <p className="mt-0.5 text-xs text-slate-400 truncate">{t.last_message.content}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Thread actif */}
          {activeThread ? (
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#89aae6]/20">
                  <UserRound className="h-4 w-4 text-[#3685b5]" />
                </div>
                <div>
                  <p className="font-semibold text-[#061826]">{activeThread.parent_name}</p>
                  <p className="text-xs text-slate-400">Enfant : {activeThread.student_name}</p>
                </div>
              </div>
              <ParentMessageThread
                linkId={activeThread.id}
                initialMessages={messages}
                currentUserId={user!.id}
              />
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
              <p className="text-sm text-slate-400">Sélectionnez une conversation.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
