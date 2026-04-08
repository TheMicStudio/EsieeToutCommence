import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getMyLinks, getParentMessages } from '@/modules/parent/actions';
import { ParentMessageThread } from '@/modules/parent/components/ParentMessageThread';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = { title: 'Messages — EsieeToutCommence' };

interface ParentMessagesPageProps {
  searchParams: Promise<{ lien?: string }>;
}

export default async function ParentMessagesPage({ searchParams }: ParentMessagesPageProps) {
  const { lien: lienParam } = await searchParams;
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'parent') redirect('/dashboard');

  const links = await getMyLinks();
  const activeLink = links.find((l) => l.id === lienParam) ?? links[0] ?? null;

  const messages = activeLink ? await getParentMessages(activeLink.id) : [];

  // ID utilisateur courant
  const admin = createAdminClient();
  const supabase = await import('@/lib/supabase/server').then((m) => m.createClient());
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/enfant" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#061826]">Messages</h1>
          <p className="mt-1 text-sm text-slate-500">Canal de communication avec l&apos;équipe pédagogique</p>
        </div>
      </div>

      {links.length === 0 && (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <p className="text-sm text-slate-400">Aucun enfant lié. <Link href="/dashboard/enfant" className="text-[#0471a6] hover:underline">Lier un enfant</Link></p>
        </div>
      )}

      {links.length > 0 && (
        <>
          {/* Sélecteur d'enfant si plusieurs */}
          {links.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {links.map((l) => (
                <Link
                  key={l.id}
                  href={`/dashboard/parent/messages?lien=${l.id}`}
                  className={[
                    'rounded-xl border px-4 py-2 text-sm font-medium transition-all',
                    activeLink?.id === l.id
                      ? 'border-[#0471a6] bg-[#0471a6] text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {l.student_prenom} {l.student_nom}
                </Link>
              ))}
            </div>
          )}

          {activeLink && (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#89aae6]/20">
                  <MessageSquare className="h-4 w-4 text-[#3685b5]" />
                </div>
                <div>
                  <p className="font-semibold text-[#061826]">
                    {activeLink.student_prenom} {activeLink.student_nom}
                  </p>
                  <p className="text-xs text-slate-400">{activeLink.student_class ?? 'Classe non assignée'}</p>
                </div>
              </div>
              <ParentMessageThread
                linkId={activeLink.id}
                initialMessages={messages}
                currentUserId={user!.id}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
