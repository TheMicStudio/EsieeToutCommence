import Link from 'next/link';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission, getRequestPermissions } from '@/lib/permissions';
import { getJobOffers } from '@/modules/career/actions';
import { JobBoard } from '@/modules/career/components/JobBoard';
import { PublishJobModal } from '@/modules/career/components/PublishJobModal';

export const metadata = { title: 'Job Board — EsieeToutCommence' };

export default async function JobBoardPage() {
  await requirePermission('job.read');
  const perms = await getRequestPermissions();
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const offers = await getJobOffers();
  const canManage = perms.has('job.manage');

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card px-6 py-5">
        <Link
          href="/dashboard/carriere"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Carrière
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#89aae6]/20">
              <Briefcase className="h-5 w-5 text-[#3685b5]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#061826]">Job Board</h1>
              <p className="mt-0.5 text-sm text-slate-500">Offres de stages et d&apos;alternance sélectionnées</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="rounded-2xl bg-[#89aae6]/10 px-3.5 py-2 text-sm font-semibold text-[#3685b5]">
              {offers.length} offre{offers.length > 1 ? 's' : ''}
            </span>
            {canManage && <PublishJobModal />}
          </div>
        </div>
      </div>

      <JobBoard offers={offers} canDelete={canManage} />
    </div>
  );
}
