'use client';

import { Download } from 'lucide-react';
import type { RetroPostit } from '../types';

interface ExportRetroButtonProps {
  postits: RetroPostit[];
  weekTitle?: string;
}

const TYPE_LABELS: Record<string, string> = {
  POSITIVE: '✅ Ce qui a bien marché',
  NEGATIVE: '⚠️ Ce qui n\'a pas bien marché',
  IDEA: '💡 Idées d\'amélioration',
};

export function ExportRetroButton({ postits, weekTitle = 'Rétro' }: ExportRetroButtonProps) {
  function handleExport() {
    const date = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const grouped = postits.reduce<Record<string, RetroPostit[]>>((acc, p) => {
      if (!acc[p.type]) acc[p.type] = [];
      acc[p.type].push(p);
      return acc;
    }, {});

    const sections = (['POSITIVE', 'NEGATIVE', 'IDEA'] as const)
      .map((type) => {
        const items = grouped[type] ?? [];
        if (items.length === 0) return '';
        const rows = items
          .map((p) => `<li style="margin-bottom:6px;padding:8px 12px;background:#f8fafc;border-radius:8px;border-left:3px solid ${type === 'POSITIVE' ? '#10b981' : type === 'NEGATIVE' ? '#f59e0b' : '#6366f1'}">${p.content}<br><span style="font-size:11px;color:#94a3b8">${p.author_name ?? 'Anonyme'}</span></li>`)
          .join('');
        return `<section style="margin-bottom:28px">
          <h2 style="font-size:14px;font-weight:700;margin-bottom:12px;color:#334155">${TYPE_LABELS[type]} (${items.length})</h2>
          <ul style="list-style:none;padding:0;margin:0">${rows}</ul>
        </section>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Rétro — ${weekTitle}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; margin: 0; padding: 32px; max-width: 800px; }
    h1 { font-size: 22px; margin-bottom: 4px; color: #0f172a; }
    .subtitle { font-size: 13px; color: #94a3b8; margin-bottom: 32px; }
    .stats { display: flex; gap: 16px; margin-bottom: 32px; }
    .stat { padding: 12px 20px; background: #f1f5f9; border-radius: 10px; text-align: center; }
    .stat strong { display: block; font-size: 22px; color: #0471a6; }
    .stat span { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
    footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>Mur de rétro — ${weekTitle}</h1>
  <p class="subtitle">Exporté le ${date}</p>
  <div class="stats">
    <div class="stat"><strong>${(grouped['POSITIVE'] ?? []).length}</strong><span>Positif</span></div>
    <div class="stat"><strong>${(grouped['NEGATIVE'] ?? []).length}</strong><span>À améliorer</span></div>
    <div class="stat"><strong>${(grouped['IDEA'] ?? []).length}</strong><span>Idées</span></div>
    <div class="stat"><strong>${postits.length}</strong><span>Total</span></div>
  </div>
  ${sections}
  <footer>EsieeToutCommence · Généré automatiquement</footer>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'width=900,height=700');
    if (win) {
      win.onafterprint = () => URL.revokeObjectURL(url);
    } else {
      // Fallback : téléchargement direct si popup bloqué
      const a = document.createElement('a');
      a.href = url;
      a.download = `retro-${weekTitle.replaceAll(/\s+/g, '-').toLowerCase()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const isEmpty = postits.length === 0;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isEmpty}
      title={isEmpty ? 'Aucun post-it à exporter' : 'Exporter en PDF'}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#0471a6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
    >
      <Download className="h-4 w-4" />
      Exporter en PDF
    </button>
  );
}
