'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import type { DocFolder, FolderNode } from '../types';

function buildTree(folders: DocFolder[]): FolderNode[] {
  const map: Record<string, FolderNode> = {};
  for (const f of folders) {
    map[f.id] = { ...f, children: [] };
  }
  const roots: FolderNode[] = [];
  for (const f of folders) {
    if (f.parent_id && map[f.parent_id]) {
      map[f.parent_id].children.push(map[f.id]);
    } else if (!f.parent_id) {
      roots.push(map[f.id]);
    }
  }
  return roots;
}

interface FolderNodeItemProps {
  node: FolderNode;
  currentFolderId?: string;
  depth: number;
}

function FolderNodeItem({ node, currentFolderId, depth }: Readonly<FolderNodeItemProps>) {
  const isActive = node.id === currentFolderId;
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(
    // Ouvrir automatiquement si un enfant est actif
    node.children.some((c) => c.id === currentFolderId) || isActive
  );

  return (
    <div>
      <div
        className="group flex items-center"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={[
            'flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 transition-colors',
            hasChildren ? 'hover:text-slate-600' : 'pointer-events-none opacity-0',
          ].join(' ')}
        >
          <ChevronRight
            className={['h-3 w-3 transition-transform', open && hasChildren ? 'rotate-90' : ''].join(' ')}
          />
        </button>

        <Link
          href={`/dashboard/documents/${node.id}`}
          className={[
            'flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors min-w-0',
            isActive
              ? 'bg-[#0471a6]/10 text-[#0471a6] font-medium'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
          ].join(' ')}
        >
          {isActive ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-[#0471a6]" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-amber-400" />
          )}
          <span className="truncate">{node.name}</span>
        </Link>
      </div>

      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderNodeItem
              key={child.id}
              node={child}
              currentFolderId={currentFolderId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderTreeProps {
  folders: DocFolder[];
  currentFolderId?: string;
}

export function FolderTree({ folders, currentFolderId }: Readonly<FolderTreeProps>) {
  const tree = buildTree(folders);

  return (
    <nav className="space-y-0.5">
      <Link
        href="/dashboard/documents"
        className={[
          'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors',
          !currentFolderId
            ? 'bg-[#0471a6]/10 text-[#0471a6] font-medium'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
        ].join(' ')}
      >
        <FolderOpen className="h-4 w-4 shrink-0 text-[#0471a6]" />
        <span className="font-medium">Tous les dossiers</span>
      </Link>

      {tree.length === 0 && (
        <p className="px-3 py-2 text-xs text-slate-400">Aucun dossier</p>
      )}

      {tree.map((node) => (
        <FolderNodeItem
          key={node.id}
          node={node}
          currentFolderId={currentFolderId}
          depth={0}
        />
      ))}
    </nav>
  );
}
