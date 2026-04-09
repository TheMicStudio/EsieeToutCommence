'use client';

import {
  FileText, Code2, File, MoreVertical, Download, Loader2,
  BarChart2, Layers,
} from 'lucide-react';

/* ── Auto-detection helpers ─────────────────────────────────────────── */
type IconColor = 'rose' | 'blue' | 'emerald' | 'amber' | 'slate' | 'cyan';

function detectColor(fileType: string): IconColor {
  const t = fileType.toUpperCase();
  if (t === 'PDF')                                        return 'rose';
  if (t === 'DOC' || t === 'DOCX')                       return 'blue';
  if (t === 'XLS' || t === 'XLSX')                       return 'emerald';
  if (t === 'ZIP' || t === 'RAR')                        return 'amber';
  if (['JS','TS','PY','JSX','TSX','CODE'].includes(t))   return 'slate';
  if (t === 'VIDEO')                                      return 'cyan';
  if (t === 'LIEN')                                       return 'emerald';
  return 'slate';
}

function detectIcon(fileType: string): React.ReactNode {
  const t = fileType.toUpperCase();
  if (t === 'PDF' || t === 'DOC' || t === 'DOCX')        return <FileText size={15} />;
  if (t === 'XLS' || t === 'XLSX')                       return <BarChart2 size={15} />;
  if (t === 'ZIP' || t === 'RAR')                        return <Layers size={15} />;
  if (['JS','TS','PY','JSX','TSX','CODE'].includes(t))   return <Code2 size={15} />;
  return <File size={15} />;
}

const COLOR_CLS: Record<IconColor, string> = {
  rose:    'bg-rose-50 text-rose-500',
  blue:    'bg-blue-50 text-blue-500',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber:   'bg-amber-50 text-amber-500',
  slate:   'bg-slate-900 text-white',
  cyan:    'bg-cyan-50 text-cyan-600',
};

/* ── Props ──────────────────────────────────────────────────────────── */
export interface DocumentCardProps {
  title: string;
  fileType: string;
  fileSize?: string;
  author?: string;
  iconColor?: IconColor;
  icon?: React.ReactNode;
  onDownload: () => void;
  onMoreOptions?: () => void;
  isLoading?: boolean;
}

export function DocumentCard({
  title,
  fileType,
  fileSize,
  author,
  iconColor,
  icon,
  onDownload,
  onMoreOptions,
  isLoading = false,
}: DocumentCardProps) {
  const resolvedColor = iconColor ?? detectColor(fileType);
  const resolvedIcon  = icon      ?? detectIcon(fileType);

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-3 hover:border-[#41c0f0]/40 transition-all">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-1.5">
        <div className={[
          'h-8 w-8 grid place-items-center rounded-lg shrink-0',
          COLOR_CLS[resolvedColor],
        ].join(' ')}>
          {resolvedIcon}
        </div>
        <button
          type="button"
          onClick={onMoreOptions}
          aria-label="More options"
          className="text-slate-300 hover:text-slate-600 transition-colors"
        >
          <MoreVertical size={13} />
        </button>
      </div>

      {/* ── Title + metadata ─────────────────────────────────────────── */}
      <div className="mt-2">
        <h3
          className="text-[13px] font-semibold text-slate-900 truncate tracking-tight leading-snug"
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          title={title}
        >
          {title}
        </h3>

        <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <span>{fileType.toUpperCase()}</span>
          {fileSize && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{fileSize}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {author ? (
          <span className="text-[11px] font-medium text-slate-400 truncate">
            {author}
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={onDownload}
          disabled={isLoading}
          aria-label="Download file"
          className="inline-flex h-6 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
        >
          {isLoading
            ? <Loader2 size={10} className="animate-spin" />
            : <Download size={10} />
          }
          Télécharger
        </button>
      </div>

    </article>
  );
}
