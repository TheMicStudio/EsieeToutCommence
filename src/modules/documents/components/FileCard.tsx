'use client';

import { useState } from 'react';
import {
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  MoreVertical,
  Share2,
  Trash2,
} from 'lucide-react';
import type { DocFile } from '../types';
import { deleteFile, getSignedDownloadUrl } from '../actions';
import { DocumentPreviewModal, detectPreviewMode } from '@/components/DocumentPreviewModal';

function getMimeIcon(mimeType?: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.includes('word') || mimeType.includes('text')) return FileText;
  return File;
}

function getMimeColor(mimeType?: string | null) {
  if (!mimeType) return 'text-slate-400 bg-slate-100';
  if (mimeType.startsWith('image/')) return 'text-purple-500 bg-purple-50';
  if (mimeType === 'application/pdf') return 'text-red-500 bg-red-50';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'text-emerald-500 bg-emerald-50';
  if (mimeType.startsWith('video/')) return 'text-blue-500 bg-blue-50';
  if (mimeType.includes('word')) return 'text-blue-600 bg-blue-50';
  return 'text-slate-500 bg-slate-100';
}

function formatSize(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface FileCardProps {
  file: DocFile;
  onShare?: (file: DocFile) => void;
}

export function FileCard({ file, onShare }: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const Icon = getMimeIcon(file.mime_type);
  const colorClass = getMimeColor(file.mime_type);
  const canPreview = detectPreviewMode('', file.mime_type) !== 'none';

  async function handleDownload() {
    setDownloading(true);
    setMenuOpen(false);
    const { url, error } = await getSignedDownloadUrl(file.id);
    setDownloading(false);
    if (error || !url) { alert('Impossible de télécharger ce fichier.'); return; }
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.target = '_blank';
    a.click();
  }

  async function handlePreview() {
    setMenuOpen(false);
    if (previewUrl) { setPreviewUrl(previewUrl); return; } // déjà chargée
    setLoadingPreview(true);
    const { url, error } = await getSignedDownloadUrl(file.id);
    setLoadingPreview(false);
    if (error || !url) { alert('Impossible de charger l\'aperçu.'); return; }
    setPreviewUrl(url);
  }

  async function handleDelete() {
    if (!confirm(`Supprimer "${file.name}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    setMenuOpen(false);
    const result = await deleteFile(file.id);
    if (result.error) { alert(result.error); setDeleting(false); }
  }

  return (
    <>
      <div
        className={[
          'group relative flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all',
          deleting ? 'opacity-50 pointer-events-none' : 'hover:shadow-md hover:border-slate-300',
        ].join(' ')}
      >
        {/* Icône */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Infos */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loadingPreview}
            className="w-full truncate text-left text-sm font-medium text-slate-800 hover:text-[#0471a6] transition-colors disabled:opacity-60"
            title={file.name}
          >
            {loadingPreview ? 'Chargement…' : file.name}
          </button>
          {file.description && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{file.description}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {file.size_bytes && (
              <span className="text-xs text-slate-400">{formatSize(file.size_bytes)}</span>
            )}
            <span className="text-xs text-slate-400">{formatDate(file.uploaded_at)}</span>
          </div>
          {file.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {file.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides (visibles au hover) */}
        <div className="flex shrink-0 items-center gap-1 self-start">
          {canPreview && (
            <button
              type="button"
              onClick={handlePreview}
              disabled={loadingPreview}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-[#0471a6] group-hover:opacity-100 disabled:opacity-40"
              title="Aperçu"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          {/* Menu … */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {canPreview && (
                    <button
                      onClick={handlePreview}
                      disabled={loadingPreview}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      Aperçu
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    {downloading ? 'Téléchargement…' : 'Télécharger'}
                  </button>
                  {onShare && (
                    <button
                      onClick={() => { setMenuOpen(false); onShare(file); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Share2 className="h-3.5 w-3.5 text-slate-400" />
                      Partager
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
      </div>

      {/* Modal aperçu */}
      {previewUrl && (
        <DocumentPreviewModal
          url={previewUrl}
          title={file.name}
          mimeType={file.mime_type}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </>
  );
}
