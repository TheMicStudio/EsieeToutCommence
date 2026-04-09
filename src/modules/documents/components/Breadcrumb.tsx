import Link from 'next/link';
import { ChevronRight, FolderOpen } from 'lucide-react';
import type { DocBreadcrumb } from '../types';

interface BreadcrumbProps {
  crumbs: DocBreadcrumb[];
}

export function Breadcrumb({ crumbs }: Readonly<BreadcrumbProps>) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      <Link
        href="/dashboard/documents"
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        <span>Documents</span>
      </Link>

      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          {i === crumbs.length - 1 ? (
            <span className="rounded-md px-1.5 py-0.5 font-medium text-slate-800">
              {crumb.name}
            </span>
          ) : (
            <Link
              href={`/dashboard/documents/${crumb.id}`}
              className="rounded-md px-1.5 py-0.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              {crumb.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
