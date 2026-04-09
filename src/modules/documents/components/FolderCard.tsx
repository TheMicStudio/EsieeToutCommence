'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Folder, MoreVertical, Pencil, Settings, Share2, Trash2 } from 'lucide-react';
import type { DocFolder } from '../types';
import { deleteFolder } from '../actions';

interface FolderCardProps {
  folder: DocFolder;
  onRename?: (folder: DocFolder) => void;
  onPermissions?: (folder: DocFolder) => void;
  onShare?: (folder: DocFolder) => void;
}

export function FolderCard({ folder, onRename, onPermissions, onShare }: FolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Supprimer le dossier "${folder.name}" et tout son contenu ? Cette action est irréversible.`
      )
    )
      return;
    setDeleting(true);
    setMenuOpen(false);
    const result = await deleteFolder(folder.id);
    if (result.error) { alert(result.error); setDeleting(false); }
  }

  return (
    <div
      className={[
        'group relative rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-all',
        deleting ? 'opacity-50 pointer-events-none' : 'hover:shadow-md hover:border-slate-300',
      ].join(' ')}
    >
      <Link
        href={`/dashboard/documents/${folder.id}`}
        className="flex min-w-0 items-center gap-3 p-4 pr-10"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <Folder className="h-5 w-5 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-slate-800">{folder.name}</p>
          {folder.description && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{folder.description}</p>
          )}
        </div>
      </Link>

      {/* Menu actions */}
      <div className="absolute right-3 top-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {onRename && (
                <button
                  onClick={() => { setMenuOpen(false); onRename(folder); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  Renommer
                </button>
              )}
              {onPermissions && (
                <button
                  onClick={() => { setMenuOpen(false); onPermissions(folder); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  Permissions
                </button>
              )}
              {onShare && (
                <button
                  onClick={() => { setMenuOpen(false); onShare(folder); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Share2 className="h-3.5 w-3.5 text-slate-400" />
                  Lien de partage
                </button>
              )}
              <div className="my-1 h-px bg-slate-100" />
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
