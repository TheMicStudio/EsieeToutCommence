'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { FolderPlus, Plus, Upload } from 'lucide-react';
import { createFolder, renameFolder } from '../actions';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { UploadDropzone } from './UploadDropzone';
import { PermissionsModal } from './PermissionsModal';
import { ShareModal } from './ShareModal';
import type { DocFile, DocFolder } from '../types';

interface FolderContentsProps {
  folders: DocFolder[];
  files: DocFile[];
  currentFolderId?: string;
}

export function FolderContents({ folders, files, currentFolderId }: Readonly<FolderContentsProps>) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<DocFolder | null>(null);
  const [permissionsFolder, setPermissionsFolder] = useState<DocFolder | null>(null);
  const [shareTarget, setShareTarget] = useState<{ target: DocFolder | DocFile; type: 'folder' | 'file' } | null>(null);

  const [createState, createAction, createPending] = useActionState(createFolder, null);
  const [renameState, renameAction, renamePending] = useActionState(renameFolder, null);
  const newFolderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNewFolder) newFolderRef.current?.focus();
  }, [showNewFolder]);

  useEffect(() => {
    if (createState?.success) setShowNewFolder(false);
  }, [createState?.success]);

  useEffect(() => {
    if (renameState?.success) setRenamingFolder(null);
  }, [renameState?.success]);

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <>
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setShowNewFolder((v) => !v); setShowUpload(false); }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300"
          >
            <FolderPlus className="h-4 w-4 text-amber-400" />
            Nouveau dossier
          </button>

          {currentFolderId && (
            <button
              type="button"
              onClick={() => { setShowUpload((v) => !v); setShowNewFolder(false); }}
              className="flex items-center gap-1.5 rounded-xl border border-[#0471a6]/30 bg-[#0471a6]/5 px-3 py-2 text-sm font-medium text-[#0471a6] shadow-sm transition-colors hover:bg-[#0471a6]/10"
            >
              <Upload className="h-4 w-4" />
              Déposer un fichier
            </button>
          )}
        </div>
      </div>

      {/* Formulaire nouveau dossier */}
      {showNewFolder && (
        <form action={createAction} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <input type="hidden" name="parent_id" value={currentFolderId ?? ''} />
          <div className="space-y-2">
            <input
              ref={newFolderRef}
              type="text"
              name="name"
              placeholder="Nom du dossier"
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0471a6] focus:outline-none"
            />
            <input
              type="text"
              name="description"
              placeholder="Description (optionnel)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0471a6] focus:outline-none"
            />
          </div>
          {createState?.error && <p className="text-xs text-red-600">{createState.error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createPending}
              className="flex items-center gap-1.5 rounded-xl bg-[#0471a6] px-4 py-2 text-sm font-medium text-white hover:bg-[#035a85] disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              {createPending ? 'Création…' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewFolder(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Formulaire upload */}
      {showUpload && currentFolderId && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <UploadDropzone
            folderId={currentFolderId}
            onSuccess={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* État vide */}
      {isEmpty && !showNewFolder && !showUpload && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <FolderPlus className="h-8 w-8 text-amber-300" />
          </div>
          <p className="mt-4 font-medium text-slate-600">Ce dossier est vide</p>
          <p className="mt-1 text-sm text-slate-400">
            {currentFolderId
              ? 'Créez un sous-dossier ou déposez des fichiers.'
              : 'Créez votre premier dossier pour commencer.'}
          </p>
        </div>
      )}

      {/* Dossiers */}
      {folders.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Dossiers
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onRename={setRenamingFolder}
                onPermissions={setPermissionsFolder}
                onShare={(f) => setShareTarget({ target: f, type: 'folder' })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fichiers */}
      {files.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Fichiers
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onShare={(f) => setShareTarget({ target: f, type: 'file' })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal renommer dossier */}
      {renamingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRenamingFolder(null)} aria-hidden="true" />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 font-semibold text-slate-800">Renommer le dossier</h2>
            <form action={renameAction} className="space-y-3">
              <input type="hidden" name="folder_id" value={renamingFolder.id} />
              <input
                type="text"
                name="name"
                defaultValue={renamingFolder.name}
                required
                autoFocus
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0471a6] focus:outline-none"
              />
              <input
                type="text"
                name="description"
                defaultValue={renamingFolder.description ?? ''}
                placeholder="Description (optionnel)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0471a6] focus:outline-none"
              />
              {renameState?.error && <p className="text-xs text-red-600">{renameState.error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={renamePending}
                  className="flex-1 rounded-xl bg-[#0471a6] py-2 text-sm font-medium text-white hover:bg-[#035a85] disabled:opacity-60"
                >
                  {renamePending ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingFolder(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal permissions */}
      {permissionsFolder && (
        <PermissionsModal
          folder={permissionsFolder}
          onClose={() => setPermissionsFolder(null)}
        />
      )}

      {/* Modal partage */}
      {shareTarget && (
        <ShareModal
          target={shareTarget.target}
          targetType={shareTarget.type}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  );
}
