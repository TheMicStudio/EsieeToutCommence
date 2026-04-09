import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/permissions';
import { getAllFolders, getBreadcrumb, getFolderContents } from '@/modules/documents/actions';
import { FolderTree } from '@/modules/documents/components/FolderTree';
import { FolderContents } from '@/modules/documents/components/FolderContents';
import { DocumentSearch } from '@/modules/documents/components/DocumentSearch';
import { Breadcrumb } from '@/modules/documents/components/Breadcrumb';

export const metadata = { title: 'Documents — EsieeToutCommence' };

interface Props {
  params: Promise<{ folderId: string }>;
}

export default async function FolderPage({ params }: Readonly<Props>) {
  await requirePermission('doc.access');

  const { folderId } = await params;

  const [allFolders, contents, crumbs] = await Promise.all([
    getAllFolders(),
    getFolderContents(folderId),
    getBreadcrumb(folderId),
  ]);

  if (crumbs.length === 0) notFound();

  const { folders, files } = contents;

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar arborescence */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-0 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-card">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Arborescence
          </p>
          <FolderTree folders={allFolders} currentFolderId={folderId} />
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="min-w-0 flex-1 space-y-5">
        {/* En-tête */}
        <div className="rounded-3xl border border-slate-200/70 bg-white px-6 py-5 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Breadcrumb crumbs={crumbs} />
              <h1 className="text-xl font-bold text-slate-800">
                {crumbs[crumbs.length - 1]?.name}
              </h1>
            </div>
            <div className="w-full sm:w-72">
              <DocumentSearch />
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="rounded-3xl border border-slate-200/70 bg-white/60 px-6 py-5 shadow-card space-y-5">
          <FolderContents
            folders={folders}
            files={files}
            currentFolderId={folderId}
          />
        </div>
      </main>
    </div>
  );
}
