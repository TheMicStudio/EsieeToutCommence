'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, User, Newspaper, BookOpen, Briefcase, X } from 'lucide-react';
import { globalSearch, type SearchResult } from '../actions/search';

const TYPE_ICONS: Record<SearchResult['type'], React.ElementType> = {
  personne: User,
  actualite: Newspaper,
  cours: BookOpen,
  offre: Briefcase,
};

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  personne: 'Personne',
  actualite: 'Actualité',
  cours: 'Cours',
  offre: 'Offre',
};

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    const res = await globalSearch(q);
    setResults(res);
    setOpen(res.length > 0);
    setLoading(false);
    setSelectedIdx(-1);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 280);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, -1)); }
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    if (e.key === 'Enter' && selectedIdx >= 0) {
      window.location.href = results[selectedIdx].href;
    }
  }

  function clear() {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  // Fermer au clic dehors
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Raccourci ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-1 mx-2">
      <div className="flex flex-1 items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher des cours, documents, personnes…"
          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
        {loading && <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-[#0471a6]" />}
        {!loading && query && (
          <button type="button" onClick={clear} className="text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!query && (
          <kbd className="hidden sm:flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-200 shadow-xs">
            ⌘K
          </kbd>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-slate-200/70 bg-white shadow-xl overflow-hidden">
          {/* Grouper par type */}
          {(['personne', 'cours', 'actualite', 'offre'] as SearchResult['type'][]).map((type) => {
            const group = results.filter((r) => r.type === type);
            if (group.length === 0) return null;
            const Icon = TYPE_ICONS[type];
            return (
              <div key={type}>
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/60 border-b border-slate-100">
                  {TYPE_LABELS[type]}s
                </p>
                {group.map((result, i) => {
                  const idx = results.indexOf(result);
                  return (
                    <Link
                      key={result.id + i}
                      href={result.href}
                      onClick={() => { setOpen(false); setQuery(''); }}
                      className={[
                        'flex items-center gap-3 px-4 py-2.5 transition-colors',
                        idx === selectedIdx ? 'bg-[#0471a6]/8 text-[#0471a6]' : 'hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[#061826]">{result.label}</span>
                        {result.sublabel && (
                          <span className="block truncate text-xs text-slate-400">{result.sublabel}</span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
