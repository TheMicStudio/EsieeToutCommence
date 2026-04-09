import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { getMyEntries, getMyTripartiteChat } from '@/modules/career/actions';
import { ApprenticeshipList } from '@/modules/career/components/ApprenticeshipList';
import { UploadEntryForm } from '@/modules/career/components/UploadEntryForm';
import { ValidationPanel } from '@/modules/career/components/ValidationPanel';
import Link from 'next/link';
import { ArrowLeft, BookOpenCheck, Upload, CheckSquare, List } from 'lucide-react';

export const metadata = { title: 'Livret d\'apprentissage — EsieeToutCommence' };

export default async function LivretPage() {
  await requirePermission('alternance.access');
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  if (userProfile.role === 'eleve' && userProfile.profile.type_parcours !== 'alternant') {
    redirect('/dashboard/carriere');
  }
  if (userProfile.role === 'professeur') {
    redirect('/dashboard/carriere');
  }

  const chat = await getMyTripartiteChat();
  const isValidator = userProfile.role === 'admin' || userProfile.role === 'entreprise';

  return (
    <div className="space-y-0">
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
          <Link
            href="/dashboard/carriere"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
              <BookOpenCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 leading-tight">
                Livret d&apos;apprentissage
              </h1>
              <p className="mt-0.5 text-[13px] font-medium text-slate-500">
                {isValidator
                  ? 'Validez les rendus déposés par l\'alternant'
                  : 'Déposez vos rendus et suivez leur validation'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!chat ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
              <p className="text-center text-sm text-slate-400">
                Espace tripartite non configuré.<br />
                Contactez l&apos;administration.
              </p>
            </div>
          ) : (
            <LivretContent chat={chat} userProfile={userProfile} isValidator={isValidator} />
          )}
        </div>
      </div>
    </div>
  );
}

async function LivretContent({
  chat,
  userProfile,
  isValidator,
}: {
  chat: NonNullable<Awaited<ReturnType<typeof getMyTripartiteChat>>>;
  userProfile: NonNullable<Awaited<ReturnType<typeof getCurrentUserProfile>>>;
  isValidator: boolean;
}) {
  const entries = await getMyEntries();

  return (
    <div className="space-y-6">
      {/* Formulaire dépôt (élève uniquement) */}
      {userProfile.role === 'eleve' && (
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0471a6]/10">
              <Upload className="h-3.5 w-3.5 text-[#0471a6]" />
            </div>
            <p className="text-[13px] font-semibold text-slate-800">Déposer un rendu</p>
          </div>
          <UploadEntryForm chatId={chat.id} />
        </div>
      )}

      {/* Panel validation */}
      {isValidator && (
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <p className="text-[13px] font-semibold text-slate-800">Validation des rendus</p>
          </div>
          <ValidationPanel entries={entries} />
        </div>
      )}

      {/* Liste des rendus */}
      <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100">
            <List className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <p className="text-[13px] font-semibold text-slate-800">
            Tous les rendus
            <span className="ml-1.5 text-[12px] font-normal text-slate-400">({entries.length})</span>
          </p>
        </div>
        {entries.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200">
            <p className="text-[13px] text-slate-400">Aucun rendu pour le moment.</p>
          </div>
        ) : (
          <ApprenticeshipList entries={entries} />
        )}
      </div>
    </div>
  );
}
