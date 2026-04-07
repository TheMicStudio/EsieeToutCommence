'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CATEGORIE_LABELS, type FaqArticle } from '../types';

interface FaqArticleCardProps {
  article: FaqArticle;
}

export function FaqArticleCard({ article }: FaqArticleCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border transition-all hover:border-primary/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant="secondary" className="shrink-0 text-xs">
            {CATEGORIE_LABELS[article.categorie]}
          </Badge>
          <span className="font-medium truncate">{article.question}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="border-t px-4 pb-4 pt-3">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{article.reponse}</p>
          {article.source_ticket_id && (
            <p className="mt-2 text-xs text-muted-foreground">Source : ticket résolu</p>
          )}
        </div>
      )}
    </div>
  );
}
