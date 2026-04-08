import { AlertCircle, Download, File, Folder } from 'lucide-react';
import { resolveShareLink, getPublicSignedUrl } from '@/modules/documents/actions';

interface Props {
  params: Promise<{ token: string }>;
}

function formatSize(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const result = await resolveShareLink(token);

  if (result.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Lien invalide</h1>
          <p className="mt-2 text-sm text-slate-500">{result.error}</p>
        </div>
      </div>
    );
  }

  // Lien vers un fichier unique
  if (result.file) {
    const { file } = result;
    const signedUrl = await getPublicSignedUrl(file.storage_path);

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
          {/* Brand */}
          <p className="mb-6 text-center text-xs font-semibold text-slate-400">
            EsieeToutCommence — Espace documentaire
          </p>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <File className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 break-words">{file.name}</h1>
              {file.description && (
                <p className="mt-1 text-sm text-slate-500">{file.description}</p>
              )}
              {file.size_bytes && (
                <p className="mt-1 text-xs text-slate-400">{formatSize(file.size_bytes)}</p>
              )}
            </div>

            {signedUrl ? (
              <a
                href={signedUrl}
                download={file.name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0471a6] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#035a85]"
              >
                <Download className="h-4 w-4" />
                Télécharger
              </a>
            ) : (
              <p className="text-sm text-red-500">
                Impossible de générer le lien de téléchargement.
              </p>
            )}
          </div>

          {result.link?.expires_at && (
            <p className="mt-6 text-center text-xs text-slate-400">
              Ce lien expire le{' '}
              {new Date(result.link.expires_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Lien vers un dossier (liste de fichiers)
  if (result.folderFiles !== undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <p className="mb-6 text-center text-xs font-semibold text-slate-400">
            EsieeToutCommence — Espace documentaire
          </p>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <Folder className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{result.folderName ?? 'Dossier partagé'}</h1>
              <p className="text-sm text-slate-500">
                {result.folderFiles.length} fichier{result.folderFiles.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {result.folderFiles.length === 0 ? (
            <p className="text-center text-sm text-slate-400">Ce dossier est vide.</p>
          ) : (
            <div className="space-y-2">
              {result.folderFiles.map(async (file) => {
                const url = await getPublicSignedUrl(file.storage_path);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <File className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{file.name}</p>
                      {file.size_bytes && (
                        <p className="text-xs text-slate-400">{formatSize(file.size_bytes)}</p>
                      )}
                    </div>
                    {url && (
                      <a
                        href={url}
                        download={file.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-[#0471a6]/10 px-3 py-1.5 text-xs font-medium text-[#0471a6] transition-colors hover:bg-[#0471a6]/20"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Télécharger
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {result.link?.expires_at && (
            <p className="mt-6 text-center text-xs text-slate-400">
              Ce lien expire le{' '}
              {new Date(result.link.expires_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
