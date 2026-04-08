'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { File, Folder, Search, X } from 'lucide-react';
import { searchDocuments } from '../actions';
import type { DocSearchResult } from '../types';

export function DocumentSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchDocuments(query);
      setResults(data);
      setOpen(true);
      setLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function clear() {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function getHref(result: DocSearchResult) {
    if (result.type === 'folder') {
      return `/dashboard/documents/${result.id}`;
    }
    return `/dashboard/documents/${result.folder_id}`;
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-[#0471a6] focus-within:ring-2 focus-within:ring-[#0471a6]/10">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un dossier ou fichier…"
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
        {loading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#0471a6]" />
        )}
        {query && !loading && (
          <button type="button" onClick={clear} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
            {results.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                href={getHref(r)}
                onClick={() => { setOpen(false); setQuery(''); }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-50"
              >
                {r.type === 'folder' ? (
                  <Folder className="h-4 w-4 shrink-0 text-amber-400" />
                ) : (
                  <File className="h-4 w-4 shrink-0 text-slate-400" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-700">{r.name}</p>
                  {r.description && (
                    <p className="truncate text-xs text-slate-400">{r.description}</p>
                  )}
                </div>
                <span className="ml-auto shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {r.type === 'folder' ? 'Dossier' : 'Fichier'}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {open && query && results.length === 0 && !loading && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
          <p className="text-sm text-slate-400">Aucun résultat pour « {query} »</p>
        </div>
      )}
    </div>
  );
}
