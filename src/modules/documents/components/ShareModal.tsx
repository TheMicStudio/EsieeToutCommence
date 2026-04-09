'use client';

import { useActionState, useEffect, useState } from 'react';
import { Check, Copy, Link, Share2, Trash2, X } from 'lucide-react';
import { createShareLink, getShareLinks, revokeShareLink } from '../actions';
import type { DocFile, DocFolder, DocShareLink } from '../types';

function formatExpiry(iso: string | null | undefined) {
  if (!iso) return 'Sans expiration';
  const d = new Date(iso);
  const now = new Date();
  if (d < now) return 'Expiré';
  return `Expire le ${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

interface ShareModalProps {
  target: DocFile | DocFolder;
  targetType: 'file' | 'folder';
  onClose: () => void;
}

export function ShareModal({ target, targetType, onClose }: ShareModalProps) {
  const [links, setLinks] = useState<DocShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [state, action, pending] = useActionState(createShareLink, null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    const fileId = targetType === 'file' ? target.id : undefined;
    const folderId = targetType === 'folder' ? target.id : undefined;
    getShareLinks(fileId, folderId).then((data) => {
      setLinks(data);
      setLoading(false);
    });
  }, [target.id, targetType]);

  useEffect(() => {
    if (state?.success) {
      const fileId = targetType === 'file' ? target.id : undefined;
      const folderId = targetType === 'folder' ? target.id : undefined;
      getShareLinks(fileId, folderId).then(setLinks);
    }
  }, [state?.success, target.id, targetType]);

  async function handleRevoke(linkId: string) {
    const result = await revokeShareLink(linkId);
    if (!result.error) {
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    }
  }

  function copyLink(token: string, id: string) {
    navigator.clipboard.writeText(`${baseUrl}/share/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-[#0471a6]" />
            <h2 className="font-semibold text-slate-800">
              Partager — <span className="text-slate-500 font-normal">{target.name}</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Liens existants */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Liens actifs
            </h3>
            {loading && <p className="text-sm text-slate-400">Chargement…</p>}
            {!loading && links.length === 0 && (
              <p className="text-sm text-slate-400">Aucun lien de partage pour l'instant.</p>
            )}
            {links.map((link) => {
              const expired =
                link.expires_at && new Date(link.expires_at) < new Date();
              const maxed =
                link.max_uses != null && link.uses_count >= link.max_uses;
              const inactive = expired || maxed;

              return (
                <div
                  key={link.id}
                  className={[
                    'flex items-start gap-3 rounded-xl border p-3',
                    inactive
                      ? 'border-slate-100 bg-slate-50 opacity-60'
                      : 'border-slate-200 bg-white',
                  ].join(' ')}
                >
                  <Link className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    {link.label && (
                      <p className="text-sm font-medium text-slate-700">{link.label}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {formatExpiry(link.expires_at)}
                      {link.max_uses != null && (
                        <> · {link.uses_count}/{link.max_uses} accès</>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!inactive && (
                      <button
                        type="button"
                        onClick={() => copyLink(link.token, link.id)}
                        title="Copier le lien"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        {copiedId === link.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRevoke(link.id)}
                      title="Révoquer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Créer un nouveau lien */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Créer un lien
            </h3>
            <form action={action} className="space-y-3">
              {targetType === 'file' && (
                <input type="hidden" name="file_id" value={target.id} />
              )}
              {targetType === 'folder' && (
                <input type="hidden" name="folder_id" value={target.id} />
              )}

              <input
                type="text"
                name="label"
                placeholder="Label (optionnel) — ex: Lien jury 2026"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0471a6] focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Expiration</label>
                  <input
                    type="date"
                    name="expires_at"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#0471a6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Max. accès</label>
                  <input
                    type="number"
                    name="max_uses"
                    placeholder="Illimité"
                    min="1"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0471a6] focus:outline-none"
                  />
                </div>
              </div>

              {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-[#0471a6] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#035a85] disabled:opacity-60"
              >
                {pending ? 'Création…' : 'Créer le lien'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
