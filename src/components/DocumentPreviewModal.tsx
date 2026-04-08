'use client';

import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

type PreviewMode = 'pdf' | 'image' | 'video' | 'youtube' | 'vimeo' | 'office' | 'none';

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function detectPreviewMode(url: string, mimeType?: string | null, fileType?: string): PreviewMode {
  // Vidéo YouTube / Vimeo
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';

  // Par MIME type (documents privés)
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('video/')) return 'video';
    if (
      mimeType.includes('word') ||
      mimeType.includes('powerpoint') ||
      mimeType.includes('presentationml') ||
      mimeType.includes('wordprocessingml') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('excel') ||
      mimeType.includes('msword') ||
      mimeType.includes('ms-powerpoint')
    ) return 'office';
  }

  // Par extension dans l'URL
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'pdf' || fileType === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext ?? '')) return 'image';
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext ?? '')) return 'video';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext ?? '')) return 'office';

  return 'none';
}

interface DocumentPreviewModalProps {
  url: string;
  title: string;
  mimeType?: string | null;
  fileType?: string;
  onClose: () => void;
}

export function DocumentPreviewModal({ url, title, mimeType, fileType, onClose }: DocumentPreviewModalProps) {
  const mode = detectPreviewMode(url, mimeType, fileType);

  // Fermer avec Échap
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const youtubeId = mode === 'youtube' ? getYoutubeId(url) : null;
  const vimeoId = mode === 'vimeo' ? getVimeoId(url) : null;
  const officeViewerUrl = mode === 'office'
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl"
        style={{ height: '90vh' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <p className="truncate text-sm font-semibold text-[#061826]" title={title}>{title}</p>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-2xl bg-slate-50">
          {mode === 'pdf' && (
            <iframe
              src={url}
              title={title}
              className="h-full w-full border-0"
            />
          )}

          {mode === 'image' && (
            <div className="flex h-full items-center justify-center p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={title}
                className="max-h-full max-w-full rounded-xl object-contain shadow-md"
              />
            </div>
          )}

          {mode === 'video' && (
            <div className="flex h-full items-center justify-center bg-black p-4">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={url}
                controls
                className="max-h-full max-w-full rounded-xl"
              />
            </div>
          )}

          {mode === 'youtube' && youtubeId && (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          )}

          {mode === 'vimeo' && vimeoId && (
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?dnt=1`}
              title={title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          )}

          {mode === 'office' && officeViewerUrl && (
            <iframe
              src={officeViewerUrl}
              title={title}
              className="h-full w-full border-0"
            />
          )}

          {mode === 'none' && (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <ExternalLink className="h-7 w-7 text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">Aperçu non disponible</p>
                <p className="mt-1 text-sm text-slate-400">Ce type de fichier ne peut pas être prévisualisé.</p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0471a6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0471a6]/90 transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir le fichier
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
