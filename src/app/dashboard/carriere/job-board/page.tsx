import { getCurrentUserProfile } from '@/modules/auth/actions';
import { getJobOffers } from '@/modules/career/actions';
import { JobBoard } from '@/modules/career/components/JobBoard';
import { PublishJobForm } from '@/modules/career/components/PublishJobForm';
import { Separator } from '@/components/ui/separator';

export const metadata = { title: 'Job Board — EsieeToutCommence' };

export default async function JobBoardPage() {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) return null;

  const offers = await getJobOffers();
  const isAdmin = userProfile.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Board</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {offers.length} offre{offers.length > 1 ? 's' : ''} disponible{offers.length > 1 ? 's' : ''}
        </p>
      </div>

      {isAdmin && (
        <>
          <PublishJobForm />
          <Separator />
        </>
      )}

      <JobBoard offers={offers} />
    </div>
  );
}
