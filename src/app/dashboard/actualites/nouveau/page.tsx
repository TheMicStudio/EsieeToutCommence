import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/modules/auth/actions';
import { requirePermission } from '@/lib/permissions';
import { CreatePostForm } from '@/modules/news/components/CreatePostForm';

export const metadata = { title: 'Nouvelle publication — EsieeToutCommence' };

export default async function NouvellePublicationPage() {
  await requirePermission('news.write');
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/login');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#061826]">Nouvelle publication</h1>
        <p className="mt-1 text-sm text-slate-500">Partagez une annonce, actualité ou événement avec tous les utilisateurs.</p>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <CreatePostForm isAdmin={profile.role === 'admin'} />
      </div>
    </div>
  );
}
